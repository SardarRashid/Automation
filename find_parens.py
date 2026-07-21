import io
with io.open(r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\pages\admin\UserManagement.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def check_parens():
    stack = 0
    in_string = False
    string_char = ''
    for i, line in enumerate(lines):
        for j, c in enumerate(line):
            if in_string:
                if c == string_char and line[j-1] != '\\\\':
                    in_string = False
                continue
            if c in ['"', "'", '`']:
                in_string = True
                string_char = c
                continue
            if c == '(': stack += 1
            elif c == ')': stack -= 1
            if stack < 0:
                print('Underflow ) at line', i+1)
                return
    print('Final ) stack:', stack)

check_parens()
