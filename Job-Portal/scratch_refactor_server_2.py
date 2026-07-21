import re

with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# The regex needs to replace the boilerplate with callGeminiJSON.
# We match:
# const ai = getGeminiClient();
# const prompt = `...`;
# const response = await ai.models.generateContent({ ... });
# ...
# } catch (error: any) {
#   console.error("...", error);
#   res.status(500).json({ error: ... });
# }

pattern = re.compile(
    r'const ai = getGeminiClient\(\);\s*'
    r'const prompt = (`.*?`);\s*'
    r'const response = await ai\.models\.generateContent\(\{\s*'
    r'model: "gemini-2.5-pro",\s*'
    r'contents: prompt,\s*'
    r'config: \{\s*'
    r'responseMimeType: "application/json",\s*'
    r'responseSchema: (\w+),\s*'
    r'temperature: 0\.7,?\s*'
    r'\},\s*'
    r'\}\);\s*'
    r'const text = response\.text \|\| "";\s*'
    r'if \(!text\) \{\s*'
    r'return res\.status\(500\)\.json\(\{ error: "Empty response from Gemini\." \}\);\s*'
    r'\}\s*'
    r'const result = safeJsonParse\(text\);\s*'
    r'res\.json\(result\);\s*'
    r'\} catch \(error: any\) \{\s*'
    r'console\.error\("([^"]+)", error\);\s*'
    r'res\.status\(500\)\.json\(\{ error: error\?\.message \|\| "[^"]+" \}\);\s*'
    r'\}',
    re.DOTALL
)

def replacer(match):
    prompt = match.group(1)
    schema = match.group(2)
    error_context = match.group(3)
    
    replacement = f"""const prompt = {prompt};
      
      const result = await callGeminiJSON(prompt, {schema}, "{error_context}");
      res.json(result);
    }} catch (error: any) {{
      console.error("{error_context}", error);
      res.status(500).json({{ error: error?.message || "Failed to process AI request" }});
    }}"""
    return replacement

new_content, count = pattern.subn(replacer, content)
print(f"Replaced {count} routes.")

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)
