import os
import re

server_path = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\server.ts'
worker_path = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\job-portal-worker\src\index.ts'

with open(server_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Extract from line 581 to 1485 (which is index 581 to 1486)
routes = "".join(lines[581:1486])

# Transform Express routes to Hono routes
# Replace `app.post("/api/...", async (req, res) => {`
routes = re.sub(r'app\.post\("(.*?)", async \(req, res\) => \{', r'app.post("\1", verifyFirebaseToken, apiLimiter, async (c) => {', routes)

# Replace `const { ... } = req.body;` with `const body = await c.req.json().catch(()=>({}));\n      const { ... } = body;`
routes = re.sub(r'const (\{.*?\}) = req\.body;', r'const body = await c.req.json().catch(()=>({}));\n      const \1 = body;', routes)
routes = re.sub(r'req\.body', r'body', routes)

# Replace getGeminiClient() with getGeminiClient(c.env.GEMINI_API_KEY)
routes = re.sub(r'getGeminiClient\(\)', r'getGeminiClient(c.env.GEMINI_API_KEY)', routes)

# Replace res.status(XYZ).json(...) with return c.json(..., XYZ)
routes = re.sub(r'return res\.status\((\d+)\)\.json\((.*?)\);', r'return c.json(\2, \1);', routes)
routes = re.sub(r'res\.status\((\d+)\)\.json\((.*?)\);', r'return c.json(\2, \1);', routes)

# Replace res.json(...) with return c.json(...)
routes = re.sub(r'return res\.json\((.*?)\);', r'return c.json(\1);', routes)
routes = re.sub(r'res\.json\((.*?)\);', r'return c.json(\1);', routes)

# Now read the worker file, strip `export default app;` from the end, append routes, and put it back.
with open(worker_path, 'r', encoding='utf-8') as f:
    worker_content = f.read()

worker_content = worker_content.replace('export default app;', '')
worker_content += "\n" + routes + "\nexport default app;\n"

with open(worker_path, 'w', encoding='utf-8') as f:
    f.write(worker_content)

print("Appended AI routes to Worker!")
