# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

# Canaboo Route Planner

## Local Development

```zsh
# Canaboo Route Planner

## Local Development

```zsh
cd canaboo-app
npm install
npm run dev
```

## GitHub Pages Deployment

This repo is configured to deploy from the `main` branch using GitHub Actions.

1. Push to `main`.
2. In GitHub, go to **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.

The site will be available at:

```
https://christine-iyer.github.io/any-given-saturday/
```

Note: Vite `base` is set to `/any-given-saturday/` in `vite.config.js`.
