const https = require('https');

const data = JSON.stringify({
  email: 'admin@savefood.vn',
  password: '123456'
});

const options = {
  hostname: 'localhost',
  port: 7251,
  path: '/api/Users/login',
  method: 'POST',
  rejectUnauthorized: false, // Ignore self-signed certs
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  let responseBody = '';
  res.on('data', chunk => {
    responseBody += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(responseBody);
      if (parsed.accessToken) {
        console.log('Login successful! Token received.');
      } else {
        console.log('Login failed: Token not found.', parsed);
      }
    } catch (e) {
      console.log('Error parsing response:', responseBody);
    }
  });
});

req.on('error', error => {
  console.error('Error connecting to API:', error);
});

req.write(data);
req.end();
