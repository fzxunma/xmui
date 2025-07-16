XMUI - Web Component UI Library
XMUI is a lightweight, open-source UI component library built with Web Components (Custom Elements, Shadow DOM, and ES Modules). It provides reusable, framework-agnostic UI components for modern web applications, compatible with any JavaScript framework (React, Vue, Angular, Svelte) or vanilla JavaScript.
Features

Framework-Agnostic: Built with native Web Components, works seamlessly in any JavaScript environment.
Lightweight: Minimal bundle size with zero dependencies.
Encapsulated Styling: Uses Shadow DOM for isolated CSS, preventing style leaks.
Customizable: Style components with CSS custom properties or custom stylesheets.
Accessible: Adheres to WAI-ARIA standards for inclusive design.
Modular: Import only the components you need for optimal performance.

Getting Started
Installation
Install XMUI via npm or use it directly via a CDN.
Via npm
npm install xmui

Via CDN
Include XMUI in your HTML:
<script type="module" src="https://unpkg.com/xmui@latest/dist/xmui.min.js"></script>

Usage
XMUI components are ready to use as custom HTML elements. Below is an example with the <xmui-button> component.
Example
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>XMUI Example</title>
  <script type="module" src="https://unpkg.com/xmui@latest/dist/xmui.min.js"></script>
</head>
<body>
  <xmui-button variant="primary">Click Me</xmui-button>

  <script>
    const button = document.querySelector('xmui-button');
    button.addEventListener('click', () => alert('Hello from XMUI!'));
  </script>
</body>
</html>

In a Framework
XMUI works with any JavaScript framework. Example in React:
import 'xmui/dist/xmui.min.js'; // Import Web Components

function App() {
  return <xmui-button variant="primary">React Button</xmui-button>;
}

export default App;

Available Components

<xmui-button>: A versatile button with variants (primary, secondary, outline).
<xmui-input>: A customizable input with validation support.
<xmui-modal>: A responsive, accessible modal dialog.
<xmui-card>: A flexible card component for content display.
Explore more in our documentation.

Styling
Customize XMUI components using CSS custom properties or by targeting the Shadow DOM.
xmui-button {
  --xmui-primary-bg: #1e90ff;
  --xmui-border-radius: 6px;
}

/* Advanced: Style Shadow DOM */
xmui-button::part(base) {
  font-size: 16px;
}

Contributing
We welcome contributions to XMUI! To contribute:

Fork the repository.
Create a feature branch (git checkout -b feat/your-feature).
Commit your changes (git commit -m "Add your feature").
Push to the branch (git push origin feat/your-feature).
Open a Pull Request.

See our Contributing Guidelines for more details.
License
XMUI is licensed under the MIT License. You are free to use, modify, and distribute this library, provided the original copyright and license notice are included.
Documentation
Visit our official documentation for detailed guides, API references, and examples.
Community

GitHub Issues: Report bugs or request features on our GitHub repository.
Discussions: Join the conversation in our GitHub Discussions.
Twitter: Follow us at @xmui for updates.
