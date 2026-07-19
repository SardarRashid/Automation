from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

options = Options()
# options.add_argument('--headless') # let's keep headless to see if we get logs
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

driver = webdriver.Chrome(options=options)
driver.get("https://automation-suit-cece7.web.app")

print("Waiting for login page...")
try:
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, "//input[@type='email']")))
    
    # Fill in credentials
    print("Filling credentials...")
    driver.find_element(By.XPATH, "//input[@type='email']").send_keys("admin@gmail.com")
    driver.find_element(By.XPATH, "//input[@type='password']").send_keys("123456")
    driver.find_element(By.XPATH, "//button[@type='submit']").click()
    
    # Wait for dashboard to load (wait for the sidebar or header)
    print("Waiting for dashboard...")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, "//nav")))
    
    # Now click on "Inventory (Admin)"
    print("Clicking Inventory Admin...")
    time.sleep(2) # let state settle
    buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Inventory (Admin)')]")
    if buttons:
        buttons[0].click()
    else:
        print("Inventory Admin button not found")
        
    print("Waiting for Inventory App to load...")
    time.sleep(5) # Wait for crash or load
    
    print("Fetching logs...")
    logs = driver.get_log('browser')
    for log in logs:
        if log['level'] == 'SEVERE':
            print(f"ERROR: {log['message']}")
        else:
            print(f"{log['level']}: {log['message']}")
            
except Exception as e:
    print("Exception occurred:", e)
finally:
    driver.quit()
