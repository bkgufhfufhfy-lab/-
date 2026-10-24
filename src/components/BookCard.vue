<template>
  <div
    @click="$emit('select', book)"
    class="group relative glass-card rounded-2xl overflow-hidden cursor-pointer flex flex-col book-card-3d border border-slate-800/80 hover:border-indigo-500/50"
  >
    <!-- Cover Wrapper -->
    <div class="relative w-full aspect-[2/3] bg-slate-900 overflow-hidden flex items-center justify-center">
      <!-- Image or Default Placeholder -->
      <img
        v-if="coverSrc"
        :src="coverSrc"
        :alt="book.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="imgError = true"
      />
      <div v-if="!coverSrc || imgError" class="w-full h-full p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-900 to-indigo-950/40">
        <BookOpen class="w-12 h-12 text-slate-700 mb-3 group-hover:text-indigo-400/60 transition-colors" />
        <span class="text-xs font-medium text-slate-400 line-clamp-2 px-2">{{ book.title }}</span>
        <span v-if="book.author" class="text-[11px] text-slate-600 mt-1">{{ book.author }}</span>
      </div>

      <!-- Book Spine Reflection Effect -->
      <div class="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none"></div>

      <!-- Top Overlay Badges & Quick Delete Button -->
      <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
        <!-- Status Badge -->
        <span
          :class="[
            'text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md backdrop-blur-md border pointer-events-none',
            statusConfig.badgeClass
          ]"
        >
          {{ statusConfig.label }}
        </span>

        <div class="flex items-center gap-1.5">
          <!-- Favorite Star -->
          <span
            v-if="book.favorite"
            class="w-6 h-6 rounded-full bg-amber-500/90 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 pointer-events-none"
          >
            <Star class="w-3.5 h-3.5 fill-current" />
          </span>

          <!-- Quick Delete Button (Appears on Hover) -->
          <button
            @click.stop="handleQuickDelete"
            class="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-slate-900/90 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md border border-slate-700 hover:border-rose-500 transition-all cursor-pointer"
            title="删除此书"
          >
            <Trash2 class="w-3 h-3" />
          </button>
        </div>
      </div>

      <!-- Quotes Count Floating Badge -->
      <div
        v-if="book.quotes_count > 0"
        class="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30"
      >
        <Quote class="w-2.5 h-2.5 fill-current" />
        <span>{{ book.quotes_count }} 摘录</span>
      </div>
    </div>

    <!-- Book Info Body -->
    <div class="p-4 flex-1 flex flex-col justify-between">
      <div>
        <h3 class="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1" :title="book.title">
          {{ book.title }}
        </h3>
        <p class="text-xs text-slate-400 mt-0.5 line-clamp-1">
          {{ book.author || '未知作者' }}
          <span v-if="book.publish_date" class="text-slate-600">· {{ book.publish_date }}</span>
        </p>

        <!-- Tags -->
        <div v-if="book.tags && book.tags.length" class="flex flex-wrap gap-1 mt-2">
          <span
            v-for="tag in book.tags.slice(0, 2)"
            :key="tag"
            class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50"
          >
            #{{ tag }}
          </span>
          <span v-if="book.tags.length > 2" class="text-[10px] text-slate-500 self-center">
            +{{ book.tags.length - 2 }}
          </span>
        </div>
      </div>

      <!-- Bottom Progress & Rating -->
      <div class="mt-3 pt-3 border-t border-slate-800/60">
        <!-- Progress Bar -->
        <div v-if="book.total_pages" class="mb-2">
          <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>{{ book.current_page || 0 }} / {{ book.total_pages }} 页</span>
            <span class="font-semibold text-slate-300">{{ progressPercent }}%</span>
          </div>
          <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-indigo-500 to-cyan-400"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>

        <!-- Rating Display -->
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-1">
            <div v-if="book.rating !== null && book.rating !== undefined" class="flex items-center gap-0.5 text-amber-400">
              <Star class="w-3.5 h-3.5 fill-current" />
              <span class="font-bold text-xs text-amber-300">{{ (book.rating / 2).toFixed(1) }}</span>
            </div>
            <span v-else class="text-[11px] text-slate-600">未评分</span>
          </div>

          <span class="text-[10px] text-slate-500">
            {{ formatRelativeTime(book.updated_at) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { BookOpen, Star, Quote, Trash2 } from 'lucide-vue-next';

const props = defineProps({
  book: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['select', 'delete']);

const imgError = ref(false);

const coverSrc = computed(() => {
  if (imgError.value) return null;
  if (props.book.cover_asset_id) {
    return `/api/covers/${props.book.cover_asset_id}`;
  }
  return props.book.cover_url || null;
});

const progressPercent = computed(() => {
  if (!props.book.total_pages) return 0;
  const pct = Math.round(((props.book.current_page || 0) / props.book.total_pages) * 100);
  return Math.min(100, Math.max(0, pct));
});

const statusConfig = computed(() => {
  switch (props.book.status) {
    case 'reading':
      return { label: '正在读', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    case 'finished':
      return { label: '已读完', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    case 'wish':
      return { label: '想读', badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    case 'abandoned':
      return { label: '弃读', badgeClass: 'bg-slate-700/60 text-slate-400 border-slate-600/40' };
    default:
      return { label: props.book.status, badgeClass: 'bg-slate-800 text-slate-400 border-slate-700' };
  }
});

function handleQuickDelete() {
  if (confirm(`确定要从藏书阁中删除《${props.book.title}》吗？`)) {
    emit('delete', props.book.id);
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
