import urllib.request
import json
url = 'https://organic-reason-4ln7n-default-rtdb.firebaseio.com/users.json'
try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        keys = [k for k in data.keys() if 'dammam' in k.lower()]
        for k in keys:
            print(k)
            print(json.dumps(data[k], indent=2))
except Exception as e:
    print('Error:', e)
