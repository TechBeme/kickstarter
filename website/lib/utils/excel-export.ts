import * as XLSX from 'xlsx'

interface ExportColumn {
  header: string
  key: string
  format?: (value: any, row?: any) => any
}

export function exportToExcel(data: any[], columns: ExportColumn[], filename: string, sheetName: string = 'Data') {
  // Transform data according to columns
  const transformedData = data.map(row => {
    const transformedRow: any = {}
    columns.forEach(col => {
      const value = getNestedValue(row, col.key)
      transformedRow[col.header] = col.format ? col.format(value, row) : value
    })
    return transformedRow
  })

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(transformedData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Auto-size columns
  const maxWidth = 50
  const colWidths = columns.map(col => {
    const headerLength = col.header.length
    const maxContentLength = Math.max(
      ...transformedData.map(row => String(row[col.header] || '').length)
    )
    return { wch: Math.min(Math.max(headerLength, maxContentLength) + 2, maxWidth) }
  })
  ws['!cols'] = colWidths

  // Write file
  XLSX.writeFile(wb, filename)
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

export function formatCurrencyForExcel(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export function formatDateForExcel(timestamp: number): string {
  if (!timestamp) return ''
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatPercentForExcel(value: number): string {
  return `${value.toFixed(1)}%`
}
