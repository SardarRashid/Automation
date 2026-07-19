import os
import zipfile

def zip_folder(folder_path, output_path):
    print(f"Zipping {folder_path} to {output_path}...")
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            if '.git' in dirs:
                dirs.remove('.git')
            if 'dist' in dirs:
                dirs.remove('dist') # The build output is often not needed if they just want the source, or wait, for an extension, dist IS the extension!
            
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, folder_path)
                zipf.write(file_path, arcname)
    print("Done!")

# For Sticker Printer, the actual extension to load is inside `dist/` because it's built with Vite.
# Wait, if they load unpacked, they should load the `dist` folder. So I should zip the `dist` folder directly!
def zip_dist_folder(folder_path, output_path):
    dist_path = os.path.join(folder_path, "dist")
    if os.path.exists(dist_path):
        print(f"Zipping {dist_path} to {output_path}...")
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(dist_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, dist_path)
                    zipf.write(file_path, arcname)
        print("Done!")
    else:
        print(f"No dist folder in {folder_path}, zipping whole folder")
        zip_folder(folder_path, output_path)

out_dir = "D:/AntiGravity/inventory-web-workspace/frontend/public"
loginext_path = "D:/AntiGravity/LogiNextExtension"
sticker_path = "D:/AntiGravity/InventorySuitAndroid/sticker-printer-extension"

# LogiNext Extension is just vanilla JS/HTML, no dist folder
zip_folder(loginext_path, os.path.join(out_dir, "LogiNextExtension.zip"))

# Sticker Printer is a Vite app, so we zip its dist folder
zip_dist_folder(sticker_path, os.path.join(out_dir, "StickerPrinterExtension.zip"))
