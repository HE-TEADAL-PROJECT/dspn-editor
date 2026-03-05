# DSPN Editor

A web-based diagram editor for Data Space Policy Networks (DSPN), built with Vue 3 and Vite.

**Current version: 0.9.1**

## Prerequisites

- **Node.js** v22 or later
- **npm** v10 or later

---

## Without Docker

### 1. Clone the repository

```bash
git clone https://github.com/HE-TEADAL-PROJECT/dspn-editor.git
cd dspn-editor
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run in development mode

Starts both the Vite dev server (frontend) and the Express backend concurrently:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 4. Run in production mode

Build the frontend and serve everything through the Express server:

```bash
npm run build
node server/index.js
```

The app will be available at http://localhost:3001.

### Environment variables

| Variable       | Default              | Description                        |
|----------------|----------------------|------------------------------------|
| `PORT`         | `3001`               | Port the Express server listens on |
| `PROJECT_ROOT` | `./projects`         | Directory where project files are stored |

---

## With Docker

### Pull the image

```bash
docker pull polimiis/dspn-editor:latest
```

### Run the container

```bash
docker run -d \
  -p 3001:3001 \
  -v /path/to/your/projects:/data/projects \
  polimiis/dspn-editor:latest
```

The app will be available at http://localhost:3001.

The `-v` flag mounts a local directory into the container so your project files persist across restarts. Replace `/path/to/your/projects` with the desired path on your host machine.

### Run a specific version

```bash
docker run -d \
  -p 3001:3001 \
  -v /path/to/your/projects:/data/projects \
  polimiis/dspn-editor:0.9.1
```

### Build the image locally

```bash
docker build -t dspn-editor .
```

---

## Usage

When the application starts, no diagram is open by default. Use the Project Manager panel on the left to:

- **Open an existing file** — double-click any `.xml` file in the project tree to open it in a new tab
- **Create a new file** — use the Project Manager to create a new `.xml` file, then open it

Each open diagram appears as a tab. Use the save button in the canvas toolbar to save changes.

---

## Authors

Developed by the [RAISE group at POLIMI](https://isgroup-polimi.github.io) with huge support of Claude.
