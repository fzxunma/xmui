import { ref, h, defineComponent } from 'vue';

export const XmCount = defineComponent(
  (props) => {
    const count = ref(0);

    // 定义点击事件处理函数
    const increment = () => {
      count.value++;
    };

    return () => {
      // 渲染函数：添加 @click 事件
      return h('div', { onClick: increment }, `Count is: ${count.value}`);
    };
  },
  {
    props: {
      /* ... */
    },
  }
);