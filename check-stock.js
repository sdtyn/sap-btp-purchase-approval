const db = require('better-sqlite3')('db.sqlite');

console.log('\n═══════════════════════════════════════════════════');
console.log('  FINAL STOCK STATUS');
console.log('═══════════════════════════════════════════════════\n');

const products = db.prepare(`
  SELECT ID, name, stock 
  FROM sap_btp_purchaseapproval_Products 
  WHERE ID IN (1,2)
`).all();

products.forEach(p => {
  const originalStock = p.ID === 1 ? 25 : 50;
  const reduced = originalStock - p.stock;
  console.log(`${p.name}:`);
  console.log(`  Original: ${originalStock}`);
  console.log(`  Current:  ${p.stock}`);
  console.log(`  Reduced:  ${reduced}\n`);
});

db.close();
