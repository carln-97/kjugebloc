const http = require('http');
const fs = require('fs');
const path = require('path');

http.createServer((req, res) => {
  let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
  const ext = path.extname(filePath);

  let contentType = 'text/html';
  switch (ext) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.csv': contentType = 'text/csv'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg':
    case '.jpeg': contentType = 'image/jpeg'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
  }

  // Stream file if exists
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}).listen(8000);

console.log('Server running at http://localhost:8000');
