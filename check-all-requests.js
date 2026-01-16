const db = require('better-sqlite3')('db.sqlite');

// Show all purchase requests
const allRequests = db.prepare(`
  SELECT 
    ID,
    title,
    status,
    requester,
    totalAmount,
    createdAt
  FROM sap_btp_purchaseapproval_PurchaseRequests
  ORDER BY createdAt DESC
`).all();

console.log('=== ALL PURCHASE REQUESTS IN DATABASE ===');
allRequests.forEach(r => {
  const date = new Date(r.createdAt).toLocaleString('de-DE');
  console.log(`${r.status.padEnd(10)} | ${r.requester.padEnd(10)} | ${r.title} | €${r.totalAmount} | ${date}`);
});
console.log(`\nTotal: ${allRequests.length} request(s)`);

// Show what Markus should see in ApprovalService (Pending only)
const pendingForApproval = allRequests.filter(r => r.status === 'Pending');
console.log('\n=== MARKUS SHOULD SEE IN GENEHMIGUNGEN (Status=Pending) ===');
if (pendingForApproval.length > 0) {
  pendingForApproval.forEach(r => {
    console.log(`${r.requester} | ${r.title} | €${r.totalAmount}`);
  });
} else {
  console.log('None');
}
console.log(`Total: ${pendingForApproval.length} request(s)`);

db.close();
