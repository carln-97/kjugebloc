const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;

http.createServer((req, res) => {
  // Strip query parameters and hash fragments
  const cleanPath = req.url.split('?')[0].split('#')[0];
  const filePath = '.' + (cleanPath === '/' ? '/index.html' : cleanPath);
  const ext = path.extname(filePath).toLowerCase();

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
    default: contentType = 'text/html'; break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error(`404 Not Found: ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      console.log(`200 OK: ${filePath}`);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}).listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
