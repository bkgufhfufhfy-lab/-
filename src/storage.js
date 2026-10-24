/**
 * Local-First Storage Adapter for Time Capsule
 * Enables seamless standalone execution on iPhone / iOS Standalone Web App
 * even when offline or disconnected from the computer's backend!
 */

const LOCAL_STORAGE_KEY = 'timecapsule_local_items_v1';

// Check if backend API is reachable
let isBackendReachable = true;

export async function checkBackend() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch('/api/items/stats', { signal: controller.signal });
    clearTimeout(timeoutId);
    isBackendReachable = res.ok;
  } catch {
    isBackendReachable = false;
  }
  return isBackendReachable;
}

export function getLocalItems() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalItems(items) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

// Fetch Items (hybrid server + local fallback)
export async function apiFetchItems(params) {
  const online = await checkBackend();
  if (online) {
    try {
      const res = await fetch(`/api/items?${params.toString()}`);
      if (res.ok) {
        const serverItems = await res.json();
        // Sync to local cache
        saveLocalItems(serverItems);
        return serverItems;
      }
    } catch {
      // fallback
    }
  }

  // Fallback to local storage (Phone offline mode)
  console.log('📱 Operating in iPhone Local Standalone Mode');
  let items = getLocalItems();

  const category = params.get('category');
  const status = params.get('status');
  const favorite = params.get('favorite');
  const search = params.get('search')?.toLowerCase().trim();
  const sort = params.get('sort');

  if (category && category !== 'all') {
    items = items.filter(i => i.category === category);
  }
  if (status && status !== 'all') {
    items = items.filter(i => i.status === status);
  }
  if (favorite === '1') {
    items = items.filter(i => !!i.favorite);
  }
  if (search) {
    items = items.filter(i =>
      i.title?.toLowerCase().includes(search) ||
      i.author?.toLowerCase().includes(search) ||
      i.developer?.toLowerCase().includes(search) ||
      i.director?.toLowerCase().includes(search)
    );
  }

  if (sort === 'rating') {
    items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'created_at') {
    items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } else {
    items.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
  }

  return items;
}

// Fetch single item
export async function apiFetchItemById(id) {
  const online = await checkBackend();
  if (online) {
    try {
      const res = await fetch(`/api/items/${id}`);
      if (res.ok) return await res.json();
    } catch {}
  }

  const items = getLocalItems();
  return items.find(i => i.id === id) || null;
}

// Save new or update item
export async function apiSaveItem(formData) {
  const online = await checkBackend();
  const isEdit = !!formData.id;

  if (online) {
    try {
      const url = isEdit ? `/api/items/${formData.id}` : '/api/items';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) return await res.json();
    } catch {}
  }

  // Standalone offline save
  const items = getLocalItems();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  if (isEdit) {
    const idx = items.findIndex(i => i.id === formData.id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...formData, updated_at: now };
    }
  } else {
    const newItem = {
      ...formData,
      id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      created_at: now,
      updated_at: now,
      quotes: []
    };
    items.unshift(newItem);
  }

  saveLocalItems(items);
  return { message: 'Saved to iPhone local storage' };
}

// Delete item
export async function apiDeleteItem(id) {
  const online = await checkBackend();
  if (online) {
    try {
      await fetch(`/api/items/${id}`, { method: 'DELETE' });
    } catch {}
  }

  const items = getLocalItems().filter(i => i.id !== id);
  saveLocalItems(items);
  return { message: 'Deleted locally' };
}

// Export & Import backup JSON
export function exportLocalData() {
  const items = getLocalItems();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute('href', dataStr);
  dlAnchorElem.setAttribute('download', `timecapsule_backup_${new Date().toISOString().split('T')[0]}.json`);
  dlAnchorElem.click();
}

export function importLocalData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      saveLocalItems(parsed);
      return true;
    }
  } catch (err) {
    console.error('Import failed:', err);
  }
  return false;
}
