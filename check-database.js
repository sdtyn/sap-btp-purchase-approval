const sqlite3 = require('better-sqlite3');

console.log('═══════════════════════════════════════════════════');
console.log('  DATABASE INTEGRITY CHECK');
console.log('═══════════════════════════════════════════════════\n');

try {
  const db = new sqlite3('db.sqlite');
  
  // Check Products
  console.log('1. PRODUCTS');
  console.log('───────────────────────────────────────────────────');
  const products = db.prepare('SELECT COUNT(*) as count, SUM(stock) as totalStock FROM sap_btp_purchaseapproval_Products').get();
  console.log(`✓ Total Products: ${products.count}`);
  console.log(`✓ Total Stock: ${products.totalStock}`);
  
  const lowStock = db.prepare('SELECT name, stock FROM sap_btp_purchaseapproval_Products WHERE stock < 20 ORDER BY stock').all();
  if (lowStock.length > 0) {
    console.log('\n⚠ Low Stock Products:');
    lowStock.forEach(p => console.log(`  - ${p.name}: ${p.stock}`));
  }
  
  // Check Purchase Requests
  console.log('\n\n2. PURCHASE REQUESTS');
  console.log('───────────────────────────────────────────────────');
  const requests = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM sap_btp_purchaseapproval_PurchaseRequests 
    GROUP BY status
  `).all();
  
  requests.forEach(r => {
    console.log(`  ${r.status}: ${r.count}`);
  });
  
  const totalRequests = db.prepare('SELECT COUNT(*) as count, SUM(totalAmount) as totalValue FROM sap_btp_purchaseapproval_PurchaseRequests').get();
  console.log(`✓ Total Requests: ${totalRequests.count}`);
  console.log(`✓ Total Value: €${totalRequests.totalValue || 0}`);
  
  // Check Purchase Items
  console.log('\n\n3. PURCHASE ITEMS');
  console.log('───────────────────────────────────────────────────');
  const items = db.prepare(`
    SELECT 
      i.product_ID,
      p.name,
      SUM(i.quantity) as totalOrdered,
      COUNT(DISTINCT i.request_ID) as numOrders
    FROM sap_btp_purchaseapproval_PurchaseItems i
    LEFT JOIN sap_btp_purchaseapproval_Products p ON p.ID = i.product_ID
    GROUP BY i.product_ID, p.name
    ORDER BY totalOrdered DESC
  `).all();
  
  if (items.length > 0) {
    console.log('Most Ordered Products:');
    items.slice(0, 5).forEach(i => {
      console.log(`  ${i.name}: ${i.totalOrdered} units (${i.numOrders} orders)`);
    });
  } else {
    console.log('  No items ordered yet');
  }
  
  // Check Data Consistency
  console.log('\n\n4. DATA CONSISTENCY CHECKS');
  console.log('───────────────────────────────────────────────────');
  
  // Check for orphaned items
  const orphanedItems = db.prepare(`
    SELECT COUNT(*) as count 
    FROM sap_btp_purchaseapproval_PurchaseItems i
    LEFT JOIN sap_btp_purchaseapproval_PurchaseRequests r ON r.ID = i.request_ID
    WHERE r.ID IS NULL
  `).get();
  
  if (orphanedItems.count > 0) {
    console.log(`❌ Found ${orphanedItems.count} orphaned items`);
  } else {
    console.log('✓ No orphaned items');
  }
  
  // Check for invalid product references
  const invalidProducts = db.prepare(`
    SELECT COUNT(*) as count 
    FROM sap_btp_purchaseapproval_PurchaseItems i
    LEFT JOIN sap_btp_purchaseapproval_Products p ON p.ID = i.product_ID
    WHERE p.ID IS NULL
  `).get();
  
  if (invalidProducts.count > 0) {
    console.log(`❌ Found ${invalidProducts.count} items with invalid product references`);
  } else {
    console.log('✓ All items reference valid products');
  }
  
  // Check stock levels vs approved orders
  console.log('\n\n5. STOCK IMPACT ANALYSIS');
  console.log('───────────────────────────────────────────────────');
  
  const stockAnalysis = db.prepare(`
    SELECT 
      p.name,
      p.stock as currentStock,
      COALESCE(SUM(CASE WHEN r.status = 'Approved' THEN i.quantity ELSE 0 END), 0) as approved,
      COALESCE(SUM(CASE WHEN r.status IN ('New', 'Pending') THEN i.quantity ELSE 0 END), 0) as pending
    FROM sap_btp_purchaseapproval_Products p
    LEFT JOIN sap_btp_purchaseapproval_PurchaseItems i ON i.product_ID = p.ID
    LEFT JOIN sap_btp_purchaseapproval_PurchaseRequests r ON r.ID = i.request_ID
    GROUP BY p.ID, p.name, p.stock
    HAVING approved > 0 OR pending > 0
    ORDER BY pending DESC
  `).all();
  
  if (stockAnalysis.length > 0) {
    console.log('Products with Orders:');
    stockAnalysis.forEach(p => {
      console.log(`  ${p.name}:`);
      console.log(`    Current Stock: ${p.currentStock}`);
      console.log(`    Approved Orders: ${p.approved}`);
      console.log(`    Pending Orders: ${p.pending}`);
      const available = p.currentStock - p.pending;
      console.log(`    Available after pending: ${available}${available < 0 ? ' ⚠ NEGATIVE!' : ''}`);
    });
  } else {
    console.log('  No orders yet');
  }
  
  db.close();
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ✓ DATABASE CHECK COMPLETE');
  console.log('═══════════════════════════════════════════════════\n');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
