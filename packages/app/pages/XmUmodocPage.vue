<script>
import { onMounted } from 'vue';
export default {
  setup() {
    onMounted(() => {
      // 等待渲染完 DOM 后再处理
      const container = document.querySelector('umo-status-bar-left');
      if (container) {
        const links = container.querySelectorAll('a');
        const len = links.length;
        if (len >= 2) {
          links[len - 1].style.display = 'none';
          links[len - 2].style.display = 'none';
        }
      }
    });
    return {}
  }
}
</script>
<template>
  <div class="h-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
    <umo-editor />
  </div>
</template>