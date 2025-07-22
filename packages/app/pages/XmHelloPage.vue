<script setup>
import { ref } from 'vue';
const count = ref(0);
const increment = () => {
  count.value++;
};
</script>
<template>
  <div @click="increment">Count撒旦杀杀杀dd发vue is: {{ count }}</div>
</template>
