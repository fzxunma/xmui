import { createApp } from 'vue';
import XmRounterPage from "./pages/rounter";
import router from "./router/index.js";

class XmAppWeb {
  static async loadApp() {
    const App = createApp(XmRounterPage);
    App.use(router)
    App.mount("#app");
  }
}

try {
  await XmAppWeb.loadApp();
} catch (error) {
  console.error("Failed to load app:", error);
}
