# XMUI

XMUI is a zero-configuration Vue.js frontend framework powered by Bun. It provides a seamless development experience for building responsive web applications, with built-in support for PC (using Naive UI) and mobile (using Vant) interfaces. The framework is designed to be lightweight, modular, and easy to extend, allowing developers to focus on building features without worrying about complex setups.

## Features

- **Zero-Configuration Setup**: Powered by Bun for fast, out-of-the-box development without additional build tools or configurations.
- **Cross-Platform UI**: Uses Naive UI for desktop/PC interfaces and Vant for mobile/responsive designs, ensuring consistent and adaptive user experiences.
- **Vue.js Based**: Leverages Vue's reactive ecosystem for efficient component-based architecture.
- **Modular Structure**: Easily add pages, views, layouts, components, and models to scale your application.
- **Fast Startup**: Launch your development server with a single command: `bun index.js`.
- **Customizable and Extensible**: Integrate additional Vue plugins or customize UI libraries as needed.
- **Accessible and Performant**: Built-in best practices for accessibility and performance optimization.

## Installation

### Prerequisites
- Install Bun: Follow the official [Bun installation guide](https://bun.sh/docs/installation) for your platform.

### Via GitHub
Clone the repository and install dependencies:

```bash
git clone https://github.com/fzxunma/xmui.git
cd xmui
bun install
```

## Usage

### Starting the Development Server
Run the following command to start the server:

```bash
bun index.js
```

This will launch the application in development mode. Open your browser to `http://localhost:3000` (or the specified port) to view it.

### Adding Elements to Your Project

XMUI follows a structured directory convention for organizing your application. Below are instructions for adding common elements:

#### 6. Adding a Page
Pages are the main routes in your application. Create a new page in the `src/pages` directory:

1. Create a file like `src/pages/MyPage.vue`.
2. Define your Vue component:
   ```vue
   <template>
     <div>My Page Content</div>
   </template>

   <script setup>
   // Your script logic here
   </script>

   <style scoped>
   /* Your styles here */
   </style>
   ```
3. Register the page in your router (e.g., `src/router/index.js`):
   ```javascript
   import MyPage from '@/pages/MyPage.vue';

   const routes = [
     { path: '/my-page', component: MyPage },
   ];
   ```

#### 7. Adding a View
Views are reusable sections or partials within pages. Create a new view in the `src/views` directory:

1. Create a file like `src/views/MyView.vue`.
2. Define your Vue component similar to a page:
   ```vue
   <template>
     <div>My View Content</div>
   </template>

   <script setup>
   // View-specific logic
   </script>
   ```
3. Import and use it in a page or layout:
   ```vue
   <template>
     <MyView />
   </template>
   <script setup>
   import MyView from '@/views/MyView.vue';
   </script>
   ```

#### 8. Adding a Layout
Layouts provide reusable wrappers (e.g., headers, footers) for pages. Create a new layout in the `src/layouts` directory:

1. Create a file like `src/layouts/MyLayout.vue`.
2. Define the layout with a slot for content:
   ```vue
   <template>
     <div class="layout">
       <header>Header</header>
       <slot /> <!-- Page content goes here -->
       <footer>Footer</footer>
     </div>
   </template>

   <style scoped>
   /* Layout styles */
   </style>
   ```
3. Apply it in your router or page:
   ```javascript
   const routes = [
     { path: '/my-page', component: MyPage, meta: { layout: 'MyLayout' } },
   ];
   ```

#### 9. Adding a Component
Components are reusable UI building blocks. Create a new component in the `src/components` directory:

1. Create a file like `src/components/MyComponent.vue`.
2. Define the component:
   ```vue
   <template>
     <div>My Component</div>
   </template>

   <script setup>
   // Component props and logic
   </script>

   <style scoped>
   /* Component styles */
   </style>
   ```
3. Import and use it anywhere:
   ```vue
   <template>
     <MyComponent />
   </template>
   <script setup>
   import MyComponent from '@/components/MyComponent.vue';
   </script>
   ```

   - For PC: Use Naive UI components (e.g., `<n-button>` from `naive-ui`).
   - For Mobile: Use Vant components (e.g., `<van-button>` from `vant`).

#### 10. Adding a Model
Models handle data structures and logic (e.g., API interactions). Create a new model in the `src/models` directory:

1. Create a file like `src/models/MyModel.js`.
2. Define the model class or functions:
   ```javascript
   export class MyModel {
     constructor(data) {
       this.data = data;
     }

     async fetchData() {
       // API call or data logic
       return fetch('/api/data').then(res => res.json());
     }
   }
   ```
3. Use it in your components or views:
   ```vue
   <script setup>
   import { MyModel } from '@/models/MyModel';
   const model = new MyModel();
   model.fetchData().then(data => console.log(data));
   </script>
   ```

## Styling and Customization

- **PC/Desktop**: Leverage Naive UI for professional, customizable UI elements. Import and use as needed:
  ```vue
  <script setup>
  import { NButton } from 'naive-ui';
  </script>
  ```

- **Mobile**: Use Vant for touch-friendly components:
  ```vue
  <script setup>
  import { VanButton } from 'vant';
  </script>
  ```

Customize globally via CSS variables or theme configurations in the respective libraries.

## Contributing

We welcome contributions! To get started:

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add YourFeature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.

Please review the [Contributing Guidelines](CONTRIBUTING.md) (if available) for more details.

- Report bugs or request features via [GitHub Issues](https://github.com/fzxunma/xmui/issues).
- Join discussions on [GitHub Discussions](https://github.com/fzxunma/xmui/discussions).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.