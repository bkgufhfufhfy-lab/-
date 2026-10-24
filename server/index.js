import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, COVERS_DIR } from './db.js';
import booksRouter from './routes/books.js';
import itemsRouter from './routes/items.js';
import uploadRouter from './routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces so iPhone on same Wi-Fi can connect

// Initialize database schema
initDatabase();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Secure static cover serving with path traversal guard
app.use('/api/covers', (req, res, next) => {
  const safeFilename = path.basename(req.path);
  const targetPath = path.join(COVERS_DIR, safeFilename);

  // Guard against traversal
  if (!targetPath.startsWith(COVERS_DIR)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (fs.existsSync(targetPath)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(targetPath);
  } else {
    res.status(404).json({ error: 'Cover image not found' });
  }
});

// API Routes
app.use('/api/items', itemsRouter);
app.use('/api/books', booksRouter);
app.use('/api/upload', uploadRouter);

// Serve frontend dist when built
const DIST_PATH = path.resolve(__dirname, '../dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(DIST_PATH, 'index.html'));
    }
  });
}

app.listen(PORT, HOST, () => {
  console.log(`✨ Time Capsule Local Server is running on http://${HOST}:${PORT}`);
});
