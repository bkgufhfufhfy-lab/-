<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
    <!-- Backdrop -->
    <div @click="$emit('close')" class="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"></div>

    <!-- Modal Box -->
    <div class="relative w-full max-w-2xl glass-panel rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden my-auto z-10 max-h-[92vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <component :is="activeCategoryIcon" class="w-5 h-5 text-indigo-400" />
          <span>{{ isEdit ? '编辑展品档案' : '收录新展品' }}</span>
        </h3>
        <button
          @click="$emit('close')"
          class="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-6 overflow-y-auto flex-1 space-y-6">
        <!-- Category Selector (Only for new items) -->
        <div v-if="!isEdit" class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400">选择展品类别</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="cat in categoryOptions"
              :key="cat.value"
              type="button"
              @click="changeCategory(cat.value)"
              :class="[
                'py-2 px-3 rounded-xl border font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer',
                form.category === cat.value
                  ? cat.activeClass
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              ]"
            >
              <component :is="cat.icon" class="w-4 h-4" />
              <span>{{ cat.label }}</span>
            </button>
          </div>
        </div>

        <!-- 🌟 Smart Online Search & Auto-complete Section -->
        <div class="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles class="w-4 h-4 text-amber-400 animate-pulse" />
              <span>在线检索与信息自动补全 ({{ categorySearchLabel }})</span>
            </label>
            <span class="text-[11px] text-slate-400">输入关键词，一键填好全部资料</span>
          </div>

          <div class="flex gap-2">
            <div class="relative flex-1">
              <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="onlineSearchQuery"
                @keyup.enter="handleOnlineSearch"
                type="text"
                :placeholder="searchPlaceholder"
                class="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="button"
              @click="handleOnlineSearch"
              :disabled="isSearchingOnline || !onlineSearchQuery.trim()"
              class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
            >
              <Loader2 v-if="isSearchingOnline" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isSearchingOnline ? '搜索中...' : '搜索' }}</span>
            </button>
          </div>

          <!-- Auto-complete Search Results List -->
          <div v-if="onlineResults.length > 0" class="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
            <div class="text-[11px] text-slate-400 font-medium px-1">匹配到以下作品，点击一键填入：</div>
            <div
              v-for="(item, idx) in onlineResults"
              :key="idx"
              @click="selectOnlineItem(item)"
              class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-900/30 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all group"
            >
              <div class="w-10 h-14 bg-slate-800 rounded overflow-hidden shrink-0 border border-slate-700/60 flex items-center justify-center">
                <img
                  v-if="item.cover_url"
                  :src="item.cover_url"
                  :alt="item.title"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer"
                />
                <component :is="activeCategoryIcon" v-else class="w-5 h-5 text-slate-600" />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="text-xs font-bold text-slate-100 group-hover:text-indigo-300 truncate">{{ item.title }}</h4>
                  <span class="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-400 border border-indigo-500/20 font-mono">{{ item.source }}</span>
                </div>
                <p class="text-[11px] text-slate-400 truncate mt-0.5">
                  {{ item.author || item.developer || item.director || '未知制作' }}
                  <span v-if="item.publisher">· {{ item.publisher }}</span>
                  <span v-if="item.publish_date || item.release_date">· {{ item.publish_date || item.release_date }}</span>
                  <span v-if="item.total_pages">· {{ item.total_pages }}页</span>
                </p>
              </div>

              <span class="text-[11px] font-semibold text-indigo-400 shrink-0 group-hover:translate-x-1 transition-transform">
                填入 ➔
              </span>
            </div>
          </div>
          <div v-else-if="hasSearchedOnline && !isSearchingOnline" class="text-center py-2 text-xs text-slate-500">
            未检索到相关内容，你可以直接在下方手动录入。
          </div>
        </div>

        <!-- Cover Upload & Preview -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-2">封面海报</label>
          <div class="flex flex-col sm:flex-row gap-4 items-center">
            <div class="w-28 aspect-[2/3] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-md shrink-0">
              <img
                v-if="previewSrc"
                :src="previewSrc"
                alt="Cover Preview"
                class="w-full h-full object-cover"
                referrerpolicy="no-referrer"
              />
              <div v-else class="text-center p-2 text-slate-600">
                <Image class="w-8 h-8 mx-auto mb-1 opacity-50" />
                <span class="text-[10px]">暂无海报</span>
              </div>
            </div>

            <div class="flex-1 w-full space-y-3">
              <div>
                <input
                  type="file"
                  ref="fileInput"
                  @change="handleFileUpload"
                  accept="image/jpeg,image/png,image/webp"
                  class="hidden"
                />
                <button
                  type="button"
                  @click="$refs.fileInput.click()"
                  :disabled="isUploading"
                  class="w-full py-2.5 px-4 rounded-xl border border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Upload class="w-4 h-4" />
                  <span>{{ isUploading ? '正在上传封面...' : '上传本地高清海报 (JPG/PNG/WebP)' }}</span>
                </button>
              </div>

              <div class="relative">
                <input
                  v-model="form.cover_url"
                  type="url"
                  placeholder="或粘贴网络海报图片 URL (可选)"
                  class="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Main Form Fields -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Title (Required) -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              作品名称 <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              required
              :placeholder="titlePlaceholder"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <!-- Original Title -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">原名 / 外文名 (选填)</label>
            <input
              v-model="form.original_title"
              type="text"
              placeholder="例如：Black Myth: Wukong"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Category Specific Creator -->
          <div v-if="form.category === 'book'">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">作者</label>
            <input
              v-model="form.author"
              type="text"
              placeholder="例如：刘慈欣"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div v-else-if="form.category === 'game'">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">开发团队 / 制作人</label>
            <input
              v-model="form.developer"
              type="text"
              placeholder="例如：游戏科学 Game Science"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div v-else-if="form.category === 'movie'">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">导演</label>
            <input
              v-model="form.director"
              type="text"
              placeholder="例如：克里斯托弗·诺兰"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Category Specific Extra: Platform / Translator / Actors -->
          <div v-if="form.category === 'game'">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">游玩平台</label>
            <input
              v-model="form.platform"
              type="text"
              placeholder="例如：PC / Steam, PS5, Switch"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div v-else-if="form.category === 'movie'">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">影视类型</label>
            <select
              v-model="form.subtype"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="movie">🎬 电影</option>
              <option value="series">📺 电视剧集</option>
              <option value="anime">🍙 动漫 / 番剧</option>
              <option value="documentary">🌍 纪录片</option>
            </select>
          </div>
          <div v-else-if="form.category === 'book'">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">译者 (选填)</label>
            <input
              v-model="form.translator"
              type="text"
              placeholder="例如：范晔"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Publisher or Actors -->
          <div v-if="form.category === 'book' || form.category === 'game'">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">{{ form.category === 'book' ? '出版社' : '发行商' }}</label>
            <input
              v-model="form.publisher"
              type="text"
              placeholder="例如：重庆出版社"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div v-else-if="form.category === 'movie'">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">主要演员 (选填)</label>
            <input
              v-model="form.actors"
              type="text"
              placeholder="例如：马修·麦康纳, 安妮·海瑟薇"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Release date -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">上映 / 发售 / 出版年份</label>
            <input
              v-model="form.publish_date"
              type="text"
              placeholder="例如：2024-08 或 2024"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Metrics: Pages / Play hours / Duration -->
          <div v-if="form.category === 'book'">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">总页数</label>
            <input
              v-model.number="form.total_pages"
              type="number"
              placeholder="例如：360"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div v-else-if="form.category === 'game'">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">已玩时长 (小时)</label>
            <input
              v-model.number="form.play_time_hours"
              type="number"
              placeholder="0"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div v-else-if="form.category === 'movie' && form.subtype !== 'series'">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">片长 (分钟)</label>
            <input
              v-model.number="form.duration_minutes"
              type="number"
              placeholder="例如：169"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div v-else-if="form.category === 'movie' && form.subtype === 'series'">
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">总集数</label>
            <input
              v-model.number="form.total_episodes"
              type="number"
              placeholder="例如：12"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Status -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">体验状态</label>
            <select
              v-model="form.status"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="reading">{{ form.category === 'game' ? '🎮 正在通关' : (form.category === 'movie' ? '🍿 在追' : '📖 正在读') }}</option>
              <option value="finished">{{ form.category === 'game' ? '🏆 已通关' : (form.category === 'movie' ? '🎬 已看完' : '✅ 已读完') }}</option>
              <option value="wish">{{ form.category === 'game' ? '⏳ 想玩' : (form.category === 'movie' ? '⏳ 想看' : '⏳ 想读') }}</option>
              <option value="abandoned">{{ form.category === 'game' ? '❌ 弃坑' : (form.category === 'movie' ? '❌ 弃剧' : '❌ 弃读') }}</option>
            </select>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">自定义标签 (逗号分隔)</label>
            <input
              v-model="tagsInput"
              type="text"
              placeholder="硬核, 剧情神作, 虚幻5"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <!-- Summary -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1.5">作品梗概与介绍</label>
          <textarea
            v-model="form.summary"
            rows="3"
            placeholder="官方简介、剧情梗概或世界观背景..."
            class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
          ></textarea>
        </div>

        <!-- Bottom Action Bar -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-800">
          <div>
            <button
              v-if="isEdit"
              type="button"
              @click="handleDeleteSelf"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600/80 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>删除此展品</span>
            </button>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="!form.title.trim()"
              class="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-40"
            >
              {{ isEdit ? '保存档案' : '确认收录' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  X, BookOpen, Gamepad2, Film, Image, Upload, Search, Sparkles, Loader2, Trash2
} from 'lucide-vue-next';

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  },
  defaultCategory: {
    type: String,
    default: 'book'
  }
});

const emit = defineEmits(['close', 'save', 'delete']);

const isEdit = computed(() => !!props.initialData?.id);
const isUploading = ref(false);

const onlineSearchQuery = ref('');
const isSearchingOnline = ref(false);
const hasSearchedOnline = ref(false);
const onlineResults = ref([]);

const categoryOptions = [
  { label: '书籍', value: 'book', icon: BookOpen, activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { label: '游戏', value: 'game', icon: Gamepad2, activeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  { label: '影视', value: 'movie', icon: Film, activeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40' }
];

const form = ref({
  category: props.initialData?.category || (props.defaultCategory === 'all' ? 'book' : props.defaultCategory),
  title: props.initialData?.title || '',
  original_title: props.initialData?.original_title || '',
  // Book
  author: props.initialData?.author || '',
  translator: props.initialData?.translator || '',
  publisher: props.initialData?.publisher || props.initialData?.book_publisher || props.initialData?.game_publisher || '',
  publish_date: props.initialData?.publish_date || props.initialData?.book_publish_date || props.initialData?.game_release_date || props.initialData?.movie_release_date || '',
  isbn: props.initialData?.isbn || '',
  total_pages: props.initialData?.total_pages || null,
  current_page: props.initialData?.current_page || 0,
  // Game
  platform: props.initialData?.platform || props.initialData?.game_platform || '',
  developer: props.initialData?.developer || props.initialData?.game_developer || '',
  play_time_hours: props.initialData?.play_time_hours || 0,
  // Movie
  subtype: props.initialData?.subtype || props.initialData?.movie_subtype || 'movie',
  director: props.initialData?.director || '',
  actors: props.initialData?.actors || '',
  duration_minutes: props.initialData?.duration_minutes || null,
  total_episodes: props.initialData?.total_episodes || 1,
  current_episode: props.initialData?.current_episode || 1,
  // Common
  status: props.initialData?.status || 'wish',
  summary: props.initialData?.summary || '',
  cover_asset_id: props.initialData?.cover_asset_id || null,
  cover_url: props.initialData?.cover_url || ''
});

const tagsInput = ref(props.initialData?.tags ? props.initialData.tags.join(', ') : '');

const activeCategoryIcon = computed(() => {
  switch (form.value.category) {
    case 'game': return Gamepad2;
    case 'movie': return Film;
    default: return BookOpen;
  }
});

const categorySearchLabel = computed(() => {
  switch (form.value.category) {
    case 'game': return '游戏库';
    case 'movie': return '电影与电视剧';
    default: return '图书库';
  }
});

const searchPlaceholder = computed(() => {
  switch (form.value.category) {
    case 'game': return '输入游戏名（如：黑神话、艾尔登法环、塞尔达传说）';
    case 'movie': return '输入影视名（如：星际穿越、肖申克的救赎、流浪地球）';
    default: return '输入书名关键词（如：三体、百年孤独、人类简史）';
  }
});

const titlePlaceholder = computed(() => {
  switch (form.value.category) {
    case 'game': return '例如：黑神话：悟空';
    case 'movie': return '例如：星际穿越';
    default: return '例如：百年孤独';
  }
});

const previewSrc = computed(() => {
  if (form.value.cover_asset_id) {
    return `/api/covers/${form.value.cover_asset_id}`;
  }
  return form.value.cover_url || null;
});

function changeCategory(cat) {
  form.value.category = cat;
  onlineResults.value = [];
  hasSearchedOnline.value = false;
}

async function handleOnlineSearch() {
  if (!onlineSearchQuery.value.trim()) return;
  isSearchingOnline.value = true;
  hasSearchedOnline.value = true;
  try {
    const res = await fetch(`/api/items/search-online?category=${form.value.category}&keyword=${encodeURIComponent(onlineSearchQuery.value.trim())}`);
    if (res.ok) {
      onlineResults.value = await res.json();
    }
  } catch (err) {
    console.error('Online search failed:', err);
  } finally {
    isSearchingOnline.value = false;
  }
}

async function selectOnlineItem(item) {
  form.value.title = item.title || form.value.title;
  if (item.original_title) form.value.original_title = item.original_title;
  if (item.author) form.value.author = item.author;
  if (item.developer) form.value.developer = item.developer;
  if (item.director) form.value.director = item.director;
  if (item.actors) form.value.actors = item.actors;
  if (item.platform) form.value.platform = item.platform;
  if (item.publisher) form.value.publisher = item.publisher;
  if (item.publish_date || item.release_date) form.value.publish_date = item.publish_date || item.release_date;
  if (item.isbn) form.value.isbn = item.isbn;
  if (item.total_pages) form.value.total_pages = item.total_pages;
  if (item.duration_minutes) form.value.duration_minutes = item.duration_minutes;
  if (item.summary) form.value.summary = item.summary;

  // Auto-download remote cover image to local assets
  if (item.cover_url) {
    form.value.cover_url = item.cover_url;
    try {
      const uploadRes = await fetch('/api/upload/remote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.cover_url })
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        form.value.cover_asset_id = uploadData.asset_id;
      }
    } catch {
      // Fallback to URL
    }
  }

  onlineResults.value = [];
}

async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('cover', file);

  isUploading.value = true;
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      form.value.cover_asset_id = data.asset_id;
    } else {
      alert('上传封面失败，请确保格式为 JPG, PNG 或 WebP');
    }
  } catch (err) {
    console.error('Upload failed:', err);
    alert('上传异常: ' + err.message);
  } finally {
    isUploading.value = false;
  }
}

function handleDeleteSelf() {
  if (confirm(`确定要从时光胶囊中删除《${form.value.title}》吗？`)) {
    emit('delete', props.initialData.id);
  }
}

function handleSubmit() {
  if (!form.value.title.trim()) return;

  const tags = tagsInput.value
    .split(/[,，]/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  emit('save', {
    ...form.value,
    id: props.initialData?.id,
    tags
  });
}
</script>
