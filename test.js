// This simulates EXACTLY what the freeCodeCamp test does
const http = require('http');

const baseUrl = 'http://localhost:3000';
const urlVariable = Date.now();
const fullUrl = `${baseUrl}/?v=${urlVariable}`;

function post(path, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getRedirect(path) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${path}`, (res) => {
      resolve({
        statusCode: res.statusCode,
        location: res.headers.location
      });
    }).on('error', reject);
  });
}

async function runTest() {
  console.log('=== Test 3: Redirect ===');
  console.log('fullUrl:', fullUrl);
  
  // The test sends this as the body (NOT url-encoded!):
  const body = `url=${fullUrl}`;
  console.log('raw body being sent:', body);
  
  // Step 1: POST
  const postData = await post('/api/shorturl', body);
  console.log('POST response:', postData);
  console.log('original_url matches?', postData.original_url === fullUrl);
  
  // Step 2: GET redirect
  const getRes = await getRedirect('/api/shorturl/' + postData.short_url);
  console.log('\nGET /api/shorturl/' + postData.short_url);
  console.log('Status:', getRes.statusCode);
  console.log('Location header:', getRes.location);
  console.log('Expected:', fullUrl);
  console.log('Match:', getRes.location === fullUrl);
  
  if (getRes.statusCode === 302 && getRes.location === fullUrl) {
    console.log('\n✅ REDIRECT TEST PASSED!');
  } else {
    console.log('\n❌ REDIRECT TEST FAILED!');
  }
}

runTest().catch(console.error);
