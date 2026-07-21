import glob
import re
import os

src_dir = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\src'
files = glob.glob(os.path.join(src_dir, '**', '*.tsx'), recursive=True) + glob.glob(os.path.join(src_dir, '**', '*.ts'), recursive=True)

for filepath in files:
    if 'apiClient.ts' in filepath:
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip files that don't have fetch('/api
    if "fetch('/api/" not in content and 'fetch("/api/' not in content:
        continue

    print(f"Refactoring {filepath}")
    
    # We need to add the import statement for API if it's not there
    # It might be in different depth, so calculate relative path to lib/apiClient
    rel_path = os.path.relpath(os.path.join(src_dir, 'lib', 'apiClient'), os.path.dirname(filepath))
    rel_path = rel_path.replace('\\', '/')
    if not rel_path.startswith('.'):
        rel_path = './' + rel_path
    
    import_stmt = f"import {{ API }} from '{rel_path}';\n"
    if 'import { API }' not in content:
        # insert after the last import
        imports = re.findall(r'^import .*?\n', content, re.MULTILINE)
        if imports:
            last_import = imports[-1]
            content = content.replace(last_import, last_import + import_stmt)
        else:
            content = import_stmt + content

    # Replace specific fetch calls with API calls
    # Example: const res = await fetch("/api/tailor-cv", { ... body: JSON.stringify({ ... }) });
    # Because there are many ways fetch is written, let's use regex to find the endpoint and replace the whole block.
    # Actually, simpler to just write custom Python regex for each known endpoint block
    
    endpoints = {
        'tailor-cv': 'API.tailorCv',
        'scan-company-site': 'API.scanCompanySite',
        'scan-emails': 'API.scanEmails',
        'generate-cv-variant': 'API.generateCvVariant',
        'trigger-automation-cycle': 'API.triggerAutomationCycle',
        'draft-hr-reply': 'API.draftHrReply',
        'parse-cv': 'API.parseCv',
        'generate-ai-cv': 'API.generateAiCv',
        'import-linkedin': 'API.importLinkedIn',
        'generate-full-profile': 'API.generateFullProfile',
        'generate-profile-ai': 'API.generateProfileAi',
    }

    # A generic regex to match the fetch block:
    # await fetch("/api/endpoint", { method: "POST", headers: { ... }, body: JSON.stringify( PAYLOAD ) })
    # and replace with: await API.endpoint( PAYLOAD )
    
    for ep, func in endpoints.items():
        # Match pattern: fetch("/api/ep", { ... body: JSON.stringify(X) ... })
        pattern = r'await fetch\([\s\'"]*/api/' + ep + r'[\s\'"]*,\s*\{[\s\S]*?body:\s*JSON\.stringify\(([\s\S]*?)\)\s*\}[\s\S]*?\)'
        
        def replacer(match):
            payload = match.group(1).strip()
            # If there's an extra trailing comma or something, strip it
            if payload.endswith(','): payload = payload[:-1]
            return f"await {func}({payload})"

        content = re.sub(pattern, replacer, content)

    # Note: Some fetch calls are wrapped with res = await fetch... followed by const data = await res.json()
    # Since apiClient returns the JSON already, we need to fix those:
    # Example: const res = await API.xyz(payload); const data = await res.json();
    # Becomes: const data = await API.xyz(payload);
    
    content = re.sub(r'const (\w+)\s*=\s*await (API\.\w+\(.*?\));\s*\n\s*(?:if\s*\(!\1\.ok\).*?\}\s*)?const (\w+)\s*=\s*await \1\.json\(\);', r'const \3 = await \2;', content, flags=re.DOTALL)
    
    # Also handle let res = ... let data = await res.json()
    content = re.sub(r'const (\w+)\s*=\s*await (API\.\w+\(.*?\));\s*\n\s*(?:if\s*\(!\1\.ok\).*?\}\s*)?let (\w+)\s*=\s*await \1\.json\(\);', r'let \3 = await \2;', content, flags=re.DOTALL)

    # Some places use `const data = await (await fetch(...)).json()`
    # We can clean that up too:
    content = re.sub(r'await\s*\(\s*await\s*(API\.\w+\(.*?\))\s*\)\.json\(\)', r'await \1', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Frontend API Refactor Complete.")
