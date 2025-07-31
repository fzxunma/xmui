import { createApp } from "vue";
import XmRounterPage from "./pages/rounter";
import router from "./router/index.js";
import naive from "naive-ui";

class XmAppWeb {
  static async loadApp() {
    const App = createApp(XmRounterPage);
    for (const compName in naive) {
      const component = naive[compName];
      if (component && component.name) {
        App.component(component.name, component);
      }
    }
    App.use(naive);
    App.use(router);
    App.mount("#app");
  }
}

try {
  await XmAppWeb.loadApp();
} catch (error) {
  console.error("Failed to load app:", error);
}
