import re

with open("processors.py", "r", encoding="utf-8") as f:
    content = f.read()

# Replace messagebox.showerror("Error", "msg") with raise Exception("msg")
content = re.sub(r'messagebox\.showerror\([^,]+,\s*(f?".*?")\)', r'raise Exception(\1)', content)

# Replace messagebox.showwarning("Warning", "msg") with raise Exception("msg") 
content = re.sub(r'messagebox\.showwarning\([^,]+,\s*(f?".*?")\)', r'raise Exception(\1)', content)

# Replace messagebox.showinfo("Success", "msg") with print("msg")
content = re.sub(r'messagebox\.showinfo\([^,]+,\s*(f?".*?")\)', r'print(\1)', content)

# Remove any remaining "from tkinter import messagebox"
content = re.sub(r'from tkinter import messagebox\n', '', content)

with open("processors.py", "w", encoding="utf-8") as f:
    f.write(content)
