<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
    <!-- Header with Stats & Filters -->
    <Header
      :stats="stats"
      :current-status="currentStatus"
      :search-query="searchQuery"
      :is-favorite-only="isFavoriteOnly"
      @open-add-modal="openAddModal"
      @update:status="handleStatusChange"
      @update:search-query="handleSearchChange"
      @toggle-favorite="toggleFavoriteFilter"
    />

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
      <!-- Toolbar: View summary & Sorting -->
      <div class="flex items-center justify-between mb-6 text-xs text-slate-400">
        <div>
          <span>共找到 <strong class="text-white">{{ books.length }}</strong> 本藏书</span>
          <span v-if="searchQuery" class="ml-2 text-indigo-400 font-medium">包含关键词 “{{ searchQuery }}”</span>
        </div>

        <div class="flex items-center gap-3">
          <label class="hidden sm:inline">排序方式:</label>
          <select
            v-model="currentSort"
            @change="fetchBooks"
            class="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="updated_at">最近更新</option>
            <option value="rating">评分最高</option>
            <option value="progress">阅读进度</option>
            <option value="created_at">收录时间</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 text-slate-500">
        <div class="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p class="text-xs">正在整理藏书阁...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="books.length === 0"
        class="glass-card rounded-3xl p-12 text-center max-w-lg mx-auto my-12 border border-slate-800/80 space-y-4"
      >
        <div class="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <BookOpen class="w-8 h-8" />
        </div>
        <div>
          <h3 class="text-base font-bold text-white">暂无匹配藏书</h3>
          <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {{ searchQuery ? '未找到相关书籍，换个搜索词试试？' : '你的私人藏书阁目前还是空的，开始收录你的第一部作品吧！' }}
          </p>
        </div>

        <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            @click="openAddModal"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus class="w-4 h-4" />
            <span>收录第一本书</span>
          </button>

          <button
            v-if="!searchQuery && stats?.total_books === 0"
            @click="seedSampleBooks"
            :disabled="isSeeding"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition-all cursor-pointer disabled:opacity-50"
          >
            {{ isSeeding ? '正在载入...' : '✨ 一键导入精选示例书单' }}
          </button>
        </div>
      </div>

      <!-- Books Grid -->
      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
      >
        <BookCard
          v-for="book in books"
          :key="book.id"
          :book="book"
          @select="openDetailModal"
        />
      </div>
    </main>

    <!-- Detail & Edit Modal -->
    <BookModal
      v-if="selectedBook"
      :book="selectedBook"
      @close="selectedBook = null"
      @update-book="handleUpdateBook"
      @delete-book="handleDeleteBook"
      @edit-metadata="handleOpenEditMetadata"
    />

    <!-- Add / Edit Form Modal -->
    <BookFormModal
      v-if="isFormModalOpen"
      :initial-data="editingBookData"
      @close="isFormModalOpen = false"
      @save="handleSaveBookForm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Header from './components/Header.vue';
import BookCard from './components/BookCard.vue';
import BookModal from './components/BookModal.vue';
import BookFormModal from './components/BookFormModal.vue';
import { BookOpen, Plus } from 'lucide-vue-next';

const books = ref([]);
const stats = ref(null);
const isLoading = ref(true);
const isSeeding = ref(false);

const currentStatus = ref('all');
const searchQuery = ref('');
const isFavoriteOnly = ref(false);
const currentSort = ref('updated_at');

const selectedBook = ref(null);
const isFormModalOpen = ref(false);
const editingBookData = ref(null);

let searchDebounceTimer = null;

async function fetchStats() {
  try {
    const res = await fetch('/api/books/stats');
    if (res.ok) {
      stats.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
}

async function fetchBooks() {
  isLoading.value = true;
  try {
    const params = new URLSearchParams();
    if (currentStatus.value !== 'all') params.append('status', currentStatus.value);
    if (searchQuery.value.trim()) params.append('search', searchQuery.value.trim());
    if (isFavoriteOnly.value) params.append('favorite', '1');
    params.append('sort', currentSort.value);

    const res = await fetch(`/api/books?${params.toString()}`);
    if (res.ok) {
      books.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch books:', err);
  } finally {
    isLoading.value = false;
  }
}

function handleStatusChange(newStatus) {
  currentStatus.value = newStatus;
  fetchBooks();
}

function handleSearchChange(query) {
  searchQuery.value = query;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    fetchBooks();
  }, 250);
}

function toggleFavoriteFilter() {
  isFavoriteOnly.value = !isFavoriteOnly.value;
  fetchBooks();
}

function openAddModal() {
  editingBookData.value = null;
  isFormModalOpen.value = true;
}

async function openDetailModal(book) {
  try {
    const res = await fetch(`/api/books/${book.id}`);
    if (res.ok) {
      selectedBook.value = await res.json();
    } else {
      selectedBook.value = book;
    }
  } catch {
    selectedBook.value = book;
  }
}

function handleOpenEditMetadata(book) {
  editingBookData.value = { ...book };
  isFormModalOpen.value = true;
}

async function handleSaveBookForm(formData) {
  try {
    const isEdit = !!formData.id;
    const url = isEdit ? `/api/books/${formData.id}` : '/api/books';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      isFormModalOpen.value = false;
      await fetchBooks();
      await fetchStats();

      // If we were editing the selected book in detail modal, refresh it
      if (selectedBook.value && selectedBook.value.id === formData.id) {
        openDetailModal(formData);
      }
    } else {
      const err = await res.json();
      alert('保存失败: ' + (err.error || '未知错误'));
    }
  } catch (err) {
    console.error('Failed to save book:', err);
    alert('保存异常: ' + err.message);
  }
}

async function handleUpdateBook(updatePayload) {
  try {
    const res = await fetch(`/api/books/${updatePayload.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });

    if (res.ok) {
      // Update selected book locally
      if (selectedBook.value && selectedBook.value.id === updatePayload.id) {
        Object.assign(selectedBook.value, updatePayload);
      }
      await fetchBooks();
      await fetchStats();
    }
  } catch (err) {
    console.error('Failed to update book:', err);
  }
}

async function handleDeleteBook(bookId) {
  try {
    const res = await fetch(`/api/books/${bookId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      selectedBook.value = null;
      await fetchBooks();
      await fetchStats();
    }
  } catch (err) {
    console.error('Failed to delete book:', err);
  }
}

// Seed helper for quick demonstration
async function seedSampleBooks() {
  isSeeding.value = true;
  const samples = [
    {
      title: "三体全集",
      original_title: "The Three-Body Problem",
      author: "刘慈欣",
      publisher: "重庆出版社",
      publish_date: "2008-01",
      total_pages: 900,
      current_page: 900,
      status: "finished",
      rating: 10,
      favorite: 1,
      summary: "文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划“红岸工程”取得了突破性进展。但在按下发射键的那一刻，历经劫难的叶文洁没有意识到，她彻底改变了人类的命运。",
      my_review: "给岁月以文明，而不是给文明以岁月。宇宙就是一座黑暗森林，每个文明都是带枪的猎人。每次重读都会被宏大的宇宙社会学框架所震撼。",
      tags: ["硬科幻", "宇宙社会学", "经典神作"],
      cover_url: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80"
    },
    {
      title: "百年孤独",
      original_title: "Cien años de soledad",
      author: "加西亚·马尔克斯",
      translator: "范晔",
      publisher: "南海出版公司",
      publish_date: "2011-06",
      total_pages: 360,
      current_page: 245,
      status: "reading",
      rating: 9,
      favorite: 1,
      summary: "魔幻现实主义文学代表作，描写了布恩迪亚家族七代人的传奇故事，以及加勒比海沿岸小镇马孔多的百年兴衰，反映了拉丁美洲一个世纪以来风云变幻的历史。",
      my_review: "多年以后，面对行刑队，奥雷里亚诺·布恩迪亚上校将会回想起父亲带他去见识冰块的那个遥远的下午。孤独是宿命，而文字跨越了虚实。",
      tags: ["魔幻现实主义", "诺贝尔文学奖", "世界名著"],
      cover_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80"
    },
    {
      title: "纳瓦尔宝典",
      original_title: "The Almanack of Naval Ravikant",
      author: "埃里克·乔根森",
      translator: "赵灿",
      publisher: "中信出版集团",
      publish_date: "2022-04",
      total_pages: 264,
      current_page: 0,
      status: "wish",
      rating: null,
      favorite: 0,
      summary: "硅谷知名天使投资人纳瓦尔关于财富创造和幸福生活的智慧结晶。阐述了如何利用专长、杠杆和判断力实现非对称收益。",
      tags: ["思维模型", "财富", "个人成长"],
      cover_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80"
    }
  ];

  try {
    for (const sample of samples) {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample)
      });
      if (res.ok && sample.title.includes('三体')) {
        const data = await res.json();
        // Add sample quotes
        await fetch(`/api/books/${data.id}/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: "给岁月以文明，而不是给文明以岁月。",
            page_number: 312,
            note: "罗辑执剑人的沉思"
          })
        });
        await fetch(`/api/books/${data.id}/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: "弱小和无知不是生存的障碍，傲慢才是。",
            page_number: 489,
            note: "宇宙文明公理"
          })
        });
      }
    }
    await fetchBooks();
    await fetchStats();
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    isSeeding.value = false;
  }
}

onMounted(() => {
  fetchBooks();
  fetchStats();
});
</script>
