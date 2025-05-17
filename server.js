const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;

http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = '.' + (reqPath === '/' ? '/index.html' : reqPath);
  const ext = path.extname(filePath);

  let contentType = 'text/html';
  switch (ext) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg':
    case '.jpeg': contentType = 'image/jpeg'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}).listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
