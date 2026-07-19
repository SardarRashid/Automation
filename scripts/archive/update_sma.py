import os

sma_file = "frontend/src/pages/SalesmanMobileApp.tsx"
with open(sma_file, "r", encoding="utf-8") as f:
    content = f.read()

# Make sure Debt is prominently displayed on the customer card in the "Customers" tab.
content = content.replace("""
                            <p className="text-xs text-slate-500">{cust.phone}</p>
                          </div>
                        </div>
                        <button 
""", """
                            <p className="text-xs text-slate-500">{cust.phone}</p>
                            <p className="text-sm font-bold text-rose-600 mt-1">Debt: {Number(cust.remainingBalance || 0).toFixed(2)} SAR</p>
                          </div>
                        </div>
                        <button 
""")

with open(sma_file, "w", encoding="utf-8") as f:
    f.write(content)

print("SalesmanMobileApp.tsx updated for debt viewing")
