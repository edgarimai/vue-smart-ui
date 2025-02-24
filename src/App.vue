<script setup>
import { reactive } from 'vue'
import {
  BaseButton,
  BasePopup,
  ToastsContainer,
  BaseDropdown,
  BaseSkeleton,
  BaseInfiniteScroll,
  BaseAccordion,
  BaseAccordionItem,
} from './components'
import { useToast } from '@/composables/toast'

const pageState = reactive({
  isLoading: false,
  isLoadingEnabled: false,
  popup: {
    variant: 'default',
    size: 'medium',
    position: 'center',
    show: false,
  },
  toast: {
    variant: 'success',
    position: 'top-right',
    duration: 3000,
    message: 'This is a toast message',
  },
  dropdown: {
    show: false,
    variant: 'default',
  },
  accordion: {
    show: false,
    variant: 'default',
  },
  infiniteScroll: {
    items: [],
    page: 1,
    loading: false,
    hasMore: true,
  },
})

const toast = useToast()
const showToast = () => {
  toast[pageState.toast.variant](pageState.toast.message, {
    title: 'Toast title',
    duration: pageState.toast.duration,
    position: pageState.toast.position,
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
    // Simulate API call with timeout
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate mock data
    const newItems = Array.from({ length: 10 }, (_, i) => ({
      id: pageState.infiniteScroll.items.length + i + 1,
      title: `Item ${pageState.infiniteScroll.items.length + i + 1}`,
    }))

    pageState.infiniteScroll.items.push(...newItems)
    pageState.infiniteScroll.page++

    // Simulate running out of items after 5 pages
    if (pageState.infiniteScroll.page > 5) {
      pageState.infiniteScroll.hasMore = false
    }
  } catch (error) {
    console.error('Error loading more items:', error)
  } finally {
    pageState.infiniteScroll.loading = false
  }
}
</script>

<template>
  <div class="examples">
    <div class="button-container">
      <h2>Buttons</h2>
      <h3>Loading on button</h3>
      <div class="container">
        <label class="checkbox-label">
          <input type="checkbox" v-model="pageState.isLoadingEnabled" class="checkbox-input" />
          Enable loading state
        </label>
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
        <!-- Button with icon -->
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
        <BaseButton disabled>Disabled button</BaseButton>
        <!-- Button that takes full width -->
        <BaseButton block style="margin: 1rem 0">Block button</BaseButton>
      </div>
    </div>

    <hr />

    <div class="popup-container">
      <h2>Popups</h2>
      <h3>Popup configuration</h3>
      <div class="container">
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
        <BaseButton variant="primary" @click="pageState.popup.show = true"> Open Popup </BaseButton>
      </div>
      <BasePopup
        v-model="pageState.popup.show"
        :variant="pageState.popup.variant"
        :size="pageState.popup.size"
        :position="pageState.popup.position"
      >
        <template #header>
          <p style="font-size: 1.2rem; font-weight: bold; text-align: center; margin-block: 0.5rem">
            Configured Popup
          </p>
        </template>
        <div class="popup-content">
          <p>Current configuration:</p>
          <ul>
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
          <span>&times;</span>
        </template>
      </BasePopup>
    </div>

    <hr />

    <div class="toast-container">
      <h2>Toasts</h2>
      <div class="container">
        <h3>Toast configuration</h3>
        <div class="select-group">
          <label>Variant:</label>
          <select v-model="pageState.toast.variant">
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
          <label>Duration:</label>
          <input type="number" v-model="pageState.toast.duration" />
        </div>
        <BaseButton variant="primary" @click="showToast">Show Toast</BaseButton>
      </div>
      <ToastsContainer />
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
      <div class="container">
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
      <table>
        <tr v-for="n in 5" :key="n">
          <td><BaseSkeleton variant="text" width="100px" /></td>
          <td><BaseSkeleton variant="text" width="200px" /></td>
          <td><BaseSkeleton variant="text" width="150px" /></td>
        </tr>
      </table>
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
    <div class="infinite-scroll-container">
      <h2>Infinite Scroll</h2>
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

        <!-- Loading custom -->
        <template #loading>
          <div class="custom-loader">Loading more items...</div>
        </template>

        <!-- End message -->
        <template #disabled>
          <div class="end-message">There are no more items to load</div>
        </template>
      </BaseInfiniteScroll>
    </div>
  </div>
</template>

<style scoped>
.examples {
  padding-bottom: 10rem;
  h2,
  h3 {
    text-align: center;
    margin-bottom: 1rem;
  }
  .container {
    text-align: center;

    button {
      margin-inline: 1rem;
    }

    .select-group {
      margin-bottom: 1rem;
    }
  }

  hr {
    margin-block: 2rem;
  }
}
</style>
