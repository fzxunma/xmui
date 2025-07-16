import { createApp } from "vue";
import { XmIndexPage } from "./pages/XmIndexPage.js";

class XmAppWeb {
  static async loadApp() {
    const app = createApp(XmIndexPage.page);
    app.mount("#app");
  }
}

try {
  await XmAppWeb.loadApp();
} catch (error) {
  console.error("Failed to load app:", error);
}
