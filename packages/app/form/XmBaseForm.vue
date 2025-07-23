<script >
import { ref } from 'vue';

export default {
  name: 'XmCount',
  setup() {
    const count = ref(0);
    const increment = () => {
      count.value++;
    };
    return { count, increment };
  },
};
</script>
<template>
  <div @click="increment">Count is: {{ count }}</div>
</template>

