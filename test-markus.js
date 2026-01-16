const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4004,
  path: '/odata/v4/purchase-request/PurchaseRequests',
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('markus:').toString('base64')
  }
};

console.log('Testing PurchaseRequestService for Markus...');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('\n=== MARKUS SEES THESE PURCHASE REQUESTS ===');
    if (json.value && json.value.length > 0) {
      json.value.forEach(r => {
        console.log(`${r.status} | ${r.requester} | ${r.title} | €${r.totalAmount}`);
      });
      console.log(`\nTotal: ${json.value.length} request(s)`);
    } else {
      console.log('✓ No requests found (Markus has no own requests yet)');
    }
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
});

req.end();
