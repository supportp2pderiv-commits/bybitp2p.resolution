# Render Deployment Guide

This project is configured and ready for instant deployment on [Render](https://render.com).

---

## Option 1: Web Service (Recommended)

1. Push this folder to a GitHub or GitLab repository.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** &rarr; **Web Service**.
4. Connect your repository.
5. Configure the following settings (if not auto-detected from `render.yaml`):
   - **Name**: `apex-p2p-portal` (or any name you prefer)
   - **Region**: Any (e.g. Frankfurt, Oregon, Singapore)
   - **Environment / Runtime**: `Node`
   - **Build Command**: `npm run build` (or leave empty)
   - **Start Command**: `npm start` (runs `node server.js`)
   - **Plan**: `Free`
6. Click **Deploy Web Service**.
7. Render will automatically detect the port via `process.env.PORT` and provide your live URL (e.g. `https://apex-p2p-portal.onrender.com`).

---

## Option 2: Render Blueprint (`render.yaml`)

Because this project includes [`render.yaml`](render.yaml):
1. In Render, select **New +** &rarr; **Blueprint**.
2. Connect your Git repository.
3. Render will read `render.yaml` and configure the web service, health check path (`/healthz`), and commands automatically.
4. Click **Apply**.

---

## Option 3: Static Site (Zero Server)

If you prefer to deploy as a purely static site:
1. In Render Dashboard, click **New +** &rarr; **Static Site**.
2. Connect your repository.
3. Set:
   - **Build Command**: *(leave empty)*
   - **Publish Directory**: `.`
4. Click **Create Static Site**.

---

## Local Testing

To test the exact production server locally:
```bash
npm start
```
The server will start on [http://localhost:3000](http://localhost:3000).
Health check endpoint: [http://localhost:3000/healthz](http://localhost:3000/healthz)
