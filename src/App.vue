<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import {
  BaseButton,
  BasePopup,
  BaseDropdown,
  BaseSkeleton,
  BaseInfiniteScroll,
  BaseAccordion,
  BaseAccordionItem,
  BaseInput,
  BaseCheckbox,
  BaseTextarea,
  BaseSlider,
  BaseSegmentedButtons,
  BaseColorPicker,
  BaseOTP,
} from './components'
import { useToast } from '@/composables/toast'

const pageState = reactive({
  isDarkMode: false,
  isLoading: false,
  isLoadingEnabled: false,
  popup: {
    variant: 'default',
    size: 'medium',
    position: 'center',
    show: false,
    disableClickOutside: false,
  },
  toast: {
    variant: 'success',
    position: 'top-right',
    duration: 3000,
    message: 'This is a toast message',
    simple: false,
  },
  dropdown: {
    show: false,
    variant: 'default',
  },
  accordion: {
    show: false,
    variant: 'default',
  },
  input: {
    username: '',
    password: '',
    email: '',
    price: '',
    phone: '',
  },
  textarea: {
    content1: '',
    content2: '',
    content3: '',
    content4: '',
    content5: '',
  },
  checkbox: {
    checked: false,
    selectedFruits: [],
    selectAll: false,
    someSelected: false,
  },
  slider: {
    value: 0,
    range: [0, 1000],
  },
  segmentedButtons: {
    selectedFruit: null,
    selectedFruits: [],
    selectedFruitsObjects: [],
  },
  colorPicker: {
    color: '#000000',
    themeColor: '#000000',
    brandColor: '#000000',
    accentColor: '#000000',
    backgroundColor: '#000000',
  },
  otp: {
    value: '',
    value4: '',
  },
  infiniteScroll: {
    items: [],
    page: 1,
    loading: false,
    hasMore: true,
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

const toast = useToast()
const showToast = () => {
  toast[pageState.toast.variant](pageState.toast.message, {
    title: 'Toast title',
    duration: pageState.toast.duration,
    position: pageState.toast.position,
    simple: pageState.toast.simple,
  })
}

const handleSaveWithLoading = async () => {
  pageState.isLoading = true
  try {
    await saveData()
  } finally {
    pageState.isLoading = false
  }
}

const saveData = async () => {
  console.log('Saving data...')
  await new Promise((resolve) => setTimeout(resolve, 2000))
  console.log('Data saved!')
}

const loadMore = async () => {
  pageState.infiniteScroll.loading = true

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newItems = Array.from({ length: 10 }, (_, i) => ({
      id: pageState.infiniteScroll.items.length + i + 1,
      title: `Item ${pageState.infiniteScroll.items.length + i + 1}`,
    }))

    pageState.infiniteScroll.items.push(...newItems)
    pageState.infiniteScroll.page++

    if (pageState.infiniteScroll.page > 5) {
      pageState.infiniteScroll.hasMore = false
    }
  } catch (error) {
    console.error('Error loading more items:', error)
  } finally {
    pageState.infiniteScroll.loading = false
  }
}

const formRefs = ref({})

const validateForm = () => {
  let isValid = true
  // Validate all registered inputs
  Object.values(formRefs.value).forEach((input) => {
    console.log(input)
    if (input?.validate && !input.validate()) {
      isValid = false
    }
  })

  return isValid
}

const handleSubmit = () => {
  console.log(pageState.input)

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

const toggleDarkMode = (value) => {
  document.documentElement.classList.toggle('dark', value)
  const vsuiRoot = document.querySelector('.vsui')
  if (vsuiRoot) {
    vsuiRoot.classList.toggle('dark', value)
  }
}

onMounted(() => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  pageState.isDarkMode = prefersDark
  document.documentElement.classList.toggle('dark', prefersDark)
  const vsuiRoot = document.querySelector('.vsui')
  if (vsuiRoot) {
    vsuiRoot.classList.toggle('dark', prefersDark)
  }
})
</script>

<template>
  <div class="examples vsui">
    <div>
      <h2 style="margin-top: 0">Dark mode</h2>
      <div class="container">
        <BaseCheckbox
          v-model="pageState.isDarkMode"
          label="Dark Mode"
          @update:model-value="toggleDarkMode"
        />
      </div>
    </div>
    <div class="button-container">
      <h2>Buttons</h2>
      <h3>Loading on button</h3>
      <div class="container">
        <BaseCheckbox v-model="pageState.isLoadingEnabled" label="Enable loading state" />
      </div>
      <h3>Buttons sizes</h3>
      <div class="container">
        <!-- Small button -->
        <BaseButton
          size="small"
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
          >Small button</BaseButton
        >
        <!-- Medium button -->
        <BaseButton
          size="medium"
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
        >
          Medium button
        </BaseButton>
        <!-- Large button -->
        <BaseButton
          size="large"
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
          >Large button</BaseButton
        >
        <!-- Auto button -->
        <BaseButton
          variant="ghost"
          size="auto"
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
          >Auto button</BaseButton
        >
      </div>
      <h3>Button variants</h3>
      <div class="container">
        <!-- Primary button -->
        <BaseButton
          variant="primary"
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
          >Primary variant</BaseButton
        >
        <!-- Secondary button -->
        <BaseButton
          variant="secondary"
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
          >Secondary variant</BaseButton
        >
        <!-- Gray button -->
        <BaseButton
          variant="gray"
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
          >Gray variant</BaseButton
        >
        <!-- Outline button -->
        <BaseButton
          variant="outline"
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
          >Outline variant</BaseButton
        >
        <!-- Ghost button -->
        <BaseButton
          variant="ghost"
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
          >Ghost variant</BaseButton
        >
      </div>
      <h3>Button with icons</h3>
      <div class="container">
        <!-- Button icon only-->
        <BaseButton
          variant="primary"
          icon-only
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 12h-14" />
            <path d="m10 5-7 7 7 7" />
          </svg>
        </BaseButton>
        <!-- Button with icon left-->
        <BaseButton
          variant="primary"
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
        >
          Icon left
          <template #prefix>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M17 12h-14" />
              <path d="m10 5-7 7 7 7" />
            </svg>
          </template>
        </BaseButton>
        <!-- Button with icon right-->
        <BaseButton
          variant="primary"
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
        >
          Icon right
          <template #suffix>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </template>
        </BaseButton>
      </div>
      <h3>Others</h3>
      <div class="container">
        <!-- Disabled button -->
        <BaseButton disabled :loading="pageState.isLoading && pageState.isLoadingEnabled"
          >Disabled button</BaseButton
        >
        <!-- Button that takes full width -->
        <BaseButton
          block
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
          style="margin: 1rem 0"
          >Block button</BaseButton
        >
      </div>
    </div>

    <hr />

    <div class="popup-container">
      <h2>Popups</h2>
      <h3>Popup configuration</h3>
      <div class="container vertical">
        <!-- Variant selector -->
        <div class="select-group">
          <label>Variant:</label>
          <select v-model="pageState.popup.variant">
            <option value="default">Default</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
        <!-- Size selector -->
        <div class="select-group">
          <label>Size:</label>
          <select v-model="pageState.popup.size">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        <!-- Position selector -->
        <div class="select-group">
          <label>Position:</label>
          <select v-model="pageState.popup.position">
            <option value="center">Center</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>

        <BaseCheckbox v-model="pageState.popup.disableClickOutside" label="Disable click outside" />
        <BaseButton variant="primary" @click="pageState.popup.show = true"> Open Popup </BaseButton>
      </div>
      <BasePopup
        v-model="pageState.popup.show"
        :variant="pageState.popup.variant"
        :size="pageState.popup.size"
        :position="pageState.popup.position"
        :disable-click-outside="pageState.popup.disableClickOutside"
      >
        <template #header>
          <p
            style="
              font-size: 1.2rem;
              font-weight: bold;
              text-align: center;
              margin-block: 0.5rem;
              color: var(--text-default);
            "
          >
            Configured Popup
          </p>
        </template>
        <div class="popup-content">
          <p style="color: var(--text-default)">Current configuration:</p>
          <ul style="color: var(--text-default)">
            <li>Variant: {{ pageState.popup.variant }}</li>
            <li>Size: {{ pageState.popup.size }}</li>
            <li>Position: {{ pageState.popup.position }}</li>
          </ul>
        </div>
        <template #footer>
          <div style="text-align: center">
            <BaseButton @click="pageState.popup.show = false">Close</BaseButton>
          </div>
        </template>
        <template #close>
          <span style="color: var(--text-default)">&times;</span>
        </template>
      </BasePopup>
    </div>

    <hr />

    <div class="toast-container">
      <h2>Toasts</h2>
      <div class="container vertical">
        <h3>Toast configuration</h3>
        <div class="select-group">
          <label>Variant:</label>
          <select v-model="pageState.toast.variant">
            <option value="default">Default</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
        <div class="select-group">
          <label>Position:</label>
          <select v-model="pageState.toast.position">
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
            <option value="top-center">Top Center</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-center">Bottom Center</option>
          </select>
        </div>
        <div class="select-group">
          <BaseInput
            v-model="pageState.toast.duration"
            label="Duration"
            type="number"
            :min="100"
            :max="10000"
            :rules="[
              { minValue: 100, message: 'Minimum value is 100' },
              { maxValue: 10000, message: 'Maximum value is 10000' },
            ]"
          />
        </div>
        <div class="select-group">
          <BaseCheckbox v-model="pageState.toast.simple" label="Simple toast" />
        </div>
        <BaseButton variant="primary" @click="showToast">Show Toast</BaseButton>
      </div>
    </div>

    <hr />

    <div class="dropdown-container">
      <h2>Dropdown</h2>
      <div class="container">
        <BaseDropdown v-model="pageState.dropdown.show" variant="default">
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
      </div>
    </div>

    <hr />

    <div class="skeleton-container">
      <h2>Skeleton</h2>
      <div class="container vertical">
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
      </div>
      <div class="container">
        <table>
          <tr v-for="n in 5" :key="n">
            <td><BaseSkeleton variant="text" width="100px" /></td>
            <td><BaseSkeleton variant="text" width="200px" /></td>
            <td><BaseSkeleton variant="text" width="150px" /></td>
          </tr>
        </table>
      </div>
    </div>

    <hr />

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

    <hr />

    <div class="input-container">
      <h2>Inputs</h2>
      <!-- Basic required validation -->
      <div style="padding-inline: 20px">
        <BaseInput
          v-model="pageState.input.name"
          label="Name"
          :rules="['required']"
          @mounted="(ref) => registerInput('name', ref)"
        />
        <!-- Email validation -->
        <BaseInput
          v-model="pageState.input.email"
          label="Email"
          :rules="['required', 'email']"
          @mounted="(ref) => registerInput('email', ref)"
        />
        <!-- Multiple rules with custom messages -->
        <BaseInput
          v-model="pageState.input.password"
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
          v-model="pageState.input.username"
          label="Username"
          :rules="[
            {
              validator: (value) => /^[a-z0-9]+$/.test(value),
              message: 'Username can only contain lowercase letters and numbers',
            },
            {
              validator: (value) => value.length >= 3,
              message: 'Username must be at least 3 characters long',
            },
          ]"
        />
        <!-- Phone mask -->
        <BaseInput
          v-model="pageState.input.phone"
          label="Phone"
          :rules="['required', 'pattern: ^\d{10}$']"
          @mounted="(ref) => registerInput('phone', ref)"
          mask="phone"
          placeholder="(00) 00000-0000"
        />
        <!-- Currency mask -->
        <BaseInput
          v-model="pageState.input.price"
          label="Price"
          mask="currency"
          placeholder="R$ 0,00"
          @enter="handleSubmit"
        />
        <BaseButton variant="primary" @click="handleSubmit">Submit</BaseButton>
      </div>
    </div>

    <hr />

    <div class="textarea-container">
      <h2>Textarea</h2>

      <div style="padding-inline: 20px">
        <BaseTextarea
          v-model="pageState.textarea.content1"
          label="Simple textarea"
          placeholder="Enter your description"
        />
        <BaseTextarea
          v-model="pageState.textarea.content2"
          label="With validation and helper text"
          :rules="['required', { min: 10, message: 'Comment must be at least 10 characters' }]"
          validate-on-input
          helper-text="Please provide detailed feedback"
        />
        <BaseTextarea
          v-model="pageState.textarea.content3"
          label="Auto-resizing textarea full width"
          :rows="3"
          :max-rows="10"
          auto-resize
          block
        />
        <BaseTextarea
          v-model="pageState.textarea.content4"
          label="Filled variant"
          variant="filled"
          placeholder="Add your notes here"
        />
        <BaseTextarea
          v-model="pageState.textarea.content5"
          label="Resizable"
          resize="both"
          :rows="4"
        />
      </div>
    </div>

    <hr />

    <div class="checkbox-container">
      <h2>Checkbox</h2>

      <div class="container">
        <BaseCheckbox v-model="pageState.checkbox.checked" label="Basic checkbox" />
        <BaseCheckbox v-model="pageState.checkbox.checked">
          Checkbox with <span style="color: purple">slots</span>
        </BaseCheckbox>
        <BaseCheckbox
          v-model="pageState.checkbox.checked"
          error
          label="Required field with error"
        />
        <BaseCheckbox v-model="pageState.checkbox.checked" disabled label="Disabled checkbox" />
      </div>

      <!-- Different size -->
      <h3>Checkbox sizes</h3>
      <div class="container">
        <BaseCheckbox v-model="pageState.checkbox.checked" size="small" label="Small option" />
        <BaseCheckbox v-model="pageState.checkbox.checked" size="medium" label="Medium option" />
        <BaseCheckbox v-model="pageState.checkbox.checked" size="large" label="Large option" />
      </div>

      <!-- Multiple selection -->
      <h3>Checkbox multiple selection</h3>
      {{ pageState.selectedFruits }}
      <div class="container">
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
      </div>
    </div>

    <hr />

    <div class="slider-container">
      <h2>Slider</h2>
      <div class="container">
        <BaseSlider
          v-model="pageState.slider.value"
          label="Volume"
          :min="0"
          :max="100"
          :step="5"
          :marks="[
            { value: 0, label: 'Min' },
            { value: 50, label: '50%' },
            { value: 100, label: 'Max' },
          ]"
          :format-value="(val) => `${val}%`"
        />

        <BaseSlider
          v-model="pageState.slider.range"
          label="Price range"
          :min="0"
          :max="1000"
          range
          :format-value="(val) => `U$ ${val}`"
          helper-text="Please provide a valid price"
          error-message="Price must be between 0 and 1000"
        />
      </div>
    </div>

    <hr />

    <div class="segmented-buttons-container">
      <h2>Segmented Buttons</h2>
      <div>
        <BaseSegmentedButtons
          v-model="pageState.segmentedButtons.selectedFruit"
          :options="['apple', 'banana', 'orange']"
          variant="primary"
          size="large"
        />
        <BaseSegmentedButtons
          v-model="pageState.segmentedButtons.selectedFruits"
          :options="['apple', 'banana', 'orange']"
          multiple
          :rules="['required']"
          helper-text="Select at least one fruit"
        />
        <BaseSegmentedButtons
          v-model="pageState.segmentedButtons.selectedFruitsObjects"
          label="Select fruits"
          :options="[
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
            { value: 'orange', label: 'Orange' },
            { value: 'pineapple', label: 'Pineapple' },
          ]"
          multiple
          helper-text="Select at least one fruit"
          :rules="['required', 'min:2', 'max:3']"
        />
      </div>
    </div>

    <hr />

    <div class="color-picker-container">
      <h2>Color Picker</h2>

      <!-- Simple color picker -->
      <BaseColorPicker v-model="pageState.colorPicker.color" label="Choose a color" />

      <!-- With custom presets -->
      <BaseColorPicker
        v-model="pageState.colorPicker.themeColor"
        label="Theme Color"
        :presets="['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3']"
      />

      <!-- With validation -->
      <BaseColorPicker
        v-model="pageState.colorPicker.brandColor"
        label="Brand Color"
        :rules="['required', 'hexColor']"
        helper-text="Please select a brand color"
      />

      <!-- Required with custom message -->
      <BaseColorPicker
        v-model="pageState.colorPicker.accentColor"
        label="Accent Color"
        :rules="[
          'required',
          {
            hexColor: true,
            message: 'Please select a valid HEX color',
          },
        ]"
      />

      <!-- Filled variant -->
      <BaseColorPicker
        v-model="pageState.colorPicker.backgroundColor"
        variant="filled"
        label="Background"
      />
    </div>

    <hr />

    <div class="otp-container">
      <h2>OTP</h2>
      <BaseOTP
        v-model="pageState.otp.value"
        label="Variant default"
        helperText="Enter the code sent to your phone"
        required
      />
      <BaseOTP
        v-model="pageState.otp.value"
        :length="6"
        label="Variant filled"
        helperText="Enter the code sent to your phone"
        required
        variant="filled"
      />
      <BaseOTP
        v-model="pageState.otp.value4"
        :length="4"
        label="Auto focus with 4 digits"
        helper-text="Enter the 4-digit code"
        required
        auto-focus
      />
      <BaseOTP
        v-model="pageState.otp.value"
        label="No required"
        helper-text="Enter the 6-digit code"
      />
    </div>

    <hr />

    <div class="infinite-scroll-container">
      <h2>Infinite Scroll</h2>
      <div style="padding-inline: 20px">
        <BaseInfiniteScroll
          :loading="pageState.infiniteScroll.loading"
          :disabled="!pageState.infiniteScroll.hasMore"
          @load-more="loadMore"
        >
          <!-- Items list -->
          <div class="items-grid">
            <div v-for="item in pageState.infiniteScroll.items" :key="item.id" class="item">
              {{ item.title }}
            </div>
          </div>
          <!-- Custom loading -->
          <!-- <template #loading>
            <div class="custom-loader">Loading more items...</div>
          </template> -->
          <!-- Custom end message -->
          <!-- <template #disabled>
            <div class="end-message">There are no more items to load</div>
          </template> -->
        </BaseInfiniteScroll>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
body {
  margin-top: 0;
}
.examples {
  background-color: var(--bg-default);
  padding-bottom: 10rem;

  h2,
  h3 {
    text-align: center;
    margin-bottom: 1rem;
    color: var(--text-default);
  }

  label {
    color: var(--text-default);
  }

  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 25px;
    padding-inline: 20px;

    &.vertical {
      flex-direction: column;
    }

    .select-group {
      margin-bottom: 1rem;
    }
  }

  hr {
    margin-block: 2rem;
  }

  .popup-container {
    p,
    ul,
    li {
      color: var(--text-default);
    }
  }

  .dropdown-container {
    .base-dropdown-item {
      color: var(--text-default);
    }
  }

  .infinite-scroll-container {
    .items-grid {
      .item {
        color: var(--text-default);
      }
    }
  }
}
</style>
