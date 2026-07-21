import re

with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports if they don't exist
if 'import admin from "firebase-admin"' not in content:
    content = content.replace('import dotenv from "dotenv";', 
                              'import dotenv from "dotenv";\nimport admin from "firebase-admin";\nimport rateLimit from "express-rate-limit";\n')

# 2. Add middleware definitions before app definitions
injection = """
// Initialize Firebase Admin
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
"""

if '// Initialize Firebase Admin' not in content:
    # Inject right after getting gemini client
    target = "const app = express();"
    content = content.replace(target, injection + "\n" + target)

# 3. Apply middleware to all /api/ routes
# Find all `app.post("/api/` and `app.get("/api/` and replace with `app.post("/api/", apiLimiter, verifyFirebaseToken,`
content = re.sub(r'app\.post\("/api/([^"]+)", async \(req, res\) => \{', r'app.post("/api/\1", apiLimiter, verifyFirebaseToken, async (req, res) => {', content)
content = re.sub(r'app\.get\("/api/([^"]+)", async \(req, res\) => \{', r'app.get("/api/\1", apiLimiter, verifyFirebaseToken, async (req, res) => {', content)

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Security patched successfully.")
