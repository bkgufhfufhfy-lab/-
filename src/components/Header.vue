<template>
  <header class="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-6 py-4 shadow-xl">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Brand & Main Category Tabs -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Hourglass class="w-5 h-5 text-white" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold tracking-tight text-white">时光胶囊</h1>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">全品类展馆</span>
            </div>
            <p class="text-xs text-slate-400">个人数字记忆博物馆 · 书籍 · 游戏 · 影视</p>
          </div>
        </div>

        <!-- Main Category Nav Pills -->
        <div class="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            v-for="cat in categories"
            :key="cat.value"
            @click="$emit('update:activeCategory', cat.value)"
            :class="[
              'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
              activeCategory === cat.value
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            <component :is="cat.icon" class="w-3.5 h-3.5" />
            <span>{{ cat.label }}</span>
          </button>
        </div>
      </div>

      <!-- Quick Dynamic Stats Banner -->
      <div class="hidden lg:flex items-center gap-5 text-xs bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2">
        <template v-if="activeCategory === 'all'">
          <div class="flex items-center gap-2">
            <Layers class="w-4 h-4 text-indigo-400" />
            <span class="text-slate-400">总藏品</span>
            <span class="font-bold text-slate-200">{{ stats?.overall?.total_items || 0 }}</span>
          </div>
          <div class="h-3 w-px bg-slate-800"></div>
          <div class="flex items-center gap-1.5 text-slate-300">
            <BookOpen class="w-3.5 h-3.5 text-emerald-400" />
            <span>{{ stats?.overall?.total_books || 0 }} 本</span>
          </div>
          <div class="flex items-center gap-1.5 text-slate-300">
            <Gamepad2 class="w-3.5 h-3.5 text-cyan-400" />
            <span>{{ stats?.overall?.total_games || 0 }} 款</span>
          </div>
          <div class="flex items-center gap-1.5 text-slate-300">
            <Film class="w-3.5 h-3.5 text-pink-400" />
            <span>{{ stats?.overall?.total_movies || 0 }} 部</span>
          </div>
        </template>

        <template v-else-if="activeCategory === 'book'">
          <div class="flex items-center gap-2">
            <BookOpen class="w-4 h-4 text-emerald-400" />
            <span class="text-slate-400">藏书</span>
            <span class="font-bold text-slate-200">{{ stats?.book?.total || 0 }} 本</span>
          </div>
          <div class="h-3 w-px bg-slate-800"></div>
          <div class="flex items-center gap-1.5 text-amber-400">
            <span>正在读 {{ stats?.book?.in_progress || 0 }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-emerald-400">
            <span>已读完 {{ stats?.book?.completed || 0 }}</span>
          </div>
          <div class="h-3 w-px bg-slate-800"></div>
          <div class="text-cyan-400 font-bold">
            累计阅读 {{ stats?.book?.metric_sum || 0 }} <span class="text-[10px] font-normal text-slate-500">页</span>
          </div>
        </template>

        <template v-else-if="activeCategory === 'game'">
          <div class="flex items-center gap-2">
            <Gamepad2 class="w-4 h-4 text-cyan-400" />
            <span class="text-slate-400">收录游戏</span>
            <span class="font-bold text-slate-200">{{ stats?.game?.total || 0 }} 款</span>
          </div>
          <div class="h-3 w-px bg-slate-800"></div>
          <div class="flex items-center gap-1.5 text-amber-400">
            <span>在玩 {{ stats?.game?.in_progress || 0 }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-emerald-400">
            <span>已通关 {{ stats?.game?.completed || 0 }}</span>
          </div>
          <div class="h-3 w-px bg-slate-800"></div>
          <div class="text-cyan-400 font-bold">
            游玩总长 {{ stats?.game?.metric_sum || 0 }} <span class="text-[10px] font-normal text-slate-500">小时</span>
          </div>
        </template>

        <template v-else-if="activeCategory === 'movie'">
          <div class="flex items-center gap-2">
            <Film class="w-4 h-4 text-pink-400" />
            <span class="text-slate-400">影视藏品</span>
            <span class="font-bold text-slate-200">{{ stats?.movie?.total || 0 }} 部</span>
          </div>
          <div class="h-3 w-px bg-slate-800"></div>
          <div class="flex items-center gap-1.5 text-amber-400">
            <span>在追 {{ stats?.movie?.in_progress || 0 }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-emerald-400">
            <span>已看 {{ stats?.movie?.completed || 0 }}</span>
          </div>
          <div class="h-3 w-px bg-slate-800"></div>
          <div class="text-pink-400 font-bold">
            观影时长 {{ stats?.movie?.metric_sum || 0 }} <span class="text-[10px] font-normal text-slate-500">分钟</span>
          </div>
        </template>
      </div>

      <!-- Add Button -->
      <div class="flex items-center gap-3">
        <button
          @click="$emit('open-add-modal')"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-500/40 active:scale-95 cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>{{ addBtnLabel }}</span>
        </button>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <!-- Status Tabs -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        <button
          v-for="tab in currentStatusTabs"
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
          :placeholder="searchPlaceholder"
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
import {
  Hourglass, Plus, Search, Layers, BookOpen, Gamepad2, Film, Star, X
} from 'lucide-vue-next';

const props = defineProps({
  stats: Object,
  activeCategory: String,
  currentStatus: String,
  searchQuery: String,
  isFavoriteOnly: Boolean
});

defineEmits(['open-add-modal', 'update:activeCategory', 'update:status', 'update:searchQuery', 'toggle-favorite']);

const categories = [
  { label: '全部展品', value: 'all', icon: Layers },
  { label: '藏书阁', value: 'book', icon: BookOpen },
  { label: '游戏馆', value: 'game', icon: Gamepad2 },
  { label: '影视厅', value: 'movie', icon: Film }
];

const addBtnLabel = computed(() => {
  switch (props.activeCategory) {
    case 'book': return '收录新书';
    case 'game': return '收录游戏';
    case 'movie': return '收录影视';
    default: return '收录新展品';
  }
});

const searchPlaceholder = computed(() => {
  switch (props.activeCategory) {
    case 'book': return '搜索书名、作者、出版社...';
    case 'game': return '搜索游戏名、开发商、平台...';
    case 'movie': return '搜索影视名、导演、演员...';
    default: return '搜索作品名、创作者、标签...';
  }
});

const currentStatusTabs = computed(() => {
  if (props.activeCategory === 'book') {
    return [
      { label: '全部', value: 'all' },
      { label: '📖 正在读', value: 'reading' },
      { label: '✅ 已读完', value: 'finished' },
      { label: '⏳ 想读', value: 'wish' },
      { label: '❌ 弃读', value: 'abandoned' }
    ];
  } else if (props.activeCategory === 'game') {
    return [
      { label: '全部', value: 'all' },
      { label: '🎮 正在通关', value: 'reading' },
      { label: '🏆 已通关', value: 'finished' },
      { label: '⏳ 想玩', value: 'wish' },
      { label: '❌ 弃坑', value: 'abandoned' }
    ];
  } else if (props.activeCategory === 'movie') {
    return [
      { label: '全部', value: 'all' },
      { label: '🍿 在追', value: 'reading' },
      { label: '🎬 已看完', value: 'finished' },
      { label: '⏳ 想看', value: 'wish' },
      { label: '❌ 弃剧', value: 'abandoned' }
    ];
  } else {
    return [
      { label: '全部', value: 'all' },
      { label: '进行中', value: 'reading' },
      { label: '已完成', value: 'finished' },
      { label: '想看/想玩/想读', value: 'wish' },
      { label: '已放弃', value: 'abandoned' }
    ];
  }
});
</script>
