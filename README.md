# 🪄 Context Crafter

**In the age of AI, your codebase is a conversation.
This is the ultimate universal translator.**

---

## ✨ What It Does

Manually copying files into an AI prompt breaks your flow and quickly hits context limits.
**Context Crafter** fixes this by reading your repository, filtering out the noise, and giving your AI a single, focused brief.

---

## 🧪 Features

* 🌐 **Universal Ingestion** – Process any public GitHub repo or local folder
* 🤖 **Smart Filtering** – Ignores noise like `node_modules`, `.git`, and build artifacts
* ⚙️ **Custom Controls** – Add ignore patterns to focus only on what matters
* 🧩 **Context Splitting** – Breaks large projects into manageable, ordered parts
* 💎 **Modern UI** – Clean, glassmorphism design for a smooth workflow

---

## 🚀 Getting Started

### Using the Web App

1. Open the Context Crafter app
2. Paste a GitHub repository URL
3. Click **Process Repository**
4. Follow the guided workflow to copy context into your AI

### Running Locally

```bash
git clone https://github.com/your-username/context-crafter.git
cd context-crafter
```

---

## ⚡ Setup Instructions

### 🛠 Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a Python virtual environment:

**For Windows**

```bash
python -m venv venv
.\venv\Scripts\activate
```

**For macOS/Linux**

```bash
python3 -m venv venv
source venv/bin/activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

---

### 🎨 Frontend Setup

Navigate to the frontend directory:

```bash
cd ../frontend
```

Install the required npm packages:

```bash
npm install
```

---

### 🚀 Launch the Application

**Terminal 1 (Backend):**

```bash
uvicorn main:app --reload
```

**Terminal 2 (Frontend):**

```bash
npm run dev
```

---

### 🌐 Access the App

Open your browser and go to:
[http://localhost:5173](http://localhost:5173)

---

## 🛠 Tech Stack

* **Frontend:** React, Vite, TypeScript, Tailwind CSS
* **Backend:** FastAPI, Python 3
* **Deployment:** Vercel (frontend) & Render (backend)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a branch:

```bash
git checkout -b feature/my-feature
```

3. Commit your changes:

```bash
git commit -m "Add my feature"
```

4. Push to your branch:

```bash
git push origin feature/my-feature
```

5. Open a Pull Request 🚀

---

<p align="center">Made with ❤️ by those who believe in better workflows.</p> 
