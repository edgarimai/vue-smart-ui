# Vue Components Library

A library of reusable and highly customizable Vue components.

## 🚀 How to Use

1. Install the package

```bash
npm install vue-smart-ui
# or
yarn add vue-smart-ui
# or
pnpm add vue-smart-ui
```

2. Import the styles on main.js

```javascript
import 'vue-smart-ui/style.css'
```

3. Import the required components

```javascript
import { BaseButton, BaseInput /* ... */ } from 'vue-smart-ui'
```

4. Use the components in your templates

```vue
<template>
  <BaseButton variant="primary"> My Button </BaseButton>
</template>
```

## ⚙️ General Features

- 🎨 Consistent and modern design
- 📱 Fully responsive
- ♿ Accessible
- 🎯 Slot support for maximum flexibility
- 🌈 Theming system via CSS variables
- 🔧 Highly customizable
- ⚡ Optimized performance

## 📦 Available Components

### BaseButton

A versatile and customizable button that supports different variants, sizes, and states.

#### Props

| Prop     | Type    | Default   | Description                                                               |
| -------- | ------- | --------- | ------------------------------------------------------------------------- |
| id       | String  | -         | Optional button ID                                                        |
| variant  | String  | 'primary' | Button style. Options: 'primary', 'secondary', 'gray', 'outline', 'ghost' |
| size     | String  | 'medium'  | Button size. Options: 'small', 'medium', 'large'                          |
| block    | Boolean | false     | If true, button will take 100% of available width                         |
| disabled | Boolean | false     | Disables the button                                                       |
| loading  | Boolean | false     | Shows a loading indicator                                                 |

#### Slots

- `default`: Main button content
- `prefix`: Content before main text (e.g., icon)
- `suffix`: Content after main text (e.g., icon)

#### Events

- `click`: Emitted when button is clicked

#### Usage Example

```vue
<BaseButton variant="primary" size="medium" :loading="false" @click="handleClick">
  Click Here
</BaseButton>
```

### BaseAccordion and BaseAccordionItem

Accordion system for displaying expandable content.

#### BaseAccordion props

| Prop     | Type    | Default   | Description                                                     |
| -------- | ------- | --------- | --------------------------------------------------------------- |
| id       | String  | -         | Optional accordion ID                                           |
| variant  | String  | 'default' | Accordion style. Options: 'default', 'bordered', 'minimal'      |
| multiple | Boolean | false     | If true, allows multiple sections to be expanded simultaneously |

#### BaseAccordionItem props

- `title` (String): Required. The title text for the accordion item
- `disabled` (Boolean): If true, disables the accordion item
  - Default: false

#### Slots

- `default`: Main content of the accordion item
- `title`: Custom title content (overrides title prop)
- `icon`: Icon content before the title
- `chevron`: Custom chevron/arrow icon

#### Usage Example

```vue
<div class="accordion-container">
  <h2>Accordion</h2>
  <BaseAccordion multiple variant="bordered">
    <BaseAccordionItem title="Section 1">
      <p>Section 1 content</p>
    </BaseAccordionItem>

    <BaseAccordionItem title="Section 2" disabled> Section 2 content </BaseAccordionItem>

    <BaseAccordionItem title="Section 3">
      <template #title>
        <span class="custom-title">Custom title</span>
      </template>
      Section 3 content
    </BaseAccordionItem>
  </BaseAccordion>
</div>
```

### BaseInput

Highly customizable input field supporting different input types, input masks (phone, currency, etc), and built-in validation rules.

The BaseInput component provides a rich set of features for form inputs:

- Works with all HTML input types (text, password, email, number, etc)

- **Built-in Validation**:

  - Required fields
  - Email format
  - Min/max length
  - Pattern matching
  - Custom validation functions
  - Customizable error messages
  - Form-level validation support

- **Input Masks**:

  - Phone numbers: Automatically formats as (00) 00000-0000
  - Currency: Formats as currency with proper decimals (e.g. R$ 1.234,56)
  - Custom masks support

- **Styling**:
  - Label customization
  - Error state styling
  - Disabled state
  - Read-only state
  - Focus state
  - Placeholder support

#### BaseInput props

| Prop        | Type    | Default | Description                                                                                                                                                                                                                                                                                                                                |
| ----------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| modelValue  | any     | -       | The v-model value                                                                                                                                                                                                                                                                                                                          |
| label       | String  | -       | Input label text                                                                                                                                                                                                                                                                                                                           |
| type        | String  | 'text'  | HTML input type                                                                                                                                                                                                                                                                                                                            |
| placeholder | String  | -       | Input placeholder text                                                                                                                                                                                                                                                                                                                     |
| disabled    | Boolean | false   | Disables the input                                                                                                                                                                                                                                                                                                                         |
| readonly    | Boolean | false   | Makes input readonly                                                                                                                                                                                                                                                                                                                       |
| rules       | Array   | -       | Validation rules array. Each rule can be:<br>• String: 'required', 'email', 'min', 'max', 'pattern'<br>• Object: { required: true, message: 'Custom message' }<br>• Object: { min: number, message: 'Custom message' }<br>• Object: { max: number, message: 'Custom message' }<br>• Object: { pattern: RegExp, message: 'Custom message' } |

#### Events

- `@update:modelValue`: Emitted when input value changes
- `@mounted`: Emitted when component is mounted, passes input ref
- `@focus`: Emitted on input focus
- `@blur`: Emitted on input blur

#### Basic example

```vue
<BaseInput v-model="name" label="Name" :rules="['required']" />
```

#### Usage Example with multiple inputs and validation

```js
const formRefs = ref({})

// Function to validate all inputs and show erros if has any
const validateForm = () => {
  let isValid = true
  // Validate all registered inputs
  Object.values(formRefs.value).forEach((input) => {
    if (input?.validate && !input.validate()) {
      isValid = false
    }
  })

  return isValid
}

const handleSubmit = () => {
  if (validateForm()) {
    console.log('Form submitted:', pageState.input)
  } else {
    console.log('Form has errors')
  }
}

const registerInput = (name, ref) => {
  console.log(name, ref)
  if (ref) {
    formRefs.value[name] = ref
  }
}
```

```vue
<!-- Email validation -->
<BaseInput
  v-model="input.email"
  label="Email"
  :rules="['required', 'email']"
  @mounted="(ref) => registerInput('email', ref)"
/>

<!-- Multiple rules with custom messages -->
<BaseInput
  v-model="password"
  type="password"
  label="Password"
  :rules="[
    { required: true, message: 'Password is required' },
    { min: 8, message: 'Password must be at least 8 characters' },
  ]"
  @mounted="(ref) => registerInput('password', ref)"
/>

<!-- Custom validator -->
<BaseInput
  v-model="username"
  label="Username"
  :rules="[
    {
      validator: (value) => /^[a-z0-9]+$/.test(value),
      message: 'Username can only contain lowercase letters and numbers',
    },
  ]"
/>

<!-- Phone mask -->
<BaseInput
  v-model="phone"
  label="Phone"
  :rules="['required', 'pattern: ^\\d{10}$']"
  @mounted="(ref) => registerInput('phone', ref)"
  mask="phone"
  placeholder="(00) 00000-0000"
/>

<!-- Currency mask -->
<BaseInput v-model="price" label="Price" mask="currency" placeholder="R$ 0,00" />
```

### BaseToast and ToastsContainer

Toast notification system for user feedback. Provides a flexible way to show notifications with different variants (success, error, warning, info), positions, and durations.

Features:

- Multiple toast positions (top-right, top-center, top-left, bottom-right, bottom-center, bottom-left)
- Customizable duration
- Different variants with appropriate styling
- Pause timer on hover
- Auto-dismiss with configurable timeout
- Stacking multiple toasts
- Smooth enter/exit animations

#### Base Toast props

| Prop         | Type                                                                                              | Default       | Description                                               |
| ------------ | ------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------- |
| variant      | `'default' \| 'success' \| 'error' \| 'warning' \| 'info'`                                        | `'default'`   | Style variant of the toast                                |
| title        | `string`                                                                                          | `undefined`   | Optional title text shown at top of toast                 |
| message      | `string`                                                                                          | `''`          | Main toast message content                                |
| duration     | `number`                                                                                          | `5000`        | Time in ms before auto-dismissing (0 for no auto-dismiss) |
| position     | `'top-right' \| 'top-center' \| 'top-left' \| 'bottom-right' \| 'bottom-center' \| 'bottom-left'` | `'top-right'` | Position where toast appears                              |
| closable     | `boolean`                                                                                         | `true`        | Whether to show close button                              |
| pauseOnHover | `boolean`                                                                                         | `true`        | Pause dismiss timer when hovering                         |

#### Basic example

### BaseInfiniteScroll

Component for implementing infinite scroll functionality.

#### Props

| Prop      | Type      | Default | Description                                                |
| --------- | --------- | ------- | ---------------------------------------------------------- |
| loading   | `boolean` | `false` | Whether more content is currently being loaded             |
| hasMore   | `boolean` | `true`  | Whether there is more content available to load            |
| threshold | `number`  | `100`   | Distance in pixels from bottom before triggering load more |
| disabled  | `boolean` | `false` | Disable infinite scroll functionality                      |

#### Slots

- `default`: Main content area for the list of items
- `loading`: Custom loading indicator when fetching more items
- `disabled`: Custom message or content when there are no more items to load

#### Basic example

```vue
<BaseInfiniteScroll :loading="loading" :disabled="!hasMore" @load-more="loadMore">
  <!-- Items list -->
  <div class="items-grid">
    <div v-for="item in pageState.infiniteScroll.items" :key="item.id" class="item">
      {{ item.title }}
    </div>
  </div>

  <!-- Loading custom -->
  <template #loading>
    <div class="custom-loader">Loading more items...</div>
  </template>

  <!-- End message -->
  <template #disabled>
    <div class="end-message">There are no more items to load</div>
  </template>
</BaseInfiniteScroll>
```

### BaseDropdown

Customizable dropdown menu component that provides a toggleable menu with positioning and click handling.

#### Props

| Prop                | Type      | Default   | Description                                     |
| ------------------- | --------- | --------- | ----------------------------------------------- |
| modelValue          | `boolean` | `false`   | Controls visibility of dropdown (v-model)       |
| variant             | `string`  | `default` | Visual style - 'default', 'white', or 'dark'    |
| width               | `string`  | `auto`    | Width of dropdown menu                          |
| closeOnClick        | `boolean` | `true`    | Whether to close dropdown when item clicked     |
| closeOnClickOutside | `boolean` | `true`    | Whether to close dropdown when clicking outside |

#### Slots

- `trigger`: Content that triggers the dropdown (usually a button)
- `default`: Content of the dropdown menu

#### Basic example

```vue
<BaseDropdown v-model="show" variant="default">
  <!-- Trigger -->
  <template #trigger>
    <BaseButton>Open Dropdown</BaseButton>
  </template>
  <!-- Dropdown items -->
  <div class="base-dropdown-item">Profile</div>
  <div class="base-dropdown-item">Settings</div>
  <div class="base-dropdown-item" data-prevent-close>Notifications</div>
  <div class="base-dropdown-item" style="color: red">Logout</div>
</BaseDropdown>
```

### BaseSkeleton

Component for displaying loading states and placeholders while content is being loaded. Supports different variants like text, headings, circles, and rectangles with optional animations.

#### Props

| Prop     | Type      | Default     | Description                                                           |
| -------- | --------- | ----------- | --------------------------------------------------------------------- |
| variant  | `string`  | `rectangle` | Type of skeleton - 'rectangle', 'circle', 'text', 'heading', 'button' |
| width    | `string`  | `100%`      | Width of the skeleton element                                         |
| height   | `string`  | -           | Height of the skeleton element (overrides variant default)            |
| rounded  | `boolean` | `false`     | Whether to apply rounded corners                                      |
| animated | `boolean` | `true`      | Whether to show loading animation                                     |

#### Basic examples

```vue
<!-- Avatar -->
<BaseSkeleton variant="circle" width="5rem" height="5rem" />

<!-- Title -->
<BaseSkeleton variant="heading" width="60%" />

<!-- Text -->
<BaseSkeleton variant="text" />
<BaseSkeleton variant="text" />
<BaseSkeleton variant="text" />

<!-- Button -->
<BaseSkeleton variant="button" rounded />
```

### BasePopup

Customizable modal/popup component with support for different variants, animations and positioning. Provides a flexible way to display modal dialogs, alerts and confirmation boxes.

#### Props

| Prop                | Type      | Default   | Description                                                            |
| ------------------- | --------- | --------- | ---------------------------------------------------------------------- |
| modelValue          | `boolean` | `false`   | Controls visibility of the popup (v-model)                             |
| variant             | `string`  | `default` | Popup style variant - 'default', 'info', 'success', 'warning', 'error' |
| size                | `string`  | `medium`  | Size of the popup - 'small', 'medium', 'large'                         |
| position            | `string`  | `center`  | Position of the popup - 'center', 'top', 'bottom', 'left', 'right'     |
| closeOnClickOutside | `boolean` | `true`    | Whether clicking outside closes the popup                              |
| closeOnEsc          | `boolean` | `true`    | Whether pressing Escape key closes the popup                           |

#### Slots

- `default`: Main content of the popup
- `trigger`: Element that triggers the popup when clicked

#### Usage example

```vue
<BasePopup v-model="show" :variant="variant" :size="size" :position="position">
  <template #header>
    <p style="font-size: 1.2rem; font-weight: bold; text-align: center; margin-block: 0.5rem">
      Configured Popup
    </p>
  </template>
  <div class="popup-content">
    <p>Current configuration:</p>
    <ul>
      <li>Variant: {{ variant }}</li>
      <li>Size: {{ size }}</li>
      <li>Position: {{ position }}</li>
    </ul>
  </div>
  <template #footer>
    <div style="text-align: center">
      <BaseButton @click="show = false">Close</BaseButton>
    </div>
  </template>
  <template #close>
    <span>&times;</span>
  </template>
</BasePopup>
```

## 🎨 Customization

### CSS Variables

The cpomponents can be customized in multiple ways:

- Using CSS variables for theming
- Overriding component classes directly
- Using Tailwind CSS classes

#### Available CSS variables for each component

```css
:root {
  --font-family-base: 'Roboto', sans-serif;

  // Buttons variables
  --button-primary-bg: #3b82f6 !important;
  --button-primary-hover: #2563eb !important;
  --button-primary-text: #ffffff !important;

  --button-secondary-bg: #9333ea !important;
  --button-secondary-hover: #7e22ce !important;
  --button-secondary-text: #ffffff !important;

  --button-gray-bg: #f3f4f6 !important;
  --button-gray-hover: #e5e7eb !important;
  --button-gray-text: #374151 !important;

  --button-outline-border: #d1d5db !important;
  --button-outline-hover: #f3f4f6 !important;
  --button-outline-text: #374151 !important;

  --button-ghost-text: #374151 !important;

  --button-focus-outline: #3b82f6 !important;

  --button-small-font-size: 0.875rem !important;
  --button-medium-font-size: 1rem !important;
  --button-large-font-size: 1.125rem !important;

  // Popups variables
  --popup-default-color: #64748b !important;
  --popup-info-color: #3b82f6 !important;
  --popup-success-color: #22c55e !important;
  --popup-warning-color: #f59e0b !important;
  --popup-error-color: #ef4444 !important;
  --popup-border-color: #d1d5db !important;

  // Toasts variables
  --toast-default-bg: #9ca3af !important;
  --toast-border-color: #e5e7eb !important;
  --toast-text-color: #1f2937 !important;

  --toast-info-bg: #eff6ff !important;
  --toast-info-color: #3b82f6 !important;
  --toast-info-text: #1e40af !important;

  --toast-success-bg: #f0fdf4 !important;
  --toast-success-color: #22c55e !important;
  --toast-success-text: #15803d !important;

  --toast-warning-bg: #fefce8 !important;
  --toast-warning-color: #f59e0b !important;
  --toast-warning-text: #92400e !important;

  --toast-error-bg: #fee2e2 !important;
  --toast-error-color: #ef4444 !important;
  --toast-error-text: #991b1b !important;

  --toast-title-font-size: 1rem !important;
  --toast-message-font-size: 0.75rem !important;

  // Dropdowns variables
  --dropdown-bg: #ffffff !important;
  --dropdown-border-color: #e5e7eb !important;
  --dropdown-item-hover-bg: #f3f4f6 !important;

  --dropdown-dark-bg: #374151 !important;
  --dropdown-dark-border-color: #4b5563 !important;
  --dropdown-dark-item-hover-bg: #4b5563 !important;

  // Skeletons variables
  --skeleton-bg: #e5e7eb !important;
  --skeleton-rectangle-height: 1.5rem !important;
  --skeleton-circle-size: 3rem !important;
  --skeleton-heading-height: 2rem !important;
  --skeleton-button-height: 2.5rem !important;
  --skeleton-button-width: 8rem !important;
  --skeleton-text-height: 1rem !important;
  --skeleton-rounded-radius: 0.375rem !important;
  --skeleton-shine: rgba(255, 255, 255, 0.3) !important;

  // Accordions variables
  --accordion-border-color: #e5e7eb !important;
  --accordion-header-color: #111827 !important;
  --accordion-hover-bg: #f9fafb !important;
  --accordion-focus-ring: #3b82f6 !important;

  // Input variables
  --input-label-color: #374151 !important;
  --input-required-color: #ef4444 !important;
  --input-helper-color: #6b7280 !important;
  --input-border-color: #d1d5db !important;
  --input-bg: #ffffff !important;
  --input-focus-border-color: #3b82f6 !important;
  --input-focus-ring-color: rgba(59, 130, 246, 0.1) !important;
  --input-placeholder-color: #9ca3af !important;
  --input-disabled-bg: #f3f4f6 !important;
  --input-disabled-text: #6b7280 !important;
  --input-icon-color: #6b7280 !important;
  --input-filled-bg: #f3f4f6 !important;
  --input-filled-focus-bg: #f9fafb !important;
  --input-success-color: #22c55e !important;
  --input-error-color: #ef4444 !important;
  --input-warning-color: #f59e0b !important;

  --input-label-font-size: 0.875rem !important;
  --input-field-font-size: 0.875rem !important;
  --input-helper-font-size: 0.75rem !important;
}
```
