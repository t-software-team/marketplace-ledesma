// Excel/Sheets interpretan una celda que arranca con =, +, -, @, tab o CR
// como fórmula al abrir el CSV; un nombre de comercio malicioso podría
// ejecutar código en la planilla de quien lo exporta. Se antepone un
// apóstrofe para forzarla a texto plano, igual que hace Google Sheets.
const FORMULA_PREFIX = /^[=+\-@\t\r]/

export function escapeCsvValue(value: string) {
  const safeValue = FORMULA_PREFIX.test(value) ? `'${value}` : value
  if (/[",\n]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`
  }
  return safeValue
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Server-side CSV building for API routes that stream a download directly
 * (no Blob/DOM available): same escaping as escapeCsvValue, plus a BOM so
 * Excel opens accented characters correctly.
 */
export function toCsv(rows: string[][]): string {
  return '﻿' + rows.map((r) => r.map(escapeCsvValue).join(',')).join('\n')
}
