import os
import zipfile

source_dir = r"D:\AntiGravity\inventory-web-workspace"
output_filename = r"D:\AntiGravity\Inventory_Suite_SourceCode.zip"

def zipdir(path, ziph):
    # ziph is zipfile handle
    for root, dirs, files in os.walk(path):
        # Exclude unwanted directories
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '.firebase', 'dist', '__pycache__']]
        for file in files:
            if file.endswith('.pyc'):
                continue
            file_path = os.path.join(root, file)
            # Add file to zip archive, using relative path
            ziph.write(file_path, os.path.relpath(file_path, source_dir))

print("Zipping files...")
with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipdir(source_dir, zipf)

print(f"Successfully created {output_filename}")
