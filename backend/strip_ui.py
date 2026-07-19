import re

with open("processors.py", "r", encoding="utf-8") as f:
    content = f.read()

# We want to remove from class FirebaseAuthClient to the end of the file.
match = re.search(r"class FirebaseAuthClient:", content)
if match:
    content = content[:match.start()]

# Remove customtkinter import
content = re.sub(r"import customtkinter as ctk\n", "", content)

# Remove PIL import if it's only used for UI
content = re.sub(r"from PIL import Image\n", "", content)

# Remove tkinter messagebox
content = re.sub(r"from tkinter import messagebox\n", "", content)

with open("processors.py", "w", encoding="utf-8") as f:
    f.write(content)
