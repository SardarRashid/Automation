import re
import os

filepath = 'server.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports for firebase-admin, rateLimit, and zod
imports_to_add = """import admin from "firebase-admin";
import rateLimit from "express-rate-limit";
import { z } from "zod";

// Initialize Firebase Admin (Using application default credentials or env var)
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.initializeApp();
  }
} catch (e) {
  console.log("Firebase Admin already initialized or missing credentials");
}

// Authentication Middleware
const verifyFirebaseToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
  }
  
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth verify error:", error);
    return res.status(403).json({ error: "Forbidden: Invalid token" });
  }
};

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 API requests per window
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper for Gemini calls with exponential backoff and JSON extraction
async function callGeminiJSON(prompt: string, schema: any, errorContext: string): Promise<any> {
  const ai = getGeminiClient();
  let retries = 2;
  let delay = 1000;
  
  while (retries >= 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.7,
        },
      });
      const text = response.text || "";
      if (!text) {
        throw new Error("Empty response from Gemini");
      }
      return safeJsonParse(text);
    } catch (error: any) {
      if (retries === 0) {
        console.error(`Final error in ${errorContext}:`, error);
        throw error;
      }
      console.warn(`Transient error in ${errorContext}. Retrying in ${delay}ms...`, error?.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      retries--;
    }
  }
}

function safeJsonParse(text: string): any {
  try {
    let cleanText = text;
    if (cleanText.includes("```json")) {
      const match = cleanText.match(/```json\\s*([\\s\\S]*?)\\s*```/);
      if (match) cleanText = match[1];
    } else if (cleanText.includes("```")) {
      const match = cleanText.match(/```\\s*([\\s\\S]*?)\\s*```/);
      if (match) cleanText = match[1];
    }
    cleanText = cleanText.replace(/(?!")\\n(?!")/g, "\\\\n");
    cleanText = cleanText.replace(/,\\s*([}\\]])/g, "$1");
    const startIndex = cleanText.indexOf("{");
    const lastIndex = cleanText.lastIndexOf("}");
    if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
      cleanText = cleanText.substring(startIndex, lastIndex + 1);
    }
    return JSON.parse(cleanText);
  } catch (err) {
    console.error("safeJsonParse error. Raw text was:", text);
    throw new Error("Failed to parse AI output as JSON.");
  }
}
"""

if 'import admin from "firebase-admin";' not in content:
    content = content.replace('import dotenv from "dotenv";', 'import dotenv from "dotenv";\n' + imports_to_add)

# Find the startServer function
start_idx = content.find("async function startServer() {")
if start_idx != -1:
    # Inject middleware
    app_use_json = 'app.use(express.json({ limit: "15mb" }));'
    middlewares = 'app.use(express.json({ limit: "15mb" }));\n  app.use("/api/", apiLimiter);\n  app.use("/api/", verifyFirebaseToken);'
    content = content.replace(app_use_json, middlewares)
    
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Middleware and helpers injected.")
