<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
    <!-- Backdrop -->
    <div @click="$emit('close')" class="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"></div>

    <!-- Modal Box -->
    <div class="relative w-full max-w-2xl glass-panel rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden my-auto z-10 max-h-[92vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <BookPlus v-if="!isEdit" class="w-5 h-5 text-indigo-400" />
          <Edit3 v-else class="w-5 h-5 text-indigo-400" />
          <span>{{ isEdit ? '编辑藏书档案' : '收录新书' }}</span>
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
        <!-- 🌟 Smart Online Search & Auto-complete Section -->
        <div class="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles class="w-4 h-4 text-amber-400 animate-pulse" />
              <span>智能搜索与信息自动补全</span>
            </label>
            <span class="text-[11px] text-slate-400">输入书名关键词，一键填好全部资料</span>
          </div>

          <div class="flex gap-2">
            <div class="relative flex-1">
              <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="onlineSearchQuery"
                @keyup.enter="handleOnlineSearch"
                type="text"
                placeholder="输入书名关键词（如：三体、百年孤独、哈利波特、人类简史...）"
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
            <div class="text-[11px] text-slate-400 font-medium px-1">找到以下匹配书籍，点击即可一键填入：</div>
            <div
              v-for="(item, idx) in onlineResults"
              :key="idx"
              @click="selectOnlineBook(item)"
              class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-900/30 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all group"
            >
              <!-- Mini Cover -->
              <div class="w-10 h-14 bg-slate-800 rounded overflow-hidden shrink-0 border border-slate-700/60 flex items-center justify-center">
                <img
                  v-if="item.cover_url"
                  :src="item.cover_url"
                  :alt="item.title"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer"
                />
                <BookOpen v-else class="w-5 h-5 text-slate-600" />
              </div>

              <!-- Metadata info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="text-xs font-bold text-slate-100 group-hover:text-indigo-300 truncate">{{ item.title }}</h4>
                  <span class="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-400 border border-indigo-500/20 font-mono">{{ item.source }}</span>
                </div>
                <p class="text-[11px] text-slate-400 truncate mt-0.5">
                  {{ item.author || '未知作者' }}
                  <span v-if="item.publisher">· {{ item.publisher }}</span>
                  <span v-if="item.publish_date">· {{ item.publish_date }}</span>
                  <span v-if="item.total_pages">· {{ item.total_pages }}页</span>
                </p>
              </div>

              <!-- Select hint -->
              <span class="text-[11px] font-semibold text-indigo-400 shrink-0 group-hover:translate-x-1 transition-transform">
                填入 ➔
              </span>
            </div>
          </div>
          <div v-else-if="hasSearchedOnline && !isSearchingOnline" class="text-center py-2 text-xs text-slate-500">
            未检索到相关书籍，你可以直接在下方手动填写。
          </div>
        </div>

        <!-- Cover Upload & Preview -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-2">书籍封面</label>
          <div class="flex flex-col sm:flex-row gap-4 items-center">
            <!-- Thumbnail Box -->
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
                <span class="text-[10px]">暂无封面</span>
              </div>
            </div>

            <!-- Upload Controls -->
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
                  <span>{{ isUploading ? '正在上传封面...' : '上传本地高清封面 (JPG/PNG/WebP)' }}</span>
                </button>
              </div>

              <!-- Or Network URL -->
              <div class="relative">
                <input
                  v-model="form.cover_url"
                  type="url"
                  placeholder="或粘贴网络封面图片 URL (可选)"
                  class="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Main Book Info -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Title (Required) -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              书名 <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="例如：百年孤独"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <!-- Original Title -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">原知名 (选填)</label>
            <input
              v-model="form.original_title"
              type="text"
              placeholder="Cien años de soledad"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Author -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">作者</label>
            <input
              v-model="form.author"
              type="text"
              placeholder="加西亚·马尔克斯"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Translator -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">译者 (选填)</label>
            <input
              v-model="form.translator"
              type="text"
              placeholder="范晔"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Publisher -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">出版社</label>
            <input
              v-model="form.publisher"
              type="text"
              placeholder="南海出版公司"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Total Pages -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">总页数</label>
            <input
              v-model.number="form.total_pages"
              type="number"
              min="1"
              placeholder="例如：360"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Current Page -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">当前已读页数</label>
            <input
              v-model.number="form.current_page"
              type="number"
              min="0"
              :max="form.total_pages || 99999"
              placeholder="0"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Publish Date -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">出版年份/日期</label>
            <input
              v-model="form.publish_date"
              type="text"
              placeholder="例如：2011-06 或 2011"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- ISBN -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">ISBN (选填)</label>
            <input
              v-model="form.isbn"
              type="text"
              placeholder="9787544253994"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Status -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">阅读状态</label>
            <select
              v-model="form.status"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="reading">📖 正在读</option>
              <option value="finished">✅ 已读完</option>
              <option value="wish">⏳ 想读</option>
              <option value="abandoned">❌ 弃读</option>
            </select>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">自定义标签 (逗号分隔)</label>
            <input
              v-model="tagsInput"
              type="text"
              placeholder="魔幻现实主义, 拉美文学, 经典"
              class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <!-- Summary -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1.5">内容简介 (选填)</label>
          <textarea
            v-model="form.summary"
            rows="3"
            placeholder="官方简介或主要内容概要..."
            class="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
          ></textarea>
        </div>

        <!-- Bottom Action Bar: Delete (if Edit) + Submit -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-800">
          <div>
            <button
              v-if="isEdit"
              type="button"
              @click="handleDeleteSelf"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600/80 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>删除此书</span>
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
              class="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-40"
            >
              {{ isEdit ? '保存修改' : '确认收录' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { X, BookPlus, Edit3, Image, Upload, Search, Sparkles, Loader2, BookOpen, Trash2 } from 'lucide-vue-next';

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'save', 'delete']);

const isEdit = computed(() => !!props.initialData?.id);
const isUploading = ref(false);

const onlineSearchQuery = ref('');
const isSearchingOnline = ref(false);
const hasSearchedOnline = ref(false);
const onlineResults = ref([]);

const form = ref({
  title: props.initialData?.title || '',
  original_title: props.initialData?.original_title || '',
  author: props.initialData?.author || '',
  translator: props.initialData?.translator || '',
  publisher: props.initialData?.publisher || '',
  publish_date: props.initialData?.publish_date || '',
  isbn: props.initialData?.isbn || '',
  total_pages: props.initialData?.total_pages || null,
  current_page: props.initialData?.current_page || 0,
  status: props.initialData?.status || 'wish',
  summary: props.initialData?.summary || '',
  cover_asset_id: props.initialData?.cover_asset_id || null,
  cover_url: props.initialData?.cover_url || ''
});

const tagsInput = ref(props.initialData?.tags ? props.initialData.tags.join(', ') : '');

const previewSrc = computed(() => {
  if (form.value.cover_asset_id) {
    return `/api/covers/${form.value.cover_asset_id}`;
  }
  return form.value.cover_url || null;
});

async function handleOnlineSearch() {
  if (!onlineSearchQuery.value.trim()) return;
  isSearchingOnline.value = true;
  hasSearchedOnline.value = true;
  try {
    const res = await fetch(`/api/books/search-online?keyword=${encodeURIComponent(onlineSearchQuery.value.trim())}`);
    if (res.ok) {
      onlineResults.value = await res.json();
    }
  } catch (err) {
    console.error('Online search failed:', err);
  } finally {
    isSearchingOnline.value = false;
  }
}

async function selectOnlineBook(book) {
  form.value.title = book.title || form.value.title;
  if (book.original_title) form.value.original_title = book.original_title;
  if (book.author) form.value.author = book.author;
  if (book.translator) form.value.translator = book.translator;
  if (book.publisher) form.value.publisher = book.publisher;
  if (book.publish_date) form.value.publish_date = book.publish_date;
  if (book.isbn) form.value.isbn = book.isbn;
  if (book.total_pages) form.value.total_pages = book.total_pages;
  if (book.summary) form.value.summary = book.summary;

  // Auto-download cover to local directory if cover_url is present
  if (book.cover_url) {
    form.value.cover_url = book.cover_url;
    // Attempt local asset download
    try {
      const uploadRes = await fetch('/api/upload/remote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: book.cover_url })
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        form.value.cover_asset_id = uploadData.asset_id;
      }
    } catch {
      // Fallback to network URL if remote download fails
    }
  }

  // Clear search results after selection
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
  if (confirm(`确定要从藏书阁中删除《${form.value.title}》吗？`)) {
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
