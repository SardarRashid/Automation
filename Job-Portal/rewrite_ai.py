import os
import re

ai_service_path = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\src\services\aiService.ts'
worker_path = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\job-portal-worker\src\index.ts'

with open(ai_service_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Already ported endpoints from server.ts
already_ported = [
    'tailorCv', 'scanCompanySite', 'generateCvVariant', 'parseRawCv', 'importLinkedin',
    'generateAiCv', 'generateFullProfile', 'draftHrReply', 'scanEmails', 'triggerAutomationCycle'
]

# Find all async functions in aiService
pattern = re.compile(r'async\s+([a-zA-Z0-9_]+)\((.*?)\)\s*\{([\s\S]*?)const\s+responseText\s*=\s*await\s+generateWithRetry\((.*?),\s*"(.*?)"(.*?)\);([\s\S]*?)return\s+extractJson\(responseText\);\s*\}')

matches = pattern.findall(content)

worker_routes = []
client_methods = []

for match in matches:
    func_name, args_str, body, prompt_var, system_prompt, generate_opts, after_gen = match
    
    if func_name in already_ported:
        continue

    # Convert camelCase to kebab-case for URL
    endpoint_name = re.sub(r'(?<!^)(?=[A-Z])', '-', func_name).lower()
    
    # Parse arguments
    # e.g., 'jobDescription: string, companyName: string, roleLevel: string'
    args = [arg.split(':')[0].strip() for arg in args_str.split(',') if arg.strip()]
    
    # Generate Worker Route
    route = f'''
app.post("/api/{endpoint_name}", verifyFirebaseToken, apiLimiter, async (c) => {{
  try {{
    const body = await c.req.json().catch(() => ({{}}));
    const {{ {", ".join(args)} }} = body;

    const prompt = `{body.strip()}`; // We will rebuild the prompt dynamically using template literals but wait, body already has the template literal!
    // Actually, body contains: const prompt = `...`; we just need to replace the variables.
'''
    
    # To keep it extremely simple, we just copy the entire body, but replace req.body variables
    # The body string already defines `const prompt = ...` using the arguments.
    # We just define the arguments from the JSON body!
    
    clean_body = body.strip()
    
    worker_route = f'''
app.post("/api/{endpoint_name}", verifyFirebaseToken, apiLimiter, async (c) => {{
  try {{
    const reqBody = await c.req.json().catch(() => ({{}}));
    const {{ {", ".join(args)} }} = reqBody;

    {clean_body}

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({{
      model: 'gemini-2.5-flash',
      contents: {prompt_var},
      config: {{
        systemInstruction: "{system_prompt}",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }}
    }});

    const responseText = response.text;
    if (!responseText) {{
      throw new Error("Empty response from Gemini.");
    }}

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  }} catch (error: any) {{
    console.error("Error in /api/{endpoint_name}:", error);
    return c.json({{ error: error?.message || "An unexpected error occurred." }}, 500);
  }}
}});
'''
    worker_routes.append(worker_route)
    
    # Generate API Client method
    client_method = f"  {func_name}: (data: any) => apiClient<any>('/api/{endpoint_name}', data),"
    client_methods.append(client_method)

# Append to worker
with open(worker_path, 'r', encoding='utf-8') as f:
    worker_content = f.read()

worker_content = worker_content.replace('export default app;', '')
worker_content += "\n".join(worker_routes) + "\nexport default app;\n"

with open(worker_path, 'w', encoding='utf-8') as f:
    f.write(worker_content)

print("Added new routes to Worker!")
print("--- Add these to apiClient.ts ---")
print("\n".join(client_methods))
