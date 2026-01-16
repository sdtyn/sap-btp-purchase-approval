const axios = require('axios');

const BASE_URL = 'http://localhost:4004';

// Test users
const KATJA = { username: 'katja', password: '' }; // Requester
const MARKUS = { username: 'markus', password: '' }; // Requester + Approver

const auth = (user) => ({
  auth: { username: user.username, password: user.password }
});

async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  SERVICE TESTS');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // ===== TEST 1: KATALOG SERVICE =====
    console.log('TEST 1: Katalog Service - Produktliste abrufen');
    console.log('───────────────────────────────────────────────────');
    const productsResponse = await axios.get(
      `${BASE_URL}/odata/v4/catalog/Products`,
      auth(KATJA)
    );
    
    console.log(`✓ Status: ${productsResponse.status}`);
    console.log(`✓ Anzahl Produkte: ${productsResponse.data.value.length}`);
    console.log('\nErste 3 Produkte:');
    productsResponse.data.value.slice(0, 3).forEach(p => {
      console.log(`  - ${p.name} (€${p.price}) - Stock: ${p.stock}`);
    });

    // ===== TEST 2: BESTELLUNG ERSTELLEN =====
    console.log('\n\nTEST 2: Bestellung vom Katalog erstellen');
    console.log('───────────────────────────────────────────────────');
    
    // Wähle 2 Produkte aus dem Katalog
    const product1 = productsResponse.data.value.find(p => p.name.includes('Laptop'));
    const product2 = productsResponse.data.value.find(p => p.name.includes('Monitor'));
    
    console.log(`Selected: ${product1.name} (ID: ${product1.ID}, Stock: ${product1.stock})`);
    console.log(`Selected: ${product2.name} (ID: ${product2.ID}, Stock: ${product2.stock})`);
    
    console.log('\nErstelle Purchase Request mit Deep Insert...');
    
    // Create purchase request with items (deep insert)
    const purchaseRequest = {
      title: 'Test Bestellung - Hardware',
      description: 'Laptop und Monitor für neuen Mitarbeiter',
      totalAmount: (2 * product1.price) + (1 * product2.price),
      requester: 'katja',
      items: [
        {
          product_ID: product1.ID,
          quantity: 2,
          price: product1.price
        },
        {
          product_ID: product2.ID,
          quantity: 1,
          price: product2.price
        }
      ]
    };
    
    const createResponse = await axios.post(
      `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests`,
      purchaseRequest,
      auth(KATJA)
    );
    
    console.log(`✓ Draft erstellt`);
    const draftId = createResponse.data.ID;
    const IsActiveEntity = createResponse.data.IsActiveEntity;
    
    // Activate the draft
    if (!IsActiveEntity) {
      console.log(`✓ Aktiviere Draft...`);
      const activateResponse = await axios.post(
        `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests(ID=${draftId},IsActiveEntity=false)/PurchaseRequestService.draftActivate`,
        {},
        auth(KATJA)
      );
      console.log(`✓ Status: ${activateResponse.status}`);
      console.log(`✓ Request ID: ${activateResponse.data.ID}`);
      console.log(`✓ Status: ${activateResponse.data.status}`);
      console.log(`✓ Requester: ${activateResponse.data.requester}`);
      var requestId = activateResponse.data.ID;
    } else {
      console.log(`✓ Request ID: ${createResponse.data.ID}`);
      console.log(`✓ Status: ${createResponse.data.status}`);
      console.log(`✓ Requester: ${createResponse.data.requester}`);
      var requestId = createResponse.data.ID;
    }

    // ===== TEST 3: BESTELLUNG MIT PRODUCT-INFORMATIONEN =====
    console.log('\n\nTEST 3: Bestellung mit Product-Informationen prüfen');
    console.log('───────────────────────────────────────────────────');
    
    // Items abrufen
    const itemsResponse = await axios.get(
      `${BASE_URL}/odata/v4/purchase-request/PurchaseItems?$filter=request_ID eq ${requestId}`,
      auth(KATJA)
    );
    
    console.log(`✓ Anzahl Items: ${itemsResponse.data.value.length}`);
    console.log('\nItems Details:');
    
    for (const item of itemsResponse.data.value) {
      // Product-Details separat abrufen
      const productResponse = await axios.get(
        `${BASE_URL}/odata/v4/purchase-request/Products(${item.product_ID})`,
        auth(KATJA)
      );
      const product = productResponse.data;
      
      console.log(`  Item:`);
      console.log(`    - Product ID: ${item.product_ID}`);
      console.log(`    - Product Name: ${product.name}`);
      console.log(`    - Quantity: ${item.quantity}`);
      console.log(`    - Price: €${item.price}`);
      console.log(`    - Subtotal: €${item.quantity * item.price}`);
    }

    // ===== TEST 4: BESTELLUNGEN ANZEIGEN =====
    console.log('\n\nTEST 4: Bestellungen richtig anzeigen');
    console.log('───────────────────────────────────────────────────');
    
    const requestsResponse = await axios.get(
      `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests`,
      auth(KATJA)
    );
    
    console.log(`✓ Anzahl Bestellungen: ${requestsResponse.data.value.length}`);
    
    const request = requestsResponse.data.value.find(r => r.ID === requestId);
    if (request) {
      console.log('\nAngezeigte Bestellung:');
      console.log(`  Title: ${request.title}`);
      console.log(`  Status: ${request.status}`);
      console.log(`  Total Amount: €${request.totalAmount}`);
      console.log(`  Requester: ${request.requester}`);
      
      // Items für diese Bestellung abrufen
      const itemsForRequest = await axios.get(
        `${BASE_URL}/odata/v4/purchase-request/PurchaseItems?$filter=request_ID eq ${requestId}`,
        auth(KATJA)
      );
      
      console.log(`  Items (${itemsForRequest.data.value.length}):`);
      
      let calculatedTotal = 0;
      for (const [idx, item] of itemsForRequest.data.value.entries()) {
        const productResponse = await axios.get(
          `${BASE_URL}/odata/v4/purchase-request/Products(${item.product_ID})`,
          auth(KATJA)
        );
        const product = productResponse.data;
        const subtotal = item.quantity * item.price;
        calculatedTotal += subtotal;
        console.log(`    ${idx + 1}. ${product.name} - ${item.quantity}x €${item.price} = €${subtotal}`);
      }
      console.log(`  Berechnete Summe: €${calculatedTotal}`);
    }

    // ===== TEST 5: STOCK NACH APPROVAL PRÜFEN =====
    console.log('\n\nTEST 5: Stock-Reduktion nach Genehmigung');
    console.log('───────────────────────────────────────────────────');
    
    console.log('\nStock VOR Genehmigung:');
    const beforeApproval = await axios.get(
      `${BASE_URL}/odata/v4/catalog/Products(${product1.ID})`,
      auth(MARKUS)
    );
    console.log(`  ${beforeApproval.data.name}: ${beforeApproval.data.stock} Stück`);
    
    // Approve the request
    console.log('\nGenehmige Bestellung...');
    const approveResponse = await axios.post(
      `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests(ID='${requestId}',IsActiveEntity=true)/PurchaseRequestService.approve`,
      {},
      auth(MARKUS)
    );
    
    console.log(`✓ Approved - Status: ${approveResponse.data.status}`);
    
    console.log('\nStock NACH Genehmigung:');
    const afterApproval = await axios.get(
      `${BASE_URL}/odata/v4/catalog/Products(${product1.ID})`,
      auth(MARKUS)
    );
    console.log(`  ${afterApproval.data.name}: ${afterApproval.data.stock} Stück`);
    console.log(`  Reduziert um: ${beforeApproval.data.stock - afterApproval.data.stock} Stück`);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ✓ ALLE TESTS ERFOLGREICH');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ TEST FEHLER:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTests();
