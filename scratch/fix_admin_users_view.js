const fs = require("fs");
const adminPanelPath = "frontend/src/pages/AdminPanel.tsx";
const headPath = "scratch/AdminPanel_head_utf8.tsx";

let adminContent = fs.readFileSync(adminPanelPath, "utf-8");
let headContent = fs.readFileSync(headPath, "utf-8");

const startIdx = headContent.indexOf("{activeView === \x27users\x27 && (");
const endIdx = headContent.indexOf("{activeView === \x27pending\x27");

if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find block in head");
    process.exit(1);
}

const usersBlock = headContent.substring(startIdx, endIdx).trim();

// Now we want to insert the conditional wrapper around usersBlock
const conditionalBlock = `{activeView === \x27users\x27 && (
  selectedUserKey ? (
    <UserManagement 
      userKey={selectedUserKey} 
      onBack={() => setSelectedUserKey(null)} 
    />
  ) : (
    ${usersBlock.substring("{activeView === \x27users\x27 && (".length, usersBlock.length - 1)}
  )
)}`;

const targetStr = "{activeView === \x27users\x27 && <UserManagement />}";
if (adminContent.includes(targetStr)) {
    adminContent = adminContent.replace(targetStr, conditionalBlock);
    fs.writeFileSync(adminPanelPath, adminContent);
    console.log("Successfully patched AdminPanel.tsx");
} else {
    console.error("Target string not found in AdminPanel.tsx");
}

