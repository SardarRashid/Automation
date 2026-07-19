import re

path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\SalesmanMobileApp.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add import
if "import { salesService }" not in content:
    content = content.replace("import { ledgerService }", "import { ledgerService }\nimport { salesService }")

# Replace handleCollectPayment
handle_collect_orig_regex = r"  const handleCollectPayment = async \(e: React\.FormEvent\) => \{.*?\n    setActiveTab\('collections'\);\n  \};"

handle_collect_new = """  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    if (amount > selectedCustomer.remainingBalance) {
      alert("Amount cannot exceed the remaining balance due.");
      return;
    }

    try {
      await salesService.submitPayment(
        selectedCustomer,
        amount,
        paymentMethod,
        description,
        currentUser?.email || 'Unknown Salesman'
      );
      
      alert(`Payment of ${amount} SAR submitted for verification.`);
      setPaymentAmount('');
      setDescription('');
      setSelectedCustomer(null);
      setActiveTab('collections');
    } catch (err: any) {
      alert(err.message || "Failed to submit payment");
    }
  };"""

content = re.sub(handle_collect_orig_regex, handle_collect_new, content, flags=re.DOTALL)


# Replace handleSubmitOrder
handle_submit_orig_regex = r"  const handleSubmitOrder = async \(\) => \{.*?setActiveTab\('customers'\);\n  \};"

handle_submit_new = """  const handleSubmitOrder = async () => {
    if (!orderCustomer) { alert("Please select a customer"); return; }
    if (cart.length === 0) { alert("Cart is empty"); return; }
    
    const upf = parseFloat(upfrontPayment) || 0;
    const currentOrderTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
    
    if (upf > currentOrderTotal) { 
      alert("Payment cannot exceed order total."); 
      return; 
    }

    try {
      await salesService.submitOrder(
        orderCustomer,
        cart,
        upf,
        paymentMethod,
        currentUser?.uid || '',
        currentUser?.email || 'Unknown Salesman'
      );
      
      alert(`Order submitted successfully!${upf > 0 ? ` Payment of ${upf} SAR is Pending Verification.` : ''}`);
      setCart([]);
      setOrderCustomer(null);
      setUpfrontPayment('');
      setActiveTab('customers');
    } catch (err: any) {
      alert(err.message || "Failed to submit order");
    }
  };"""

content = re.sub(handle_submit_orig_regex, handle_submit_new, content, flags=re.DOTALL)

# Remove the orphaned orderTotal that is computed outside the function
content = re.sub(r"  const orderTotal = cart\.reduce\(\(sum, item\) => sum \+ \(item\.product\.price \* item\.qty\), 0\);\n", "", content)

# Replace orderTotal in the JSX
content = content.replace("SAR {orderTotal.toFixed(2)}", "SAR {cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0).toFixed(2)}")
content = content.replace("Total: SAR {orderTotal.toFixed(2)}", "Total: SAR {cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0).toFixed(2)}")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated SalesmanMobileApp.tsx to use salesService!")
