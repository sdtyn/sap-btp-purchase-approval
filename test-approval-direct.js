const http = require('http');

const options = {
  hostname: 'localhost',
  port: 53290,
  path: '/odata/v4/approval/PurchaseRequests',
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('markus:').toString('base64')
  }
};

console.log('Testing ApprovalService directly for Markus...\n');

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse Body:');
    console.log(data);
    
    try {
      const json = JSON.parse(data);
      if (json.value) {
        console.log(`\n✓ Found ${json.value.length} requests`);
        json.value.forEach(r => {
          console.log(`  - ${r.requester} | ${r.title} | Status: ${r.status}`);
        });
      }
    } catch (err) {
      console.error('Parse error:', err.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
});

req.end();
