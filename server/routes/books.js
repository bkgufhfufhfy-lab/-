import express from 'express';
import { db } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper: sync tags
function syncItemTags(itemId, tagNames) {
  if (!Array.isArray(tagNames)) return;

  const deleteStmt = db.prepare('DELETE FROM item_tags WHERE item_id = ?');
  deleteStmt.run(itemId);

  const findTagStmt = db.prepare('SELECT id FROM tags WHERE name = ?');
  const insertTagStmt = db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)');
  const linkStmt = db.prepare('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)');

  for (const rawName of tagNames) {
    const name = String(rawName).trim();
    if (!name) continue;

    let tag = findTagStmt.get(name);
    let tagId = tag ? tag.id : null;
    if (!tagId) {
      tagId = uuidv4();
      insertTagStmt.run(tagId, name);
    }
    linkStmt.run(itemId, tagId);
  }
}

// GET /api/books/stats
router.get('/stats', (req, res) => {
  try {
    const statsQuery = db.prepare(`
      SELECT
        COUNT(*) as total_books,
        SUM(CASE WHEN i.status = 'reading' THEN 1 ELSE 0 END) as reading_count,
        SUM(CASE WHEN i.status = 'finished' THEN 1 ELSE 0 END) as finished_count,
        SUM(CASE WHEN i.status = 'wish' THEN 1 ELSE 0 END) as wish_count,
        SUM(CASE WHEN i.status = 'abandoned' THEN 1 ELSE 0 END) as abandoned_count,
        SUM(COALESCE(b.current_page, 0)) as total_pages_read,
        ROUND(AVG(CASE WHEN i.rating IS NOT NULL THEN i.rating / 2.0 ELSE NULL END), 1) as avg_rating
      FROM items i
      LEFT JOIN book_details b ON i.id = b.item_id
      WHERE i.category = 'book'
    `);
    const stats = statsQuery.get();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/search-online
router.get('/search-online', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword || !keyword.trim()) {
    return res.json([]);
  }

  const query = keyword.trim();
  const results = [];
  const seenTitles = new Set();

  // 1. Search NeoDB
  try {
    const neodbRes = await fetch(
      `https://neodb.social/api/catalog/search?query=${encodeURIComponent(query)}&category=book`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      }
    );
    if (neodbRes.ok) {
      const neodbData = await neodbRes.json();
      for (const item of (neodbData.data || [])) {
        if (!item.title) continue;
        const normalizedTitle = item.title.trim().toLowerCase();
        seenTitles.add(normalizedTitle);

        results.push({
          title: item.title,
          original_title: item.orig_title || '',
          author: Array.isArray(item.author) ? item.author.join(', ') : (item.author || ''),
          translator: Array.isArray(item.translator) ? item.translator.join(', ') : (item.translator || ''),
          publisher: Array.isArray(item.publisher) ? item.publisher.join(', ') : (item.publisher || ''),
          publish_date: item.pub_date || (item.year ? String(item.year) : ''),
          isbn: item.isbn || '',
          total_pages: item.pages ? Number(item.pages) : null,
          summary: item.brief || '',
          cover_url: item.cover_image_url || '',
          source: 'NeoDB'
        });
      }
    }
  } catch (err) {
    console.error('NeoDB online search error:', err.message);
  }

  // 2. Search Douban Suggest
  try {
    const doubanRes = await fetch(
      `https://book.douban.com/j/subject_suggest?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    );
    if (doubanRes.ok) {
      const doubanData = await doubanRes.json();
      for (const item of (doubanData || [])) {
        if (!item.title) continue;
        const normalizedTitle = item.title.trim().toLowerCase();
        // If not already included
        if (!seenTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle);
          results.push({
            title: item.title,
            original_title: '',
            author: item.author_name || '',
            translator: '',
            publisher: '',
            publish_date: item.year || '',
            isbn: '',
            total_pages: null,
            summary: '',
            cover_url: item.pic || '',
            source: '豆瓣'
          });
        }
      }
    }
  } catch (err) {
    console.error('Douban online search error:', err.message);
  }

  res.json(results.slice(0, 8));
});

// GET /api/books
router.get('/', (req, res) => {
  try {
    const { status, search, favorite, sort = 'updated_at' } = req.query;

    let sql = `
      SELECT
        i.id, i.category, i.title, i.original_title, i.cover_asset_id, i.cover_url,
        i.status, i.rating, i.favorite, i.summary, i.created_at, i.updated_at,
        b.author, b.translator, b.publisher, b.publish_date, b.isbn,
        b.total_pages, b.current_page, b.start_date, b.finish_date,
        (SELECT COUNT(*) FROM quotes q WHERE q.item_id = i.id) as quotes_count,
        (
          SELECT json_group_array(t.name)
          FROM item_tags it
          JOIN tags t ON it.tag_id = t.id
          WHERE it.item_id = i.id
        ) as tags_json
      FROM items i
      LEFT JOIN book_details b ON i.id = b.item_id
      WHERE i.category = 'book'
    `;

    const params = [];

    if (status && status !== 'all') {
      sql += ' AND i.status = ?';
      params.push(status);
    }

    if (favorite === 'true' || favorite === '1') {
      sql += ' AND i.favorite = 1';
    }

    if (search && search.trim()) {
      const keyword = `%${search.trim()}%`;
      sql += ` AND (
        i.title LIKE ? OR
        b.author LIKE ? OR
        b.publisher LIKE ? OR
        b.isbn LIKE ? OR
        EXISTS (
          SELECT 1 FROM item_tags it
          JOIN tags t ON it.tag_id = t.id
          WHERE it.item_id = i.id AND t.name LIKE ?
        )
      )`;
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    // Sort order
    if (sort === 'rating') {
      sql += ' ORDER BY i.rating DESC NULLS LAST, i.updated_at DESC';
    } else if (sort === 'progress') {
      sql += ' ORDER BY CAST(b.current_page AS FLOAT) / NULLIF(b.total_pages, 0) DESC NULLS LAST';
    } else if (sort === 'created_at') {
      sql += ' ORDER BY i.created_at DESC';
    } else {
      sql += ' ORDER BY i.updated_at DESC';
    }

    const books = db.prepare(sql).all(...params).map(row => ({
      ...row,
      tags: row.tags_json ? JSON.parse(row.tags_json) : []
    }));

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/:id
router.get('/:id', (req, res) => {
  try {
    const itemSql = `
      SELECT
        i.id, i.category, i.title, i.original_title, i.cover_asset_id, i.cover_url,
        i.status, i.rating, i.favorite, i.summary, i.my_review, i.created_at, i.updated_at,
        b.author, b.translator, b.publisher, b.publish_date, b.isbn,
        b.total_pages, b.current_page, b.start_date, b.finish_date
      FROM items i
      LEFT JOIN book_details b ON i.id = b.item_id
      WHERE i.id = ? AND i.category = 'book'
    `;
    const item = db.prepare(itemSql).get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Book not found' });

    // Fetch quotes
    const quotes = db.prepare('SELECT * FROM quotes WHERE item_id = ? ORDER BY created_at DESC').all(req.params.id);

    // Fetch tags
    const tags = db.prepare(`
      SELECT t.name FROM item_tags it
      JOIN tags t ON it.tag_id = t.id
      WHERE it.item_id = ?
    `).all(req.params.id).map(r => r.name);

    res.json({ ...item, quotes, tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/books
router.post('/', (req, res) => {
  const {
    title, original_title, cover_asset_id, cover_url, status = 'wish',
    rating, favorite = 0, summary, my_review,
    author, translator, publisher, publish_date, isbn,
    total_pages, current_page = 0, start_date, finish_date,
    tags = []
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const id = uuidv4();
  const insertTransaction = db.transaction(() => {
    // 1. Insert into items
    db.prepare(`
      INSERT INTO items (
        id, category, title, original_title, cover_asset_id, cover_url,
        status, rating, favorite, summary, my_review
      ) VALUES (?, 'book', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, title.trim(), original_title || null, cover_asset_id || null, cover_url || null,
      status, rating !== undefined && rating !== null ? Number(rating) : null,
      favorite ? 1 : 0, summary || null, my_review || null
    );

    // 2. Insert into book_details
    db.prepare(`
      INSERT INTO book_details (
        item_id, author, translator, publisher, publish_date, isbn,
        total_pages, current_page, start_date, finish_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, author || null, translator || null, publisher || null, publish_date || null, isbn || null,
      total_pages ? Number(total_pages) : null, current_page ? Number(current_page) : 0,
      start_date || null, finish_date || null
    );

    // 3. Sync tags
    syncItemTags(id, tags);
  });

  try {
    insertTransaction();
    res.status(201).json({ id, message: 'Book created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/books/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    title, original_title, cover_asset_id, cover_url, status,
    rating, favorite, summary, my_review,
    author, translator, publisher, publish_date, isbn,
    total_pages, current_page, start_date, finish_date,
    tags
  } = req.body;

  const updateTransaction = db.transaction(() => {
    // Update items
    db.prepare(`
      UPDATE items SET
        title = COALESCE(?, title),
        original_title = ?,
        cover_asset_id = ?,
        cover_url = ?,
        status = COALESCE(?, status),
        rating = ?,
        favorite = COALESCE(?, favorite),
        summary = ?,
        my_review = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND category = 'book'
    `).run(
      title ? title.trim() : null, original_title || null, cover_asset_id || null, cover_url || null,
      status || null, rating !== undefined && rating !== null ? Number(rating) : null,
      favorite !== undefined ? (favorite ? 1 : 0) : null, summary || null, my_review || null,
      id
    );

    // Update book_details
    db.prepare(`
      UPDATE book_details SET
        author = ?,
        translator = ?,
        publisher = ?,
        publish_date = ?,
        isbn = ?,
        total_pages = ?,
        current_page = COALESCE(?, current_page),
        start_date = ?,
        finish_date = ?
      WHERE item_id = ?
    `).run(
      author || null, translator || null, publisher || null, publish_date || null, isbn || null,
      total_pages ? Number(total_pages) : null, current_page !== undefined ? Number(current_page) : null,
      start_date || null, finish_date || null,
      id
    );

    if (tags !== undefined) {
      syncItemTags(id, tags);
    }
  });

  try {
    updateTransaction();
    res.json({ message: 'Book updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/books/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare("DELETE FROM items WHERE id = ? AND category = 'book'").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/books/:id/quotes
router.post('/:id/quotes', (req, res) => {
  const { content, page_number, note } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Quote content is required' });
  }

  const quoteId = uuidv4();
  try {
    db.prepare(`
      INSERT INTO quotes (id, item_id, content, page_number, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(quoteId, req.params.id, content.trim(), page_number ? Number(page_number) : null, note || null);

    // Touch item updated_at
    db.prepare('UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

    res.status(201).json({ id: quoteId, content, page_number, note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/books/:id/quotes/:quoteId
router.delete('/:id/quotes/:quoteId', (req, res) => {
  try {
    db.prepare('DELETE FROM quotes WHERE id = ? AND item_id = ?').run(req.params.quoteId, req.params.id);
    res.json({ message: 'Quote deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
