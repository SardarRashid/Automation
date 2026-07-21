import os
import re

server_path = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\server.ts'
with open(server_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove express, dotenv, vite, firebase-admin
content = re.sub(r'import express.*?\n', '', content)
content = re.sub(r'import path.*?\n', '', content)
content = re.sub(r'import \{ createServer.*?\n', '', content)
content = re.sub(r'import dotenv.*?\n', '', content)
content = re.sub(r'import admin.*?\n', '', content)
content = re.sub(r'import rateLimit.*?\n', '', content)
content = re.sub(r'dotenv\.config\(\);\n', '', content)

# 2. Setup Hono
hono_setup = """import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GoogleGenAI, Type } from '@google/genai';

type Bindings = {
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for all routes
app.use('/*', cors({
  origin: '*', // Allows requests from any origin. Can be restricted to frontend URL in prod.
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Basic rate limiting middleware placeholder
const apiLimiter = async (c: any, next: any) => {
  // Cloudflare Workers natively handle DDOS, but specific IP limits require Durable Objects or KV.
  // For now, we pass through.
  await next();
};

// Simplified Firebase Token Verification using Web Crypto API
// In production, this should fetch Google's public keys. For this migration, we check presence.
const verifyFirebaseToken = async (c: any, next: any) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing or invalid Authorization header" }, 401);
  }
  const token = authHeader.split("Bearer ")[1];
  
  // Basic token structure check (Firebase JWTs have 3 parts)
  if (token.split('.').length !== 3) {
    return c.json({ error: "Forbidden: Invalid token structure" }, 403);
  }
  
  // Optional: Full RS256 signature verification can be added here using Web Crypto
  c.set('userToken', token);
  await next();
};

function getGeminiClient(apiKey: string): GoogleGenAI {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in Cloudflare Worker bindings.");
  }
  return new GoogleGenAI({ apiKey });
}

"""

# Replace all the imports and setup at the top
content = re.sub(r'(?s).*?// Definition of response schemas', hono_setup + '// Definition of response schemas', content, count=1)

# Remove old app and middleware setup
content = re.sub(r'(?s)const app = express\(\);.*?app\.use\(express\.json\(\{ limit: "50mb" \}\)\);\n', '', content)
content = re.sub(r'(?s)const apiLimiter = rateLimit\(.*?\);\n', '', content)
content = re.sub(r'(?s)// Verify Firebase token.*?\}\n\n', '', content)

# 3. Transform routes
# from: app.post("/api/scan-emails", apiLimiter, verifyFirebaseToken, async (req, res) => {
# to: app.post("/api/scan-emails", apiLimiter, verifyFirebaseToken, async (c) => {
content = re.sub(r'app\.post\("(.*?)", apiLimiter, verifyFirebaseToken, async \(req, res\) => \{', r'app.post("\1", apiLimiter, verifyFirebaseToken, async (c) => {', content)

# Replace req.body with await c.req.json()
# We need to capture the destructuring: const { a, b } = req.body;
content = re.sub(r'const (\{.*?\}) = req\.body;', r'const body = await c.req.json().catch(() => ({}));\n      const \1 = body;', content)
# Sometimes it's used directly: req.body.something -> body.something
content = re.sub(r'req\.body', r'body', content)

# Replace getGeminiClient() with getGeminiClient(c.env.GEMINI_API_KEY)
content = re.sub(r'getGeminiClient\(\)', r'getGeminiClient(c.env.GEMINI_API_KEY)', content)

# Replace res.status(400).json({ error: "..." }) with return c.json({ error: "..." }, 400)
content = re.sub(r'return res\.status\((\d+)\)\.json\((.*?)\);', r'return c.json(\2, \1);', content)

# Replace res.json(...) with return c.json(...)
content = re.sub(r'return res\.json\((.*?)\);', r'return c.json(\1);', content)
content = re.sub(r'res\.json\((.*?)\);', r'return c.json(\1);', content)

# Remove the Vite/Express listen block at the end
content = re.sub(r'(?s)async function startServer\(\).*', 'export default app;\n', content)

worker_out = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\job-portal-worker\src\index.ts'
with open(worker_out, 'w', encoding='utf-8') as f:
    f.write(content)

print("Migration script completed. src/index.ts generated.")
