import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  server: {
    open: true
  },
  plugins: [{
    name: 'screenshot-saver',
    configureServer(server) {
      server.middlewares.use('/save-screenshot', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            const base64 = body.replace(/^data:image\/png;base64,/, '');
            const filePath = path.resolve('screenshot.png');
            fs.writeFileSync(filePath, base64, 'base64');
            res.writeHead(200);
            res.end('ok');
          });
        }
      });
    }
  }]
});
