const sqlite3 = require('better-sqlite3');

try {
  const db = new sqlite3('db.sqlite');
  
  console.log('=== PURCHASE ITEMS TABLE STRUCTURE ===');
  const itemsInfo = db.prepare("PRAGMA table_info(sap_btp_purchaseapproval_PurchaseItems)").all();
  itemsInfo.forEach(col => console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`));
  
  console.log('\n=== PRODUCTS TABLE STRUCTURE ===');
  const productsInfo = db.prepare("PRAGMA table_info(sap_btp_purchaseapproval_Products)").all();
  productsInfo.forEach(col => console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`));
  
  console.log('\n=== SAMPLE PRODUCTS ===');
  const products = db.prepare('SELECT ID, name, price, stock FROM sap_btp_purchaseapproval_Products LIMIT 5').all();
  products.forEach(p => console.log(`  ID: ${p.ID} | ${p.name} | €${p.price} | Stock: ${p.stock}`));
  
  db.close();
  console.log('\n✓ Schema updated successfully!');
} catch (error) {
  console.error('Error:', error.message);
}
