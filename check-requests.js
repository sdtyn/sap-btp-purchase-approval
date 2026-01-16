const db = require('better-sqlite3')('db.sqlite');

console.log('=== ALL PURCHASE REQUESTS ===');
const reqs = db.prepare('SELECT ID, title, status, totalAmount, requester FROM sap_btp_purchaseapproval_PurchaseRequests ORDER BY createdAt DESC LIMIT 5').all();
reqs.forEach(r => {
  console.log(`${r.status.padEnd(10)} | ${r.requester.padEnd(10)} | ${r.title} | €${r.totalAmount}`);
});

console.log('\n=== PENDING REQUESTS ===');
const pending = db.prepare("SELECT COUNT(*) as count FROM sap_btp_purchaseapproval_PurchaseRequests WHERE status = 'Pending'").get();
console.log('Count:', pending.count);

console.log('\n=== ACTIVE (Non-Draft) REQUESTS ===');
const active = db.prepare('SELECT ID, title, status FROM sap_btp_purchaseapproval_PurchaseRequests WHERE ID NOT IN (SELECT ID FROM PurchaseRequestService_PurchaseRequests_drafts)').all();
active.forEach(r => console.log(`  ${r.status} | ${r.title}`));

db.close();
