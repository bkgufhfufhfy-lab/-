<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
    <!-- Backdrop -->
    <div @click="$emit('close')" class="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-4xl glass-panel rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden my-auto z-10 max-h-[90vh] flex flex-col">
      <!-- Top Actions Bar -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
        <div class="flex items-center gap-2">
          <!-- Favorite Toggle -->
          <button
            @click="toggleFavorite"
            :class="[
              'p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium',
              book.favorite
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-amber-400 border border-slate-700/50'
            ]"
            title="标记为年度挚爱"
          >
            <Star :class="['w-4 h-4', book.favorite ? 'fill-current' : '']" />
            <span>{{ book.favorite ? '已设为挚爱' : '设为挚爱' }}</span>
          </button>

          <!-- Edit Info Button -->
          <button
            @click="$emit('edit-metadata', book)"
            class="p-2 rounded-xl bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 class="w-4 h-4" />
            <span>编辑信息</span>
          </button>

          <!-- Delete Button (Prominent) -->
          <button
            @click="confirmDelete"
            class="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer ml-1"
            title="从藏书阁中删除此书"
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
              :alt="book.title"
              class="w-full h-full object-cover"
              @error="imgError = true"
            />
            <div v-if="!coverSrc || imgError" class="w-full h-full flex flex-col items-center justify-center p-4 text-center">
              <BookOpen class="w-12 h-12 text-slate-700 mb-2" />
              <span class="text-xs text-slate-400">{{ book.title }}</span>
            </div>
            <div class="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent"></div>
          </div>

          <!-- Metadata & Interactive Controls -->
          <div class="flex-1 space-y-5">
            <div>
              <h2 class="text-2xl font-extrabold text-white tracking-tight">{{ book.title }}</h2>
              <p v-if="book.original_title" class="text-xs text-slate-500 italic mt-0.5">{{ book.original_title }}</p>
              <div class="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 mt-2">
                <span class="font-medium text-indigo-300">{{ book.author || '未知作者' }}</span>
                <span v-if="book.translator">/ {{ book.translator }} 译</span>
                <span v-if="book.publisher">· {{ book.publisher }}</span>
                <span v-if="book.publish_date">· {{ book.publish_date }}</span>
                <span v-if="book.isbn" class="text-slate-500 font-mono">ISBN: {{ book.isbn }}</span>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="book.tags && book.tags.length" class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in book.tags"
                :key="tag"
                class="text-xs px-2.5 py-0.8 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/50"
              >
                #{{ tag }}
              </span>
            </div>

            <!-- Status & Rating Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <!-- Reading Status Selector -->
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-2">阅读状态</label>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <button
                    v-for="st in statusOptions"
                    :key="st.value"
                    @click="updateStatus(st.value)"
                    :class="[
                      'py-1.5 px-2 rounded-xl font-medium border transition-all cursor-pointer text-center',
                      book.status === st.value
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
                  <label class="text-xs font-semibold text-slate-400">个人评分</label>
                  <span class="text-xs font-bold text-amber-400">
                    {{ book.rating !== null && book.rating !== undefined ? (book.rating / 2).toFixed(1) + ' 星' : '尚未评分' }}
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
                        book.rating >= starIndex * 2
                          ? 'fill-amber-400 text-amber-400'
                          : book.rating >= starIndex * 2 - 1
                          ? 'fill-amber-400/50 text-amber-400'
                          : 'text-slate-700'
                      ]"
                    />
                  </button>
                  <button
                    v-if="book.rating !== null"
                    @click="setRating(null)"
                    class="ml-2 text-[10px] text-slate-500 hover:text-rose-400 underline cursor-pointer"
                  >
                    清除
                  </button>
                </div>
              </div>
            </div>

            <!-- Reading Progress Controls -->
            <div v-if="book.total_pages" class="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400">阅读进度</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-cyan-400">{{ progressPercent }}%</span>
                  <span class="text-xs text-slate-400">({{ book.current_page || 0 }} / {{ book.total_pages }} 页)</span>
                </div>
              </div>

              <!-- Range Slider -->
              <input
                type="range"
                min="0"
                :max="book.total_pages"
                :value="book.current_page || 0"
                @change="handleProgressChange($event.target.value)"
                class="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />

              <!-- Quick Page Steppers -->
              <div class="flex items-center justify-between pt-1">
                <div class="flex items-center gap-1.5">
                  <button
                    @click="adjustPages(-10)"
                    class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                  >
                    -10
                  </button>
                  <button
                    @click="adjustPages(-1)"
                    class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                  >
                    -1
                  </button>
                  <button
                    @click="adjustPages(1)"
                    class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    @click="adjustPages(10)"
                    class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                  >
                    +10
                  </button>
                </div>

                <button
                  v-if="book.current_page < book.total_pages"
                  @click="finishReading"
                  class="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                >
                  直接标记为读毕 🎉
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Official Summary -->
        <div v-if="book.summary" class="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">内容简介</h4>
          <p class="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">{{ book.summary }}</p>
        </div>

        <!-- Golden Quotes Section -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Quote class="w-4 h-4 text-amber-400" />
              <h3 class="text-base font-bold text-white">高光金句 & 书摘</h3>
              <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                {{ book.quotes ? book.quotes.length : 0 }}
              </span>
            </div>
          </div>

          <!-- Add Quote Form -->
          <div class="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <textarea
              v-model="newQuote.content"
              rows="2"
              placeholder="记录触动你的一句话或精彩段落..."
              class="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            ></textarea>
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400">页码:</span>
                <input
                  v-model.number="newQuote.page_number"
                  type="number"
                  placeholder="例如: 128"
                  class="w-24 px-2 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                @click="submitQuote"
                :disabled="!newQuote.content.trim()"
                class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-amber-500/20"
              >
                添加书摘
              </button>
            </div>
          </div>

          <!-- Quotes List -->
          <div v-if="book.quotes && book.quotes.length" class="space-y-3">
            <div
              v-for="quote in book.quotes"
              :key="quote.id"
              class="relative group p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-900/40 border border-slate-800 hover:border-amber-500/40 transition-all shadow-sm"
            >
              <Quote class="w-6 h-6 text-amber-500/20 absolute top-3 left-3 -scale-x-100 pointer-events-none" />
              <p class="text-xs leading-relaxed text-slate-200 italic pl-6 pr-6 whitespace-pre-wrap font-serif">
                “{{ quote.content }}”
              </p>
              <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400 pl-6 border-t border-slate-800/50 pt-2">
                <span v-if="quote.page_number" class="font-mono text-amber-400/80">P. {{ quote.page_number }}</span>
                <span v-else class="text-slate-600">未注页码</span>

                <button
                  @click="deleteQuote(quote.id)"
                  class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer p-1"
                  title="删除此书摘"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-6 text-xs text-slate-600">
            暂无书摘，读到好句子时随时随手记录下来吧 ✨
          </div>
        </div>

        <!-- Personal Review / Notes Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <FileText class="w-4 h-4 text-indigo-400" />
              <h3 class="text-base font-bold text-white">精读随笔与感想</h3>
            </div>
            <button
              v-if="!isEditingReview"
              @click="isEditingReview = true"
              class="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
            >
              {{ book.my_review ? '修改感想' : '写下感想' }}
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
              placeholder="写下你通读本书后的深层感悟、批判性思考或是对你现实生活的触动..."
              class="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            ></textarea>
          </div>
          <div v-else-if="book.my_review" class="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <p class="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">{{ book.my_review }}</p>
          </div>
          <div v-else class="text-center py-6 text-xs text-slate-600 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
            尚未留下读后感想，通关/精读完后在这里写下你的时光印记 ✍️
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="pt-6 border-t border-slate-800/80 flex justify-end">
          <button
            @click="confirmDelete"
            class="text-xs text-slate-500 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>从藏书阁移除本书</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { X, Star, Edit3, BookOpen, Quote, Trash2, FileText } from 'lucide-vue-next';

const props = defineProps({
  book: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'update-book', 'delete-book', 'edit-metadata']);

const imgError = ref(false);
const isEditingReview = ref(false);
const editReviewText = ref(props.book.my_review || '');

const newQuote = ref({
  content: '',
  page_number: null,
  note: ''
});

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

const statusOptions = [
  { label: '📖 正在读', value: 'reading', activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { label: '✅ 已读完', value: 'finished', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { label: '⏳ 想读', value: 'wish', activeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { label: '❌ 弃读', value: 'abandoned', activeClass: 'bg-slate-700/60 text-slate-300 border-slate-600/40' }
];

async function updateStatus(newStatus) {
  emit('update-book', {
    id: props.book.id,
    status: newStatus
  });
}

async function setRating(newRating) {
  emit('update-book', {
    id: props.book.id,
    rating: newRating
  });
}

async function toggleFavorite() {
  emit('update-book', {
    id: props.book.id,
    favorite: !props.book.favorite
  });
}

async function handleProgressChange(val) {
  const page = Math.max(0, Math.min(Number(val), props.book.total_pages || 99999));
  emit('update-book', {
    id: props.book.id,
    current_page: page
  });
}

async function adjustPages(delta) {
  const current = props.book.current_page || 0;
  const max = props.book.total_pages || 99999;
  const next = Math.max(0, Math.min(current + delta, max));
  emit('update-book', {
    id: props.book.id,
    current_page: next
  });
}

async function finishReading() {
  emit('update-book', {
    id: props.book.id,
    current_page: props.book.total_pages,
    status: 'finished',
    finish_date: new Date().toISOString().split('T')[0]
  });
}

async function saveReview() {
  await emit('update-book', {
    id: props.book.id,
    my_review: editReviewText.value
  });
  isEditingReview.value = false;
}

async function submitQuote() {
  if (!newQuote.value.content.trim()) return;
  try {
    const res = await fetch(`/api/books/${props.book.id}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQuote.value)
    });
    if (res.ok) {
      const added = await res.json();
      if (!props.book.quotes) props.book.quotes = [];
      props.book.quotes.unshift(added);
      newQuote.value = { content: '', page_number: null, note: '' };
    }
  } catch (err) {
    console.error('Failed to add quote:', err);
  }
}

async function deleteQuote(quoteId) {
  if (!confirm('确认删除这条书摘吗？')) return;
  try {
    const res = await fetch(`/api/books/${props.book.id}/quotes/${quoteId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      props.book.quotes = props.book.quotes.filter(q => q.id !== quoteId);
    }
  } catch (err) {
    console.error('Failed to delete quote:', err);
  }
}

function confirmDelete() {
  if (confirm(`确定要从藏书阁中删除《${props.book.title}》吗？所有相关书摘和记录都将被移除。`)) {
    emit('delete-book', props.book.id);
  }
}
</script>
