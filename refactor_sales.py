import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\SalesmanMobileApp.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
if "OfflineIndicator" not in content:
    imports = """import { OfflineIndicator } from '../components/mobile/OfflineIndicator';
import { SuccessOverlay } from '../components/mobile/SuccessOverlay';
import { TouchButton } from '../components/mobile/TouchButton';
import { useDraft } from '../hooks/useDraft';
import { useFavorites } from '../hooks/useFavorites';
"""
    content = re.sub(r'(import React.*?;)', rf'\1\n{imports}', content)

# 2. Add Hooks and Success State
if "const [showSuccess" not in content:
    hooks = """
  // Mobile UX Hooks
  const { draft: draftCart, saveDraft: saveCartDraft, clearDraft: clearCartDraft } = useDraft('salesCart', []);
  const { favorites, toggleFavorite, addRecent } = useFavorites('salesProducts');
  const [showSuccess, setShowSuccess] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    if (draftCart && draftCart.length > 0 && cart.length === 0) {
      if (window.confirm("You have an unsaved order draft. Would you like to resume?")) {
        setCart(draftCart);
      } else {
        clearCartDraft();
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (cart.length > 0) saveCartDraft(cart);
  }, [cart]);
"""
    content = re.sub(r'(const \[isSubmitting, setIsSubmitting\] = useState\(false\);)', rf'\1\n{hooks}', content)

# 3. Add Success Overlay and Offline Indicator to the main render
if "<OfflineIndicator />" not in content:
    render_insert = """
      <OfflineIndicator />
      <SuccessOverlay isVisible={showSuccess} message="Order Placed Successfully!" />
"""
    content = re.sub(r'(<div className="min-h-screen bg-slate-50 pb-20">)', rf'\1{render_insert}', content)

# 4. Modify handleOrderSubmit to trigger animation and clear draft
if "setShowSuccess(true);" not in content:
    content = content.replace("setCart([]);\n      setPaymentAmount('');", "setCart([]);\n      setPaymentAmount('');\n      clearCartDraft();\n      setShowSuccess(true);\n      setTimeout(() => setShowSuccess(false), 2500);")

# 5. Convert standard button to TouchButton (the Submit Collection button)
content = content.replace("""<button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] py-4 font-bold text-white bg-emerald-600 rounded-2xl active:bg-emerald-700 shadow-lg shadow-emerald-600/30 flex justify-center items-center gap-2 disabled:opacity-70"
                    >""", """<TouchButton
                      type="submit"
                      disabled={isSubmitting}
                      variant="primary"
                    >""")
content = content.replace("""<CheckCircle className="w-5 h-5" /> Submit Collection\n                    </button>""", """<CheckCircle className="w-5 h-5" /> Submit Collection\n                    </TouchButton>""")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("SalesmanMobileApp refactored.")
