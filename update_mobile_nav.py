import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\SalesmanMobileApp.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Props and Component Signature
if "interface SalesmanMobileAppProps" not in content:
    content = content.replace("export default function SalesmanMobileApp() {", """interface SalesmanMobileAppProps {
  onBack?: () => void;
}

export default function SalesmanMobileApp({ onBack }: SalesmanMobileAppProps) {""")

# 2. Update Header Button (Logout vs Back)
header_pattern = r'<button onClick=\{logout\} className="p-2 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-95">\s*<LogOut className="w-5 h-5" />\s*</button>'
if re.search(header_pattern, content):
    back_button_code = """{onBack ? (
            <button onClick={onBack} className="px-3 py-2 text-xs font-bold text-white bg-white/20 rounded-xl hover:bg-white/30 active:scale-95 transition-all flex items-center gap-1">
              Back
            </button>
          ) : (
            <button onClick={logout} className="p-2 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-95">
              <LogOut className="w-5 h-5" />
            </button>
          )}"""
    content = re.sub(header_pattern, back_button_code, content)

# 3. Add Bottom Navigation Bar
if "Mobile Bottom Navigation" not in content:
    bottom_nav = """
        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
          <div className="flex justify-around items-center h-16">
            <button onClick={() => setActiveTab('customers')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'customers' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}>
              <Users size={20} />
              <span className="text-[10px] font-medium">Customers</span>
            </button>
            <button onClick={() => setActiveTab('products')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'products' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}>
              <Package size={20} />
              <span className="text-[10px] font-medium">Products</span>
            </button>
            <button onClick={() => setActiveTab('cart')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${activeTab === 'cart' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}>
              <ShoppingCart size={20} />
              {cart.length > 0 && <span className="absolute top-2 right-6 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{cart.length}</span>}
              <span className="text-[10px] font-medium">Cart</span>
            </button>
            <button onClick={() => setActiveTab('payments')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'payments' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}>
              <DollarSign size={20} />
              <span className="text-[10px] font-medium">Payments</span>
            </button>
          </div>
        </div>
"""
    # Insert right before </main>
    content = content.replace("      </main>", f"{bottom_nav}\n      </main>")
    # We must also add pb-20 to the main wrapper so the nav bar doesn't cover content
    # Look for `<div className="min-h-screen bg-slate-50">` or similar
    content = content.replace('className="min-h-screen bg-slate-50"', 'className="min-h-screen bg-slate-50 pb-20"')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("SalesmanMobileApp updated with Bottom Nav and Back prop.")
