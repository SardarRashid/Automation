from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

options = Options()
options.add_argument('--headless')
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

driver = webdriver.Chrome(options=options)
driver.get("https://automation-suit-cece7.web.app")

print("Waiting for login page...")
try:
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, "//input[@type='email']")))
    
    print("Filling credentials...")
    driver.find_element(By.XPATH, "//input[@type='email']").send_keys("sardarrashid121@gmail.com")
    driver.find_element(By.XPATH, "//input[@type='password']").send_keys("123456")
    driver.find_element(By.XPATH, "//button[@type='submit']").click()
    
    print("Waiting for dashboard...")
    time.sleep(5)
    
    print("Clicking Inventory Admin...")
    buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Inventory (Admin)')]")
    if buttons:
        buttons[0].click()
    else:
        print("Inventory Admin button not found")
        
    print("Waiting for Inventory App to load...")
    time.sleep(3)
    
    print("Fetching logs...")
    logs = driver.get_log('browser')
    for log in logs:
        print(f"{log['level']}: {log['message']}")
            
except Exception as e:
    print("Exception occurred:", e)
finally:
    driver.quit()
