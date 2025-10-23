/**
 * Application constants
 */

export const APP_NAME = 'CharcoSud'
export const APP_DESCRIPTION = 'Sistema de Control de Inventario'

export const DEFAULT_PROVEEDOR = 'Delicias del Sur'
export const DEFAULT_UNIDAD = 'kg'
export const DEFAULT_STOCK_MINIMO = 5

// Chilean regions/comunas (simplified for Santiago Metropolitan Region)
export const COMUNAS_RM = [
  'Santiago',
  'Providencia',
  'Las Condes',
  'Vitacura',
  'Lo Barnechea',
  'Ñuñoa',
  'La Reina',
  'Macul',
  'Peñalolén',
  'La Florida',
  'San Joaquín',
  'La Granja',
  'La Pintana',
  'San Ramón',
  'San Miguel',
  'La Cisterna',
  'El Bosque',
  'Pedro Aguirre Cerda',
  'Lo Espejo',
  'Estación Central',
  'Cerrillos',
  'Maipú',
  'Quinta Normal',
  'Lo Prado',
  'Pudahuel',
  'Cerro Navia',
  'Renca',
  'Quilicura',
  'Huechuraba',
  'Recoleta',
  'Independencia',
  'Conchalí',
  'San Bernardo',
  'Puente Alto',
] as const

// Report periods
export const REPORT_PERIODS = {
  LAST_7_DAYS: 7,
  LAST_30_DAYS: 30,
  LAST_90_DAYS: 90,
} as const

// Decimal precision for kilograms
export const KG_DECIMAL_PLACES = 3

// Touch target size (iOS HIG recommends 44x44px minimum)
export const MIN_TOUCH_TARGET_SIZE = 44
