<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAutoId } from '../composables/autoId'
import BaseButton from './BaseButton.vue'
import BaseCheckbox from './BaseCheckbox.vue'
import BaseInput from './BaseInput.vue'
import BaseSkeleton from './BaseSkeleton.vue'
import BaseCombobox from './BaseCombobox.vue'
import type { ComboboxModelValue } from './BaseCombobox.vue'

defineOptions({
  inheritAttrs: false,
})

export type TableVariant = 'default' | 'striped' | 'bordered'
export type TableSize = 'small' | 'medium' | 'large'
export type SortDirection = 'asc' | 'desc' | null

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  class?: string
  formatter?: (value: unknown, row: Record<string, unknown>) => unknown
  [k: string]: unknown
}

export interface TablePagination {
  enabled?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  showTotal?: boolean
  showPageSizeSelector?: boolean
  showFirstLastButtons?: boolean
}

interface Props {
  id?: string
  columns: TableColumn[]
  data?: Record<string, unknown>[]
  loading?: boolean
  variant?: TableVariant
  size?: TableSize
  sortable?: boolean
  filterable?: boolean
  selectable?: boolean
  pagination?: TablePagination
  responsive?: boolean
  emptyMessage?: string
  loadingRows?: number
  scrollOnPageChange?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  data: () => [],
  loading: false,
  variant: 'default',
  size: 'medium',
  sortable: true,
  filterable: false,
  selectable: false,
  pagination: () => ({
    enabled: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    showTotal: true,
    showPageSizeSelector: true,
    showFirstLastButtons: true,
  }),
  responsive: true,
  emptyMessage: 'No data found',
  loadingRows: 5,
  scrollOnPageChange: true,
})

const { autoId } = useAutoId('table', props)

const emit = defineEmits<{
  sort: [payload: { column: string; direction: SortDirection }]
  filter: [payload: { column: string; value: string | number }]
  select: [payload: { row: Record<string, unknown>; selected: boolean; selectedRows: unknown[] }]
  'select-all': [payload: { selected: boolean; selectedRows: unknown[] }]
  'page-change': [page: number]
  'page-size-change': [size: number]
  'row-click': [payload: { row: Record<string, unknown>; index: number }]
  'action-click': [payload: { action: unknown; row: Record<string, unknown>; index: number }]
}>()

defineSlots<{
  header?: () => unknown
  empty?: () => unknown
  actions?: (props: {
    row: Record<string, unknown>
    index: number
    handleAction: (action: unknown) => void
  }) => unknown
  [name: `cell-${string}`]: (props: {
    row: Record<string, unknown>
    column: TableColumn
    value: unknown
    index: number
  }) => unknown
}>()

// table state
const sortState = ref<{ column: string | null; direction: SortDirection }>({
  column: null,
  direction: null,
})
const filterState = ref<Record<string, string | number>>({})
const selectedRows = ref<Set<unknown>>(new Set())
const currentPage = ref(1)
const pageSize = ref<number>(props.pagination.pageSize as number)
const searchQuery = ref('')
const tableRef = ref<HTMLDivElement | null>(null)

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
      const aValue = getNestedValue(a, sortState.value.column as string)
      const bValue = getNestedValue(b, sortState.value.column as string)

      if (aValue === bValue) return 0

      const comparison = (aValue as number) > (bValue as number) ? 1 : -1
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

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return (
    path
      .split('.')
      .reduce<unknown>((o, p) => (o as Record<string, unknown> | null | undefined)?.[p], obj) ?? ''
  )
}

const getRowId = (row: Record<string, unknown>, index?: number): string | number =>
  (row.id ?? index) as string | number

const scrollToTable = (): void => {
  if (props.scrollOnPageChange && tableRef.value) {
    tableRef.value.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
}

const scrollToTableWithDelay = (): void => {
  if (props.scrollOnPageChange) {
    setTimeout(() => {
      scrollToTable()
    }, 100)
  }
}

const handleSort = (column: TableColumn): void => {
  if (!props.sortable || column.sortable === false) return

  if (sortState.value.column === column.key) {
    sortState.value.direction = sortState.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sortState.value.column = column.key
    sortState.value.direction = 'asc'
  }

  emit('sort', { column: column.key, direction: sortState.value.direction })
}

const handleFilter = (columnKey: string, value: string | number): void => {
  filterState.value[columnKey] = value
  currentPage.value = 1
  emit('filter', { column: columnKey, value })
}

const handleRowSelect = (row: Record<string, unknown>, index: number): void => {
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

const handleSelectAll = (): void => {
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

const handlePageChange = (page: number): void => {
  currentPage.value = page
  emit('page-change', page)

  // Scroll to table top after page change
  scrollToTableWithDelay()
}
const handlePageSizeChange = (size: ComboboxModelValue): void => {
  pageSize.value = size as number
  currentPage.value = 1
  emit('page-size-change', size as number)

  // Scroll to table top after page size change
  scrollToTableWithDelay()
}
const handleRowClick = (row: Record<string, unknown>, index: number): void => {
  emit('row-click', { row, index })
}

const handleActionClick = (action: unknown, row: Record<string, unknown>, index: number): void => {
  emit('action-click', { action, row, index })
}

const getSortIcon = (column: TableColumn): string => {
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
    ref="tableRef"
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
                <BaseSkeleton variant="text" rounded />
              </td>
              <td v-if="$slots.actions" class="base-table__td">
                <BaseSkeleton variant="text" rounded />
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
        <label>Items per page:</label>
        <BaseCombobox
          :model-value="pageSize"
          :options="pagination.pageSizeOptions"
          @update:model-value="handlePageSizeChange"
          class="base-table__page-size-select"
        />
      </div>

      <!-- Page navigation -->
      <div class="base-table__pagination-nav">
        <!-- First page -->
        <BaseButton
          v-if="pagination.showFirstLastButtons && totalPages > 2"
          variant="outline"
          size="small"
          :disabled="currentPage === 1"
          @click="handlePageChange(1)"
          title="First page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="11,17 6,12 11,7"></polyline>
            <polyline points="18,17 13,12 18,7"></polyline>
          </svg>
        </BaseButton>

        <!-- Previous page -->
        <BaseButton
          variant="outline"
          size="small"
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
          title="Previous page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </BaseButton>

        <span class="base-table__pagination-pages">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <!-- Next page -->
        <BaseButton
          variant="outline"
          size="small"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
          title="Next page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </BaseButton>

        <!-- Last page -->
        <BaseButton
          v-if="pagination.showFirstLastButtons && totalPages > 2"
          variant="outline"
          size="small"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(totalPages)"
          title="Last page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="13,17 18,12 13,7"></polyline>
            <polyline points="6,17 11,12 6,7"></polyline>
          </svg>
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.base-table {
  width: 100%;
  border-radius: var(--vsui-table-border-radius);
  // overflow: hidden;
  border: 1px solid var(--vsui-table-border-color);

  &__header {
    padding: var(--vsui-table-pagination-padding);
    background: var(--vsui-table-header-bg);
    border-bottom: 1px solid var(--vsui-table-border-color);
  }

  &__search {
    display: flex;
    gap: var(--vsui-table-pagination-gap);
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
    background: var(--vsui-table-header-bg);
  }

  &__th {
    padding: var(--vsui-table-header-padding);
    text-align: left;
    font-weight: var(--vsui-table-header-font-weight);
    color: var(--vsui-table-header-text-color);
    border-bottom: 1px solid var(--vsui-table-border-color);

    &--sortable {
      cursor: pointer;
      user-select: none;

      &:hover {
        background: var(--vsui-table-row-hover-bg);
      }
    }

    &--sorted {
      color: var(--vsui-table-sort-active-color);
    }

    &--checkbox {
      width: var(--vsui-table-checkbox-width);
      padding: var(--vsui-table-checkbox-padding);
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
    opacity: var(--vsui-table-sort-icon-opacity);
    font-size: var(--vsui-table-sort-icon-size);
  }

  &__filter {
    margin-top: var(--vsui-table-filter-margin-top);
  }

  &__tbody {
    background: var(--vsui-table-body-bg);
  }

  &__tr {
    &:hover:not(&--loading):not(&--empty) {
      background: var(--vsui-table-row-hover-bg);
    }

    &--selected {
      background: var(--vsui-table-row-selected-bg);
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
    padding: var(--vsui-table-cell-padding);
    border-bottom: 1px solid var(--vsui-table-cell-border-color);
    color: var(--vsui-table-cell-text-color);

    &--checkbox {
      width: var(--vsui-table-checkbox-width);
      padding: var(--vsui-table-checkbox-padding);
    }

    &--actions {
      width: auto;
      white-space: nowrap;
    }

    &--empty {
      text-align: center;
      padding: var(--vsui-table-empty-padding);
      color: var(--vsui-table-empty-text-color);
    }
  }

  &__actions {
    display: flex;
    gap: var(--vsui-table-actions-gap);
    align-items: center;
    justify-content: var(--vsui-table-actions-justify-content);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    p {
      margin: 0;
      color: var(--vsui-table-empty-text-color);
    }
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--vsui-table-pagination-padding);
    background: var(--vsui-table-pagination-bg);
    border-top: 1px solid var(--vsui-table-pagination-border-color);
    gap: var(--vsui-table-pagination-gap);
    flex-wrap: wrap;
  }

  &__pagination-info {
    color: var(--vsui-table-pagination-info-color);
    font-size: var(--vsui-table-pagination-info-font-size);
  }

  &__page-size {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--vsui-table-pagination-info-font-size);

    label {
      color: var(--vsui-text-muted);
    }
  }

  &__page-size-select {
    min-width: 80px;
  }

  &__pagination-nav {
    display: flex;
    align-items: center;
    gap: var(--vsui-table-pagination-gap);

    // Icon buttons styling
    .base-button {
      min-width: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        display: block;
        flex-shrink: 0;
      }
    }
  }

  &__pagination-pages {
    color: var(--vsui-table-pagination-pages-color);
    font-size: var(--vsui-table-pagination-pages-font-size);
  }

  // Variants
  &--striped {
    .base-table__tr:nth-child(even) {
      background: var(--vsui-table-stripe-bg);
    }
  }

  &--bordered {
    .base-table__td,
    .base-table__th {
      border-right: 1px solid var(--vsui-table-border-color);

      &:last-child {
        border-right: none;
      }
    }
  }

  // Sizes
  &--small {
    .base-table__th,
    .base-table__td {
      padding: var(--vsui-table-small-padding);
      font-size: var(--vsui-table-small-font-size);
    }
  }

  &--large {
    .base-table__th,
    .base-table__td {
      padding: var(--vsui-table-large-padding);
      font-size: var(--vsui-table-large-font-size);
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
</style>
