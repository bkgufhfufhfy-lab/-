<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
    <!-- Header with Category Tabs & Stats -->
    <Header
      :stats="stats"
      :active-category="activeCategory"
      :current-status="currentStatus"
      :search-query="searchQuery"
      :is-favorite-only="isFavoriteOnly"
      @open-add-modal="openAddModal"
      @update:active-category="handleCategoryChange"
      @update:status="handleStatusChange"
      @update:search-query="handleSearchChange"
      @toggle-favorite="toggleFavoriteFilter"
    />

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
      <!-- Toolbar: View summary & Sorting -->
      <div class="flex items-center justify-between mb-6 text-xs text-slate-400">
        <div>
          <span>共收录 <strong class="text-white">{{ items.length }}</strong> 项藏品</span>
          <span v-if="searchQuery" class="ml-2 text-indigo-400 font-medium">包含关键词 “{{ searchQuery }}”</span>
        </div>

        <div class="flex items-center gap-3">
          <label class="hidden sm:inline">排序方式:</label>
          <select
            v-model="currentSort"
            @change="fetchItems"
            class="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="updated_at">最近更新</option>
            <option value="rating">评分最高</option>
            <option value="created_at">收录时间</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 text-slate-500">
        <div class="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p class="text-xs">正在整理时光展馆...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="items.length === 0"
        class="glass-card rounded-3xl p-12 text-center max-w-lg mx-auto my-12 border border-slate-800/80 space-y-4"
      >
        <div class="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <Hourglass class="w-8 h-8" />
        </div>
        <div>
          <h3 class="text-base font-bold text-white">暂无匹配展品</h3>
          <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {{ searchQuery ? '未找到相关作品，换个关键词试试？' : '当前展馆还是空的，点击下方按钮收录你的第一部作品吧！' }}
          </p>
        </div>

        <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            @click="openAddModal"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus class="w-4 h-4" />
            <span>收录第一部作品</span>
          </button>

          <button
            v-if="!searchQuery && stats?.overall?.total_items === 0"
            @click="seedSampleExhibits"
            :disabled="isSeeding"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition-all cursor-pointer disabled:opacity-50"
          >
            {{ isSeeding ? '正在载入...' : '✨ 一键导入全品类典藏展品' }}
          </button>
        </div>
      </div>

      <!-- Items Grid -->
      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
      >
        <ItemCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          @select="openDetailModal"
          @delete="handleDeleteItem"
        />
      </div>
    </main>

    <!-- Detail & Edit Modal -->
    <ItemModal
      v-if="selectedItem"
      :item="selectedItem"
      @close="selectedItem = null"
      @update-item="handleUpdateItem"
      @delete-item="handleDeleteItem"
      @edit-metadata="handleOpenEditMetadata"
    />

    <!-- Add / Edit Form Modal -->
    <ItemFormModal
      v-if="isFormModalOpen"
      :initial-data="editingItemData"
      :default-category="activeCategory"
      @close="isFormModalOpen = false"
      @save="handleSaveItemForm"
      @delete="handleDeleteItemFromForm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Header from './components/Header.vue';
import ItemCard from './components/ItemCard.vue';
import ItemModal from './components/ItemModal.vue';
import ItemFormModal from './components/ItemFormModal.vue';
import { Hourglass, Plus } from 'lucide-vue-next';

const items = ref([]);
const stats = ref(null);
const isLoading = ref(true);
const isSeeding = ref(false);

const activeCategory = ref('all');
const currentStatus = ref('all');
const searchQuery = ref('');
const isFavoriteOnly = ref(false);
const currentSort = ref('updated_at');

const selectedItem = ref(null);
const isFormModalOpen = ref(false);
const editingItemData = ref(null);

let searchDebounceTimer = null;

async function fetchStats() {
  try {
    const res = await fetch('/api/items/stats');
    if (res.ok) {
      stats.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
}

async function fetchItems() {
  isLoading.value = true;
  try {
    const params = new URLSearchParams();
    if (activeCategory.value !== 'all') params.append('category', activeCategory.value);
    if (currentStatus.value !== 'all') params.append('status', currentStatus.value);
    if (searchQuery.value.trim()) params.append('search', searchQuery.value.trim());
    if (isFavoriteOnly.value) params.append('favorite', '1');
    params.append('sort', currentSort.value);

    const res = await fetch(`/api/items?${params.toString()}`);
    if (res.ok) {
      items.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch items:', err);
  } finally {
    isLoading.value = false;
  }
}

function handleCategoryChange(cat) {
  activeCategory.value = cat;
  currentStatus.value = 'all'; // reset status filter when category switches
  fetchItems();
}

function handleStatusChange(newStatus) {
  currentStatus.value = newStatus;
  fetchItems();
}

function handleSearchChange(query) {
  searchQuery.value = query;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    fetchItems();
  }, 250);
}

function toggleFavoriteFilter() {
  isFavoriteOnly.value = !isFavoriteOnly.value;
  fetchItems();
}

function openAddModal() {
  editingItemData.value = null;
  isFormModalOpen.value = true;
}

async function openDetailModal(item) {
  try {
    const res = await fetch(`/api/items/${item.id}`);
    if (res.ok) {
      selectedItem.value = await res.json();
    } else {
      selectedItem.value = item;
    }
  } catch {
    selectedItem.value = item;
  }
}

function handleOpenEditMetadata(item) {
  editingItemData.value = { ...item };
  isFormModalOpen.value = true;
}

async function handleSaveItemForm(formData) {
  try {
    const isEdit = !!formData.id;
    const url = isEdit ? `/api/items/${formData.id}` : '/api/items';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      isFormModalOpen.value = false;
      await fetchItems();
      await fetchStats();

      if (selectedItem.value && selectedItem.value.id === formData.id) {
        openDetailModal(formData);
      }
    } else {
      const err = await res.json();
      alert('保存失败: ' + (err.error || '未知错误'));
    }
  } catch (err) {
    console.error('Failed to save item:', err);
    alert('保存异常: ' + err.message);
  }
}

async function handleUpdateItem(updatePayload) {
  try {
    const res = await fetch(`/api/items/${updatePayload.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });

    if (res.ok) {
      if (selectedItem.value && selectedItem.value.id === updatePayload.id) {
        Object.assign(selectedItem.value, updatePayload);
      }
      await fetchItems();
      await fetchStats();
    }
  } catch (err) {
    console.error('Failed to update item:', err);
  }
}

async function handleDeleteItem(itemId) {
  try {
    const res = await fetch(`/api/items/${itemId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      selectedItem.value = null;
      await fetchItems();
      await fetchStats();
    }
  } catch (err) {
    console.error('Failed to delete item:', err);
  }
}

async function handleDeleteItemFromForm(itemId) {
  await handleDeleteItem(itemId);
  isFormModalOpen.value = false;
}

// Seed helper for quick 3-category demonstration
async function seedSampleExhibits() {
  isSeeding.value = true;
  const samples = [
    {
      category: "game",
      title: "黑神话：悟空",
      original_title: "Black Myth: Wukong",
      platform: "PC / Steam",
      developer: "游戏科学 Game Science",
      publisher: "Game Science",
      publish_date: "2024-08-20",
      play_time_hours: 58,
      status: "finished",
      rating: 10,
      favorite: 1,
      summary: "《黑神话：悟空》是由游戏科学开发的西游题材动作角色扮演游戏。玩家将扮演一位“天命人”，为了探寻昔日传说的真相，踏上一条充满危险与惊奇的西游之路。",
      my_review: "踏过三千界，回首已非少年。从大圣残躯战到最终定格，东方美学与顶级动作手感的完美交融，中国单机游戏的里程碑神作！",
      tags: ["动作RPG", "西游记", "虚幻5", "年度神作"],
      cover_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80"
    },
    {
      category: "movie",
      title: "星际穿越",
      original_title: "Interstellar",
      subtype: "movie",
      director: "克里斯托弗·诺兰",
      actors: "马修·麦康纳, 安妮·海瑟薇, 杰西卡·查斯坦",
      publish_date: "2014-11-07",
      duration_minutes: 169,
      status: "finished",
      rating: 10,
      favorite: 1,
      summary: "在不远的未来，地球环境恶化导致粮食匮乏。前 NASA 宇航员库珀受命驾驶飞船穿越神秘虫洞，在浩瀚宇宙中为濒临灭绝的人类寻找新家园。",
      my_review: "爱不是人类发明的东西，它跨越了维度，跨越了时间和空间。汉斯·季默的风琴配乐每次响起都会起一身鸡皮疙瘩。IMAX 视觉奇迹。",
      tags: ["硬科幻", "虫洞理论", "诺兰", "IMAX神作"],
      cover_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80"
    },
    {
      category: "book",
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
    }
  ];

  try {
    for (const sample of samples) {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample)
      });
      if (res.ok) {
        const data = await res.json();
        if (sample.category === 'game') {
          await fetch(`/api/items/${data.id}/quotes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: "若是不甘，便拔出那根金箍棒，再翻他一个跟头！",
              note: "天命人的执念"
            })
          });
        } else if (sample.category === 'movie') {
          await fetch(`/api/items/${data.id}/quotes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: "Do not go gentle into that good night. Rage, rage against the dying of the light.",
              note: "布兰德教授的诗"
            })
          });
        }
      }
    }
    await fetchItems();
    await fetchStats();
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    isSeeding.value = false;
  }
}

onMounted(() => {
  fetchItems();
  fetchStats();
});
</script>
