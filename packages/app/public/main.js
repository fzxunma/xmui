  
  async function loadApp() {
  // Dynamically load Vue and Pinia
  const { createApp, ref } = await import('https://unpkg.com/vue@3/dist/vue.esm-browser.js');

  const app = createApp({
    setup() {
      const message = ref('Hello vue!');
      const b2Data = ref(null);
      const users = ref(null);

      async function fetchB2() {
        try {
          const response = await fetch('/b3');
          if (response.ok) {
            b2Data.value = await response.json();
          }
        } catch (error) {
          console.error('Fetch /b2 error:', error);
        }
      }

      async function fetchUsers() {
        try {
          const response = await fetch('/api/users');
          if (response.ok) {
            users.value = (await response.json()).users;
          }
        } catch (error) {
          console.error('Fetch /api/users error:', error);
        }
      }

      fetchB2();
      fetchUsers();

      return { message, b2Data, users };
    },
    template: `
      <div class="p-4">
        <h1>{{ message }}</h1>
        <p v-if="b2Data">B2 Message: {{ b2Data.message }}</p>
        <p v-else>Loading B2...</p>
        <div v-if="users">
          <h2>User List</h2>
          <ul>
            <li v-for="user in users" :key="user.id">
              {{ user.username }} ({{ user.email }})
            </li>
          </ul>
        </div>
        <p v-else>Loading users...</p>
      </div>
    `
  });

  app.mount('#app');
}

loadApp().catch((error) => console.error('Failed to load app:', error));
