import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { COVERS_DIR } from '../db.js';

const router = express.Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, COVERS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTS.includes(ext) ? ext : '.jpg';
    const safeName = `${uuidv4()}${safeExt}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

// Upload local file
router.post('/', upload.single('cover'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  res.json({
    asset_id: req.file.filename,
    url: `/api/covers/${req.file.filename}`
  });
});

// Download remote image and store locally (Local-First)
router.post('/remote', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://douban.com'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to download image from source' });
    }

    const contentType = response.headers.get('content-type') || '';
    let ext = '.jpg';
    if (contentType.includes('png')) ext = '.png';
    else if (contentType.includes('webp')) ext = '.webp';

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName = `${uuidv4()}${ext}`;
    const targetPath = path.join(COVERS_DIR, safeName);

    await fs.promises.writeFile(targetPath, buffer);

    res.json({
      asset_id: safeName,
      url: `/api/covers/${safeName}`
    });
  } catch (err) {
    console.error('Remote image download error:', err);
    res.status(500).json({ error: 'Failed to download remote cover' });
  }
});

export default router;
