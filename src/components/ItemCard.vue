<template>
  <div
    @click="$emit('select', item)"
    class="group relative glass-card rounded-2xl overflow-hidden cursor-pointer flex flex-col book-card-3d border border-slate-800/80 hover:border-indigo-500/50"
  >
    <!-- Cover Wrapper -->
    <div class="relative w-full aspect-[2/3] bg-slate-900 overflow-hidden flex items-center justify-center">
      <img
        v-if="coverSrc"
        :src="coverSrc"
        :alt="item.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="imgError = true"
      />
      <div v-if="!coverSrc || imgError" class="w-full h-full p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-900 to-indigo-950/40">
        <component :is="categoryIcon" class="w-12 h-12 text-slate-700 mb-3 group-hover:text-indigo-400/60 transition-colors" />
        <span class="text-xs font-medium text-slate-400 line-clamp-2 px-2">{{ item.title }}</span>
        <span v-if="creatorName" class="text-[11px] text-slate-600 mt-1">{{ creatorName }}</span>
      </div>

      <!-- Spine reflection effect -->
      <div class="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none"></div>

      <!-- Top Overlay Badges & Quick Delete Button -->
      <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
        <!-- Category & Status Badge -->
        <div class="flex items-center gap-1">
          <span
            :class="[
              'text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md backdrop-blur-md border pointer-events-none flex items-center gap-1',
              statusBadgeConfig.badgeClass
            ]"
          >
            <component :is="categoryIcon" class="w-2.5 h-2.5" />
            <span>{{ statusBadgeConfig.label }}</span>
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <!-- Favorite Star -->
          <span
            v-if="item.favorite"
            class="w-6 h-6 rounded-full bg-amber-500/90 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 pointer-events-none"
          >
            <Star class="w-3.5 h-3.5 fill-current" />
          </span>

          <!-- Quick Delete Button (Appears on Hover) -->
          <button
            @click.stop="handleQuickDelete"
            class="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-slate-900/90 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md border border-slate-700 hover:border-rose-500 transition-all cursor-pointer"
            title="删除此展品"
          >
            <Trash2 class="w-3 h-3" />
          </button>
        </div>
      </div>

      <!-- Quotes / Moments Count Floating Badge -->
      <div
        v-if="item.quotes_count > 0"
        class="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30"
      >
        <Quote class="w-2.5 h-2.5 fill-current" />
        <span>{{ item.quotes_count }} {{ item.category === 'movie' ? '台词' : (item.category === 'game' ? '时刻' : '摘录') }}</span>
      </div>
    </div>

    <!-- Info Body -->
    <div class="p-4 flex-1 flex flex-col justify-between">
      <div>
        <h3 class="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1" :title="item.title">
          {{ item.title }}
        </h3>
        <p class="text-xs text-slate-400 mt-0.5 line-clamp-1">
          {{ creatorName || '未知制作' }}
          <span v-if="releaseInfo" class="text-slate-600">· {{ releaseInfo }}</span>
        </p>

        <!-- Platform or Extra tag for games/movies -->
        <div v-if="extraTag" class="mt-1.5 flex items-center gap-1">
          <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-mono">
            {{ extraTag }}
          </span>
        </div>
      </div>

      <!-- Bottom Progress & Rating -->
      <div class="mt-3 pt-3 border-t border-slate-800/60">
        <!-- Progress Bar for Books or Series -->
        <div v-if="hasProgress" class="mb-2">
          <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>{{ progressLabel }}</span>
            <span class="font-semibold text-slate-300">{{ progressPercent }}%</span>
          </div>
          <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-indigo-500 to-cyan-400"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>

        <!-- Metric text for Games (play time) -->
        <div v-else-if="item.category === 'game' && item.play_time_hours > 0" class="mb-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>已游玩时长</span>
          <span class="font-bold text-cyan-400 font-mono">{{ item.play_time_hours }} 小时</span>
        </div>

        <!-- Rating Display -->
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-1">
            <div v-if="item.rating !== null && item.rating !== undefined" class="flex items-center gap-0.5 text-amber-400">
              <Star class="w-3.5 h-3.5 fill-current" />
              <span class="font-bold text-xs text-amber-300">{{ (item.rating / 2).toFixed(1) }}</span>
            </div>
            <span v-else class="text-[11px] text-slate-600">未评分</span>
          </div>

          <span class="text-[10px] text-slate-500">
            {{ formatRelativeTime(item.updated_at) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { BookOpen, Gamepad2, Film, Star, Quote, Trash2 } from 'lucide-vue-next';

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['select', 'delete']);

const imgError = ref(false);

const coverSrc = computed(() => {
  if (imgError.value) return null;
  if (props.item.cover_asset_id) {
    return `/api/covers/${props.item.cover_asset_id}`;
  }
  return props.item.cover_url || null;
});

const categoryIcon = computed(() => {
  switch (props.item.category) {
    case 'game': return Gamepad2;
    case 'movie': return Film;
    default: return BookOpen;
  }
});

const creatorName = computed(() => {
  if (props.item.category === 'book') return props.item.author;
  if (props.item.category === 'game') return props.item.game_developer || props.item.developer;
  if (props.item.category === 'movie') return props.item.director;
  return null;
});

const releaseInfo = computed(() => {
  if (props.item.category === 'book') return props.item.book_publish_date || props.item.publish_date;
  if (props.item.category === 'game') return props.item.game_release_date || props.item.release_date;
  if (props.item.category === 'movie') return props.item.movie_release_date || props.item.release_date;
  return null;
});

const extraTag = computed(() => {
  if (props.item.category === 'game') return props.item.game_platform || props.item.platform;
  if (props.item.category === 'movie') {
    if (props.item.movie_subtype === 'series') return '剧集';
    if (props.item.duration_minutes) return `${props.item.duration_minutes} 分钟`;
    return '电影';
  }
  return null;
});

const hasProgress = computed(() => {
  if (props.item.category === 'book') return !!props.item.total_pages;
  if (props.item.category === 'movie' && props.item.total_episodes > 1) return true;
  return false;
});

const progressLabel = computed(() => {
  if (props.item.category === 'book') {
    return `${props.item.current_page || 0} / ${props.item.total_pages} 页`;
  }
  if (props.item.category === 'movie') {
    return `第 ${props.item.current_episode || 1} / ${props.item.total_episodes} 集`;
  }
  return '';
});

const progressPercent = computed(() => {
  if (props.item.category === 'book' && props.item.total_pages) {
    return Math.min(100, Math.round(((props.item.current_page || 0) / props.item.total_pages) * 100));
  }
  if (props.item.category === 'movie' && props.item.total_episodes) {
    return Math.min(100, Math.round(((props.item.current_episode || 1) / props.item.total_episodes) * 100));
  }
  return 0;
});

const statusBadgeConfig = computed(() => {
  const cat = props.item.category;
  const st = props.item.status;

  if (cat === 'game') {
    if (st === 'finished' || st === 'cleared') return { label: '已通关', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (st === 'reading' || st === 'playing') return { label: '在玩', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    if (st === 'wish') return { label: '想玩', badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    return { label: '弃坑', badgeClass: 'bg-slate-700/60 text-slate-400 border-slate-600/40' };
  } else if (cat === 'movie') {
    if (st === 'finished' || st === 'watched') return { label: '已看完', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (st === 'reading' || st === 'watching') return { label: '在追', badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40' };
    if (st === 'wish') return { label: '想看', badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    return { label: '弃剧', badgeClass: 'bg-slate-700/60 text-slate-400 border-slate-600/40' };
  } else {
    if (st === 'finished') return { label: '已读完', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (st === 'reading') return { label: '正在读', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    if (st === 'wish') return { label: '想读', badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    return { label: '弃读', badgeClass: 'bg-slate-700/60 text-slate-400 border-slate-600/40' };
  }
});

function handleQuickDelete() {
  if (confirm(`确定要从时光胶囊中删除《${props.item.title}》吗？`)) {
    emit('delete', props.item.id);
  }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '今日更新';
  if (diffDays === 1) return '昨天更新';
  if (diffDays < 30) return `${diffDays} 天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}
</script>
