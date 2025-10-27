# 🍞 Toast System - Vue Smart UI

This document explains how the toast notification system works and how to configure global defaults.

## 📋 Table of Contents

- [Overview](#overview)
- [Global Configuration](#global-configuration)
- [Available Options](#available-options)
- [Toast Methods](#toast-methods)
- [Usage Examples](#usage-examples)
- [Advanced Customization](#advanced-customization)

## Overview

Vue Smart UI has an integrated toast notification system that allows:

✅ **Global configuration** of default behavior  
✅ **Multiple variants** (default, success, error, warning, info)  
✅ **Flexible positioning** (6 positions available)  
✅ **Auto-dismiss** with customizable duration  
✅ **Pause on hover** functionality  
✅ **Simple mode** for minimal notifications  
✅ **Stacking** multiple toasts  

## Global Configuration

### Configuring in `main.js`

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import { useToastConfig } from 'vue-smart-ui'

const app = createApp(App)

// Configure toast defaults globally
const { setToastDefaults } = useToastConfig()

setToastDefaults({
  position: 'bottom-right',  // Default position for all toasts
  duration: 5000,            // Default duration in milliseconds
  closable: true,            // Show close button by default
  simple: false,             // Use full toast style by default
})

app.mount('#app')
```

### Reset to Default Settings

```javascript
import { useToastConfig } from 'vue-smart-ui'

const { resetToastDefaults } = useToastConfig()

// Reset to default settings
resetToastDefaults()
```

## Available Options

### Position Options

| Position | Description |
|----------|-------------|
| `top-right` | Top right corner (default) |
| `top-left` | Top left corner |
| `top-center` | Top center |
| `bottom-right` | Bottom right corner |
| `bottom-left` | Bottom left corner |
| `bottom-center` | Bottom center |

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `position` | `string` | `'top-right'` | Where the toast appears on screen |
| `duration` | `number` | `3000` | Time in milliseconds before auto-dismiss (0 = no auto-dismiss) |
| `closable` | `boolean` | `true` | Whether to show the close button |
| `simple` | `boolean` | `false` | Use simple toast style (no icon, no progress bar) |

## Toast Methods

### Basic Usage

```javascript
import { useToast } from 'vue-smart-ui'

const toast = useToast()

// Using variant methods
toast.success('Operation completed!')
toast.error('An error occurred')
toast.warning('Please be careful')
toast.info('New notification')
toast.default('Generic message')
```

### With Custom Options

```javascript
// Override global defaults for specific toast
toast.success('Saved successfully!', {
  position: 'top-center',
  duration: 10000,
  title: 'Success',
  closable: false,
})

// Simple toast
toast.info('Quick notification', {
  simple: true,
  duration: 2000,
})

// Toast that doesn't auto-dismiss
toast.warning('Important message', {
  duration: 0,
  title: 'Warning',
})
```

### Generic Method

```javascript
// Using the generic addToast method
toast.addToast({
  message: 'Custom message',
  variant: 'info',
  title: 'Information',
  position: 'bottom-left',
  duration: 4000,
  closable: true,
  simple: false,
})
```

## Usage Examples

### Basic Example

```vue
<template>
  <BaseButton @click="showSuccess">
    Show Success Toast
  </BaseButton>
</template>

<script setup>
import { useToast } from 'vue-smart-ui'

const toast = useToast()

const showSuccess = () => {
  toast.success('Operation completed successfully!')
}
</script>
```

### Multiple Toasts with Different Positions

```vue
<template>
  <div>
    <BaseButton @click="showTopToast">Top Toast</BaseButton>
    <BaseButton @click="showBottomToast">Bottom Toast</BaseButton>
  </div>
</template>

<script setup>
import { useToast } from 'vue-smart-ui'

const toast = useToast()

const showTopToast = () => {
  toast.info('This appears at the top', {
    position: 'top-center',
  })
}

const showBottomToast = () => {
  toast.success('This appears at the bottom', {
    position: 'bottom-center',
  })
}
</script>
```

### Error Handling Example

```vue
<template>
  <BaseButton @click="handleSubmit" :loading="loading">
    Submit Form
  </BaseButton>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'vue-smart-ui'

const toast = useToast()
const loading = ref(false)

const handleSubmit = async () => {
  loading.value = true
  
  try {
    await submitData()
    toast.success('Form submitted successfully!', {
      title: 'Success',
      duration: 5000,
    })
  } catch (error) {
    toast.error(error.message || 'Failed to submit form', {
      title: 'Error',
      duration: 7000,
    })
  } finally {
    loading.value = false
  }
}

const submitData = async () => {
  // Your API call here
}
</script>
```

### Simple Toast Example

```vue
<template>
  <BaseButton @click="showSimpleToast">
    Show Simple Toast
  </BaseButton>
</template>

<script setup>
import { useToast } from 'vue-smart-ui'

const toast = useToast()

const showSimpleToast = () => {
  toast.info('This is a simple toast', {
    simple: true,
    duration: 3000,
    position: 'bottom-center',
  })
}
</script>
```

### Sequential Toasts

```vue
<template>
  <BaseButton @click="showSequence">
    Show Sequence
  </BaseButton>
</template>

<script setup>
import { useToast } from 'vue-smart-ui'

const toast = useToast()

const showSequence = () => {
  toast.info('Step 1: Processing...', { duration: 2000 })
  
  setTimeout(() => {
    toast.warning('Step 2: Validating...', { duration: 2000 })
  }, 2000)
  
  setTimeout(() => {
    toast.success('Step 3: Complete!', { duration: 3000 })
  }, 4000)
}
</script>
```

## Advanced Customization

### Configuration by Environment

```javascript
// config/toast.js
const toastConfigs = {
  development: {
    position: 'bottom-right',
    duration: 10000, // Longer duration in development
    closable: true,
    simple: false,
  },
  production: {
    position: 'top-right',
    duration: 3000,
    closable: true,
    simple: false,
  },
}

export default toastConfigs

// main.js
import { useToastConfig } from 'vue-smart-ui'
import toastConfigs from './config/toast'

const { setToastDefaults } = useToastConfig()
const environment = import.meta.env.MODE || 'production'

setToastDefaults(toastConfigs[environment])
```

### Internationalization

```javascript
// composables/useNotification.js
import { useToast } from 'vue-smart-ui'
import { useI18n } from 'vue-i18n' // or your i18n solution

export const useNotification = () => {
  const toast = useToast()
  const { t } = useI18n()

  return {
    success: (key, options = {}) => {
      toast.success(t(key), options)
    },
    error: (key, options = {}) => {
      toast.error(t(key), options)
    },
    warning: (key, options = {}) => {
      toast.warning(t(key), options)
    },
    info: (key, options = {}) => {
      toast.info(t(key), options)
    },
  }
}

// Usage in component
const notify = useNotification()
notify.success('messages.save_success')
```

### Custom Toast Wrapper

```javascript
// composables/useAppToast.js
import { useToast } from 'vue-smart-ui'

export const useAppToast = () => {
  const toast = useToast()

  // Custom presets
  const quickNotification = (message) => {
    toast.info(message, {
      simple: true,
      duration: 2000,
      position: 'bottom-center',
    })
  }

  const criticalError = (message) => {
    toast.error(message, {
      title: 'Critical Error',
      duration: 0, // No auto-dismiss
      position: 'top-center',
    })
  }

  const actionSuccess = (message) => {
    toast.success(message, {
      title: 'Success',
      duration: 4000,
      position: 'top-right',
    })
  }

  return {
    ...toast,
    quickNotification,
    criticalError,
    actionSuccess,
  }
}
```

### Dynamic Configuration

```javascript
// In your app setup
import { useToastConfig } from 'vue-smart-ui'
import { watch } from 'vue'
import { useUserPreferences } from './composables/useUserPreferences'

const { setToastDefaults } = useToastConfig()
const { preferences } = useUserPreferences()

// Update toast position based on user preferences
watch(() => preferences.value.notificationPosition, (position) => {
  setToastDefaults({
    position: position || 'top-right',
  })
}, { immediate: true })
```

## 🎨 Theming

Toasts can be styled using CSS variables. See the main documentation for theming details.

```css
:root {
  --vsui-toast-success-bg: #f0fdf4;
  --vsui-toast-success-color: #22c55e;
  --vsui-toast-success-text: #15803d;
  
  --vsui-toast-error-bg: #fef2f2;
  --vsui-toast-error-color: #ef4444;
  --vsui-toast-error-text: #b91c1c;
  
  /* ... other variants */
}
```

## 🎯 Tips and Best Practices

1. **Configure defaults globally** in `main.js` to maintain consistency
2. **Use appropriate variants** - success for positive actions, error for failures, etc.
3. **Choose sensible durations** - 3-5 seconds for regular messages, longer for important ones
4. **Use simple mode** for non-critical, quick notifications
5. **Position strategically** - avoid blocking important UI elements
6. **Limit stacking** - too many toasts can overwhelm users
7. **Set duration to 0** for critical messages that require acknowledgment

## 🐛 Troubleshooting

### Toasts are not appearing

- Make sure `useToast` is imported from `vue-smart-ui`
- Check if toasts are being hidden by CSS z-index issues
- Verify that the toast container is mounted properly

### Global defaults are not applying

- Check if `setToastDefaults()` is being called **before** showing toasts
- Make sure to import `useToastConfig` correctly
- Verify that you're not overriding all options in individual toast calls

### Toasts appear in wrong position

- Verify the position value is one of the valid options
- Check if CSS is interfering with positioning
- Ensure global defaults are set correctly

### Multiple containers are being created

- This is normal behavior - the container is created once and reused
- If you see issues, check for multiple app instances

---

**Need help?** Open an issue in the repository! 🚀

