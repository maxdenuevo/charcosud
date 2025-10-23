// Database types based on the schema

export interface Producto {
  id: string
  sku: string
  nombre: string
  proveedor: string
  unidad: string
  costo_por_kg: number
  precio_venta_por_kg: number
  stock_actual: number
  stock_minimo: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  nombre_tienda: string
  rut: string
  direccion: string
  comuna: string
  contacto_nombre: string
  contacto_telefono: string
  email?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export type TipoMovimiento = 'entrada' | 'salida'

export interface Movimiento {
  id: string
  tipo: TipoMovimiento
  fecha: string
  producto_id: string
  cliente_id?: string
  cantidad_kg: number
  stock_resultante: number
  guia_despacho?: string
  notas?: string
  usuario_id?: string
  despacho_id?: string
  created_at: string
}

export interface Despacho {
  id: string
  cliente_id: string
  fecha: string
  total_clp: number
  usuario_id?: string
  created_at: string
}

// Extended types for UI
export interface ProductoConStock extends Producto {
  bajo_stock: boolean
}

export interface MovimientoDetallado extends Movimiento {
  producto?: Producto
  cliente?: Cliente
}

export interface DespachoDetallado extends Despacho {
  cliente?: Cliente
  movimientos?: MovimientoDetallado[]
}

// Form types
export interface ProductoFormData {
  sku: string
  nombre: string
  proveedor: string
  unidad: string
  costo_por_kg: number
  precio_venta_por_kg: number
  stock_minimo: number
}

export interface ClienteFormData {
  nombre_tienda: string
  rut: string
  direccion: string
  comuna: string
  contacto_nombre: string
  contacto_telefono: string
  email?: string
}

export interface EntradaFormData {
  producto_id: string
  cantidad_kg: number
  guia_despacho?: string
  notas?: string
}

export interface CarritoItem {
  producto: Producto
  cantidad_kg: number
}

export interface SalidaFormData {
  cliente_id: string
  items: CarritoItem[]
}

// Report types
export interface VentasPorCliente {
  cliente: Cliente
  total_clp: number
  total_kg: number
  num_transacciones: number
  ultimo_despacho: string | null
}
