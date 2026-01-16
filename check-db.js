const sqlite3 = require('better-sqlite3');

try {
  const db = new sqlite3('db.sqlite');
  
  // Check tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('=== TABLES IN DATABASE ===');
  tables.forEach(t => console.log(' -', t.name));
  
  // Check Products
  const productsCount = db.prepare('SELECT COUNT(*) as count FROM sap_btp_purchaseapproval_Products').get();
  console.log('\n=== PRODUCTS ===');
  console.log('Total products:', productsCount.count);
  
  const products = db.prepare('SELECT ID, name, price, stock, category FROM sap_btp_purchaseapproval_Products').all();
  console.log('\nAll products:');
  products.forEach(p => console.log(`  ${p.ID}: ${p.name} - €${p.price} - Stock: ${p.stock} (${p.category})`));
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}
