const http = require('http');

const testUser = (username) => {
  const options = {
    hostname: 'localhost',
    port: 4004,
    path: '/odata/v4/approval/PurchaseRequests',
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${username}:`).toString('base64')
    }
  };

  console.log(`\n=== TESTING ${username.toUpperCase()} - ApprovalService ===`);

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`\n${username} sieht diese Genehmigungen:`);
        if (json.value && json.value.length > 0) {
          json.value.forEach(r => {
            console.log(`  ${r.status} | ${r.requester} | ${r.title} | €${r.totalAmount}`);
          });
          console.log(`\nTotal: ${json.value.length} Bestellung(en)`);
        } else {
          console.log('  Keine Genehmigungen (alle von ihm selbst oder keine vorhanden)');
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
};

// Test both users
testUser('markus');
setTimeout(() => testUser('katja'), 500);
