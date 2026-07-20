# Vue Smart UI

A collection of Vue 3 UI components — customizable, accessible, and themeable via CSS variables.

**Documentation & live demos:** [https://vuesmartui.edgarimai.com/](https://vuesmartui.edgarimai.com/)

All component APIs, examples, theming guides, and changelogs are available on the documentation site.

## Install

```bash
npm install vue-smart-ui
# or
yarn add vue-smart-ui
# or
pnpm add vue-smart-ui
```

## Quick start

1. Import styles once (required):

```js
import 'vue-smart-ui/style.css'
```

2. Prefer named imports (tree-shakable):

```js
import { BaseButton, BaseInput } from 'vue-smart-ui'
```

```vue
<template>
  <BaseButton variant="primary">Click me</BaseButton>
</template>
```

3. Or register all components globally:

```js
import { createApp } from 'vue'
import VueSmartUI from 'vue-smart-ui'
import App from './App.vue'

createApp(App).use(VueSmartUI).mount('#app')
```

## Tree-shaking

Named ESM imports are tree-shakable: unused components are dropped from your JS bundle by modern bundlers (Vite, Rollup, webpack, esbuild).

- Use `import { BaseButton } from 'vue-smart-ui'`
- Avoid `app.use(VueSmartUI)` if you want unused components removed
- Styles are shipped as a single stylesheet (`vue-smart-ui/style.css`) and are not tree-shaken

## Theming

Override `--vsui-*` CSS variables **before** importing `vue-smart-ui/style.css`.

Full theming guide: [https://vuesmartui.edgarimai.com/theming](https://vuesmartui.edgarimai.com/theming)

## License

MIT
