const db = require('better-sqlite3')('db.sqlite');

// Update all "New" requests to "Pending"
const result = db.prepare(`
  UPDATE sap_btp_purchaseapproval_PurchaseRequests 
  SET status = 'Pending' 
  WHERE status = 'New'
`).run();

console.log(`✓ Updated ${result.changes} request(s) to Pending status`);

// Show current status distribution
const statusCounts = db.prepare(`
  SELECT status, COUNT(*) as count 
  FROM sap_btp_purchaseapproval_PurchaseRequests 
  GROUP BY status
`).all();

console.log('\n=== STATUS DISTRIBUTION ===');
statusCounts.forEach(row => {
  console.log(`${row.status}: ${row.count}`);
});

// Show all requests
const allRequests = db.prepare(`
  SELECT 
    ID,
    title,
    status,
    requester,
    totalAmount
  FROM sap_btp_purchaseapproval_PurchaseRequests
  WHERE IsActiveEntity = 1
`).all();

console.log('\n=== ALL ACTIVE REQUESTS ===');
allRequests.forEach(r => {
  console.log(`${r.status} | ${r.requester} | ${r.title} | €${r.totalAmount}`);
});

db.close();
