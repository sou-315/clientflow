// Converts an array of row objects into a downloaded CSV file.
// columns: [{ key: 'name', label: 'Name' }] or [{ value: (row) => ..., label: 'Created' }]
export function exportToCsv(filename, rows, columns) {
  if (!rows || rows.length === 0) return

  const escapeCell = (value) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const getCell = (col, row) => (typeof col.value === 'function' ? col.value(row) : row[col.key])

  const header = columns.map((c) => escapeCell(c.label)).join(',')
  const lines = rows.map((row) => columns.map((c) => escapeCell(getCell(c, row))).join(','))

  const csvContent = [header, ...lines].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}