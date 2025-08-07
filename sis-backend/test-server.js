const http = require('http');

http.get('http://localhost:5000/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Server is running:', data);
    process.exit(0);
  });
}).on('error', (err) => {
  console.log('Server is not running:', err.message);
  process.exit(1);
});