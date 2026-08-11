#!/bin/bash
# 启动前端静态服务器 (端口 5173)
echo "启动前端服务器..."
node -e "
const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = { '.html':'text/html','.js':'application/javascript','.css':'text/css','.ico':'image/x-icon' };
const root = path.join(__dirname, 'dist');
const server = http.createServer((req, res) => {
  const f = path.join(root, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); }
    else res.end(data);
  });
});
server.listen(5173, '0.0.0.0', () => console.log('前端已启动: http://localhost:5173'));
" &
echo "前端进程已启动，访问 http://localhost:5173"
echo ""
echo "如需启动后端Go服务，请另开终端执行:"
echo "  cd server && go run main.go"
