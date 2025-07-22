import { ref } from "vue";
import XmCount from "../components/XmCount.js";
import XmMd from "../components/XmMd.js";
import XmHtml from "../components/XmHtml.js";
export default {
  name: "XmIndexPage",
  components: { XmCount, XmMd,XmHtml },
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

    async function fetchUsers() {
      try {
        const response = await fetch("/api/users");
        if (response.ok) {
          users.value = (await response.json()).users;
        }
      } catch (error) {
        console.error("Fetch /api/users error:", error);
      }
    }

    fetchB2();
    fetchUsers();

    return { message, b2Data, users };
  },
  template: `
      <div class="p-4">
      <RouterLink to="/pages/hello">Go to Hello</RouterLink>
        <h1>{{ message }}</h1>
               <XmCount  />
        <p v-if="b2Data">B2 Message: {{ b2Data.message }}</p>
        <p v-else>Loading B2...</p>
        <div v-if="users">
          <h2>User List</h2>
          <ul>
            <li v-for="user in users" :key="user.id">
              {{ user.data.username }} ({{ user.data.email }})
            </li>
          </ul>
        </div>
        <p v-else>Loading users...</p>
              </div>
              <XmMd/>
              <XmHtml/>
    `,
};
