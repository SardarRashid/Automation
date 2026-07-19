import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyC5Q2u1afhxzkaJyUbBVfSncBDajCW-Jb8",
  authDomain: "automation-suit-cece7.firebaseapp.com",
  databaseURL: "https://automation-suit-cece7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "automation-suit-cece7",
  storageBucket: "automation-suit-cece7.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function migrate() {
  console.log('Fetching customers...');
  const customersSnap = await get(ref(database, 'customers'));
  if (!customersSnap.exists()) {
    console.log('No customers found.');
    return;
  }
  
  const customers = customersSnap.val();
  let migratedCount = 0;
  
  for (const [custId, custData] of Object.entries<any>(customers)) {
    const balance = Number(custData.remainingBalance || 0);
    
    const ledgerRef = ref(database, `customer_ledgers/${custId}`);
    const ledgerSnap = await get(ledgerRef);
    
    if (!ledgerSnap.exists()) {
      const entryId = `MIGRATE_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      const entry = {
        id: entryId,
        customerId: custId,
        date: new Date().toISOString(),
        type: 'INITIAL_BALANCE',
        amount: balance, // Positive means they owe us
        description: 'Initial Balance Migration'
      };
      
      await set(ref(database, `customer_ledgers/${custId}/${entryId}`), entry);
      console.log(`Migrated customer ${custId} (${custData.name}) - Balance: ${balance}`);
      migratedCount++;
    } else {
      console.log(`Customer ${custId} already has a ledger. Skipping migration.`);
    }
  }
  
  console.log(`Migration complete! Migrated ${migratedCount} customers.`);
  process.exit(0);
}

migrate().catch(console.error);
