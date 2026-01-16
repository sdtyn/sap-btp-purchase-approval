const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4004,
  path: '/odata/v4/purchase-request/PurchaseRequests',
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('katja:').toString('base64')
  }
};

console.log('Testing PurchaseRequestService for Katja...');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\n=== KATJA SEES THESE PURCHASE REQUESTS ===');
      if (json.value && json.value.length > 0) {
        json.value.forEach(r => {
          console.log(`${r.status} | ${r.requester} | ${r.title} | €${r.totalAmount}`);
        });
        console.log(`\nTotal: ${json.value.length} request(s)`);
      } else {
        console.log('No requests found');
      }
    } catch (err) {
      console.error('Parse error:', err.message);
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
});

req.end();
