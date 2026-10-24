<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
    <!-- Backdrop -->
    <div @click="$emit('close')" class="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"></div>

    <!-- Modal Box -->
    <div class="relative w-full max-w-2xl glass-panel rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden my-auto z-10 max-h-[90vh] flex flex-col">
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
        <!-- Cover Upload & Preview -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-2">书籍封面</label>
          <div class="flex flex-col sm:flex-row gap-4 items-center">
            <!-- Thumbnail Box -->
            <div class="w-28 aspect-[2/3] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-md">
              <img
                v-if="previewSrc"
                :src="previewSrc"
                alt="Cover Preview"
                class="w-full h-full object-cover"
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

        <!-- Submit Buttons -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { X, BookPlus, Edit3, Image, Upload } from 'lucide-vue-next';

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'save']);

const isEdit = computed(() => !!props.initialData?.id);
const isUploading = ref(false);

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
