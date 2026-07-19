from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time
import json

options = Options()
options.add_argument('--headless')
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

driver = webdriver.Chrome(options=options)
driver.get("https://automation-suit-cece7.web.app")

print("Waiting for page to load...")
time.sleep(5)

logs = driver.get_log('browser')
for log in logs:
    if log['level'] == 'SEVERE':
        print(f"ERROR: {log['message']}")
    else:
        print(f"{log['level']}: {log['message']}")

driver.quit()
