<script setup>
import { ref, computed, watch } from 'vue'
import { useAutoId } from '../composables/autoId'
import BaseButton from './BaseButton.vue'
import BaseCheckbox from './BaseCheckbox.vue'
import BaseInput from './BaseInput.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  columns: {
    type: Array,
    required: true,
    validator: (columns) => columns.every((col) => col.key && col.label),
  },
  data: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'striped', 'bordered'].includes(value),
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  sortable: {
    type: Boolean,
    default: true,
  },
  filterable: {
    type: Boolean,
    default: false,
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: Object,
    default: () => ({
      enabled: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50, 100],
      showTotal: true,
      showPageSizeSelector: true,
    }),
  },
  responsive: {
    type: Boolean,
    default: true,
  },
  emptyMessage: {
    type: String,
    default: 'No data found',
  },
  loadingRows: {
    type: Number,
    default: 5,
  },
})

const { autoId } = useAutoId('table', props)

const emit = defineEmits([
  'sort',
  'filter',
  'select',
  'select-all',
  'page-change',
  'page-size-change',
  'row-click',
  'action-click',
])

// table state
const sortState = ref({ column: null, direction: null })
const filterState = ref({})
const selectedRows = ref(new Set())
const currentPage = ref(1)
const pageSize = ref(props.pagination.pageSize)
const searchQuery = ref('')

// filtered data
const filteredData = computed(() => {
  let result = [...props.data]

  // apply global search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((row) =>
      props.columns.some((col) => {
        const value = getNestedValue(row, col.key)
        return String(value).toLowerCase().includes(query)
      }),
    )
  }

  // apply column filters
  Object.entries(filterState.value).forEach(([key, value]) => {
    if (value) {
      result = result.filter((row) => {
        const rowValue = getNestedValue(row, key)
        return String(rowValue).toLowerCase().includes(String(value).toLowerCase())
      })
    }
  })

  // apply sorting
  if (sortState.value.column) {
    result.sort((a, b) => {
      const aValue = getNestedValue(a, sortState.value.column)
      const bValue = getNestedValue(b, sortState.value.column)

      if (aValue === bValue) return 0

      const comparison = aValue > bValue ? 1 : -1
      return sortState.value.direction === 'desc' ? -comparison : comparison
    })
  }

  return result
})

// pagination
const totalPages = computed(() =>
  props.pagination.enabled ? Math.ceil(filteredData.value.length / pageSize.value) : 1,
)

const paginatedData = computed(() => {
  if (!props.pagination.enabled) return filteredData.value

  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const paginationInfo = computed(() => {
  if (!props.pagination.enabled) return null

  const start = Math.min((currentPage.value - 1) * pageSize.value + 1, filteredData.value.length)
  const end = Math.min(currentPage.value * pageSize.value, filteredData.value.length)
  const total = filteredData.value.length

  return { start, end, total }
})

// selection
const isAllSelected = computed(
  () =>
    paginatedData.value.length > 0 &&
    paginatedData.value.every((row) => selectedRows.value.has(getRowId(row))),
)

const isIndeterminate = computed(() => selectedRows.value.size > 0 && !isAllSelected.value)

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((o, p) => o?.[p], obj) ?? ''
}

const getRowId = (row, index) => row.id ?? index

const handleSort = (column) => {
  if (!props.sortable || column.sortable === false) return

  if (sortState.value.column === column.key) {
    sortState.value.direction = sortState.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sortState.value.column = column.key
    sortState.value.direction = 'asc'
  }

  emit('sort', { column: column.key, direction: sortState.value.direction })
}

const handleFilter = (columnKey, value) => {
  filterState.value[columnKey] = value
  currentPage.value = 1
  emit('filter', { column: columnKey, value })
}

const handleRowSelect = (row, index) => {
  const rowId = getRowId(row, index)

  if (selectedRows.value.has(rowId)) {
    selectedRows.value.delete(rowId)
  } else {
    selectedRows.value.add(rowId)
  }

  emit('select', {
    row,
    selected: selectedRows.value.has(rowId),
    selectedRows: Array.from(selectedRows.value),
  })
}

const handleSelectAll = () => {
  if (isAllSelected.value) {
    paginatedData.value.forEach((row, index) => {
      selectedRows.value.delete(getRowId(row, index))
    })
  } else {
    paginatedData.value.forEach((row, index) => {
      selectedRows.value.add(getRowId(row, index))
    })
  }

  emit('select-all', {
    selected: !isAllSelected.value,
    selectedRows: Array.from(selectedRows.value),
  })
}

const handlePageChange = (page) => {
  currentPage.value = page
  emit('page-change', page)
}

const handlePageSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  emit('page-size-change', size)
}

const handleRowClick = (row, index) => {
  emit('row-click', { row, index })
}

const handleActionClick = (action, row, index) => {
  emit('action-click', { action, row, index })
}

const getSortIcon = (column) => {
  if (sortState.value.column !== column.key) return '↕️'
  return sortState.value.direction === 'asc' ? '↑' : '↓'
}

// reset selection when data changes
watch(
  () => props.data,
  () => {
    selectedRows.value.clear()
  },
  { deep: true },
)

// reset page when filters change
watch(
  filterState,
  () => {
    currentPage.value = 1
  },
  { deep: true },
)
</script>

<template>
  <div
    :id="autoId"
    class="vsui base-table"
    :class="[
      `base-table--${variant}`,
      `base-table--${size}`,
      {
        'base-table--loading': loading,
        'base-table--responsive': responsive,
        'base-table--selectable': selectable,
      },
      $attrs.class,
    ]"
  >
    <!-- Header with search and actions -->
    <div v-if="filterable || $slots.header" class="base-table__header">
      <slot name="header">
        <div class="base-table__search">
          <BaseInput v-model="searchQuery" placeholder="Search..." prefix-icon="🔍" />
        </div>
      </slot>
    </div>

    <!-- Table container -->
    <div class="base-table__container">
      <table class="base-table__table">
        <!-- Header -->
        <thead class="base-table__thead">
          <tr class="base-table__tr">
            <!-- Checkbox for select all -->
            <th v-if="selectable" class="base-table__th base-table__th--checkbox">
              <BaseCheckbox
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                @update:model-value="handleSelectAll"
              />
            </th>

            <!-- Columns -->
            <th
              v-for="column in columns"
              :key="column.key"
              class="base-table__th"
              :class="{
                'base-table__th--sortable': sortable && column.sortable !== false,
                'base-table__th--sorted': sortState.column === column.key,
              }"
              @click="handleSort(column)"
            >
              <div class="base-table__th-content">
                <span>{{ column.label }}</span>
                <span v-if="sortable && column.sortable !== false" class="base-table__sort-icon">
                  {{ getSortIcon(column) }}
                </span>
              </div>

              <!-- Column filter -->
              <div v-if="filterable && column.filterable !== false" class="base-table__filter">
                <BaseInput
                  :placeholder="`Filter ${column.label.toLowerCase()}...`"
                  :model-value="filterState[column.key] || ''"
                  @update:model-value="(value) => handleFilter(column.key, value)"
                  @click.stop
                />
              </div>
            </th>

            <!-- Actions column -->
            <th v-if="$slots.actions" class="base-table__th base-table__th--actions">Actions</th>
          </tr>
        </thead>

        <!-- Table body -->
        <tbody class="base-table__tbody">
          <!-- Loading state -->
          <template v-if="loading">
            <tr
              v-for="n in loadingRows"
              :key="`loading-${n}`"
              class="base-table__tr base-table__tr--loading"
            >
              <td v-if="selectable" class="base-table__td">
                <BaseCheckbox disabled />
              </td>
              <td v-for="column in columns" :key="column.key" class="base-table__td">
                <div class="base-table__skeleton"></div>
              </td>
              <td v-if="$slots.actions" class="base-table__td">
                <div class="base-table__skeleton base-table__skeleton--actions"></div>
              </td>
            </tr>
          </template>

          <!-- Data rows -->
          <template v-else-if="paginatedData.length > 0">
            <tr
              v-for="(row, index) in paginatedData"
              :key="getRowId(row, index)"
              class="base-table__tr"
              :class="{
                'base-table__tr--selected': selectable && selectedRows.has(getRowId(row, index)),
              }"
              @click="handleRowClick(row, index)"
            >
              <!-- Selection checkbox -->
              <td v-if="selectable" class="base-table__td base-table__td--checkbox">
                <BaseCheckbox
                  :model-value="selectedRows.has(getRowId(row, index))"
                  @update:model-value="handleRowSelect(row, index)"
                  @click.stop
                />
              </td>

              <!-- Data cells -->
              <td
                v-for="column in columns"
                :key="column.key"
                class="base-table__td"
                :class="column.class"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :row="row"
                  :column="column"
                  :value="getNestedValue(row, column.key)"
                  :index="index"
                >
                  {{
                    column.formatter
                      ? column.formatter(getNestedValue(row, column.key), row)
                      : getNestedValue(row, column.key)
                  }}
                </slot>
              </td>

              <!-- Actions -->
              <td v-if="$slots.actions" class="base-table__td base-table__td--actions">
                <div class="base-table__actions">
                  <slot
                    name="actions"
                    :row="row"
                    :index="index"
                    :handleAction="(action) => handleActionClick(action, row, index)"
                  />
                </div>
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else class="base-table__tr base-table__tr--empty">
            <td
              :colspan="columns.length + (selectable ? 1 : 0) + ($slots.actions ? 1 : 0)"
              class="base-table__td base-table__td--empty"
            >
              <slot name="empty">
                <div class="base-table__empty">
                  <p>{{ emptyMessage }}</p>
                </div>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination.enabled && !loading && paginatedData.length > 0"
      class="base-table__pagination"
    >
      <!-- Pagination info -->
      <div v-if="pagination.showTotal" class="base-table__pagination-info">
        Showing {{ paginationInfo.start }} - {{ paginationInfo.end }} of
        {{ paginationInfo.total }} results
      </div>

      <!-- Page size selector -->
      <div v-if="pagination.showPageSizeSelector" class="base-table__page-size">
        <label for="page-size">Items per page:</label>
        <select
          id="page-size"
          :value="pageSize"
          @change="handlePageSizeChange(Number($event.target.value))"
          class="base-table__page-size-select"
        >
          <option v-for="size in pagination.pageSizeOptions" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
      </div>

      <!-- Page navigation -->
      <div class="base-table__pagination-nav">
        <BaseButton
          variant="outline"
          size="small"
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
        >
          Previous
        </BaseButton>

        <span class="base-table__pagination-pages">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <BaseButton
          variant="outline"
          size="small"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
        >
          Next
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.base-table {
  width: 100%;
  border-radius: var(--table-border-radius);
  overflow: hidden;
  border: 1px solid var(--table-border-color);

  &__header {
    padding: var(--table-pagination-padding);
    background: var(--table-header-bg);
    border-bottom: 1px solid var(--table-border-color);
  }

  &__search {
    display: flex;
    gap: var(--table-pagination-gap);
    align-items: center;
  }

  &__container {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
  }

  &__thead {
    background: var(--table-header-bg);
  }

  &__th {
    padding: var(--table-header-padding);
    text-align: left;
    font-weight: var(--table-header-font-weight);
    color: var(--table-header-text-color);
    border-bottom: 1px solid var(--table-border-color);

    &--sortable {
      cursor: pointer;
      user-select: none;

      &:hover {
        background: var(--table-row-hover-bg);
      }
    }

    &--sorted {
      color: var(--table-sort-active-color);
    }

    &--checkbox {
      width: var(--table-checkbox-width);
      padding: var(--table-checkbox-padding);
    }

    &--actions {
      width: auto;
      white-space: nowrap;
      text-align: center;
    }
  }

  &__th-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__sort-icon {
    opacity: var(--table-sort-icon-opacity);
    font-size: var(--table-sort-icon-size);
  }

  &__filter {
    margin-top: var(--table-filter-margin-top);
  }

  &__tbody {
    background: var(--table-body-bg);
  }

  &__tr {
    &:hover:not(&--loading):not(&--empty) {
      background: var(--table-row-hover-bg);
    }

    &--selected {
      background: var(--table-row-selected-bg);
    }

    &--clickable {
      cursor: pointer;
    }

    &--empty {
      &:hover {
        background: transparent;
      }
    }
  }

  &__td {
    padding: var(--table-cell-padding);
    border-bottom: 1px solid var(--table-cell-border-color);
    color: var(--table-cell-text-color);

    &--checkbox {
      width: var(--table-checkbox-width);
      padding: var(--table-checkbox-padding);
    }

    &--actions {
      width: auto;
      white-space: nowrap;
    }

    &--empty {
      text-align: center;
      padding: var(--table-empty-padding);
      color: var(--table-empty-text-color);
    }
  }

  &__actions {
    display: flex;
    gap: var(--table-actions-gap);
    align-items: center;
    justify-content: var(--table-actions-justify-content);
  }

  &__skeleton {
    height: 1rem;
    background: var(--table-skeleton-bg);
    border-radius: 0.25rem;
    animation: pulse var(--table-skeleton-animation-duration) infinite;

    &--actions {
      width: 4rem;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    p {
      margin: 0;
      color: var(--table-empty-text-color);
    }
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--table-pagination-padding);
    background: var(--table-pagination-bg);
    border-top: 1px solid var(--table-pagination-border-color);
    gap: var(--table-pagination-gap);
    flex-wrap: wrap;
  }

  &__pagination-info {
    color: var(--table-pagination-info-color);
    font-size: var(--table-pagination-info-font-size);
  }

  &__page-size {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--table-pagination-info-font-size);

    label {
      color: var(--text-muted);
    }
  }

  &__page-size-select {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--table-border-color);
    border-radius: 0.25rem;
    background: var(--bg-default);

    &:focus {
      outline: 1px solid var(--color-primary);
    }
  }

  &__pagination-nav {
    display: flex;
    align-items: center;
    gap: var(--table-pagination-gap);
  }

  &__pagination-pages {
    color: var(--table-pagination-pages-color);
    font-size: var(--table-pagination-pages-font-size);
  }

  // Variants
  &--striped {
    .base-table__tr:nth-child(even) {
      background: var(--table-stripe-bg);
    }
  }

  &--bordered {
    .base-table__td,
    .base-table__th {
      border-right: 1px solid var(--table-border-color);

      &:last-child {
        border-right: none;
      }
    }
  }

  // Sizes
  &--small {
    .base-table__th,
    .base-table__td {
      padding: var(--table-small-padding);
      font-size: var(--table-small-font-size);
    }
  }

  &--large {
    .base-table__th,
    .base-table__td {
      padding: var(--table-large-padding);
      font-size: var(--table-large-font-size);
    }
  }

  // Responsiveness
  &--responsive {
    @media (max-width: 768px) {
      .base-table__container {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .base-table__pagination {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;

        > * {
          justify-content: center;
        }
      }
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
