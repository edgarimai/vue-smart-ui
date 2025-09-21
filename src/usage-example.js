// Vue Smart UI - Usage Example for External Projects
// This file demonstrates how to use and customize Vue Smart UI in your project

// =============================================================================
// 1. BASIC SETUP
// =============================================================================

// In your main.js or app entry point:

import { createApp } from 'vue'
import App from './App.vue'

// Import your custom theme BEFORE Vue Smart UI
import './custom-theme.css'

// Import Vue Smart UI after your theme
import 'vue-smart-ui/style.css'

// Import Vue Smart UI components
import { BaseButton, BaseInput, BaseAvatar } from 'vue-smart-ui'

const app = createApp(App)

// Register components globally (optional)
app.component('BaseButton', BaseButton)
app.component('BaseInput', BaseInput)
app.component('BaseAvatar', BaseAvatar)

// Or use individually in components
app.mount('#app')

// =============================================================================
// 2. CUSTOM THEME EXAMPLE (custom-theme.css)
// =============================================================================

/*
  // custom-theme.css
  :root {
    // Override primary colors
    --vsui-color-primary: #6366f1;           // Indigo instead of blue
    --vsui-color-primary-dark: #4f46e5;      // Darker indigo
    --vsui-color-primary-light: #e0e7ff;     // Light indigo background
    --vsui-color-primary-text: #312e81;      // Dark indigo text

    // Override secondary colors
    --vsui-color-secondary: #ec4899;         // Pink instead of purple
    --vsui-color-secondary-dark: #db2777;    // Darker pink
    --vsui-color-secondary-light: #fce7f3;   // Light pink background
    --vsui-color-secondary-text: #831843;    // Dark pink text

    // Override status colors
    --vsui-color-success: #10b981;           // Emerald
    --vsui-color-warning: #f59e0b;           // Amber
    --vsui-color-error: #ef4444;             // Red
    --vsui-color-info: #06b6d4;              // Cyan

    // Override backgrounds
    --vsui-bg-default: #ffffff;              // Pure white
    --vsui-bg-subtle: #f8fafc;               // Very light gray
    --vsui-bg-muted: #f1f5f9;                // Light gray
    --vsui-bg-emphasized: #e2e8f0;           // Medium gray
    --vsui-bg-disabled: #f8fafc;             // Disabled background

    // Override text colors
    --vsui-text-default: #0f172a;            // Very dark slate
    --vsui-text-muted: #475569;              // Medium slate
    --vsui-text-subtle: #64748b;             // Light slate
    --vsui-text-disabled: #94a3b8;           // Disabled text
    --vsui-text-inverse: #ffffff;            // White text
  }

  // Dark mode overrides
  :root[data-theme='dark'] {
    --vsui-bg-default: #0f172a;              // Dark slate
    --vsui-text-default: #f8fafc;            // Light text
    // ... other dark mode variables
  }
*/

// =============================================================================
// 3. COMPONENT USAGE EXAMPLES
// =============================================================================

// In your Vue components:

export default {
  components: {
    BaseButton,
    BaseInput,
    BaseAvatar,
  },
  data() {
    return {
      name: '',
      email: '',
      selectedAvatar: null,
    }
  },
  template: `
    <div class="my-form">
      <!-- Avatar with custom image -->
      <BaseAvatar
        src="https://example.com/avatar.jpg"
        alt="User Avatar"
        name="John Doe"
        size="large"
        status="online"
      />

      <!-- Avatar with initials (fallback) -->
      <BaseAvatar
        name="Jane Smith"
        variant="filled"
        size="medium"
      />

      <!-- Form inputs -->
      <BaseInput
        v-model="name"
        label="Full Name"
        placeholder="Enter your name"
        :rules="['required']"
      />

      <BaseInput
        v-model="email"
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        :rules="['required', 'email']"
      />

      <!-- Buttons with custom styling -->
      <BaseButton variant="primary" size="large">
        Submit Form
      </BaseButton>

      <BaseButton variant="secondary">
        Cancel
      </BaseButton>
    </div>
  `,
}

// =============================================================================
// 4. ADVANCED CUSTOMIZATION
// =============================================================================

// You can also customize component-specific variables:

// custom-advanced-theme.css
/*
  :root {
    // Component-specific overrides
    --vsui-button-primary-bg: #059669;       // Custom green primary
    --vsui-button-primary-hover: #047857;    // Darker green

    --vsui-input-bg: #f0f9ff;                // Very light blue background
    --vsui-input-border-color: #0ea5e9;      // Blue border

    --vsui-avatar-default-bg: #f3f4f6;       // Light gray
    --vsui-avatar-filled-bg: #7c3aed;        // Purple filled
  }
*/

// =============================================================================
// 5. DYNAMIC THEME SWITCHING
// =============================================================================

// You can dynamically change themes by updating CSS variables:

export const useTheme = () => {
  const setThemeVariable = (variable, value) => {
    document.documentElement.style.setProperty(variable, value)
  }

  const applyTheme = (theme) => {
    // Example: Switch to a "dark" theme
    if (theme === 'dark') {
      setThemeVariable('--vsui-bg-default', '#0f172a')
      setThemeVariable('--vsui-text-default', '#f8fafc')
      // ... set other dark theme variables
    } else {
      // Reset to light theme
      setThemeVariable('--vsui-bg-default', '#ffffff')
      setThemeVariable('--vsui-text-default', '#111827')
      // ... reset other variables
    }
  }

  return { applyTheme, setThemeVariable }
}

// In a component:
/*
  import { useTheme } from './theme-utils'

  export default {
    setup() {
      const { applyTheme } = useTheme()

      const switchToDark = () => applyTheme('dark')
      const switchToLight = () => applyTheme('light')

      return { switchToDark, switchToLight }
    }
  }
*/

// =============================================================================
// 6. IMPORTANT NOTES
// =============================================================================

/*
  KEY POINTS FOR EXTERNAL USAGE:

  1. ALWAYS import your custom theme CSS BEFORE Vue Smart UI styles
  2. Use the --vsui- prefix for all custom variables
  3. Variables defined in :root will be inherited by all components
  4. Dark mode variables should be defined with :root[data-theme='dark']
  5. Component-specific variables allow fine-grained customization
  6. All components will automatically use your custom colors

  TROUBLESHOOTING:

  - If colors aren't changing, check import order
  - Make sure you're using --vsui- prefixed variables
  - Verify that your CSS is loaded before Vue Smart UI
  - Check for CSS specificity conflicts
*/
