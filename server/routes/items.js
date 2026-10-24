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

// GET /api/items/stats
router.get('/stats', (req, res) => {
  try {
    const { category } = req.query;

    const overall = db.prepare(`
      SELECT
        COUNT(*) as total_items,
        SUM(CASE WHEN category = 'book' THEN 1 ELSE 0 END) as total_books,
        SUM(CASE WHEN category = 'game' THEN 1 ELSE 0 END) as total_games,
        SUM(CASE WHEN category = 'movie' THEN 1 ELSE 0 END) as total_movies,
        SUM(CASE WHEN favorite = 1 THEN 1 ELSE 0 END) as total_favorites,
        ROUND(AVG(CASE WHEN rating IS NOT NULL THEN rating / 2.0 ELSE NULL END), 1) as avg_rating
      FROM items
    `).get();

    const bookStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN i.status = 'reading' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN i.status = 'finished' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN i.status = 'wish' THEN 1 ELSE 0 END) as wish,
        SUM(COALESCE(b.current_page, 0)) as metric_sum
      FROM items i
      LEFT JOIN book_details b ON i.id = b.item_id
      WHERE i.category = 'book'
    `).get();

    const gameStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN i.status = 'playing' OR i.status = 'reading' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN i.status = 'cleared' OR i.status = 'finished' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN i.status = 'wish' THEN 1 ELSE 0 END) as wish,
        ROUND(SUM(COALESCE(g.play_time_hours, 0)), 1) as metric_sum
      FROM items i
      LEFT JOIN game_details g ON i.id = g.item_id
      WHERE i.category = 'game'
    `).get();

    const movieStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN i.status = 'watching' OR i.status = 'reading' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN i.status = 'watched' OR i.status = 'finished' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN i.status = 'wish' THEN 1 ELSE 0 END) as wish,
        SUM(COALESCE(m.duration_minutes, 0)) as metric_sum
      FROM items i
      LEFT JOIN movie_details m ON i.id = m.item_id
      WHERE i.category = 'movie'
    `).get();

    res.json({
      overall,
      book: bookStats,
      game: gameStats,
      movie: movieStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/search-online
router.get('/search-online', async (req, res) => {
  const { keyword, category = 'book' } = req.query;
  if (!keyword || !keyword.trim()) return res.json([]);

  const query = keyword.trim();
  const results = [];
  const seenTitles = new Set();

  try {
    if (category === 'book') {
      // 1. NeoDB Books
      try {
        const r = await fetch(`https://neodb.social/api/catalog/search?query=${encodeURIComponent(query)}&category=book`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (r.ok) {
          const d = await r.json();
          for (const item of (d.data || [])) {
            if (!item.title) continue;
            seenTitles.add(item.title.trim().toLowerCase());
            results.push({
              title: item.title,
              original_title: item.orig_title || '',
              author: Array.isArray(item.author) ? item.author.join(', ') : (item.author || ''),
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
      } catch (e) {
        console.error('NeoDB book error:', e.message);
      }

      // 2. Douban Book Suggest
      try {
        const r = await fetch(`https://book.douban.com/j/subject_suggest?q=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (r.ok) {
          const d = await r.json();
          for (const item of (d || [])) {
            if (!item.title || seenTitles.has(item.title.trim().toLowerCase())) continue;
            seenTitles.add(item.title.trim().toLowerCase());
            results.push({
              title: item.title,
              original_title: '',
              author: item.author_name || '',
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
      } catch (e) {
        console.error('Douban book error:', e.message);
      }
    } else if (category === 'game') {
      // NeoDB Game
      try {
        const r = await fetch(`https://neodb.social/api/catalog/search?query=${encodeURIComponent(query)}&category=game`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (r.ok) {
          const d = await r.json();
          for (const item of (d.data || [])) {
            if (!item.title) continue;
            seenTitles.add(item.title.trim().toLowerCase());
            results.push({
              title: item.title,
              original_title: item.orig_title || '',
              developer: Array.isArray(item.developer) ? item.developer.join(', ') : (item.developer || ''),
              publisher: Array.isArray(item.publisher) ? item.publisher.join(', ') : (item.publisher || ''),
              platform: Array.isArray(item.genre) ? item.genre.join(', ') : 'PC / Steam',
              release_date: item.release_date || (item.year ? String(item.year) : ''),
              summary: item.brief || '',
              cover_url: item.cover_image_url || '',
              source: 'NeoDB'
            });
          }
        }
      } catch (e) {
        console.error('NeoDB game error:', e.message);
      }
    } else if (category === 'movie') {
      // 1. Douban Movie Suggest
      try {
        const r = await fetch(`https://movie.douban.com/j/subject_suggest?q=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (r.ok) {
          const d = await r.json();
          for (const item of (d || [])) {
            if (!item.title) continue;
            seenTitles.add(item.title.trim().toLowerCase());
            results.push({
              title: item.title,
              original_title: item.sub_title || '',
              subtype: item.type === 'movie' ? 'movie' : 'series',
              director: '',
              actors: '',
              release_date: item.year || '',
              summary: '',
              cover_url: item.img || item.pic || '',
              source: '豆瓣'
            });
          }
        }
      } catch (e) {
        console.error('Douban movie error:', e.message);
      }

      // 2. NeoDB Movie
      try {
        const r = await fetch(`https://neodb.social/api/catalog/search?query=${encodeURIComponent(query)}&category=movie`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (r.ok) {
          const d = await r.json();
          for (const item of (d.data || [])) {
            if (!item.title || seenTitles.has(item.title.trim().toLowerCase())) continue;
            seenTitles.add(item.title.trim().toLowerCase());
            results.push({
              title: item.title,
              original_title: item.orig_title || '',
              subtype: 'movie',
              director: Array.isArray(item.director) ? item.director.join(', ') : (item.director || ''),
              actors: Array.isArray(item.actor) ? item.actor.slice(0, 4).join(', ') : (item.actor || ''),
              release_date: item.pub_date || (item.year ? String(item.year) : ''),
              summary: item.brief || '',
              cover_url: item.cover_image_url || '',
              source: 'NeoDB'
            });
          }
        }
      } catch (e) {
        console.error('NeoDB movie error:', e.message);
      }
    }
  } catch (err) {
    console.error('Search online error:', err);
  }

  res.json(results.slice(0, 8));
});

// GET /api/items
router.get('/', (req, res) => {
  try {
    const { category, status, search, favorite, sort = 'updated_at' } = req.query;

    let sql = `
      SELECT
        i.id, i.category, i.title, i.original_title, i.cover_asset_id, i.cover_url,
        i.status, i.rating, i.favorite, i.summary, i.created_at, i.updated_at,
        -- Book details
        b.author, b.translator, b.publisher as book_publisher, b.publish_date as book_publish_date,
        b.isbn, b.total_pages, b.current_page, b.start_date, b.finish_date,
        -- Game details
        g.platform as game_platform, g.developer as game_developer, g.publisher as game_publisher,
        g.release_date as game_release_date, g.play_time_hours, g.expected_hours, g.clear_date, g.achievement_status,
        -- Movie details
        m.subtype as movie_subtype, m.director, m.actors, m.release_date as movie_release_date,
        m.duration_minutes, m.total_episodes, m.current_episode, m.watch_platform, m.watch_date,
        -- Stats & Tags
        (SELECT COUNT(*) FROM quotes q WHERE q.item_id = i.id) as quotes_count,
        (
          SELECT json_group_array(t.name)
          FROM item_tags it
          JOIN tags t ON it.tag_id = t.id
          WHERE it.item_id = i.id
        ) as tags_json
      FROM items i
      LEFT JOIN book_details b ON i.id = b.item_id
      LEFT JOIN game_details g ON i.id = g.item_id
      LEFT JOIN movie_details m ON i.id = m.item_id
      WHERE 1=1
    `;

    const params = [];

    if (category && category !== 'all') {
      sql += ' AND i.category = ?';
      params.push(category);
    }

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
        g.developer LIKE ? OR
        m.director LIKE ? OR
        EXISTS (
          SELECT 1 FROM item_tags it
          JOIN tags t ON it.tag_id = t.id
          WHERE it.item_id = i.id AND t.name LIKE ?
        )
      )`;
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    if (sort === 'rating') {
      sql += ' ORDER BY i.rating DESC NULLS LAST, i.updated_at DESC';
    } else if (sort === 'created_at') {
      sql += ' ORDER BY i.created_at DESC';
    } else {
      sql += ' ORDER BY i.updated_at DESC';
    }

    const items = db.prepare(sql).all(...params).map(row => ({
      ...row,
      tags: row.tags_json ? JSON.parse(row.tags_json) : []
    }));

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/:id
router.get('/:id', (req, res) => {
  try {
    const itemSql = `
      SELECT
        i.id, i.category, i.title, i.original_title, i.cover_asset_id, i.cover_url,
        i.status, i.rating, i.favorite, i.summary, i.my_review, i.created_at, i.updated_at,
        b.author, b.translator, b.publisher as book_publisher, b.publish_date as book_publish_date,
        b.isbn, b.total_pages, b.current_page, b.start_date, b.finish_date,
        g.platform as game_platform, g.developer as game_developer, g.publisher as game_publisher,
        g.release_date as game_release_date, g.play_time_hours, g.expected_hours, g.clear_date, g.achievement_status,
        m.subtype as movie_subtype, m.director, m.actors, m.release_date as movie_release_date,
        m.duration_minutes, m.total_episodes, m.current_episode, m.watch_platform, m.watch_date
      FROM items i
      LEFT JOIN book_details b ON i.id = b.item_id
      LEFT JOIN game_details g ON i.id = g.item_id
      LEFT JOIN movie_details m ON i.id = m.item_id
      WHERE i.id = ?
    `;
    const item = db.prepare(itemSql).get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const quotes = db.prepare('SELECT * FROM quotes WHERE item_id = ? ORDER BY created_at DESC').all(req.params.id);
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

// POST /api/items
router.post('/', (req, res) => {
  const {
    category = 'book', title, original_title, cover_asset_id, cover_url, status = 'wish',
    rating, favorite = 0, summary, my_review,
    // Book
    author, translator, publisher, publish_date, isbn, total_pages, current_page = 0, start_date, finish_date,
    // Game
    platform, developer, game_publisher, game_release_date, play_time_hours = 0, expected_hours, clear_date, achievement_status,
    // Movie
    subtype = 'movie', director, actors, movie_release_date, duration_minutes, total_episodes = 1, current_episode = 1, watch_platform, watch_date,
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, category, title.trim(), original_title || null, cover_asset_id || null, cover_url || null,
      status, rating !== undefined && rating !== null ? Number(rating) : null,
      favorite ? 1 : 0, summary || null, my_review || null
    );

    // 2. Insert into category table
    if (category === 'book') {
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
    } else if (category === 'game') {
      db.prepare(`
        INSERT INTO game_details (
          item_id, platform, developer, publisher, release_date,
          play_time_hours, expected_hours, clear_date, achievement_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, platform || null, developer || null, game_publisher || publisher || null,
        game_release_date || publish_date || null, play_time_hours ? Number(play_time_hours) : 0,
        expected_hours ? Number(expected_hours) : null, clear_date || null, achievement_status || 'none'
      );
    } else if (category === 'movie') {
      db.prepare(`
        INSERT INTO movie_details (
          item_id, subtype, director, actors, release_date,
          duration_minutes, total_episodes, current_episode, watch_platform, watch_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, subtype || 'movie', director || null, actors || null, movie_release_date || publish_date || null,
        duration_minutes ? Number(duration_minutes) : null, total_episodes ? Number(total_episodes) : 1,
        current_episode ? Number(current_episode) : 1, watch_platform || null, watch_date || null
      );
    }

    // 3. Sync tags
    syncItemTags(id, tags);
  });

  try {
    insertTransaction();
    res.status(201).json({ id, message: 'Item created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/items/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    category, title, original_title, cover_asset_id, cover_url, status,
    rating, favorite, summary, my_review,
    // Book
    author, translator, publisher, publish_date, isbn, total_pages, current_page, start_date, finish_date,
    // Game
    platform, developer, game_publisher, game_release_date, play_time_hours, expected_hours, clear_date, achievement_status,
    // Movie
    subtype, director, actors, movie_release_date, duration_minutes, total_episodes, current_episode, watch_platform, watch_date,
    tags
  } = req.body;

  const updateTransaction = db.transaction(() => {
    // 1. Update items
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
      WHERE id = ?
    `).run(
      title ? title.trim() : null, original_title || null, cover_asset_id || null, cover_url || null,
      status || null, rating !== undefined && rating !== null ? Number(rating) : null,
      favorite !== undefined ? (favorite ? 1 : 0) : null, summary || null, my_review || null,
      id
    );

    // 2. Update category table
    if (category === 'book') {
      db.prepare(`
        INSERT INTO book_details (item_id, author, translator, publisher, publish_date, isbn, total_pages, current_page, start_date, finish_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(item_id) DO UPDATE SET
          author = excluded.author,
          translator = excluded.translator,
          publisher = excluded.publisher,
          publish_date = excluded.publish_date,
          isbn = excluded.isbn,
          total_pages = excluded.total_pages,
          current_page = excluded.current_page,
          start_date = excluded.start_date,
          finish_date = excluded.finish_date
      `).run(
        id, author || null, translator || null, publisher || null, publish_date || null, isbn || null,
        total_pages ? Number(total_pages) : null, current_page !== undefined ? Number(current_page) : 0,
        start_date || null, finish_date || null
      );
    } else if (category === 'game') {
      db.prepare(`
        INSERT INTO game_details (item_id, platform, developer, publisher, release_date, play_time_hours, expected_hours, clear_date, achievement_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(item_id) DO UPDATE SET
          platform = excluded.platform,
          developer = excluded.developer,
          publisher = excluded.publisher,
          release_date = excluded.release_date,
          play_time_hours = excluded.play_time_hours,
          expected_hours = excluded.expected_hours,
          clear_date = excluded.clear_date,
          achievement_status = excluded.achievement_status
      `).run(
        id, platform || null, developer || null, game_publisher || publisher || null,
        game_release_date || publish_date || null, play_time_hours !== undefined ? Number(play_time_hours) : 0,
        expected_hours ? Number(expected_hours) : null, clear_date || null, achievement_status || 'none'
      );
    } else if (category === 'movie') {
      db.prepare(`
        INSERT INTO movie_details (item_id, subtype, director, actors, release_date, duration_minutes, total_episodes, current_episode, watch_platform, watch_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(item_id) DO UPDATE SET
          subtype = excluded.subtype,
          director = excluded.director,
          actors = excluded.actors,
          release_date = excluded.release_date,
          duration_minutes = excluded.duration_minutes,
          total_episodes = excluded.total_episodes,
          current_episode = excluded.current_episode,
          watch_platform = excluded.watch_platform,
          watch_date = excluded.watch_date
      `).run(
        id, subtype || 'movie', director || null, actors || null, movie_release_date || publish_date || null,
        duration_minutes ? Number(duration_minutes) : null, total_episodes ? Number(total_episodes) : 1,
        current_episode !== undefined ? Number(current_episode) : 1, watch_platform || null, watch_date || null
      );
    }

    if (tags !== undefined) {
      syncItemTags(id, tags);
    }
  });

  try {
    updateTransaction();
    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/items/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items/:id/quotes
router.post('/:id/quotes', (req, res) => {
  const { content, page_number, note } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const quoteId = uuidv4();
  try {
    db.prepare(`
      INSERT INTO quotes (id, item_id, content, page_number, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(quoteId, req.params.id, content.trim(), page_number ? Number(page_number) : null, note || null);

    db.prepare('UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

    res.status(201).json({ id: quoteId, content, page_number, note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/items/:id/quotes/:quoteId
router.delete('/:id/quotes/:quoteId', (req, res) => {
  try {
    db.prepare('DELETE FROM quotes WHERE id = ? AND item_id = ?').run(req.params.quoteId, req.params.id);
    res.json({ message: 'Quote deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
