# Vue Components Library

A library of reusable and highly customizable Vue components.

## 📱 Examples

Visit our website to see examples for all components:

[https://vuesmartui.edgarimai.com/](https://vuesmartui.edgarimai.com/)

Here you will find:

- Interactive demonstrations of each component
- Available customization options

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
| type     | String  | 'button'  | Button style. Options: 'button', 'submit', 'reset'                        |
| variant  | String  | 'primary' | Button style. Options: 'primary', 'secondary', 'gray', 'outline', 'ghost' |
| size     | String  | 'medium'  | Button size. Options: 'small', 'medium', 'large', 'auto'                  |
| block    | Boolean | false     | If true, button will take 100% of available width                         |
| disabled | Boolean | false     | Disables the button                                                       |
| loading  | Boolean | false     | Shows a loading indicator                                                 |
| iconOnly | Boolean | false     | If true, button will be square with no padding                            |

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

### BaseTextarea

Highly customizable textarea component that matches the BaseInput styling and functionality. Perfect for multi-line text input with support for validation, different variants, and auto-resize capability.

Features:

- Consistent styling with BaseInput
- Auto-resize capability
- Built-in validation
- Different variants (default, filled, outlined)
- Support for helper text and error states
- Customizable through CSS variables
- Flexible width control (block/inline)

#### Props

| Prop            | Type      | Default      | Description                                                        |
| --------------- | --------- | ------------ | ------------------------------------------------------------------ |
| modelValue      | `String`  | `''`         | The v-model value                                                  |
| variant         | `String`  | `'default'`  | Textarea style. Options: 'default', 'filled', 'outlined'           |
| label           | `String`  | `null`       | Label text                                                         |
| placeholder     | `String`  | `''`         | Placeholder text                                                   |
| rows            | `Number`  | `3`          | Initial number of rows                                             |
| maxRows         | `Number`  | `null`       | Maximum number of rows when using autoResize                       |
| disabled        | `Boolean` | `false`      | Disables the textarea                                              |
| readonly        | `Boolean` | `false`      | Makes textarea readonly                                            |
| required        | `Boolean` | `false`      | Makes the field required                                           |
| helperText      | `String`  | `null`       | Helper text displayed below the textarea                           |
| errorMessage    | `String`  | `null`       | Error message to display                                           |
| rules           | `Array`   | `[]`         | Validation rules array                                             |
| validateOnBlur  | `Boolean` | `true`       | Trigger validation on blur                                         |
| validateOnInput | `Boolean` | `false`      | Trigger validation on input                                        |
| block           | `Boolean` | `false`      | Makes the textarea full width                                      |
| resize          | `String`  | `'vertical'` | Resize behavior. Options: 'none', 'both', 'horizontal', 'vertical' |
| autoResize      | `Boolean` | `false`      | Automatically adjust height based on content                       |

#### Events

- `@update:modelValue`: Emitted when textarea value changes
- `@focus`: Emitted on textarea focus
- `@blur`: Emitted on textarea blur
- `@input`: Emitted on input
- `@validation`: Emitted when validation occurs, includes validation status
- `@mounted`: Emitted when component is mounted, passes textarea ref

#### Basic Examples

```vue
<!-- Simple textarea -->
<BaseTextarea v-model="description" label="Description" placeholder="Enter your description" />

<!-- With validation -->
<BaseTextarea
  v-model="comment"
  label="Comment"
  :rules="['required', { min: 10, message: 'Comment must be at least 10 characters' }]"
  helper-text="Please provide detailed feedback"
/>

<!-- Auto-resizing textarea -->
<BaseTextarea v-model="content" label="Content" :rows="3" :max-rows="10" auto-resize block />

<!-- Filled variant -->
<BaseTextarea v-model="notes" label="Notes" variant="filled" placeholder="Add your notes here" />

<!-- With custom resize behavior -->
<BaseTextarea v-model="text" label="Resizable" resize="both" :rows="4" />
```

#### Form Validation Example

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <BaseTextarea
      v-model="feedback"
      label="Feedback"
      :rules="[
        'required',
        { min: 20, message: 'Feedback must be at least 20 characters long' },
        { max: 500, message: 'Feedback cannot exceed 500 characters' },
      ]"
      block
      @mounted="(ref) => registerTextarea('feedback', ref)"
    />

    <BaseButton type="submit">Submit Feedback</BaseButton>
  </form>
</template>

<script setup>
const formRefs = ref({})

const registerTextarea = (name, ref) => {
  if (ref) {
    formRefs.value[name] = ref
  }
}

const validateForm = () => {
  let isValid = true
  Object.values(formRefs.value).forEach((textarea) => {
    if (textarea?.validate && !textarea.validate()) {
      isValid = false
    }
  })
  return isValid
}

const handleSubmit = () => {
  if (validateForm()) {
    console.log('Form is valid, submitting...')
  }
}
</script>
```

### BaseCheckbox

Checkbox component with customizable size, state and styling. Supports single checkbox or group functionality.

Features:

- Three sizes (small, medium, large)
- Disabled state
- Indeterminate state
- Custom colors and styling
- Group functionality for multiple checkboxes

#### Props

| Prop          | Type                             | Default     | Description                       |
| ------------- | -------------------------------- | ----------- | --------------------------------- |
| modelValue    | `boolean \| Array`               | `false`     | v-model binding value             |
| label         | `string`                         | `''`        | Label text for the checkbox       |
| size          | `'small' \| 'medium' \| 'large'` | `'medium'`  | Size of the checkbox              |
| disabled      | `boolean`                        | `false`     | Whether checkbox is disabled      |
| indeterminate | `boolean`                        | `false`     | Show indeterminate state          |
| value         | `any`                            | `undefined` | Value when used in checkbox group |
| name          | `string`                         | `''`        | Input name attribute              |

#### Basic examples

```vue
<BaseCheckbox v-model="checked" label="Basic checkbox" />
<BaseCheckbox v-model="checked">
  Checkbox with <span style="color: purple">slots</span>
</BaseCheckbox>
<BaseCheckbox v-model="checked" error label="Required field with error" />
<BaseCheckbox v-model="checked" disabled label="Disabled checkbox" />
<BaseCheckbox v-model="checked" size="small" label="Small option" />
<BaseCheckbox v-model="checked" size="medium" label="Medium option" />
<BaseCheckbox v-model="checked" size="large" label="Large option" />
```

#### Example with multiple options

```js
const pageState = reactive({
  checkbox: {
    checked: false,
    selectedFruits: [],
    selectAll: false,
    someSelected: false,
  },
  fruits: [
    {
      name: 'Apple',
      value: 'apple',
    },
    {
      name: 'Banana',
      value: 'banana',
    },
    {
      name: 'Orange',
      value: 'orange',
    },
    {
      name: 'Pineapple',
      value: 'pineapple',
    },
  ],
})

const allSelected = computed(() => {
  return pageState.checkbox.selectedFruits.length === pageState.fruits.length
})

const someSelected = computed(() => {
  return pageState.checkbox.selectedFruits.length > 0 && !allSelected.value
})

const handleSelectAll = (checked) => {
  if (!checked) return (pageState.checkbox.selectedFruits = [])

  pageState.fruits.forEach((fruit) => {
    if (!pageState.checkbox.selectedFruits.includes(fruit.value)) {
      pageState.checkbox.selectedFruits.push(fruit.value)
    }
  })
}
```

```vue
<BaseCheckbox
  v-for="fruit in pageState.fruits"
  :key="fruit.value"
  v-model="pageState.checkbox.selectedFruits"
  :value="fruit.value"
  :label="fruit.name"
/>
<BaseCheckbox
  v-model="allSelected"
  :indeterminate="someSelected"
  label="Select all"
  @update:model-value="handleSelectAll"
/>
```

### BaseToast

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
| simple       | `boolean`                                                                                         | `false`       | Simple toast option                                       |

#### Basic example

```vue
<script setup>
import { useToast } from 'vue-smart-ui'

const toast = useToast()
const showToast = () => {
  toast.success('Basic toast')
}

const showCustom = () => {
  toast.warning('Custom toast', {
    title: 'Title',
    position: 'bottom-center',
    duration: 5000,
  })
}

const showSimple = () => {
  toast.error('Simple toast', {
    position: 'bottom-center',
    duration: 5000,
    simple: true,
  })
}
</script>
```

### BaseInfiniteScroll

Component for implementing infinite scroll functionality.

#### Props

| Prop        | Type      | Default                   | Description                                                |
| ----------- | --------- | ------------------------- | ---------------------------------------------------------- |
| loading     | `boolean` | `false`                   | Whether more content is currently being loaded             |
| disabled    | `boolean` | `false`                   | Disable infinite scroll functionality                      |
| threshold   | `number`  | `20`                      | Distance in pixels from bottom before triggering load more |
| container   | `string`  | `null`                    | CSS selector for scroll container. If null, uses window    |
| loadingText | `string`  | `'Loading more items...'` | Text shown during loading. If empty, no text is shown      |
| endText     | `string`  | `'No more items to load'` | Text shown when disabled. If empty, no text is shown       |

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

### BaseSlider

A highly customizable slider component that supports single values or ranges, with custom marks, value formatting, and different visual states.

Features:

- Support for single values or ranges
- Customizable marks for specific points
- Custom value formatting
- Different visual states (success, error, warning)
- Configurable minimum and maximum values
- Adjustable steps
- Fully accessible with keyboard support
- Display of values at extremities and above controls

#### Props

| Prop         | Type              | Default     | Description                                      |
| ------------ | ----------------- | ----------- | ------------------------------------------------ |
| modelValue   | `Number \| Array` | `0`         | Current slider value (single or array for range) |
| min          | `Number`          | `0`         | Minimum value of the slider                      |
| max          | `Number`          | `100`       | Maximum value of the slider                      |
| step         | `Number`          | `1`         | Increment between values                         |
| label        | `String`          | `null`      | Label text for the slider                        |
| disabled     | `Boolean`         | `false`     | Disables the slider                              |
| required     | `Boolean`         | `false`     | Marks the field as required                      |
| helperText   | `String`          | `null`      | Helper text displayed below the slider           |
| errorMessage | `String`          | `null`      | Error message to display                         |
| state        | `String`          | `null`      | Visual state: 'success', 'error', 'warning'      |
| showValue    | `Boolean`         | `true`      | Displays the current value above the control     |
| range        | `Boolean`         | `false`     | Enables range mode with two controls             |
| variant      | `String`          | `'default'` | Visual variant: 'default', 'filled'              |
| marks        | `Array`           | `[]`        | Marks for specific values                        |
| formatValue  | `Function`        | `null`      | Function to format the display of values         |

#### Events

- `@update:modelValue`: Emitted when the slider value changes
- `@change`: Emitted when the user changes the value
- `@mounted`: Emitted when the component is mounted, passes the slider reference

#### Basic Examples

```vue
<!-- Simple slider -->
<BaseSlider v-model="volume" label="Volume" />

<!-- Slider with value formatting -->
<BaseSlider
  v-model="price"
  :min="0"
  :max="1000"
  :format-value="(val) => `$${val.toFixed(2)}`"
  label="Price"
/>

<!-- Slider with marks -->
<BaseSlider
  v-model="rating"
  :min="0"
  :max="5"
  :step="0.5"
  :marks="[
    { value: 0, label: 'Poor' },
    { value: 2.5, label: 'Average' },
    { value: 5, label: 'Excellent' },
  ]"
  label="Rating"
/>

<!-- Range slider -->
<BaseSlider
  v-model="priceRange"
  :min="0"
  :max="1000"
  range
  :format-value="(val) => `$${val}`"
  label="Price Range"
/>

<!-- Slider with error state -->
<BaseSlider
  v-model="value"
  state="error"
  error-message="Please select a higher value"
  label="Value"
/>
```

#### Validation Example

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <BaseSlider
      v-model="formData.budget"
      label="Budget"
      :min="100"
      :max="10000"
      :step="100"
      :format-value="(val) => `$${val.toLocaleString()}`"
      :marks="[
        { value: 1000, label: 'Basic' },
        { value: 5000, label: 'Intermediate' },
        { value: 10000, label: 'Premium' },
      ]"
      @mounted="(ref) => registerSlider('budget', ref)"
    />

    <BaseButton type="submit">Submit</BaseButton>
  </form>
</template>

<script setup>
const formRefs = ref({})

const registerSlider = (name, ref) => {
  if (ref) {
    formRefs.value[name] = ref
  }
}

const validateForm = () => {
  let isValid = true

  // Validate if budget is at least 1000
  const budgetRef = formRefs.value.budget
  if (budgetRef && budgetRef.getValue() < 1000) {
    budgetRef.setError('Minimum budget is $1,000')
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  if (validateForm()) {
    console.log('Form is valid, submitting...')
  }
}
</script>
```

### BaseSegmentedButtons

A customizable segmented button control that displays a set of options in a connected button group. Perfect for toggling between different options or selecting multiple values from a set of related choices.

Features:

- Single or multiple selection modes
- Support for string, number, or object options
- Customizable appearance with different variants and sizes
- Proper styling for connected buttons with rounded corners at ends
- Consistent with other form components

#### Props

| Prop       | Type                        | Default     | Description                                                   |
| ---------- | --------------------------- | ----------- | ------------------------------------------------------------- |
| modelValue | `String \| Number \| Array` | `[]`        | Selected value(s) (v-model binding)                           |
| options    | `Array`                     | `[]`        | Array of options to display as buttons                        |
| valueKey   | `String`                    | `'value'`   | Property name to use as value when options are objects        |
| labelKey   | `String`                    | `'label'`   | Property name to use as display text when options are objects |
| variant    | `String`                    | `'primary'` | Visual style. Options: 'primary', 'secondary', 'gray'         |
| size       | `String`                    | `'medium'`  | Button size. Options: 'small', 'medium', 'large'              |
| disabled   | `Boolean`                   | `false`     | Disables the entire control                                   |
| block      | `Boolean`                   | `false`     | If true, buttons will expand to fill the container width      |
| multiple   | `Boolean`                   | `false`     | Enables selection of multiple options                         |

#### Events

- `@update:modelValue`: Emitted when selection changes
- `@change`: Emitted when selection changes, with the new value

#### Basic Examples

```vue
<!-- Simple string options -->
<BaseSegmentedButtons v-model="selectedFruit" :options="['apple', 'banana', 'orange']" />

<!-- Object options -->
<BaseSegmentedButtons
  v-model="selectedColor"
  :options="[
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ]"
/>

<!-- Multiple selection mode -->
<BaseSegmentedButtons
  v-model="selectedCategories"
  :options="['Work', 'Personal', 'Family']"
  multiple
/>

<!-- Custom variants and sizes -->
<BaseSegmentedButtons
  v-model="alignment"
  :options="['Left', 'Center', 'Right']"
  variant="secondary"
  size="small"
/>

<!-- Block display (full width) -->
<BaseSegmentedButtons v-model="viewMode" :options="['List', 'Grid', 'Table']" block />

<!-- Custom object keys -->
<BaseSegmentedButtons
  v-model="selectedItem"
  :options="[
    { id: 1, name: 'Option A' },
    { id: 2, name: 'Option B' },
    { id: 3, name: 'Option C' },
  ]"
  valueKey="id"
  labelKey="name"
/>
```

### BaseColorPicker

A customizable color picker component that allows users to select colors through an input field, color picker interface, and preset colors.

Features:

- Color preview swatch
- Text input for direct color code entry
- Native color picker interface
- Preset color palette
- Different variants to match other form components
- Validation support
- Dark mode compatible

#### Props

| Prop         | Type      | Default     | Description                                            |
| ------------ | --------- | ----------- | ------------------------------------------------------ |
| id           | `String`  | `''`        | Optional color picker ID                               |
| modelValue   | `String`  | `'#000000'` | The selected color value (hex, rgb, etc.)              |
| variant      | `String`  | `'default'` | Visual style. Options: 'default', 'filled', 'outlined' |
| state        | `String`  | `null`      | Visual state: 'success', 'error', 'warning'            |
| label        | `String`  | `null`      | Label text for the color picker                        |
| disabled     | `Boolean` | `false`     | Disables the color picker                              |
| readonly     | `Boolean` | `false`     | Makes the control read-only                            |
| required     | `Boolean` | `false`     | Marks the field as required                            |
| helperText   | `String`  | `null`      | Helper text displayed below the picker                 |
| errorMessage | `String`  | `null`      | Error message to display                               |
| rules        | `Array`   | `[]`        | Validation rules array                                 |
| name         | `String`  | `''`        | Input name attribute                                   |
| format       | `String`  | `'hex'`     | Color format. Options: 'hex', 'rgb', 'rgba', 'hsl'     |
| showPreview  | `Boolean` | `true`      | Shows color preview swatch                             |
| presets      | `Array`   | `[]`        | Array of preset colors to display                      |

#### Events

- `@update:modelValue`: Emitted when color value changes
- `@focus`: Emitted on field focus
- `@blur`: Emitted on field blur
- `@input`: Emitted on input
- `@validation`: Emitted when validation occurs, includes validation status
- `@mounted`: Emitted when component is mounted, passes component reference

#### Basic Examples

```vue
<!-- Simple color picker -->
<BaseColorPicker v-model="color" label="Choose a color" />

<!-- With custom presets -->
<BaseColorPicker
  v-model="themeColor"
  label="Theme Color"
  :presets="['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3']"
/>

<!-- With validation -->
<BaseColorPicker
  v-model="brandColor"
  label="Brand Color"
  :rules="['required']"
  helper-text="Please select a brand color"
/>

<!-- Without preview -->
<BaseColorPicker v-model="accentColor" :showPreview="false" label="Accent Color" />

<!-- Filled variant -->
<BaseColorPicker v-model="backgroundColor" variant="filled" label="Background" />
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
| disableClickOutside | `boolean` | `false`   | Whether clicking outside closes the popup                              |
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

### BaseOTP

A customizable One-Time Password (OTP) input component for secure authentication flows. Provides individual input fields for each digit with automatic focus management and validation.

Features:

- Configurable number of input fields (default 6)
- Automatic focus progression between fields
- Support for different input types (text, number, password)
- Paste support for complete codes
- Keyboard navigation (arrow keys, backspace, delete)
- Built-in validation for complete/incomplete codes
- Clear all functionality with Shift+Backspace or Shift+Delete
- Different visual variants and states
- Auto-focus capability

#### Props

| Prop         | Type      | Default                                       | Description                                       |
| ------------ | --------- | --------------------------------------------- | ------------------------------------------------- |
| id           | `String`  | `''`                                          | Optional OTP input ID                             |
| modelValue   | `String`  | `''`                                          | The OTP value (v-model binding)                   |
| length       | `Number`  | `6`                                           | Number of OTP input fields                        |
| variant      | `String`  | `'default'`                                   | Visual style. Options: 'default', 'filled'        |
| state        | `String`  | `null`                                        | Visual state: 'success', 'error', 'warning'       |
| label        | `String`  | `null`                                        | Label text for the OTP input                      |
| disabled     | `Boolean` | `false`                                       | Disables all input fields                         |
| readonly     | `Boolean` | `false`                                       | Makes all input fields read-only                  |
| required     | `Boolean` | `false`                                       | Marks the field as required                       |
| helperText   | `String`  | `null`                                        | Helper text displayed below the inputs            |
| errorMessage | `String`  | `null`                                        | Error message to display                          |
| autoFocus    | `Boolean` | `false`                                       | Automatically focus the first input on mount      |
| type         | `String`  | `'text'`                                      | Input type. Options: 'text', 'number', 'password' |
| instructions | `String`  | `'Press Shift+Backspace to clear all fields'` | Instructions text displayed below the inputs      |

#### Events

- `@update:modelValue`: Emitted when OTP value changes
- `@complete`: Emitted when all fields are filled, passes the complete OTP value
- `@validation`: Emitted when validation occurs, includes validation status
- `@mounted`: Emitted when component is mounted, passes component reference with methods

#### Basic Examples

```vue
<!-- Simple 6-digit OTP -->
<BaseOTP v-model="otpCode" label="Simple 6-digit OTP" required />

<!-- Required with helper text -->
<BaseOTP
  v-model="otpCode"
  label="Required with helper text"
  helperText="Enter the code sent to your phone"
  required
/>

<!-- Variant filled -->
<BaseOTP
  v-model="otpCode"
  label="Variant filled"
  helperText="Enter the code sent to your phone"
  required
  variant="filled"
/>

<!-- Auto focus with 4 digits -->
<BaseOTP
  v-model="otpCode"
  :length="4"
  label="Auto focus with 4 digits"
  helper-text="Enter the 4-digit code"
  required
  auto-focus
/>

<!-- No required -->
<BaseOTP v-model="otpCode" label="No required" helper-text="Enter the 6-digit code" />
```

#### Form Validation Example

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <BaseOTP
      v-model="formData.otpCode"
      label="Verification Code"
      required
      auto-focus
      helper-text="Enter the 6-digit code sent to your email"
      @complete="handleOTPComplete"
      @mounted="(ref) => registerOTP('otp', ref)"
    />

    <BaseButton type="submit" :disabled="!isFormValid"> Verify Code </BaseButton>
  </form>
</template>

<script setup>
const formRefs = ref({})
const formData = reactive({
  otpCode: '',
})

const registerOTP = (name, ref) => {
  if (ref) {
    formRefs.value[name] = ref
  }
}

const handleOTPComplete = (code) => {
  console.log('OTP completed:', code)
  // Auto-submit or validate when complete
}

const validateForm = () => {
  let isValid = true
  Object.values(formRefs.value).forEach((field) => {
    if (field?.validate && !field.validate()) {
      isValid = false
    }
  })
  return isValid
}

const handleSubmit = () => {
  if (validateForm()) {
    console.log('Form is valid, submitting OTP:', formData.otpCode)
  }
}

const isFormValid = computed(() => {
  return formData.otpCode.length === 6
})
</script>
```

## 🎨 Customization

### Theme Customization with CSS Variables

The Vue Smart UI library is highly customizable and allows you to override colors and styling by defining CSS variables **before** importing the library styles.

#### How to Customize Colors

1. **Define your custom variables** in your CSS file (before importing Vue Smart UI)
2. **Import Vue Smart UI styles** after your custom variables
3. **All components will automatically use your custom colors**

```css
/* Your custom theme - define BEFORE importing Vue Smart UI */
:root {
  /* Custom primary colors */
  --vsui-color-primary: #6366f1; /* Indigo instead of blue */
  --vsui-color-primary-dark: #4f46e5; /* Darker indigo */
  --vsui-color-primary-light: #e0e7ff; /* Light indigo background */
  --vsui-color-primary-text: #312e81; /* Dark indigo text */

  /* Custom secondary colors */
  --vsui-color-secondary: #ec4899; /* Pink instead of purple */
  --vsui-color-secondary-dark: #db2777; /* Darker pink */
  --vsui-color-secondary-light: #fce7f3; /* Light pink background */
  --vsui-color-secondary-text: #831843; /* Dark pink text */

  /* Custom status colors */
  --vsui-color-success: #10b981; /* Emerald */
  --vsui-color-warning: #f59e0b; /* Amber */
  --vsui-color-error: #ef4444; /* Red */
  --vsui-color-info: #06b6d4; /* Cyan */

  /* Custom background colors */
  --vsui-bg-default: #ffffff; /* Pure white */
  --vsui-bg-subtle: #f8fafc; /* Very light gray */
  --vsui-bg-muted: #f1f5f9; /* Light gray */
  --vsui-bg-emphasized: #e2e8f0; /* Medium gray */
  --vsui-bg-disabled: #f8fafc; /* Disabled background */

  /* Custom text colors */
  --vsui-text-default: #0f172a; /* Very dark slate */
  --vsui-text-muted: #475569; /* Medium slate */
  --vsui-text-subtle: #64748b; /* Light slate */
  --vsui-text-disabled: #94a3b8; /* Disabled text */
  --vsui-text-inverse: #ffffff; /* White text */
}

/* Dark mode overrides */
:root[data-theme='dark'] {
  --vsui-bg-default: #0f172a; /* Dark slate */
  --vsui-text-default: #f8fafc; /* Light text */
  /* ... other dark mode variables */
}
```

```javascript
// In your main.js or App.vue
import './your-custom-theme.css' // Import your custom variables FIRST
import 'vue-smart-ui/style.css' // Then import Vue Smart UI
```

#### Advanced Customization

You can also override component-specific variables for more granular control:

```css
:root {
  /* Button customization */
  --vsui-button-primary-bg: #059669; /* Custom green primary */
  --vsui-button-primary-hover: #047857; /* Darker green */

  /* Input customization */
  --vsui-input-bg: #f0f9ff; /* Very light blue background */
  --vsui-input-border-color: #0ea5e9; /* Blue border */

  /* Avatar customization */
  --vsui-avatar-default-bg: #f3f4f6; /* Light gray */
  --vsui-avatar-filled-bg: #7c3aed; /* Purple filled */
}
```

#### Other Customization Methods

The components can be customized in multiple ways:

- **CSS variables for theming** (recommended)
- **Overriding component classes directly**
- **Using Tailwind CSS classes**

#### Complete CSS Variables Reference

See the `src/theme-example.css` file for a complete example of how to customize all available variables.
