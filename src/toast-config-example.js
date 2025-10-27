// Example: How to configure global toast defaults
// Import the toast config composable
import { useToastConfig } from './composables/toastConfig'

// In your main.js or app setup
const { setToastDefaults } = useToastConfig()

// Set custom default values globally
setToastDefaults({
  position: 'bottom-right', // Default position for all toasts
  duration: 5000, // Default duration in milliseconds (5 seconds)
  closable: true, // Show close button by default
  simple: false, // Use full toast style by default
})

// Available position options:
// - 'top-right' (default)
// - 'top-left'
// - 'top-center'
// - 'bottom-right'
// - 'bottom-left'
// - 'bottom-center'

// Example usage in a Vue component:
/*
import { useToast } from 'vue-smart-ui'

const toast = useToast()

// Use global defaults
toast.success('Operation completed successfully!')

// Override specific defaults
toast.error('An error occurred', {
  duration: 10000, // This toast will last 10 seconds
  position: 'top-center', // This toast will appear at top-center
})

// Use all default values
toast.info('New notification')

// Override multiple settings
toast.warning('Please review your changes', {
  title: 'Warning',
  position: 'bottom-left',
  duration: 8000,
  simple: true,
})
*/

// You can also reset to default values at any time:
/*
import { useToastConfig } from './composables/toastConfig'

const { resetToastDefaults } = useToastConfig()
resetToastDefaults()
*/

