import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import BaseTable, { type TableColumn } from '../../src/components/BaseTable.vue'
import BaseButton from '../../src/components/BaseButton.vue'
import BaseCheckbox from '../../src/components/BaseCheckbox.vue'
import BaseCombobox from '../../src/components/BaseCombobox.vue'

type Row = Record<string, unknown>
type TableProps = InstanceType<typeof BaseTable>['$props']

interface CellSlotProps {
  row: Row
  column: TableColumn
  value: unknown
  index: number
}

interface ActionsSlotProps {
  row: Row
  index: number
  handleAction: (action: unknown) => void
}

const COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' },
]

const PEOPLE: Row[] = [
  { id: 1, name: 'Alice', age: 30, address: { city: 'Lisbon' } },
  { id: 2, name: 'Bob', age: 25, address: { city: 'Porto' } },
  { id: 3, name: 'Carol', age: 35, address: { city: 'Faro' } },
]

function makeRows(count: number, withId = true): Row[] {
  return Array.from({ length: count }, (_, i) => {
    const row: Row = { name: `User ${i + 1}`, age: 20 + i }
    if (withId) row.id = i + 1
    return row
  })
}

function mountTable(
  props: Partial<TableProps> = {},
  slots: Record<string, (slotProps: never) => unknown> = {},
): VueWrapper {
  return mount(BaseTable, {
    props: { columns: COLUMNS, data: PEOPLE, scrollOnPageChange: false, ...props },
    // The loose map is only a test convenience; the real slot types are exercised by the callers.
    slots: slots as never,
  })
}

function bodyRows(wrapper: VueWrapper) {
  return wrapper.findAll('tbody tr.base-table__tr')
}

function cellTexts(wrapper: VueWrapper): string[][] {
  return bodyRows(wrapper).map((row) => row.findAll('td').map((cell) => cell.text()))
}

function firstColumn(wrapper: VueWrapper): string[] {
  return bodyRows(wrapper).map((row) => row.find('td').text())
}

function headerCell(wrapper: VueWrapper, label: string) {
  const cell = wrapper
    .findAll('th.base-table__th')
    .find((th) => th.find('.base-table__th-content span').text() === label)
  if (!cell) throw new Error(`header "${label}" not found`)
  return cell
}

function pageButton(wrapper: VueWrapper, title: string) {
  const button = wrapper.findAllComponents(BaseButton).find((b) => b.vm.$attrs.title === title)
  if (!button) throw new Error(`pagination button "${title}" not found`)
  return button
}

function pageLabel(wrapper: VueWrapper): string {
  return wrapper.find('.base-table__pagination-pages').text()
}

function rowCheckbox(wrapper: VueWrapper, index: number) {
  return bodyRows(wrapper)[index].find('input[type="checkbox"]')
}

function headerCheckbox(wrapper: VueWrapper) {
  return wrapper.find('thead input[type="checkbox"]')
}

// Checked state is read from the BaseCheckbox props (the table state), not from the DOM property,
// because wrapper.setValue() flips the DOM checkbox by itself and would mask a missing re-render.
function checkboxes(wrapper: VueWrapper) {
  return wrapper.findAllComponents(BaseCheckbox)
}

function isHeaderChecked(wrapper: VueWrapper): boolean {
  return checkboxes(wrapper)[0].props('modelValue') === true
}

function isHeaderIndeterminate(wrapper: VueWrapper): boolean {
  return checkboxes(wrapper)[0].props('indeterminate') === true
}

function isRowChecked(wrapper: VueWrapper, index: number): boolean {
  return checkboxes(wrapper)[index + 1].props('modelValue') === true
}

function lastEmitted(wrapper: VueWrapper, name: string): unknown {
  const events = wrapper.emitted(name)
  return events?.[events.length - 1]?.[0]
}

describe('BaseTable rendering', () => {
  it('renders the base, variant, size and responsive classes by default', () => {
    const wrapper = mountTable()

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        'vsui',
        'base-table',
        'base-table--default',
        'base-table--medium',
        'base-table--responsive',
      ]),
    )
    expect(wrapper.classes()).not.toContain('base-table--loading')
    expect(wrapper.classes()).not.toContain('base-table--selectable')
  })

  it('renders one header cell per column and one row per data item', () => {
    const wrapper = mountTable()

    expect(
      wrapper
        .findAll('th.base-table__th .base-table__th-content span:first-child')
        .map((el) => el.text()),
    ).toEqual(['Name', 'Age'])
    expect(cellTexts(wrapper)).toEqual([
      ['Alice', '30'],
      ['Bob', '25'],
      ['Carol', '35'],
    ])
  })

  it('uses the id prop, or generates a "table-<n>" id', () => {
    expect(mountTable({ id: 'users' }).attributes('id')).toBe('users')
    expect(mountTable().attributes('id')).toMatch(/^table-\d+$/)
  })

  it.each(['default', 'striped', 'bordered'] as const)(
    'applies the "%s" variant class',
    (variant) => {
      const wrapper = mountTable({ variant })

      expect(wrapper.classes()).toContain(`base-table--${variant}`)
    },
  )

  it.each(['small', 'medium', 'large'] as const)('applies the "%s" size class', (size) => {
    const wrapper = mountTable({ size })

    expect(wrapper.classes()).toContain(`base-table--${size}`)
  })

  it('drops the responsive class when responsive is false', () => {
    const wrapper = mountTable({ responsive: false })

    expect(wrapper.classes()).not.toContain('base-table--responsive')
  })

  it('merges a custom class with the component classes', () => {
    const wrapper = mount(BaseTable, {
      props: { columns: COLUMNS, data: PEOPLE },
      attrs: { class: 'my-table' },
    })

    expect(wrapper.classes()).toEqual(expect.arrayContaining(['base-table', 'my-table']))
  })

  // BUG: inheritAttrs is false and only $attrs.class is applied; data-*/aria-* are dropped
  it.fails('forwards data-* and aria-* attributes to the root element', () => {
    const wrapper = mount(BaseTable, {
      props: { columns: COLUMNS, data: PEOPLE },
      attrs: { 'data-testid': 'users', 'aria-label': 'Users' },
    })

    expect(wrapper.attributes('data-testid')).toBe('users')
    expect(wrapper.attributes('aria-label')).toBe('Users')
  })

  // BUG: inline style passed to <BaseTable> is dropped
  it.fails('forwards an inline style to the root element', () => {
    const wrapper = mount(BaseTable, {
      props: { columns: COLUMNS, data: PEOPLE },
      attrs: { style: 'max-width: 400px' },
    })

    expect(wrapper.attributes('style')).toContain('max-width: 400px')
  })

  it('resolves nested keys with dot notation', () => {
    const wrapper = mountTable({
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'address.city', label: 'City' },
      ],
    })

    expect(cellTexts(wrapper)).toEqual([
      ['Alice', 'Lisbon'],
      ['Bob', 'Porto'],
      ['Carol', 'Faro'],
    ])
  })

  it('renders an empty cell for missing or null values, and keeps 0', () => {
    const wrapper = mountTable({
      columns: [
        { key: 'a', label: 'A' },
        { key: 'b.c', label: 'B' },
        { key: 'zero', label: 'Zero' },
      ],
      data: [{ id: 1, a: null, zero: 0 }],
    })

    expect(cellTexts(wrapper)).toEqual([['', '', '0']])
  })

  it('applies the column formatter with the value and the row', () => {
    const formatter = vi.fn((value: unknown, row: Row) => `${String(value)} (${String(row.name)})`)
    const wrapper = mountTable({
      columns: [{ key: 'age', label: 'Age', formatter }],
    })

    expect(cellTexts(wrapper)[0]).toEqual(['30 (Alice)'])
    expect(formatter).toHaveBeenCalledWith(30, PEOPLE[0])
  })

  it('applies the column class to its cells', () => {
    const wrapper = mountTable({ columns: [{ key: 'name', label: 'Name', class: 'name-col' }] })

    for (const row of bodyRows(wrapper)) {
      expect(row.find('td').classes()).toEqual(
        expect.arrayContaining(['base-table__td', 'name-col']),
      )
    }
  })

  it('does not mutate or reorder the data prop when sorting', async () => {
    const data = PEOPLE.map((row) => ({ ...row }))
    const wrapper = mountTable({ data })

    await headerCell(wrapper, 'Age').trigger('click')

    expect(data.map((row) => row.id)).toEqual([1, 2, 3])
  })

  describe('slots', () => {
    it('renders a cell-<key> slot with row, column, value and index', () => {
      const received: CellSlotProps[] = []
      const wrapper = mountTable(
        {},
        {
          'cell-name': (slotProps: CellSlotProps) => {
            received.push(slotProps)
            return h('b', { class: 'custom-cell' }, `*${String(slotProps.value)}*`)
          },
        },
      )

      expect(wrapper.findAll('.custom-cell').map((el) => el.text())).toEqual([
        '*Alice*',
        '*Bob*',
        '*Carol*',
      ])
      expect(received).toHaveLength(3)
      expect(received[1]).toMatchObject({ row: PEOPLE[1], value: 'Bob', index: 1 })
      expect(received[1].column).toMatchObject({ key: 'name', label: 'Name' })
      // Columns without a slot keep the default rendering.
      expect(cellTexts(wrapper)[0][1]).toBe('30')
    })

    it('passes the nested value to the cell slot', () => {
      const values: unknown[] = []
      mountTable(
        { columns: [{ key: 'address.city', label: 'City' }] },
        {
          'cell-address.city': (slotProps: CellSlotProps) => {
            values.push(slotProps.value)
            return null
          },
        },
      )

      expect(values).toEqual(['Lisbon', 'Porto', 'Faro'])
    })

    it('replaces the search with the header slot, and shows the header area for it', () => {
      const wrapper = mountTable({}, { header: () => h('h3', { class: 'my-header' }, 'Users') })

      expect(wrapper.find('.base-table__header').exists()).toBe(true)
      expect(wrapper.find('.my-header').text()).toBe('Users')
      expect(wrapper.find('.base-table__search').exists()).toBe(false)
    })

    it('renders no header area without filterable or a header slot', () => {
      const wrapper = mountTable()

      expect(wrapper.find('.base-table__header').exists()).toBe(false)
    })

    it('renders an Actions column when the actions slot is provided', () => {
      const wrapper = mountTable(
        {},
        {
          actions: (slotProps: ActionsSlotProps) => h('i', { class: 'act' }, `#${slotProps.index}`),
        },
      )

      expect(wrapper.find('th.base-table__th--actions').text()).toBe('Actions')
      expect(wrapper.findAll('td.base-table__td--actions')).toHaveLength(3)
      expect(wrapper.findAll('.base-table__actions .act').map((el) => el.text())).toEqual([
        '#0',
        '#1',
        '#2',
      ])
    })

    it('does not render an Actions column without the actions slot', () => {
      const wrapper = mountTable()

      expect(wrapper.find('th.base-table__th--actions').exists()).toBe(false)
    })

    it('emits action-click with the action, the row and the index through handleAction', async () => {
      const wrapper = mountTable(
        {},
        {
          actions: (slotProps: ActionsSlotProps) =>
            h('button', { class: 'act', onClick: () => slotProps.handleAction('edit') }, 'Edit'),
        },
      )

      await wrapper.findAll('button.act')[1].trigger('click')

      expect(wrapper.emitted('action-click')).toEqual([
        [{ action: 'edit', row: PEOPLE[1], index: 1 }],
      ])
    })
  })
})

describe('BaseTable empty and loading states', () => {
  it('shows the default empty message spanning every column', () => {
    const wrapper = mountTable({ data: [] })

    expect(bodyRows(wrapper)).toHaveLength(1)
    expect(wrapper.find('.base-table__tr--empty').exists()).toBe(true)
    expect(wrapper.find('.base-table__empty').text()).toBe('No data found')
    expect(wrapper.find('td.base-table__td--empty').attributes('colspan')).toBe('2')
  })

  it('shows a custom emptyMessage', () => {
    const wrapper = mountTable({ data: [], emptyMessage: 'Nothing here' })

    expect(wrapper.find('.base-table__empty').text()).toBe('Nothing here')
  })

  it('counts the selection and actions columns in the empty colspan', () => {
    const wrapper = mountTable({ data: [], selectable: true }, { actions: () => h('span', 'x') })

    expect(wrapper.find('td.base-table__td--empty').attributes('colspan')).toBe('4')
  })

  it('renders the empty slot instead of the default message', () => {
    const wrapper = mountTable(
      { data: [] },
      { empty: () => h('div', { class: 'my-empty' }, 'Custom') },
    )

    expect(wrapper.find('.my-empty').text()).toBe('Custom')
    expect(wrapper.find('.base-table__empty').exists()).toBe(false)
  })

  it('hides the pagination when there is no data', () => {
    const wrapper = mountTable({ data: [] })

    expect(wrapper.find('.base-table__pagination').exists()).toBe(false)
  })

  it('renders 5 skeleton rows by default while loading, instead of the data', () => {
    const wrapper = mountTable({ loading: true })

    expect(wrapper.classes()).toContain('base-table--loading')
    expect(wrapper.findAll('tr.base-table__tr--loading')).toHaveLength(5)
    expect(wrapper.findAll('tbody .base-skeleton')).toHaveLength(5 * COLUMNS.length)
    expect(wrapper.text()).not.toContain('Alice')
    expect(wrapper.find('.base-table__tr--empty').exists()).toBe(false)
  })

  it('renders loadingRows skeleton rows', () => {
    const wrapper = mountTable({ loading: true, loadingRows: 2 })

    expect(wrapper.findAll('tr.base-table__tr--loading')).toHaveLength(2)
  })

  it('renders disabled checkboxes and an actions skeleton in loading rows when applicable', () => {
    const wrapper = mountTable(
      { loading: true, loadingRows: 1, selectable: true },
      { actions: () => h('span', 'x') },
    )

    const row = wrapper.find('tr.base-table__tr--loading')
    expect(row.find('input[type="checkbox"]').attributes('disabled')).toBeDefined()
    expect(row.findAll('.base-skeleton')).toHaveLength(COLUMNS.length + 1)
  })

  it('hides the pagination while loading', () => {
    const wrapper = mountTable({ loading: true, data: makeRows(30) })

    expect(wrapper.find('.base-table__pagination').exists()).toBe(false)
  })
})

describe('BaseTable sorting', () => {
  it('shows a neutral sort icon on every sortable column initially', () => {
    const wrapper = mountTable()

    const icons = wrapper.findAll('.base-table__sort-icon').map((el) => el.text())
    expect(icons).toHaveLength(2)
    for (const icon of icons) expect(icon).toBe('↕️')
    expect(wrapper.findAll('th.base-table__th--sortable')).toHaveLength(2)
    expect(wrapper.findAll('th.base-table__th--sorted')).toHaveLength(0)
  })

  it('sorts ascending on the first click and emits sort', async () => {
    const wrapper = mountTable()

    await headerCell(wrapper, 'Age').trigger('click')

    expect(firstColumn(wrapper)).toEqual(['Bob', 'Alice', 'Carol'])
    expect(wrapper.emitted('sort')).toEqual([[{ column: 'age', direction: 'asc' }]])
    expect(headerCell(wrapper, 'Age').find('.base-table__sort-icon').text()).toBe('↑')
    expect(headerCell(wrapper, 'Age').classes()).toContain('base-table__th--sorted')
    expect(headerCell(wrapper, 'Name').classes()).not.toContain('base-table__th--sorted')
  })

  it('sorts descending on the second click', async () => {
    const wrapper = mountTable()

    await headerCell(wrapper, 'Age').trigger('click')
    await headerCell(wrapper, 'Age').trigger('click')

    expect(firstColumn(wrapper)).toEqual(['Carol', 'Alice', 'Bob'])
    expect(lastEmitted(wrapper, 'sort')).toEqual({ column: 'age', direction: 'desc' })
    expect(headerCell(wrapper, 'Age').find('.base-table__sort-icon').text()).toBe('↓')
  })

  it('goes back to ascending on the third click (it cycles asc/desc, it never clears the sort)', async () => {
    const wrapper = mountTable()

    await headerCell(wrapper, 'Age').trigger('click')
    await headerCell(wrapper, 'Age').trigger('click')
    await headerCell(wrapper, 'Age').trigger('click')

    expect(wrapper.emitted('sort')?.map(([payload]) => payload)).toEqual([
      { column: 'age', direction: 'asc' },
      { column: 'age', direction: 'desc' },
      { column: 'age', direction: 'asc' },
    ])
    expect(firstColumn(wrapper)).toEqual(['Bob', 'Alice', 'Carol'])
  })

  it('restarts in ascending order when another column is sorted', async () => {
    const wrapper = mountTable()

    await headerCell(wrapper, 'Age').trigger('click')
    await headerCell(wrapper, 'Age').trigger('click')
    await headerCell(wrapper, 'Name').trigger('click')

    expect(lastEmitted(wrapper, 'sort')).toEqual({ column: 'name', direction: 'asc' })
    expect(firstColumn(wrapper)).toEqual(['Alice', 'Bob', 'Carol'])
    expect(headerCell(wrapper, 'Age').find('.base-table__sort-icon').text()).toBe('↕️')
  })

  it('sorts by a nested key', async () => {
    const wrapper = mountTable({
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'address.city', label: 'City' },
      ],
    })

    await headerCell(wrapper, 'City').trigger('click')

    expect(firstColumn(wrapper)).toEqual(['Carol', 'Alice', 'Bob'])
  })

  it('sorts the whole data set before paginating', async () => {
    const wrapper = mountTable({ data: makeRows(25) })

    await headerCell(wrapper, 'Age').trigger('click')
    await headerCell(wrapper, 'Age').trigger('click')

    expect(firstColumn(wrapper)[0]).toBe('User 25')
    expect(firstColumn(wrapper)).toHaveLength(10)
  })

  it('ignores clicks and hides the icons when sortable is false', async () => {
    const wrapper = mountTable({ sortable: false })

    await headerCell(wrapper, 'Age').trigger('click')

    expect(wrapper.emitted('sort')).toBeUndefined()
    expect(wrapper.find('.base-table__sort-icon').exists()).toBe(false)
    expect(wrapper.find('th.base-table__th--sortable').exists()).toBe(false)
    expect(firstColumn(wrapper)).toEqual(['Alice', 'Bob', 'Carol'])
  })

  it('ignores columns with sortable: false', async () => {
    const wrapper = mountTable({
      columns: [
        { key: 'name', label: 'Name', sortable: false },
        { key: 'age', label: 'Age' },
      ],
    })

    await headerCell(wrapper, 'Name').trigger('click')

    expect(wrapper.emitted('sort')).toBeUndefined()
    expect(headerCell(wrapper, 'Name').classes()).not.toContain('base-table__th--sortable')
    expect(headerCell(wrapper, 'Name').find('.base-table__sort-icon').exists()).toBe(false)
    expect(headerCell(wrapper, 'Age').find('.base-table__sort-icon').exists()).toBe(true)
  })

  // BUG: sortable headers expose no aria-sort, so assistive tech cannot tell the sort state
  it.fails('exposes aria-sort on the sorted header', async () => {
    const wrapper = mountTable()

    await headerCell(wrapper, 'Age').trigger('click')
    expect(headerCell(wrapper, 'Age').attributes('aria-sort')).toBe('ascending')

    await headerCell(wrapper, 'Age').trigger('click')
    expect(headerCell(wrapper, 'Age').attributes('aria-sort')).toBe('descending')
  })
})

describe('BaseTable search and filters', () => {
  it('shows the search input only when filterable', () => {
    expect(mountTable().find('.base-table__search').exists()).toBe(false)

    const wrapper = mountTable({ filterable: true })
    expect(wrapper.find('.base-table__header').exists()).toBe(true)
    expect(wrapper.find('.base-table__search input').attributes('placeholder')).toBe('Search...')
  })

  it('filters rows case-insensitively across every column as the user types', async () => {
    const wrapper = mountTable({ filterable: true })

    await wrapper.find('.base-table__search input').setValue('aLi')
    expect(firstColumn(wrapper)).toEqual(['Alice'])

    await wrapper.find('.base-table__search input').setValue('3')
    expect(firstColumn(wrapper)).toEqual(['Alice', 'Carol'])
  })

  it('searches nested column values', async () => {
    const wrapper = mountTable({
      filterable: true,
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'address.city', label: 'City' },
      ],
    })

    await wrapper.find('.base-table__search input').setValue('porto')

    expect(firstColumn(wrapper)).toEqual(['Bob'])
  })

  it('shows the empty message when nothing matches and restores the rows when cleared', async () => {
    const wrapper = mountTable({ filterable: true })

    await wrapper.find('.base-table__search input').setValue('zzz')
    expect(wrapper.find('.base-table__empty').text()).toBe('No data found')

    await wrapper.find('.base-table__search input').setValue('')
    expect(firstColumn(wrapper)).toEqual(['Alice', 'Bob', 'Carol'])
  })

  it('updates the pagination total with the search results', async () => {
    const wrapper = mountTable({ filterable: true, data: makeRows(25) })

    await wrapper.find('.base-table__search input').setValue('user 2')

    expect(wrapper.find('.base-table__pagination-info').text()).toBe('Showing 1 - 7 of 7 results')
  })

  it('renders a filter input per column with a lower-cased placeholder', () => {
    const wrapper = mountTable({ filterable: true })

    expect(wrapper.find('input[placeholder="Filter name..."]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="Filter age..."]').exists()).toBe(true)
  })

  it('omits the filter input of columns with filterable: false', () => {
    const wrapper = mountTable({
      filterable: true,
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age', filterable: false },
      ],
    })

    expect(wrapper.find('input[placeholder="Filter name..."]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="Filter age..."]').exists()).toBe(false)
  })

  it('filters by column and emits filter with the column key and value', async () => {
    const wrapper = mountTable({ filterable: true })

    await wrapper.find('input[placeholder="Filter name..."]').setValue('ar')

    expect(firstColumn(wrapper)).toEqual(['Carol'])
    expect(wrapper.emitted('filter')).toEqual([[{ column: 'name', value: 'ar' }]])
  })

  it('combines several column filters and the global search', async () => {
    const wrapper = mountTable({ filterable: true })

    await wrapper.find('input[placeholder="Filter name..."]').setValue('a')
    expect(firstColumn(wrapper)).toEqual(['Alice', 'Carol'])

    await wrapper.find('input[placeholder="Filter age..."]').setValue('35')
    expect(firstColumn(wrapper)).toEqual(['Carol'])

    await wrapper.find('.base-table__search input').setValue('alice')
    expect(wrapper.find('.base-table__empty').exists()).toBe(true)
  })

  it('does not sort when a filter input is clicked', async () => {
    const wrapper = mountTable({ filterable: true })

    await wrapper.find('input[placeholder="Filter name..."]').trigger('click')

    expect(wrapper.emitted('sort')).toBeUndefined()
  })

  it('goes back to the first page when a column filter changes', async () => {
    const wrapper = mountTable({ filterable: true, data: makeRows(25) })

    await pageButton(wrapper, 'Next page').trigger('click')
    expect(pageLabel(wrapper)).toBe('Page 2 of 3')

    await wrapper.find('input[placeholder="Filter name..."]').setValue('user')

    expect(pageLabel(wrapper)).toBe('Page 1 of 3')
    expect(firstColumn(wrapper)[0]).toBe('User 1')
  })

  it('goes back to the first page when the search changes', async () => {
    const wrapper = mountTable({ filterable: true, data: makeRows(30) })

    await pageButton(wrapper, 'Next page').trigger('click')
    await pageButton(wrapper, 'Next page').trigger('click')
    expect(pageLabel(wrapper)).toBe('Page 3 of 3')

    await wrapper.find('.base-table__search input').setValue('user 2')

    expect(wrapper.find('.base-table__empty').exists()).toBe(false)
    expect(pageLabel(wrapper)).toBe('Page 1 of 2')
  })
})

describe('BaseTable pagination', () => {
  it('shows the first 10 rows, the totals and the page label by default', () => {
    const wrapper = mountTable({ data: makeRows(25) })

    expect(bodyRows(wrapper)).toHaveLength(10)
    expect(firstColumn(wrapper)[0]).toBe('User 1')
    expect(wrapper.find('.base-table__pagination-info').text()).toBe('Showing 1 - 10 of 25 results')
    expect(pageLabel(wrapper)).toBe('Page 1 of 3')
  })

  it('goes to the next and previous pages and emits page-change', async () => {
    const wrapper = mountTable({ data: makeRows(25) })

    await pageButton(wrapper, 'Next page').trigger('click')

    expect(firstColumn(wrapper)[0]).toBe('User 11')
    expect(wrapper.find('.base-table__pagination-info').text()).toBe(
      'Showing 11 - 20 of 25 results',
    )
    expect(pageLabel(wrapper)).toBe('Page 2 of 3')

    await pageButton(wrapper, 'Previous page').trigger('click')

    expect(firstColumn(wrapper)[0]).toBe('User 1')
    expect(wrapper.emitted('page-change')).toEqual([[2], [1]])
  })

  it('shows the partial last page', async () => {
    const wrapper = mountTable({ data: makeRows(25) })

    await pageButton(wrapper, 'Last page').trigger('click')

    expect(bodyRows(wrapper)).toHaveLength(5)
    expect(wrapper.find('.base-table__pagination-info').text()).toBe(
      'Showing 21 - 25 of 25 results',
    )
    expect(wrapper.emitted('page-change')).toEqual([[3]])
  })

  it('jumps back with the first-page button', async () => {
    const wrapper = mountTable({ data: makeRows(25) })

    await pageButton(wrapper, 'Last page').trigger('click')
    await pageButton(wrapper, 'First page').trigger('click')

    expect(pageLabel(wrapper)).toBe('Page 1 of 3')
    expect(wrapper.emitted('page-change')).toEqual([[3], [1]])
  })

  it('disables previous/first on the first page and next/last on the last page', async () => {
    const wrapper = mountTable({ data: makeRows(25) })

    expect(pageButton(wrapper, 'Previous page').attributes('disabled')).toBeDefined()
    expect(pageButton(wrapper, 'First page').attributes('disabled')).toBeDefined()
    expect(pageButton(wrapper, 'Next page').attributes('disabled')).toBeUndefined()

    await pageButton(wrapper, 'Last page').trigger('click')

    expect(pageButton(wrapper, 'Next page').attributes('disabled')).toBeDefined()
    expect(pageButton(wrapper, 'Last page').attributes('disabled')).toBeDefined()
    expect(pageButton(wrapper, 'Previous page').attributes('disabled')).toBeUndefined()
  })

  it('does not emit page-change when a disabled navigation button is clicked', async () => {
    const wrapper = mountTable({ data: makeRows(25) })

    await pageButton(wrapper, 'Previous page').trigger('click')

    expect(wrapper.emitted('page-change')).toBeUndefined()
  })

  it('only renders the first/last buttons when there are more than 2 pages', () => {
    const three = mountTable({ data: makeRows(25) })
    const two = mountTable({ data: makeRows(15) })

    expect(three.findAllComponents(BaseButton)).toHaveLength(4)
    expect(two.findAllComponents(BaseButton)).toHaveLength(2)
    expect(pageLabel(two)).toBe('Page 1 of 2')
  })

  it('renders pagination controls from the pagination option flags', () => {
    const wrapper = mountTable({
      data: makeRows(25),
      pagination: {
        enabled: true,
        pageSize: 10,
        pageSizeOptions: [10],
        showTotal: false,
        showPageSizeSelector: false,
        showFirstLastButtons: false,
      },
    })

    expect(wrapper.find('.base-table__pagination-info').exists()).toBe(false)
    expect(wrapper.find('.base-table__page-size').exists()).toBe(false)
    expect(wrapper.findAllComponents(BaseButton)).toHaveLength(2)
    expect(wrapper.find('.base-table__pagination-pages').exists()).toBe(true)
  })

  it('respects a fully specified pagination option', () => {
    const wrapper = mountTable({
      data: makeRows(25),
      pagination: {
        enabled: true,
        pageSize: 5,
        pageSizeOptions: [5, 10],
        showTotal: true,
        showPageSizeSelector: true,
        showFirstLastButtons: true,
      },
    })

    expect(bodyRows(wrapper)).toHaveLength(5)
    expect(pageLabel(wrapper)).toBe('Page 1 of 5')
    expect(wrapper.findComponent(BaseCombobox).props('options')).toEqual([5, 10])
  })

  it('renders every row and no pagination footer when pagination is disabled', () => {
    const wrapper = mountTable({ data: makeRows(25), pagination: { enabled: false } })

    expect(bodyRows(wrapper)).toHaveLength(25)
    expect(wrapper.find('.base-table__pagination').exists()).toBe(false)
  })

  it('exposes the page size selector with the default options and the current size', () => {
    const wrapper = mountTable({ data: makeRows(25) })

    const combobox = wrapper.findComponent(BaseCombobox)
    expect(wrapper.find('.base-table__page-size label').text()).toBe('Items per page:')
    expect(combobox.props('options')).toEqual([5, 10, 25, 50, 100])
    expect(combobox.props('modelValue')).toBe(10)
  })

  it('changes the page size, goes back to page 1 and emits page-size-change', async () => {
    const wrapper = mountTable({ data: makeRows(25) })

    await pageButton(wrapper, 'Next page').trigger('click')
    await wrapper.findComponent(BaseCombobox).setValue(5)

    expect(bodyRows(wrapper)).toHaveLength(5)
    expect(pageLabel(wrapper)).toBe('Page 1 of 5')
    expect(firstColumn(wrapper)[0]).toBe('User 1')
    expect(wrapper.emitted('page-size-change')).toEqual([[5]])
    expect(wrapper.findComponent(BaseCombobox).props('modelValue')).toBe(5)
  })

  it('emits row-click with the row and its index inside the current page', async () => {
    const data = makeRows(25)
    const wrapper = mountTable({ data })

    await bodyRows(wrapper)[2].trigger('click')
    await pageButton(wrapper, 'Next page').trigger('click')
    await bodyRows(wrapper)[0].trigger('click')

    expect(wrapper.emitted('row-click')).toEqual([
      [{ row: data[2], index: 2 }],
      [{ row: data[10], index: 0 }],
    ])
  })

  describe('scroll on page change', () => {
    const scrollSpy = vi.fn()

    beforeEach(() => {
      vi.useFakeTimers()
      // jsdom does not implement scrollIntoView.
      Object.defineProperty(Element.prototype, 'scrollIntoView', {
        configurable: true,
        writable: true,
        value: scrollSpy,
      })
    })

    afterEach(() => {
      vi.useRealTimers()
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
      scrollSpy.mockClear()
    })

    it('scrolls the table into view 100ms after a page change by default', async () => {
      const wrapper = mount(BaseTable, { props: { columns: COLUMNS, data: makeRows(25) } })

      await pageButton(wrapper, 'Next page').trigger('click')
      expect(scrollSpy).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)

      expect(scrollSpy).toHaveBeenCalledTimes(1)
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
      expect(scrollSpy.mock.contexts[0]).toBe(wrapper.element)
    })

    it('does not scroll when scrollOnPageChange is false', async () => {
      const wrapper = mountTable({ data: makeRows(25) })

      await pageButton(wrapper, 'Next page').trigger('click')
      vi.advanceTimersByTime(500)

      expect(scrollSpy).not.toHaveBeenCalled()
    })
  })

  // BUG: a partial pagination object replaces the defaults, so { pageSize } leaves enabled undefined
  it.fails('keeps pagination on when only pageSize is provided', () => {
    const wrapper = mountTable({ data: makeRows(30), pagination: { pageSize: 20 } })

    expect(bodyRows(wrapper)).toHaveLength(20)
  })

  it('falls back to the default page size when only enabled is provided', () => {
    const wrapper = mountTable({ data: makeRows(15), pagination: { enabled: true } })

    expect(bodyRows(wrapper)).toHaveLength(10)
  })
})

describe('BaseTable selection', () => {
  it('renders a header checkbox, a checkbox per row and the selectable class', () => {
    const wrapper = mountTable({ selectable: true })

    expect(wrapper.classes()).toContain('base-table--selectable')
    expect(wrapper.find('th.base-table__th--checkbox').exists()).toBe(true)
    expect(wrapper.findAll('td.base-table__td--checkbox')).toHaveLength(3)
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(4)
  })

  it('renders no checkboxes when not selectable', () => {
    const wrapper = mountTable()

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
  })

  it('selects a row and emits select with the row, the flag and the selected ids', async () => {
    const wrapper = mountTable({ selectable: true })

    await rowCheckbox(wrapper, 1).setValue(true)

    expect(wrapper.emitted('select')).toEqual([
      [{ row: PEOPLE[1], selected: true, selectedRows: [2] }],
    ])
    expect(isRowChecked(wrapper, 1)).toBe(true)
    expect(bodyRows(wrapper)[1].classes()).toContain('base-table__tr--selected')
    expect(bodyRows(wrapper)[0].classes()).not.toContain('base-table__tr--selected')
  })

  it('deselects a selected row and emits select with selected: false', async () => {
    const wrapper = mountTable({ selectable: true })

    await rowCheckbox(wrapper, 0).setValue(true)
    await rowCheckbox(wrapper, 2).setValue(true)
    await rowCheckbox(wrapper, 0).setValue(false)

    expect(lastEmitted(wrapper, 'select')).toEqual({
      row: PEOPLE[0],
      selected: false,
      selectedRows: [3],
    })
    expect(bodyRows(wrapper)[0].classes()).not.toContain('base-table__tr--selected')
  })

  it('does not emit row-click when a checkbox is clicked, but row clicks do not select', async () => {
    // Attached to the document so jsdom runs the native checkbox activation (click -> change).
    const wrapper = mount(BaseTable, {
      props: { columns: COLUMNS, data: PEOPLE, selectable: true, scrollOnPageChange: false },
      attachTo: document.body,
    })

    await rowCheckbox(wrapper, 0).trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(wrapper.emitted('row-click')).toBeUndefined()

    await bodyRows(wrapper)[1].trigger('click')
    expect(wrapper.emitted('row-click')).toEqual([[{ row: PEOPLE[1], index: 1 }]])
    expect(wrapper.emitted('select')).toHaveLength(1)

    wrapper.unmount()
  })

  it('shows the header checkbox as indeterminate while only some rows are selected', async () => {
    const wrapper = mountTable({ selectable: true })

    expect(isHeaderIndeterminate(wrapper)).toBe(false)

    await rowCheckbox(wrapper, 0).setValue(true)

    expect(isHeaderIndeterminate(wrapper)).toBe(true)
    expect(isHeaderChecked(wrapper)).toBe(false)
  })

  it('checks the header checkbox once every row of the page is selected', async () => {
    const wrapper = mountTable({ selectable: true })

    for (const index of [0, 1, 2]) await rowCheckbox(wrapper, index).setValue(true)

    expect(isHeaderChecked(wrapper)).toBe(true)
    expect(isHeaderIndeterminate(wrapper)).toBe(false)
  })

  it('selects every row of the page with the header checkbox and emits select-all with the ids', async () => {
    const wrapper = mountTable({ selectable: true })

    await headerCheckbox(wrapper).setValue(true)

    expect(isHeaderChecked(wrapper)).toBe(true)
    for (const index of [0, 1, 2]) {
      expect(isRowChecked(wrapper, index)).toBe(true)
      expect(bodyRows(wrapper)[index].classes()).toContain('base-table__tr--selected')
    }
    expect(wrapper.emitted('select-all')).toHaveLength(1)
    expect(
      (wrapper.emitted('select-all')?.[0]?.[0] as { selectedRows: unknown[] }).selectedRows,
    ).toEqual([1, 2, 3])
  })

  it('deselects every row of the page with the header checkbox', async () => {
    const wrapper = mountTable({ selectable: true })

    await headerCheckbox(wrapper).setValue(true)
    await headerCheckbox(wrapper).setValue(false)

    expect(isHeaderChecked(wrapper)).toBe(false)
    for (const index of [0, 1, 2]) expect(isRowChecked(wrapper, index)).toBe(false)
    expect(
      (wrapper.emitted('select-all')?.[1]?.[0] as { selectedRows: unknown[] }).selectedRows,
    ).toEqual([])
  })

  it('selects only the rows of the current page and keeps the selection across pages', async () => {
    const wrapper = mountTable({ selectable: true, data: makeRows(25) })

    await headerCheckbox(wrapper).setValue(true)
    expect(
      (wrapper.emitted('select-all')?.[0]?.[0] as { selectedRows: unknown[] }).selectedRows,
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

    await pageButton(wrapper, 'Next page').trigger('click')
    expect(isHeaderChecked(wrapper)).toBe(false)
    expect(isRowChecked(wrapper, 0)).toBe(false)

    await pageButton(wrapper, 'Previous page').trigger('click')
    expect(isHeaderChecked(wrapper)).toBe(true)
    expect(isRowChecked(wrapper, 0)).toBe(true)
  })

  it('clears the selection, without emitting any event, when the data prop is replaced', async () => {
    const wrapper = mountTable({ selectable: true })

    await rowCheckbox(wrapper, 0).setValue(true)
    expect(wrapper.emitted('select')).toHaveLength(1)

    await wrapper.setProps({ data: PEOPLE.map((row) => ({ ...row })) })

    for (const index of [0, 1, 2]) expect(isRowChecked(wrapper, index)).toBe(false)
    expect(wrapper.findAll('.base-table__tr--selected')).toHaveLength(0)
    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(wrapper.emitted('select-all')).toBeUndefined()
  })

  it('emits select-all with selected: true when selecting every row', async () => {
    const wrapper = mountTable({ selectable: true })

    await headerCheckbox(wrapper).setValue(true)

    expect(wrapper.emitted('select-all')?.[0]?.[0]).toMatchObject({ selected: true })
  })

  it('emits select-all with selected: false when deselecting every row', async () => {
    const wrapper = mountTable({ selectable: true })

    await headerCheckbox(wrapper).setValue(true)
    await headerCheckbox(wrapper).setValue(false)

    expect(wrapper.emitted('select-all')?.[1]?.[0]).toMatchObject({ selected: false })
  })

  describe('rows without an id', () => {
    it('still selects an individual row', async () => {
      const wrapper = mountTable({ selectable: true, data: makeRows(3, false) })

      await rowCheckbox(wrapper, 1).setValue(true)

      expect(isRowChecked(wrapper, 1)).toBe(true)
      expect(isRowChecked(wrapper, 0)).toBe(false)
      expect(wrapper.emitted('select')).toHaveLength(1)
    })

    // BUG: the select-all state looks rows up without their index, so it never reads as checked
    it.fails('checks the header checkbox after select-all', async () => {
      const wrapper = mountTable({ selectable: true, data: makeRows(3, false) })

      await headerCheckbox(wrapper).setValue(true)

      for (const index of [0, 1, 2]) expect(isRowChecked(wrapper, index)).toBe(true)
      expect(isHeaderChecked(wrapper)).toBe(true)
    })

    // BUG: because the header never reads as checked, the second select-all click cannot deselect
    it.fails('deselects every row when select-all is toggled twice', async () => {
      const wrapper = mountTable({ selectable: true, data: makeRows(3, false) })

      await headerCheckbox(wrapper).setValue(true)
      await headerCheckbox(wrapper).setValue(false)

      for (const index of [0, 1, 2]) expect(isRowChecked(wrapper, index)).toBe(false)
    })

    // BUG: selection is keyed by the row position inside the page, shared by every page
    it.fails('does not mark the same position on another page as selected', async () => {
      const wrapper = mountTable({ selectable: true, data: makeRows(15, false) })

      await rowCheckbox(wrapper, 0).setValue(true)
      await pageButton(wrapper, 'Next page').trigger('click')

      expect(isRowChecked(wrapper, 0)).toBe(false)
    })
  })
})
