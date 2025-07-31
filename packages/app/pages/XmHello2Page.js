import { ref } from "vue";
import { XmCount } from "../components/XmCount2.js";
export default {
  name: "XmHelloPage",
  components: { XmCount },
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

    return { message, b2Data, users };
  },
  template: `
      <div class="p-4">heelo1111122222
       <RouterLink to="/pages/hello1">Go to Hello</RouterLink>
      </div>
    `,
};
