<template>
  <nav class="md:hidden fixed bottom-0 inset-x-0 z-40 glass-panel border-t border-slate-800/80 pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)] pt-1 px-3 shadow-2xl">
    <div class="flex items-center justify-around relative">
      <!-- 1. All -->
      <button
        @click="$emit('select-category', 'all')"
        :class="[
          'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer',
          activeCategory === 'all' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <Layers class="w-5 h-5" />
        <span class="text-[10px] mt-0.5">全部</span>
      </button>

      <!-- 2. Books -->
      <button
        @click="$emit('select-category', 'book')"
        :class="[
          'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer',
          activeCategory === 'book' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <BookOpen class="w-5 h-5" />
        <span class="text-[10px] mt-0.5">书籍</span>
      </button>

      <!-- 3. Center Floating Add Button -->
      <button
        @click="$emit('open-add')"
        class="w-12 h-12 -mt-5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-95 transition-all cursor-pointer border border-white/20"
      >
        <Plus class="w-6 h-6" />
      </button>

      <!-- 4. Games -->
      <button
        @click="$emit('select-category', 'game')"
        :class="[
          'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer',
          activeCategory === 'game' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <Gamepad2 class="w-5 h-5" />
        <span class="text-[10px] mt-0.5">游戏</span>
      </button>

      <!-- 5. Movies -->
      <button
        @click="$emit('select-category', 'movie')"
        :class="[
          'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer',
          activeCategory === 'movie' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <Film class="w-5 h-5" />
        <span class="text-[10px] mt-0.5">影视</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { Layers, BookOpen, Gamepad2, Film, Plus } from 'lucide-vue-next';

defineProps({
  activeCategory: String
});

defineEmits(['select-category', 'open-add']);
</script>
