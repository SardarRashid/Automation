import re

with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to capture everything from `const response = await ai.models.generateContent` 
# down to the end of the `catch` block for a route.
pattern = re.compile(
    r'const response = await ai\.models\.generateContent\(\{.*?'
    r'responseSchema:\s*([a-zA-Z0-9_]+),?.*?'
    r'\}\);.*?'
    r'\} catch \(error: any\) \{.*?'
    r'console\.error\("([^"]+)", error\);.*?'
    r'res\.status\(500\)\.json\(\{ error: error\?\.message \|\| "([^"]+)" \}\);\s*\}',
    re.DOTALL
)

def replacer(match):
    schema = match.group(1)
    error_context = match.group(2)
    default_error = match.group(3)
    
    replacement = f"""const result = await callGeminiJSON(prompt, {schema}, "{error_context}");
      res.json(result);
    }} catch (error: any) {{
      console.error("{error_context}", error);
      res.status(500).json({{ error: error?.message || "{default_error}" }});
    }}"""
    return replacement

new_content, count = pattern.subn(replacer, content)
print(f"Replaced {count} routes.")

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)
