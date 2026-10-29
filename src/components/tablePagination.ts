// Defaults for BaseTable's `pagination` prop. They live in a module (not in the SFC) so both
// the prop default and the merge with a partial `pagination` object can use them.
export const DEFAULT_PAGINATION = {
  enabled: true,
  pageSize: 10,
  pageSizeOptions: [5, 10, 25, 50, 100],
  showTotal: true,
  showPageSizeSelector: true,
  showFirstLastButtons: true,
}
