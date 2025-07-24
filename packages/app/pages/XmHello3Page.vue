<script>
import { ref } from 'vue';
import XmCard2_2_3 from "../components/XmCard2_2_3.vue";
import XmCard1_1_1 from "../components/XmCard1_1_1.vue";
import XmCard1_2s_1 from "../components/XmCard1_2s_1.vue";
import XmCard1s_2s_1 from "../components/XmCard1s_2s_1.vue";
import XmCard1_1_1_1 from "../components/XmCard1_1_1_1.vue";
import XmCard1_1_1_1_1 from "../components/XmCard1_1_1_1_1.vue";
import XmCard1_2_1_2 from "../components/XmCard1_2_1_2.vue";
import XmCard1_2 from "../components/XmCard1_2.vue";
import XmCard2_1 from "../components/XmCard2_1.vue";
import XmCard3_3 from "../components/XmCard3_3.vue";
export default {
  components: {
    XmCard2_2_3,
    XmCard1_1_1,
    XmCard1_2s_1,
    XmCard1s_2s_1,
    XmCard1_1_1_1,
    XmCard1_1_1_1_1,
    XmCard1_2_1_2,
    XmCard1_2,
    XmCard2_1,
    XmCard3_3
  },
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
  <div class="flex flex-row  justify-center flex-wrap">
    <XmCard1_1_1></XmCard1_1_1>
    <XmCard1_2s_1></XmCard1_2s_1>
    <XmCard1s_2s_1></XmCard1s_2s_1>
    <XmCard1_1_1_1></XmCard1_1_1_1>
    <XmCard1_1_1_1_1></XmCard1_1_1_1_1>
    <XmCard1_2_1_2></XmCard1_2_1_2>
    <XmCard1_2></XmCard1_2>
    <XmCard2_1></XmCard2_1>
    <XmCard3_3></XmCard3_3>
    <XmCard2_2_3></XmCard2_2_3>
  </div>
</template>
