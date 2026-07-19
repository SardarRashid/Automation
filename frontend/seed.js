const DB_URL = "https://automation-suit-cece7-default-rtdb.asia-southeast1.firebasedatabase.app";

async function seedData() {
  console.log("Seeding Dummy Data to Firebase RTDB...");

  const products = {
    "prod-001": { id: "prod-001", code: "F-001", name: "Premium Bananas", category: "Fruits", price: 15.50, stock: 200, unit: "Box" },
    "prod-002": { id: "prod-002", code: "V-001", name: "Fresh Tomatoes", category: "Vegetables", price: 8.00, stock: 500, unit: "Crate" },
    "prod-003": { id: "prod-003", code: "FL-001", name: "Red Roses Bouquet", category: "Flowers", price: 45.00, stock: 50, unit: "Bouquet" }
  };

  const customers = {
    "cust-001": { id: "cust-001", name: "Ahmed Store", shopName: "Ahmed Supermarket", phone: "050-1234567", address: "North Territory", remainingBalance: 120.50 },
    "cust-002": { id: "cust-002", name: "Zainab Mart", shopName: "Zainab Fresh Mart", phone: "050-7654321", address: "West Territory", remainingBalance: 0 }
  };

  try {
    await fetch(`${DB_URL}/products.json`, { method: "PATCH", body: JSON.stringify(products) });
    console.log("Products seeded!");

    await fetch(`${DB_URL}/customers.json`, { method: "PATCH", body: JSON.stringify(customers) });
    console.log("Customers seeded!");

    console.log("Dummy data successfully seeded.");
  } catch (e) {
    console.error("Error seeding data:", e);
  }
}

seedData();
