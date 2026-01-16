const axios = require('axios');

const BASE_URL = 'http://localhost:4004';
const KATJA = { username: 'katja', password: '' };
const MARKUS = { username: 'markus', password: '' };

const auth = (user) => ({ auth: { username: user.username, password: user.password } });

async function runEdgeCaseTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  EDGE CASE & VALIDATION TESTS');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Get products
    const productsResponse = await axios.get(
      `${BASE_URL}/odata/v4/catalog/Products`,
      auth(KATJA)
    );
    const product = productsResponse.data.value[0];

    // ===== TEST 1: INSUFFICIENT STOCK =====
    console.log('TEST 1: Insufficient Stock Validation');
    console.log('───────────────────────────────────────────────────');
    
    try {
      const draft = await axios.post(
        `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests`,
        {
          title: 'Zu viel bestellt',
          description: 'Test',
          totalAmount: 1000,
          requester: 'katja'
        },
        auth(KATJA)
      );
      
      // Add item with too much quantity
      await axios.post(
        `${BASE_URL}/odata/v4/purchase-request/PurchaseItems`,
        {
          request_ID: draft.data.ID,
          IsActiveEntity: false,
          product_ID: product.ID,
          quantity: 9999,  // More than available
          price: product.price
        },
        auth(KATJA)
      );
      
      await axios.post(
        `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests(ID=${draft.data.ID},IsActiveEntity=false)/PurchaseRequestService.draftActivate`,
        {},
        auth(KATJA)
      );
      
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error.message.includes('Insufficient stock')) {
        console.log('✓ Correctly rejected: Insufficient stock');
      } else {
        console.log('❌ Wrong error:', error.response?.data.error.message);
      }
    }

    // ===== TEST 2: PRODUCT NOT FOUND =====
    console.log('\n\nTEST 2: Invalid Product ID');
    console.log('───────────────────────────────────────────────────');
    
    try {
      const draft = await axios.post(
        `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests`,
        {
          title: 'Invalid Product',
          description: 'Test',
          totalAmount: 100,
          requester: 'katja',
          items: [{
            product_ID: 99999,  // Non-existent product
            quantity: 1,
            price: 100
          }]
        },
        auth(KATJA)
      );
      
      await axios.post(
        `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests(${draft.data.ID})/PurchaseRequestService.draftActivate`,
        {},
        auth(KATJA)
      );
      
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✓ Correctly rejected: Product not found');
      } else {
        console.log('❌ Wrong error:', error.response?.data.error.message);
      }
    }

    // ===== TEST 3: AUTHORIZATION - REQUESTER CANNOT APPROVE =====
    console.log('\n\nTEST 3: Authorization - Requester cannot approve own request');
    console.log('───────────────────────────────────────────────────');
    
    // Create a request as KATJA
    const draft = await axios.post(
      `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests`,
      {
        title: 'Authorization Test',
        description: 'Test',
        totalAmount: 100,
        requester: 'katja',
        items: [{
          product_ID: product.ID,
          quantity: 1,
          price: product.price
        }]
      },
      auth(KATJA)
    );
    
    const activeRequest = await axios.post(
      `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests(${draft.data.ID})/PurchaseRequestService.draftActivate`,
      {},
      auth(KATJA)
    );
    
    const requestId = activeRequest.data.ID;
    
    try {
      // Try to approve as KATJA (requester)
      await axios.post(
        `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests(${requestId})/PurchaseRequestService.approve`,
        {},
        auth(KATJA)
      );
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✓ Correctly rejected: Requester cannot approve');
      } else {
        console.log('❌ Wrong error:', error.response?.data.error.message);
      }
    }
    
    // Clean up - MARKUS approves it
    await axios.post(
      `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests(${requestId})/PurchaseRequestService.approve`,
      {},
      auth(MARKUS)
    );
    console.log('✓ MARKUS (Approver) successfully approved');

    // ===== TEST 4: CANNOT APPROVE ALREADY APPROVED REQUEST =====
    console.log('\n\nTEST 4: Cannot approve already approved request');
    console.log('───────────────────────────────────────────────────');
    
    try {
      await axios.post(
        `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests(${requestId})/PurchaseRequestService.approve`,
        {},
        auth(MARKUS)
      );
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error.message.includes('Cannot approve')) {
        console.log('✓ Correctly rejected: Already approved');
      } else {
        console.log('❌ Wrong error:', error.response?.data.error.message);
      }
    }

    // ===== TEST 5: STOCK TRACKING =====
    console.log('\n\nTEST 5: Stock Tracking across multiple orders');
    console.log('───────────────────────────────────────────────────');
    
    const beforeStock = await axios.get(
      `${BASE_URL}/odata/v4/catalog/Products(${product.ID})`,
      auth(KATJA)
    );
    console.log(`Initial Stock: ${beforeStock.data.stock}`);
    
    // Create and approve 2 orders
    for (let i = 0; i < 2; i++) {
      const d = await axios.post(
        `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests`,
        {
          title: `Order ${i + 1}`,
          totalAmount: product.price,
          requester: 'katja',
          items: [{ product_ID: product.ID, quantity: 1, price: product.price }]
        },
        auth(KATJA)
      );
      
      const active = await axios.post(
        `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests(${d.data.ID})/PurchaseRequestService.draftActivate`,
        {},
        auth(KATJA)
      );
      
      await axios.post(
        `${BASE_URL}/odata/v4/purchase-request/PurchaseRequests(${active.data.ID})/PurchaseRequestService.approve`,
        {},
        auth(MARKUS)
      );
    }
    
    const afterStock = await axios.get(
      `${BASE_URL}/odata/v4/catalog/Products(${product.ID})`,
      auth(KATJA)
    );
    console.log(`After 2 orders: ${afterStock.data.stock}`);
    console.log(`✓ Stock reduced by: ${beforeStock.data.stock - afterStock.data.stock}`);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ✓ ALL EDGE CASE TESTS COMPLETED');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runEdgeCaseTests();
