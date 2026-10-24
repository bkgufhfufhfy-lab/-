<template>
  <header class="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-6 py-4 shadow-xl">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Brand & Version -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <BookOpen class="w-5 h-5 text-white" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold tracking-tight text-white">时光胶囊 · 藏书阁</h1>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">v0.1</span>
          </div>
          <p class="text-xs text-slate-400">完全数据本地化的个人多媒体展馆 · 书籍版</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div v-if="stats" class="hidden lg:flex items-center gap-6 text-xs bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2">
        <div class="flex items-center gap-2">
          <Library class="w-4 h-4 text-indigo-400" />
          <span class="text-slate-400">总藏书</span>
          <span class="font-bold text-slate-200">{{ stats.total_books || 0 }}</span>
        </div>
        <div class="h-3 w-px bg-slate-800"></div>
        <div class="flex items-center gap-2">
          <BookmarkCheck class="w-4 h-4 text-emerald-400" />
          <span class="text-slate-400">已读完</span>
          <span class="font-bold text-emerald-400">{{ stats.finished_count || 0 }}</span>
        </div>
        <div class="h-3 w-px bg-slate-800"></div>
        <div class="flex items-center gap-2">
          <Glasses class="w-4 h-4 text-amber-400" />
          <span class="text-slate-400">正在读</span>
          <span class="font-bold text-amber-400">{{ stats.reading_count || 0 }}</span>
        </div>
        <div class="h-3 w-px bg-slate-800"></div>
        <div class="flex items-center gap-2">
          <Layers class="w-4 h-4 text-cyan-400" />
          <span class="text-slate-400">累计阅读</span>
          <span class="font-bold text-cyan-400">{{ stats.total_pages_read || 0 }} <span class="text-[10px] font-normal text-slate-500">页</span></span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <button
          @click="$emit('open-add-modal')"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-500/40 active:scale-95 cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>收录新书</span>
        </button>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <!-- Status Tabs -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          @click="$emit('update:status', tab.value)"
          :class="[
            'px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5',
            currentStatus === tab.value
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          ]"
        >
          <span>{{ tab.label }}</span>
          <span v-if="tab.count !== undefined" class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
            {{ tab.count }}
          </span>
        </button>

        <button
          @click="$emit('toggle-favorite')"
          :class="[
            'px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ml-1',
            isFavoriteOnly
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          ]"
        >
          <Star class="w-3.5 h-3.5 fill-current" />
          <span>年度挚爱</span>
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative w-full md:w-64">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
          placeholder="搜索书名、作者、标签..."
          class="w-full pl-9 pr-4 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
        <button
          v-if="searchQuery"
          @click="$emit('update:searchQuery', '')"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { BookOpen, Plus, Search, Library, BookmarkCheck, Glasses, Layers, Star, X } from 'lucide-vue-next';

const props = defineProps({
  stats: Object,
  currentStatus: String,
  searchQuery: String,
  isFavoriteOnly: Boolean
});

defineEmits(['open-add-modal', 'update:status', 'update:searchQuery', 'toggle-favorite']);

const filterTabs = computed(() => [
  { label: '全部', value: 'all', count: props.stats?.total_books },
  { label: '📖 正在读', value: 'reading', count: props.stats?.reading_count },
  { label: '✅ 已读完', value: 'finished', count: props.stats?.finished_count },
  { label: '⏳ 想读', value: 'wish', count: props.stats?.wish_count },
  { label: '❌ 弃读', value: 'abandoned', count: props.stats?.abandoned_count }
]);
</script>
