import { ref } from "vue";
import XmCount from "../../components/XmCount.vue";
import XmHtml from "../../components/XmHtml.js";
export default {
  name: "XmIndexPage",
  components: { XmCount, XmHtml },
  setup() {
    const message = ref("Hello vue!");
    const b2Data = ref(null);
    const users = ref(null);

    async function fetchB2() {
      try {
        const response = await fetch("/b3");
        if (response.ok) {
          b2Data.value = await response.json();
        }
      } catch (error) {
        console.error("Fetch /b2 error:", error);
      }
    }


    fetchB2();
    const meeting = ref({
      name: "示例会议",
      date: "2025-08-01",
      location: "在线",
      notes1: "# 会议议程1\n- 开场",
      notes2: "# 会议议程2\n- 产品演示",
    });
    return { message, b2Data, users, meeting };
  }
};
