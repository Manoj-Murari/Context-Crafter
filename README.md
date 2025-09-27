# 🪄 Context Crafter

Turn your entire codebase into a perfectly formatted prompt for any LLM, right from your browser.

In the age of AI, your codebase is a conversation. Context Crafter is the ultimate universal translator, letting you brief your AI assistant on a complete project without the hassle of manual file handling or context limits.

## ✨ What It Does

Manually copying and pasting files into an AI prompt is slow, inefficient, and quickly hits token limits. Context Crafter solves this by intelligently reading your project, filtering out the noise, and packaging everything into a single, focused brief for your AI.

It runs as a Chrome Extension in your browser's side panel, integrating seamlessly into your workflow.

## 🧪 Key Features

- 🌐 **Universal Ingestion**: Process projects directly from a public GitHub repository URL or by dragging and dropping a local folder.
- 🤖 **Smart Filtering**: Automatically ignores clutter like `node_modules`, `.git`, build artifacts, and binary files to keep your context clean and relevant.
- ⚙️ **Custom Ignore Patterns**: Fine-tune the output by adding your own custom rules to ignore specific files or directories.
- 🧩 **Automatic Context Splitting**: For large projects, it automatically breaks the context into numbered, sequential parts that you can paste one by one.
- 📋 **Guided Copy Workflow**: The UI tracks which parts you've copied, making it easy to manage large, multi-part prompts.
- 💎 **Modern UI**: A clean, intuitive interface designed for a fast and smooth workflow, accessible right in your browser's side panel.

## 🚀 Getting Started (Easy Install)

You can install and use Context Crafter in developer mode in just a few steps.

### Download the Extension

1. Go to the main repository page: https://github.com/Manoj-Murari/Context-Crafter
2. Click the green **< > Code** button, then click **Download ZIP**.
3. Unzip the downloaded file. The folder you need for the extension is located at `frontend/dist`.

### Load the Extension in Chrome

1. Open your Chrome browser and navigate to `chrome://extensions`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **"Load unpacked"** button that appears.
4. Select the `frontend/dist` folder from the unzipped repository you downloaded in step 1.

### Ready to Go!

The Context Crafter extension will now appear in your extensions list. Pin it to your toolbar and click the icon to open it in the side panel!

## 🛠️ For Developers (Contributing & Running Locally)

If you want to contribute to the project or run it from the source code, follow these steps.

### Prerequisites

- Node.js (v20.x or higher recommended)
- npm

### Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Manoj-Murari/Context-Crafter.git
   cd Context-Crafter/frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   This will start the Vite development server with hot-reloading.
   ```bash
   npm run dev
   ```

   **Note**: To load the extension while developing, you will still need to run `npm run build` once to create the initial `dist` folder.

## 🔮 Future Plans

We are working hard to bring Context Crafter to the official Chrome Web Store for a simple, one-click installation. Stay tuned!

## 💻 Tech Stack

- **Framework**: React with Vite & TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Platform**: Chrome Extension (Manifest V3)

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features or improvements, feel free to fork the repository, make your changes, and open a pull request.

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

<p align="center">Made with ❤️ for a more intelligent workflow.</p>