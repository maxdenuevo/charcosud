/**
 * Utility functions for Chilean formats
 */

// Format currency (CLP)
export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

// Format kilograms with up to 3 decimals
export const formatKg = (kg: number): string => {
  return `${kg.toFixed(3)} kg`
}

// Format date to DD-MM-YYYY
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

// Format date with time to DD-MM-YYYY HH:mm
export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}-${month}-${year} ${hours}:${minutes}`
}

// Validate Chilean RUT using modulo 11 algorithm
export const validateRUT = (rut: string): boolean => {
  // Remove dots and dashes
  const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '')

  if (cleanRUT.length < 2) return false

  const body = cleanRUT.slice(0, -1)
  const dv = cleanRUT.slice(-1).toLowerCase()

  // Calculate check digit
  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const expectedDV = 11 - (sum % 11)
  const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'k' : String(expectedDV)

  return dv === calculatedDV
}

// Format RUT to XX.XXX.XXX-X
export const formatRUT = (rut: string): string => {
  const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '')

  if (cleanRUT.length < 2) return rut

  const body = cleanRUT.slice(0, -1)
  const dv = cleanRUT.slice(-1)

  // Add dots every 3 digits from right to left
  let formattedBody = ''
  for (let i = body.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      formattedBody = '.' + formattedBody
    }
    formattedBody = body[i] + formattedBody
  }

  return `${formattedBody}-${dv}`
}

// Parse formatted RUT to clean version
export const cleanRUT = (rut: string): string => {
  return rut.replace(/\./g, '').replace(/-/g, '')
}
