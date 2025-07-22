import { createRouter, createWebHashHistory } from "vue-router"; // 假设使用 WebHistory
import { defineAsyncComponent, h, ref, watch } from "vue"; // 添加 ref 和 watch
import { useRoute } from "vue-router";

// 路由配置
const routes = [
  {
    path: "/pages/:id",
    component: {
      setup() {
        const route = useRoute();
        let paramsId = route.params.id || "index";
        paramsId = paramsId.charAt(0).toUpperCase() + paramsId.slice(1);
        const currentId = ref(paramsId); // 使用 ref 存储当前 id
        console.log("Initial loading page:", currentId.value);

        // 定义异步组件加载函数
        const loadPage = (id) => {
          return defineAsyncComponent(() =>
            import(`../pages/${id}`).catch((error) => {
              console.error(`Failed to load component for ${id}:`, error);
              return import("../pages/index"); // 回退组件
            })
          );
        };

        const Page = ref(loadPage(currentId.value)); // 初始加载

        // 监听路由参数变化
        watch(
          () => route.params.id,
          (newId) => {
            if (newId) {
              currentId.value = newId.charAt(0).toUpperCase() + newId.slice(1);
              Page.value = loadPage(currentId.value); // 更新组件
            }
          },
          { immediate: true }
        ); // immediate 确保首次也触发

        return () => h(Page.value);
      },
    },
  },
  {
    path: "/page/:id",
    component: {
      setup() {
        const route = useRoute();
        let paramsId = route.params.id || "index";
        paramsId = paramsId.charAt(0).toUpperCase() + paramsId.slice(1);
        const currentId = ref(paramsId); // 使用 ref 存储当前 id

        const url = new URL(window.location.href);
        const pathname = url.pathname;
        const filename = pathname.split("/").pop();
        console.log("当前页面文件名:", filename);

        const pagesType = filename.startsWith("m") ? "XmMobile" : "Xm"; // 判断是移动端还是网页端
        // 定义异步组件加载函数
        const loadPage = (id) => {
          return defineAsyncComponent(() =>
            import(`../pages/${pagesType}${id}/index.js`).catch((error) => {
              console.error(`Failed to load component for ${id}:`, error);
              return import("../pages/index"); // 回退组件
            })
          );
        };

        const Page = ref(loadPage(currentId.value)); // 初始加载

        // 监听路由参数变化
        watch(
          () => route.params.id,
          (newId) => {
            if (newId) {
              currentId.value = newId.charAt(0).toUpperCase() + newId.slice(1);
              Page.value = loadPage(currentId.value); // 更新组件
            }
          },
          { immediate: true }
        ); // immediate 确保首次也触发

        return () => h(Page.value);
      },
    },
  },
  {
    path: "/pagesv3/:id",
    component: {
      setup() {
        const route = useRoute();
        let paramsId = route.params.id || "index";
        paramsId = paramsId.charAt(0).toUpperCase() + paramsId.slice(1);

        const currentId = ref(paramsId); // 使用 ref 存储当前 id
        const url = new URL(window.location.href);
        const pathname = url.pathname;
        const filename = pathname.split("/").pop();

        const pagesType = filename.startsWith("m") ? "XmMobile" : "Xm"; // 判断是移动端还是网页端
        // 定义异步组件加载函数
        const loadPage = (id) => {
          return defineAsyncComponent(() =>
            import(`../pages/${pagesType}${id}Page.vue`).catch((error) => {
              console.error(`Failed to load component for ${id}:`, error);
              return import("../pages/index"); // 回退组件
            })
          );
        };

        const Page = ref(loadPage(currentId.value)); // 初始加载

        // 监听路由参数变化
        watch(
          () => route.params.id,
          (newId) => {
            if (newId) {
              currentId.value = newId.charAt(0).toUpperCase() + newId.slice(1);
              Page.value = loadPage(currentId.value); // 更新组件
            }
          },
          { immediate: true }
        ); // immediate 确保首次也触发

        return () => h(Page.value);
      },
    },
  },
  {
    path: "/",
    redirect: "/pages/index",
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
