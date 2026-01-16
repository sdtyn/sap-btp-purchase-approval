const db = require('better-sqlite3')('db.sqlite');

// Show all purchase requests
const allRequests = db.prepare(`
  SELECT 
    ID,
    title,
    status,
    requester,
    totalAmount
  FROM sap_btp_purchaseapproval_PurchaseRequests
  ORDER BY createdAt DESC
`).all();

console.log('=== ALL PURCHASE REQUESTS ===');
allRequests.forEach(r => {
  console.log(`${r.status.padEnd(10)} | ${r.requester.padEnd(10)} | ${r.title}`);
});

// Update all "New" requests to "Pending"
const updateResult = db.prepare(`
  UPDATE sap_btp_purchaseapproval_PurchaseRequests 
  SET status = 'Pending' 
  WHERE status = 'New'
`).run();

console.log(`\n✓ Updated ${updateResult.changes} request(s) from New to Pending`);

// Show updated results
const updatedRequests = db.prepare(`
  SELECT 
    ID,
    title,
    status,
    requester,
    totalAmount
  FROM sap_btp_purchaseapproval_PurchaseRequests
  ORDER BY createdAt DESC
`).all();

console.log('\n=== UPDATED PURCHASE REQUESTS ===');
updatedRequests.forEach(r => {
  console.log(`${r.status.padEnd(10)} | ${r.requester.padEnd(10)} | ${r.title}`);
});

db.close();
