import os
import glob

# Paths to search
directories = [
    '../backend/core/**/*.py',
    '../backend/clinical/**/*.py',
    '../backend/pharmacy/**/*.py',
    '../frontend/src/**/*.ts',
    '../frontend/src/**/*.tsx',
]

# Get all file paths
files = []
for d in directories:
    files.extend(glob.glob(d, recursive=True))

count = 0
for file_path in files:
    if not os.path.isfile(file_path):
        continue

    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    original_content = content
    # 1. Replace "RX-PAT-" with "98765432"
    content = content.replace("RX-PAT-", "98765432")
    # 2. Replace "Patient ID" with "Aadhar ID"
    content = content.replace("Patient ID", "Aadhar ID")
    content = content.replace("Patient ID:", "Aadhar ID:")
    # 3. Specifically fix up the AuthContext label
    content = content.replace("Aadhar ID / Email", "Aadhar ID / Email")
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")
        count += 1

print(f"Done! Updated {count} files.")
