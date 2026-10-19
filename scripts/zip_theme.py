
import zipfile
import os

build_dir = "/app/applet/build/youcan-big-offer-theme"
zip_path = "/app/applet/public/downloads/big-offer-youcan-theme.zip"

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(build_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, build_dir)
            zipf.write(full_path, rel_path)

print("Successfully created ZIP file at:", zip_path)
