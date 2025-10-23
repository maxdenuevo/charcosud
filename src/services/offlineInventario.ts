import { db } from './db'
import { syncManager } from './syncManager'
import { inventarioService } from './inventario'
import { Producto, Cliente, EntradaFormData, SalidaFormData } from '@/types'

export const offlineInventarioService = {
  // Register entry - works offline
  async registrarEntrada(entrada: EntradaFormData, userId?: string): Promise<void> {
    if (syncManager.isOnline()) {
      // Online: Save directly to Supabase
      await inventarioService.registrarEntrada(entrada, userId)

      // Update local cache
      const producto = await db.getProducto(entrada.producto_id)
      if (producto) {
        await db.updateProductoStock(
          entrada.producto_id,
          producto.stock_actual + entrada.cantidad_kg
        )
      }
    } else {
      // Offline: Queue for sync and update local cache
      const producto = await db.getProducto(entrada.producto_id)
      if (!producto) {
        throw new Error('Producto no encontrado en caché local')
      }

      // Update local stock optimistically
      await db.updateProductoStock(
        entrada.producto_id,
        producto.stock_actual + entrada.cantidad_kg
      )

      // Queue transaction
      await db.addPendingTransaction({
        type: 'entrada',
        timestamp: Date.now(),
        status: 'pending',
        data: entrada,
        userId,
        retryCount: 0
      })
    }
  },

  // Register sale - works offline
  async registrarSalida(salida: SalidaFormData, userId?: string): Promise<void> {
    // Validate stock locally first
    for (const item of salida.items) {
      const producto = await db.getProducto(item.producto.id)
      if (!producto) {
        throw new Error(`Producto ${item.producto.nombre} no encontrado en caché local`)
      }

      if (producto.stock_actual < item.cantidad_kg) {
        throw new Error(
          `Stock insuficiente para ${item.producto.nombre}. ` +
          `Disponible: ${producto.stock_actual} kg`
        )
      }
    }

    if (syncManager.isOnline()) {
      // Online: Save directly to Supabase
      await inventarioService.registrarSalida(salida, userId)

      // Update local cache
      for (const item of salida.items) {
        const producto = await db.getProducto(item.producto.id)
        if (producto) {
          await db.updateProductoStock(
            item.producto.id,
            producto.stock_actual - item.cantidad_kg
          )
        }
      }
    } else {
      // Offline: Queue for sync and update local cache
      for (const item of salida.items) {
        const producto = await db.getProducto(item.producto.id)
        if (producto) {
          await db.updateProductoStock(
            item.producto.id,
            producto.stock_actual - item.cantidad_kg
          )
        }
      }

      // Queue transaction
      await db.addPendingTransaction({
        type: 'salida',
        timestamp: Date.now(),
        status: 'pending',
        data: salida,
        userId,
        retryCount: 0
      })
    }
  },

  // Get productos - from cache when offline
  async getProductos(): Promise<Producto[]> {
    if (syncManager.isOnline()) {
      try {
        // Try to get fresh data from Supabase
        const productos = await import('./productos').then(m => m.productosService.getActive())
        // Update cache
        await db.saveProductos(productos)
        return productos
      } catch (error) {
        console.error('Error fetching from server, using cache:', error)
        // Fall back to cache
        return db.getProductos()
      }
    } else {
      // Offline: Use cache
      return db.getProductos()
    }
  },

  // Get clientes - from cache when offline
  async getClientes(): Promise<Cliente[]> {
    if (syncManager.isOnline()) {
      try {
        // Try to get fresh data from Supabase
        const clientes = await import('./clientes').then(m => m.clientesService.getActive())
        // Update cache
        await db.saveClientes(clientes)
        return clientes
      } catch (error) {
        console.error('Error fetching from server, using cache:', error)
        // Fall back to cache
        return db.getClientes()
      }
    } else {
      // Offline: Use cache
      return db.getClientes()
    }
  },
}
