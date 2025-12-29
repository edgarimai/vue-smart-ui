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
  BaseCombobox,
  BaseOTP,
  BaseTable,
  BaseAvatar,
  BaseSwitch,
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
    birthdate: '',
    alphanumericMask: '',
    letterMask: '',
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
  switch: {
    customValue: -1,
    notifications: false,
    size: false,
    mode: false,
    state: false,
    loading: false,
    disabled: false,
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
  combobox: {
    selectedCountry: null,
    selectedCountries: [],
    selectedCountriesNoTags: [],
    selectedUser: null,
    selectedUsers: [],
    searchableValue: null,
    loadingValue: null,
  },
  infiniteScroll: {
    items: [],
    page: 1,
    loading: false,
    hasMore: true,
  },
  table: {
    loading: false,
    selectedRows: [],
    data: [
      {
        id: 1,
        name: 'John Smith',
        email: 'john@email.com',
        age: 28,
        status: 'Active',
        role: 'Developer',
      },
      {
        id: 2,
        name: 'Mary Johnson',
        email: 'mary@email.com',
        age: 32,
        status: 'Active',
        role: 'Designer',
      },
      {
        id: 3,
        name: 'Peter Brown',
        email: 'peter@email.com',
        age: 25,
        status: 'Inactive',
        role: 'Manager',
      },
      {
        id: 4,
        name: 'Anna Wilson',
        email: 'anna@email.com',
        age: 29,
        status: 'Active',
        role: 'Developer',
      },
      {
        id: 5,
        name: 'Charles Davis',
        email: 'charles@email.com',
        age: 35,
        status: 'Active',
        role: 'Analyst',
      },
      {
        id: 6,
        name: 'Lucy Miller',
        email: 'lucy@email.com',
        age: 27,
        status: 'Inactive',
        role: 'Designer',
      },
      {
        id: 7,
        name: 'Robert Garcia',
        email: 'robert@email.com',
        age: 31,
        status: 'Active',
        role: 'Developer',
      },
      {
        id: 8,
        name: 'Sarah Rodriguez',
        email: 'sarah@email.com',
        age: 26,
        status: 'Active',
        role: 'Manager',
      },
      {
        id: 9,
        name: 'Michael Martinez',
        email: 'michael@email.com',
        age: 30,
        status: 'Inactive',
        role: 'Analyst',
      },
      {
        id: 10,
        name: 'Jennifer Lopez',
        email: 'jennifer@email.com',
        age: 24,
        status: 'Active',
        role: 'Designer',
      },
      {
        id: 11,
        name: 'David Anderson',
        email: 'david@email.com',
        age: 33,
        status: 'Active',
        role: 'Developer',
      },
      {
        id: 12,
        name: 'Lisa Taylor',
        email: 'lisa@email.com',
        age: 28,
        status: 'Inactive',
        role: 'Manager',
      },
    ],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'age', label: 'Age' },
      { key: 'status', label: 'Status' },
      { key: 'role', label: 'Role' },
    ],
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

// Combobox options data
const countryOptions = [
  'Brazil 42.15',
  'United States',
  'Canada',
  'United Kingdom',
  'France',
  'Germany',
  'Italy',
  'Spain',
  'Portugal',
  'Argentina',
  'Chile',
  'Mexico',
  'Japan',
  'China',
  'South Korea',
  'Australia',
  'New Zealand',
  'Netherlands',
  'Belgium',
  'Switzerland',
  'Bosnia and Herzegovina',
  'United Arab Emirates',
  'Democratic Republic of the Congo',
  'São Tomé and Príncipe',
  'Trinidad and Tobago',
  'Central African Republic',
]

const userOptions = [
  { id: 1, name: 'John Silva', email: 'john@email.com' },
  { id: 2, name: 'Mary Santos', email: 'mary@email.com' },
  { id: 3, name: 'Peter Oliveira', email: 'peter@email.com' },
  { id: 4, name: 'Anna Costa', email: 'anna@email.com' },
  { id: 5, name: 'Charles Ferreira', email: 'charles@email.com' },
  { id: 6, name: 'Lucy Rodrigues', email: 'lucy@email.com' },
  { id: 7, name: 'Robert Lima', email: 'robert@email.com' },
  { id: 8, name: 'Fernanda Alves', email: 'fernanda@email.com' },
  { id: 9, name: 'Antonio Pereira', email: 'antonio@email.com' },
  { id: 10, name: 'Juliana Martins', email: 'juliana@email.com' },
]

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

// Table functions
const handleTableSort = (event) => {
  console.log('Table sorted:', event)
}

const handleTableFilter = (event) => {
  console.log('Table filtered:', event)
}

const handleTableSelect = (event) => {
  console.log('Row selected:', event)
  pageState.table.selectedRows = event.selectedRows
}

const handleTableSelectAll = (event) => {
  console.log('Select all:', event)
  pageState.table.selectedRows = event.selectedRows
}

const handleTableRowClick = (event) => {
  console.log('Row clicked:', event)
}

const handleTableAction = (event) => {
  console.log('Action clicked:', event)
  const { action, row } = event

  if (action === 'edit') {
    alert(`Editing user: ${row.name}`)
  } else if (action === 'delete') {
    const confirmed = confirm(`Do you want to delete user ${row.name}?`)
    if (confirmed) {
      const index = pageState.table.data.findIndex((item) => item.id === row.id)
      if (index > -1) {
        pageState.table.data.splice(index, 1)
      }
    }
  } else if (action === 'view') {
    alert(`Viewing user: ${row.name}`)
  }
}

const toggleTableLoading = () => {
  pageState.table.loading = !pageState.table.loading

  if (pageState.table.loading) {
    setTimeout(() => {
      pageState.table.loading = false
    }, 3000)
  }
}

const formatStatus = (status) => {
  return status === 'Active' ? '✅ Active' : '❌ Inactive'
}

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
        <!-- White button -->
        <BaseButton
          variant="white"
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
          >White variant</BaseButton
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
        <!-- Button with hide focus outline -->
        <BaseButton
          hide-focus-outline
          @click="handleSaveWithLoading"
          :loading="pageState.isLoading && pageState.isLoadingEnabled"
          style="margin: 1rem 0"
          >Hide focus outline button</BaseButton
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
              color: var(--vsui-text-default);
            "
          >
            Configured Popup
          </p>
        </template>
        <div class="popup-content">
          <p style="color: var(--vsui-text-default)">Current configuration:</p>
          <ul style="color: var(--vsui-text-default)">
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
          <span style="color: var(--vsui-text-default)">&times;</span>
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
          type="email"
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
        <!-- Date mask -->
        <BaseInput
          v-model="pageState.input.birthdate"
          label="Birthdate"
          :rules="['required']"
          @mounted="(ref) => registerInput('birthdate', ref)"
          mask="date"
          placeholder="DD/MM/YYYY"
        />
        <!-- Currency mask -->
        <BaseInput
          v-model="pageState.input.price"
          label="Price"
          mask="currency"
          placeholder="R$ 0,00"
          @enter="handleSubmit"
        />
        <BaseInput
          v-model="pageState.input.alphanumericMask"
          label="Alphanumeric mask"
          mask="XXXXXX"
          placeholder="ABC123"
          @enter="handleSubmit"
        />
        <BaseInput
          v-model="pageState.input.letterMask"
          label="Letter mask"
          mask="AAAAAA"
          placeholder="ABCDEF"
          @enter="handleSubmit"
        />
        <BaseInput
          v-model="pageState.input.uppercase"
          label="Uppercase"
          uppercase
          @enter="handleSubmit"
        />
        <BaseInput
          v-model="pageState.input.lowercase"
          label="Lowercase"
          lowercase
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

    <div class="switch-container">
      <h2>Switch</h2>
      <div class="container">
        <BaseSwitch
          v-model="pageState.switch.customValue"
          :on-value="1"
          :off-value="-1"
          label="Custom Value"
        />
        <BaseSwitch v-model="pageState.switch.notifications" required label="Notifications" />

        <BaseSwitch v-model="pageState.switch.size" size="small" label="Small" />
        <BaseSwitch v-model="pageState.switch.size" size="medium" label="Medium" />
        <BaseSwitch v-model="pageState.switch.size" size="large" label="Large" />

        <BaseSwitch v-model="pageState.switch.size" label="Top" label-position="top" />
        <BaseSwitch v-model="pageState.switch.size" label="Left" label-position="left" />
        <BaseSwitch v-model="pageState.switch.size" label="Right" label-position="right" />

        <BaseSwitch v-model="pageState.switch.mode" onLabel="ON" offLabel="OFF" />

        <BaseSwitch
          v-model="pageState.switch.state"
          state="success"
          label="Success"
          helperText="Success state"
        />
        <BaseSwitch v-model="pageState.switch.state" state="error" errorMessage="Error state" />

        <BaseSwitch v-model="pageState.switch.loading" :loading="true" label="Loading" />

        <BaseSwitch v-model="pageState.switch.disabled" :disabled="true" label="Disabled" />
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
        v-model="pageState.otp.value4"
        :length="4"
        label="Variant filled with 4 digits"
        helperText="Enter the code sent to your phone"
        required
        variant="filled"
      />
      <!-- <BaseOTP
        v-model="pageState.otp.value4"
        :length="4"
        label="Auto focus with 4 digits"
        helper-text="Enter the 4-digit code"
        required
        auto-focus
      /> -->
      <BaseOTP
        v-model="pageState.otp.value"
        label="No required"
        helper-text="Enter the 6-digit code"
      />
    </div>

    <hr />

    <div class="combobox-container">
      <h2>Combobox</h2>

      <div class="container vertical">
        <!-- Simple combobox -->
        <BaseCombobox
          v-model="pageState.combobox.selectedCountry"
          :options="countryOptions"
          label="Country"
          placeholder="Select a country"
          helperText="Choose your country of origin"
        />

        <!-- Multiple selection with tags -->
        <BaseCombobox
          v-model="pageState.combobox.selectedCountries"
          :options="countryOptions"
          label="Countries (Multiple with tags)"
          placeholder="Select countries"
          multiple
          clearable
          :close-on-select="false"
          :show-tags="true"
          searchable
          helperText="Shows selected items as tags"
          style="width: 500px"
        />

        <!-- Multiple selection without tags (default) -->
        <BaseCombobox
          v-model="pageState.combobox.selectedCountriesNoTags"
          :options="countryOptions"
          label="Countries (Multiple without tags)"
          placeholder="Select countries"
          multiple
          clearable
          :close-on-select="false"
          searchable
          helperText="Shows only checkmarks in dropdown"
          style="width: 500px"
        />

        <!-- Multiple selection without tags (default) -->
        <BaseCombobox
          v-model="pageState.combobox.selectedCountriesNoTags"
          :options="countryOptions"
          label="Countries (Multiple without tags with custom text)"
          placeholder="Select countries"
          multiple
          clearable
          :close-on-select="false"
          searchable
          helperText="Shows only checkmarks in dropdown"
          style="width: 500px"
          selected-multiple-text="Selected {count} countries"
          selected-single-text="Selected 1 country"
        />

        <!-- Searchable combobox -->
        <BaseCombobox
          v-model="pageState.combobox.searchableValue"
          :options="userOptions"
          label="User (Searchable)"
          placeholder="Type to search..."
          searchable
          clearable
          valueKey="id"
          labelKey="name"
          helperText="Type the user name to filter"
        />

        <!-- With validation -->
        <BaseCombobox
          v-model="pageState.combobox.selectedUser"
          :options="userOptions"
          label="User (Required)"
          placeholder="Select a user"
          valueKey="id"
          labelKey="name"
          :rules="['required']"
          helperText="This field is required"
        />

        <!-- Different variants -->
        <div class="container">
          <BaseCombobox
            v-model="pageState.combobox.selectedCountry"
            :options="countryOptions.slice(0, 3)"
            label="Filled"
            variant="filled"
            placeholder="Filled variant"
          />

          <BaseCombobox
            v-model="pageState.combobox.selectedCountry"
            :options="countryOptions.slice(0, 3)"
            label="Outlined"
            variant="outlined"
            placeholder="Outlined variant"
          />
        </div>

        <!-- With states -->
        <div class="container">
          <BaseCombobox
            v-model="pageState.combobox.selectedCountry"
            :options="countryOptions.slice(0, 3)"
            label="Success"
            state="success"
            placeholder="Success state"
            helperText="Valid selection"
          />

          <BaseCombobox
            v-model="pageState.combobox.selectedCountry"
            :options="countryOptions.slice(0, 3)"
            label="Error"
            state="error"
            placeholder="Error state"
            errorMessage="Invalid selection"
          />

          <BaseCombobox
            v-model="pageState.combobox.selectedCountry"
            :options="countryOptions.slice(0, 3)"
            label="Warning"
            state="warning"
            placeholder="Warning state"
            helperText="Please check your selection"
          />
        </div>

        <!-- Loading state -->
        <BaseCombobox
          v-model="pageState.combobox.loadingValue"
          :options="[]"
          label="Loading"
          placeholder="Loading options..."
          loading
          helperText="Please wait while we load the options"
        />

        <!-- Disabled -->
        <BaseCombobox
          v-model="pageState.combobox.selectedCountry"
          :options="countryOptions.slice(0, 3)"
          label="Disabled"
          placeholder="Disabled field"
          disabled
          helperText="This field is disabled"
        />

        <!-- Custom option slot -->
        <BaseCombobox
          v-model="pageState.combobox.selectedUser"
          :options="userOptions"
          label="User (Custom template)"
          placeholder="Select a user"
          valueKey="id"
          labelKey="name"
          searchable
          clearable
          helperText="With custom template for options"
        >
          <template #option="{ option, selected }">
            <div style="display: flex; align-items: center; gap: 0.5rem; width: 100%">
              <div
                style="
                  width: 2rem;
                  height: 2rem;
                  border-radius: 50%;
                  background: linear-gradient(45deg, #3b82f6, #8b5cf6);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: 600;
                  font-size: 0.75rem;
                "
              >
                {{ option.name.charAt(0).toUpperCase() }}
              </div>
              <div style="flex: 1">
                <div style="font-weight: 500">{{ option.name }}</div>
                <div style="font-size: 0.75rem; color: #6b7280">{{ option.email }}</div>
              </div>
              <div v-if="selected" style="color: #3b82f6">✓</div>
            </div>
          </template>
        </BaseCombobox>

        <!-- Narrow combobox with proper dropdown width -->
        <div class="container">
          <BaseCombobox
            v-model="pageState.combobox.selectedCountry"
            :options="countryOptions"
            label="Narrow (Auto width)"
            placeholder="Select..."
            helperText="Dropdown auto-expands for content"
            style="width: 150px"
          />

          <BaseCombobox
            v-model="pageState.combobox.selectedCountry"
            :options="countryOptions"
            label="Narrow (Text wrap)"
            placeholder="Select..."
            wrapOptionText
            helperText="Long text wraps in options"
            style="width: 150px"
          />
        </div>
      </div>
    </div>

    <hr />

    <div class="table-container">
      <h2>Dynamic Table</h2>

      <div
        class="table-controls"
        style="margin-bottom: 1rem; display: flex; gap: 1rem; justify-content: center"
      >
        <BaseButton @click="toggleTableLoading" :loading="pageState.table.loading">
          {{ pageState.table.loading ? 'Loading...' : 'Simulate Loading' }}
        </BaseButton>
        <BaseButton
          variant="secondary"
          :disabled="pageState.table.selectedRows.length === 0"
          @click="() => alert(`${pageState.table.selectedRows.length} row(s) selected`)"
        >
          Bulk Action ({{ pageState.table.selectedRows.length }})
        </BaseButton>
      </div>

      <!-- Tabela básica -->
      <BaseTable
        :columns="pageState.table.columns"
        :data="pageState.table.data"
        :loading="pageState.table.loading"
        selectable
        filterable
        @sort="handleTableSort"
        @filter="handleTableFilter"
        @select="handleTableSelect"
        @select-all="handleTableSelectAll"
        @row-click="handleTableRowClick"
        @action-click="handleTableAction"
      >
        <!-- Custom slot for status -->
        <template #cell-status="{ value }">
          <span :style="{ color: value === 'Active' ? 'green' : 'red' }">
            {{ formatStatus(value) }}
          </span>
        </template>

        <!-- Custom slot for actions -->
        <template #actions="{ handleAction }">
          <BaseButton size="small" variant="ghost" @click="handleAction('view')" title="View">
            👁️
          </BaseButton>
          <BaseButton size="small" variant="ghost" @click="handleAction('edit')" title="Edit">
            ✏️
          </BaseButton>
          <BaseButton
            size="small"
            variant="ghost"
            @click="handleAction('delete')"
            title="Delete"
            style="color: red"
          >
            🗑️
          </BaseButton>
        </template>
      </BaseTable>

      <!-- Style variants example -->
      <h3 style="margin-top: 2rem">Style Variants</h3>

      <div style="display: grid; gap: 2rem; margin-top: 1rem">
        <!-- Striped table -->
        <div>
          <h4>Striped Table</h4>
          <BaseTable
            :columns="[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role' },
            ]"
            :data="pageState.table.data.slice(0, 5)"
            variant="striped"
            size="small"
            :pagination="{ enabled: false }"
          />
        </div>

        <!-- Bordered table -->
        <div>
          <h4>Bordered Table</h4>
          <BaseTable
            :columns="[
              { key: 'name', label: 'Name' },
              { key: 'age', label: 'Age' },
              { key: 'status', label: 'Status' },
            ]"
            :data="pageState.table.data.slice(0, 5)"
            variant="bordered"
            size="large"
            :pagination="{ enabled: false }"
            :sortable="false"
            :filterable="false"
          />
        </div>
      </div>
    </div>

    <hr />

    <div class="avatar-container">
      <h2>Avatar</h2>
      <div class="container">
        <div>
          <h3>Sizes</h3>
          <div style="display: flex; gap: 1rem; align-items: center">
            <BaseAvatar name="John Doe" size="small" />
            <BaseAvatar name="John Doe" size="medium" />
            <BaseAvatar name="John Doe" size="large" />
            <BaseAvatar name="John Doe" size="xlarge" />
          </div>
        </div>

        <div>
          <h3>Variants</h3>
          <div style="display: flex; gap: 1rem; align-items: center">
            <BaseAvatar name="John Doe" variant="default" />
            <BaseAvatar name="John Doe" variant="filled" />
            <BaseAvatar name="John Doe" variant="outlined" />
          </div>
        </div>

        <div>
          <h3>Shapes</h3>
          <div style="display: flex; gap: 1rem; align-items: center">
            <BaseAvatar name="John Doe" shape="circle" />
            <BaseAvatar name="John Doe" shape="square" />
            <BaseAvatar name="John Doe" shape="rounded" />
          </div>
        </div>

        <div>
          <h3>With Image</h3>
          <div style="display: flex; gap: 1rem; align-items: center">
            <BaseAvatar
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
              alt="John Doe"
              name="John Doe"
            />
            <BaseAvatar
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
              alt="Jane Smith"
              name="Jane Smith"
            />
            <BaseAvatar
              src="https://invalid-image-url.jpg"
              alt="Broken Image"
              name="Broken Image"
            />
          </div>
        </div>

        <div>
          <h3>Status Indicators</h3>
          <div style="display: flex; gap: 1rem; align-items: center">
            <BaseAvatar name="Online User" status="online" />
            <BaseAvatar name="Offline User" status="offline" />
            <BaseAvatar name="Away User" status="away" />
            <BaseAvatar name="Busy User" status="busy" />
          </div>
        </div>

        <div>
          <h3>States</h3>
          <div style="display: flex; gap: 1rem; align-items: center">
            <BaseAvatar name="Normal" />
            <BaseAvatar name="Disabled" disabled />
          </div>
        </div>

        <div>
          <h3>Custom Initials</h3>
          <div style="display: flex; gap: 1rem; align-items: center">
            <BaseAvatar fallback="JD" />
            <BaseAvatar name="João Silva Santos" />
            <BaseAvatar name="M" />
          </div>
        </div>
      </div>
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
  background-color: var(--vsui-bg-default);
  padding-bottom: 10rem;

  h2,
  h3 {
    text-align: center;
    margin-bottom: 1rem;
    color: var(--vsui-text-default);
  }

  label {
    color: var(--vsui-text-default);
  }

  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
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
      color: var(--vsui-text-default);
    }
  }

  .dropdown-container {
    .base-dropdown-item {
      color: var(--vsui-text-default);
    }
  }

  .infinite-scroll-container {
    .items-grid {
      .item {
        color: var(--vsui-text-default);
      }
    }
  }

  .table-container {
    padding-inline: 20px;

    h3,
    h4 {
      text-align: center;
      color: var(--vsui-text-default);
    }

    .table-controls {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
  }

  .avatar-container {
    padding-inline: 20px;

    h2,
    h3 {
      text-align: center;
      color: var(--vsui-text-default);
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      align-items: center;

      > div {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        min-width: 200px;
      }
    }
  }
}
</style>
