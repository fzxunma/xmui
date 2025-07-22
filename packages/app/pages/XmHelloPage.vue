<script setup>
import { ref } from 'vue';
const count = ref(0);
const increment = () => {
  count.value++;
};
</script>
<template>
  <div @click="increment" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Count撒旦杀杀杀dd发vue is: {{ count }}</div>
</template>
