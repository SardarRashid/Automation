import urllib.request
import json
url = 'https://automation-suit-cece7-default-rtdb.asia-southeast1.firebasedatabase.app/users.json'
try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        keys = [k for k in data.keys() if 'dammam' in k.lower()]
        for k in keys:
            print(k)
            print(json.dumps(data[k], indent=2))
except Exception as e:
    print('Error:', e)
