<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
    <!-- Backdrop -->
    <div @click="$emit('close')" class="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-4xl glass-panel rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden my-auto z-10 max-h-[92vh] flex flex-col">
      <!-- Top Actions Bar -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
        <div class="flex items-center gap-2">
          <!-- Favorite Toggle -->
          <button
            @click="toggleFavorite"
            :class="[
              'p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium',
              item.favorite
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-amber-400 border border-slate-700/50'
            ]"
            title="标记为年度挚爱"
          >
            <Star :class="['w-4 h-4', item.favorite ? 'fill-current' : '']" />
            <span>{{ item.favorite ? '已设为挚爱' : '设为挚爱' }}</span>
          </button>

          <!-- Edit Info Button -->
          <button
            @click="$emit('edit-metadata', item)"
            class="p-2 rounded-xl bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 class="w-4 h-4" />
            <span>编辑档案</span>
          </button>

          <!-- Delete Button -->
          <button
            @click="confirmDelete"
            class="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer ml-1"
            title="从时光胶囊中移除此展品"
          >
            <Trash2 class="w-4 h-4" />
            <span>删除</span>
          </button>
        </div>

        <button
          @click="$emit('close')"
          class="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Scrollable Body -->
      <div class="p-6 overflow-y-auto flex-1 space-y-8">
        <!-- Hero Section: Cover & Key Info -->
        <div class="flex flex-col md:flex-row gap-6">
          <!-- Big Cover -->
          <div class="w-44 sm:w-52 shrink-0 aspect-[2/3] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl relative self-center md:self-start">
            <img
              v-if="coverSrc"
              :src="coverSrc"
              :alt="item.title"
              class="w-full h-full object-cover"
              referrerpolicy="no-referrer"
              @error="imgError = true"
            />
            <div v-if="!coverSrc || imgError" class="w-full h-full flex flex-col items-center justify-center p-4 text-center">
              <component :is="categoryIcon" class="w-12 h-12 text-slate-700 mb-2" />
              <span class="text-xs text-slate-400">{{ item.title }}</span>
            </div>
            <div class="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent"></div>
          </div>

          <!-- Metadata & Interactive Controls -->
          <div class="flex-1 space-y-5">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-semibold flex items-center gap-1">
                  <component :is="categoryIcon" class="w-3 h-3" />
                  <span>{{ categoryName }}</span>
                </span>
                <span v-if="item.platform || item.game_platform" class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {{ item.platform || item.game_platform }}
                </span>
              </div>

              <h2 class="text-2xl font-extrabold text-white tracking-tight">{{ item.title }}</h2>
              <p v-if="item.original_title" class="text-xs text-slate-500 italic mt-0.5">{{ item.original_title }}</p>

              <!-- Creators info -->
              <div class="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 mt-2">
                <template v-if="item.category === 'book'">
                  <span class="font-medium text-indigo-300">{{ item.author || '未知作者' }}</span>
                  <span v-if="item.translator">/ {{ item.translator }} 译</span>
                  <span v-if="item.publisher || item.book_publisher">· {{ item.publisher || item.book_publisher }}</span>
                  <span v-if="item.publish_date || item.book_publish_date">· {{ item.publish_date || item.book_publish_date }}</span>
                </template>
                <template v-else-if="item.category === 'game'">
                  <span class="font-medium text-cyan-300">{{ item.developer || item.game_developer || '未知开发商' }}</span>
                  <span v-if="item.publisher || item.game_publisher">· {{ item.publisher || item.game_publisher }} 发行</span>
                  <span v-if="item.release_date || item.game_release_date">· {{ item.release_date || item.game_release_date }} 发售</span>
                </template>
                <template v-else-if="item.category === 'movie'">
                  <span class="font-medium text-pink-300">{{ item.director || '未知导演' }} 导演</span>
                  <span v-if="item.actors">· 主演: {{ item.actors }}</span>
                  <span v-if="item.release_date || item.movie_release_date">· {{ item.release_date || item.movie_release_date }} 上映</span>
                </template>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="item.tags && item.tags.length" class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in item.tags"
                :key="tag"
                class="text-xs px-2.5 py-0.8 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/50"
              >
                #{{ tag }}
              </span>
            </div>

            <!-- Status & Rating Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <!-- Status Selector -->
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-2">当前体验状态</label>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <button
                    v-for="st in statusOptions"
                    :key="st.value"
                    @click="updateStatus(st.value)"
                    :class="[
                      'py-1.5 px-2 rounded-xl font-medium border transition-all cursor-pointer text-center',
                      item.status === st.value
                        ? st.activeClass
                        : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-200'
                    ]"
                  >
                    {{ st.label }}
                  </button>
                </div>
              </div>

              <!-- Rating (0 to 10 points / 5 stars) -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs font-semibold text-slate-400">心动评分</label>
                  <span class="text-xs font-bold text-amber-400">
                    {{ item.rating !== null && item.rating !== undefined ? (item.rating / 2).toFixed(1) + ' 星' : '尚未评分' }}
                  </span>
                </div>
                <div class="flex items-center gap-1.5 pt-1">
                  <button
                    v-for="starIndex in 5"
                    :key="starIndex"
                    @click="setRating(starIndex * 2)"
                    class="p-1 hover:scale-125 transition-transform cursor-pointer text-slate-700 hover:text-amber-400"
                    :title="`${starIndex} 星`"
                  >
                    <Star
                      :class="[
                        'w-5 h-5 transition-colors',
                        item.rating >= starIndex * 2
                          ? 'fill-amber-400 text-amber-400'
                          : item.rating >= starIndex * 2 - 1
                          ? 'fill-amber-400/50 text-amber-400'
                          : 'text-slate-700'
                      ]"
                    />
                  </button>
                  <button
                    v-if="item.rating !== null"
                    @click="setRating(null)"
                    class="ml-2 text-[10px] text-slate-500 hover:text-rose-400 underline cursor-pointer"
                  >
                    清除
                  </button>
                </div>
              </div>
            </div>

            <!-- Progress Tracker Section -->
            <!-- 1. Books: Page progress -->
            <div v-if="item.category === 'book' && item.total_pages" class="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400">阅读进度</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-cyan-400">{{ progressPercent }}%</span>
                  <span class="text-xs text-slate-400">({{ item.current_page || 0 }} / {{ item.total_pages }} 页)</span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                :max="item.total_pages"
                :value="item.current_page || 0"
                @change="handleBookProgressChange($event.target.value)"
                class="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />

              <div class="flex items-center justify-between pt-1">
                <div class="flex items-center gap-1.5">
                  <button @click="adjustPages(-10)" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer">-10</button>
                  <button @click="adjustPages(-1)" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer">-1</button>
                  <button @click="adjustPages(1)" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer">+1</button>
                  <button @click="adjustPages(10)" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer">+10</button>
                </div>
                <button
                  v-if="item.current_page < item.total_pages"
                  @click="finishItem"
                  class="text-xs font-medium text-emerald-400 hover:underline cursor-pointer"
                >
                  直接标记为读毕 🎉
                </button>
              </div>
            </div>

            <!-- 2. Games: Play time hours counter -->
            <div v-else-if="item.category === 'game'" class="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400">游玩记录</span>
                <span class="text-xs font-bold text-cyan-400 font-mono">{{ item.play_time_hours || 0 }} 小时</span>
              </div>
              <div class="flex items-center justify-between pt-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500">累计投入:</span>
                  <button @click="adjustGameHours(1)" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono cursor-pointer">+1h</button>
                  <button @click="adjustGameHours(5)" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono cursor-pointer">+5h</button>
                  <button @click="adjustGameHours(10)" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono cursor-pointer">+10h</button>
                </div>
                <button
                  v-if="item.status !== 'finished'"
                  @click="finishItem"
                  class="text-xs font-medium text-emerald-400 hover:underline cursor-pointer"
                >
                  通关打卡 🏆
                </button>
              </div>
            </div>

            <!-- 3. Movies: Episodes tracker -->
            <div v-else-if="item.category === 'movie' && item.total_episodes > 1" class="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400">追剧进度</span>
                <span class="text-xs font-bold text-pink-400">第 {{ item.current_episode || 1 }} / {{ item.total_episodes }} 集</span>
              </div>
              <div class="flex items-center justify-between pt-1">
                <button @click="adjustEpisode(1)" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-300 text-xs cursor-pointer">
                  看完了下一集 (+1)
                </button>
                <button
                  v-if="item.current_episode < item.total_episodes"
                  @click="finishItem"
                  class="text-xs font-medium text-emerald-400 hover:underline cursor-pointer"
                >
                  全剧终看毕 🍿
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div v-if="item.summary" class="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">作品梗概</h4>
          <p class="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">{{ item.summary }}</p>
        </div>

        <!-- Golden Quotes / Moments Section -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Quote class="w-4 h-4 text-amber-400" />
              <h3 class="text-base font-bold text-white">{{ quotesSectionTitle }}</h3>
              <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                {{ item.quotes ? item.quotes.length : 0 }}
              </span>
            </div>
          </div>

          <!-- Add Quote Form -->
          <div class="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <textarea
              v-model="newQuote.content"
              rows="2"
              :placeholder="quotesPlaceholder"
              class="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            ></textarea>
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400">{{ item.category === 'book' ? '页码:' : '备注/时间点:' }}</span>
                <input
                  v-model="newQuote.note"
                  type="text"
                  placeholder="例如: 结局处 / 第3章"
                  class="w-36 px-2 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                @click="submitQuote"
                :disabled="!newQuote.content.trim()"
                class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-amber-500/20"
              >
                添加印记
              </button>
            </div>
          </div>

          <!-- Quotes List -->
          <div v-if="item.quotes && item.quotes.length" class="space-y-3">
            <div
              v-for="quote in item.quotes"
              :key="quote.id"
              class="relative group p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-900/40 border border-slate-800 hover:border-amber-500/40 transition-all shadow-sm"
            >
              <Quote class="w-6 h-6 text-amber-500/20 absolute top-3 left-3 -scale-x-100 pointer-events-none" />
              <p class="text-xs leading-relaxed text-slate-200 italic pl-6 pr-6 whitespace-pre-wrap font-serif">
                “{{ quote.content }}”
              </p>
              <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400 pl-6 border-t border-slate-800/50 pt-2">
                <span v-if="quote.note" class="text-amber-400/80">{{ quote.note }}</span>
                <span v-else class="text-slate-600">未注细节</span>

                <button
                  @click="deleteQuote(quote.id)"
                  class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer p-1"
                  title="删除"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Personal Review Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <FileText class="w-4 h-4 text-indigo-400" />
              <h3 class="text-base font-bold text-white">深度体验随笔</h3>
            </div>
            <button
              v-if="!isEditingReview"
              @click="isEditingReview = true"
              class="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
            >
              {{ item.my_review ? '修改随笔' : '写下感想' }}
            </button>
            <div v-else class="flex items-center gap-2">
              <button
                @click="saveReview"
                class="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 cursor-pointer"
              >
                保存
              </button>
              <button
                @click="isEditingReview = false"
                class="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>

          <div v-if="isEditingReview">
            <textarea
              v-model="editReviewText"
              rows="6"
              placeholder="记录下你通关、观影或读完那一刻最真实的震撼感受与评分理由..."
              class="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            ></textarea>
          </div>
          <div v-else-if="item.my_review" class="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <p class="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">{{ item.my_review }}</p>
          </div>
          <div v-else class="text-center py-6 text-xs text-slate-600 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
            尚未留下体验感想，在这里记录下属于你的时光印记 ✍️
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  X, Star, Edit3, BookOpen, Gamepad2, Film, Quote, Trash2, FileText
} from 'lucide-vue-next';

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'update-item', 'delete-item', 'edit-metadata']);

const imgError = ref(false);
const isEditingReview = ref(false);
const editReviewText = ref(props.item.my_review || '');

const newQuote = ref({
  content: '',
  note: ''
});

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

const categoryName = computed(() => {
  switch (props.item.category) {
    case 'game': return '游戏档案';
    case 'movie': return '影视档案';
    default: return '书籍档案';
  }
});

const quotesSectionTitle = computed(() => {
  switch (props.item.category) {
    case 'game': return '名场面与难忘瞬间';
    case 'movie': return '经典台词与高光画面';
    default: return '高光金句 & 书摘';
  }
});

const quotesPlaceholder = computed(() => {
  switch (props.item.category) {
    case 'game': return '记录打通Boss那一刻的心情、NPC震撼对白或剧情转折点...';
    case 'movie': return '记录触动灵魂的经典台词或镜头美学...';
    default: return '记录触动你的一句话或精彩段落...';
  }
});

const progressPercent = computed(() => {
  if (props.item.category === 'book' && props.item.total_pages) {
    return Math.min(100, Math.round(((props.item.current_page || 0) / props.item.total_pages) * 100));
  }
  return 0;
});

const statusOptions = computed(() => {
  if (props.item.category === 'game') {
    return [
      { label: '🎮 正在通关', value: 'reading', activeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
      { label: '🏆 已通关', value: 'finished', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
      { label: '⏳ 想玩', value: 'wish', activeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
      { label: '❌ 弃坑', value: 'abandoned', activeClass: 'bg-slate-700/60 text-slate-300 border-slate-600/40' }
    ];
  } else if (props.item.category === 'movie') {
    return [
      { label: '🍿 在追', value: 'reading', activeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
      { label: '🎬 已看完', value: 'finished', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
      { label: '⏳ 想看', value: 'wish', activeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
      { label: '❌ 弃剧', value: 'abandoned', activeClass: 'bg-slate-700/60 text-slate-300 border-slate-600/40' }
    ];
  } else {
    return [
      { label: '📖 正在读', value: 'reading', activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
      { label: '✅ 已读完', value: 'finished', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
      { label: '⏳ 想读', value: 'wish', activeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
      { label: '❌ 弃读', value: 'abandoned', activeClass: 'bg-slate-700/60 text-slate-300 border-slate-600/40' }
    ];
  }
});

async function updateStatus(newStatus) {
  emit('update-item', { id: props.item.id, status: newStatus });
}

async function setRating(newRating) {
  emit('update-item', { id: props.item.id, rating: newRating });
}

async function toggleFavorite() {
  emit('update-item', { id: props.item.id, favorite: !props.item.favorite });
}

function handleBookProgressChange(val) {
  const page = Math.max(0, Math.min(Number(val), props.item.total_pages || 99999));
  emit('update-item', { id: props.item.id, current_page: page });
}

function adjustPages(delta) {
  const current = props.item.current_page || 0;
  const next = Math.max(0, Math.min(current + delta, props.item.total_pages || 99999));
  emit('update-item', { id: props.item.id, current_page: next });
}

function adjustGameHours(delta) {
  const current = props.item.play_time_hours || 0;
  emit('update-item', { id: props.item.id, play_time_hours: current + delta });
}

function adjustEpisode(delta) {
  const current = props.item.current_episode || 1;
  emit('update-item', { id: props.item.id, current_episode: current + delta });
}

function finishItem() {
  emit('update-item', {
    id: props.item.id,
    status: 'finished',
    current_page: props.item.total_pages || undefined
  });
}

async function saveReview() {
  await emit('update-item', {
    id: props.item.id,
    my_review: editReviewText.value
  });
  isEditingReview.value = false;
}

async function submitQuote() {
  if (!newQuote.value.content.trim()) return;
  try {
    const res = await fetch(`/api/items/${props.item.id}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQuote.value)
    });
    if (res.ok) {
      const added = await res.json();
      if (!props.item.quotes) props.item.quotes = [];
      props.item.quotes.unshift(added);
      newQuote.value = { content: '', note: '' };
    }
  } catch (err) {
    console.error('Failed to add quote:', err);
  }
}

async function deleteQuote(quoteId) {
  if (!confirm('确认删除此条记录吗？')) return;
  try {
    const res = await fetch(`/api/items/${props.item.id}/quotes/${quoteId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      props.item.quotes = props.item.quotes.filter(q => q.id !== quoteId);
    }
  } catch (err) {
    console.error('Failed to delete quote:', err);
  }
}

function confirmDelete() {
  if (confirm(`确定要从时光胶囊中移除《${props.item.title}》吗？所有相关记录都将被删除。`)) {
    emit('delete-item', props.item.id);
  }
}
</script>
