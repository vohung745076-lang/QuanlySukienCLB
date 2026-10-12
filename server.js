const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8'
};

function sendFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, data) => {
        if (error) {
            res.writeHead(error.code === 'ENOENT' ? 404 : 500, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            res.end(error.code === 'ENOENT' ? '404 Not Found' : '500 Internal Server Error');
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const relativePath = requestPath === '/' ? '/index.html' : requestPath;
    const normalizedPath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(ROOT, normalizedPath);

    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (error, stats) => {
        if (!error && stats.isDirectory()) {
            sendFile(path.join(filePath, 'index.html'), res);
            return;
        }

        sendFile(filePath, res);
    });
});

server.listen(PORT, () => {
    console.log(`Local server is running at http://localhost:${PORT}`);
});
