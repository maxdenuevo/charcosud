import { db, PendingTransaction } from './db'
import { inventarioService } from './inventario'
import { productosService } from './productos'
import { clientesService } from './clientes'
import { EntradaFormData, SalidaFormData } from '@/types'

export type SyncEvent = {
  type: 'sync-start' | 'sync-progress' | 'sync-complete' | 'sync-error'
  message?: string
  progress?: number
  total?: number
}

class SyncManager {
  private syncListeners: Set<(event: SyncEvent) => void> = new Set()
  private isSyncing = false

  // Add event listener
  onSync(callback: (event: SyncEvent) => void): () => void {
    this.syncListeners.add(callback)
    return () => this.syncListeners.delete(callback)
  }

  private emit(event: SyncEvent): void {
    this.syncListeners.forEach(listener => listener(event))
  }

  // Check if online
  isOnline(): boolean {
    return navigator.onLine
  }

  // Sync all data from Supabase to IndexedDB
  async syncFromServer(): Promise<void> {
    if (!this.isOnline()) {
      console.log('Offline: Cannot sync from server')
      return
    }

    try {
      this.emit({ type: 'sync-start', message: 'Sincronizando datos del servidor...' })

      // Sync productos
      const productos = await productosService.getAll()
      await db.saveProductos(productos)
      await db.setLastSyncTime('productos', Date.now())

      // Sync clientes
      const clientes = await clientesService.getAll()
      await db.saveClientes(clientes)
      await db.setLastSyncTime('clientes', Date.now())

      this.emit({ type: 'sync-complete', message: 'Datos sincronizados' })
    } catch (error) {
      console.error('Error syncing from server:', error)
      this.emit({ type: 'sync-error', message: 'Error al sincronizar datos' })
      throw error
    }
  }

  // Sync pending transactions to Supabase
  async syncToServer(userId?: string): Promise<void> {
    if (!this.isOnline()) {
      console.log('Offline: Cannot sync to server')
      return
    }

    if (this.isSyncing) {
      console.log('Sync already in progress')
      return
    }

    this.isSyncing = true
    await db.setSyncInProgress('transactions', true)

    try {
      const pending = await db.getPendingTransactions()

      if (pending.length === 0) {
        this.emit({ type: 'sync-complete', message: 'No hay transacciones pendientes' })
        return
      }

      this.emit({
        type: 'sync-start',
        message: `Sincronizando ${pending.length} transacciones...`,
        total: pending.length
      })

      // Sort by timestamp (oldest first)
      pending.sort((a, b) => a.timestamp - b.timestamp)

      let synced = 0
      const errors: string[] = []

      for (const tx of pending) {
        try {
          await db.updateTransactionStatus(tx.id, 'syncing')

          if (tx.type === 'entrada') {
            await this.syncEntrada(tx, userId)
          } else if (tx.type === 'salida') {
            await this.syncSalida(tx, userId)
          }

          await db.updateTransactionStatus(tx.id, 'completed')
          synced++

          this.emit({
            type: 'sync-progress',
            message: `Sincronizadas ${synced}/${pending.length}`,
            progress: synced,
            total: pending.length
          })
        } catch (error: any) {
          console.error(`Error syncing transaction ${tx.id}:`, error)
          await db.updateTransactionStatus(tx.id, 'failed', error.message)
          errors.push(`${tx.type}: ${error.message}`)
        }
      }

      // Clean up completed transactions
      await db.clearCompletedTransactions()

      // Sync fresh data from server
      await this.syncFromServer()

      if (errors.length > 0) {
        this.emit({
          type: 'sync-error',
          message: `${synced} sincronizadas, ${errors.length} fallidas`
        })
      } else {
        this.emit({
          type: 'sync-complete',
          message: `${synced} transacciones sincronizadas`
        })
      }
    } catch (error: any) {
      console.error('Sync error:', error)
      this.emit({ type: 'sync-error', message: error.message })
    } finally {
      this.isSyncing = false
      await db.setSyncInProgress('transactions', false)
    }
  }

  private async syncEntrada(tx: PendingTransaction, userId?: string): Promise<void> {
    const data: EntradaFormData = tx.data

    // Check current stock on server
    const producto = await productosService.getById(data.producto_id)
    if (!producto) {
      throw new Error('Producto no encontrado en el servidor')
    }

    // Register entry
    await inventarioService.registrarEntrada(data, userId)

    // Update local cache
    await db.updateProductoStock(
      data.producto_id,
      producto.stock_actual + data.cantidad_kg
    )
  }

  private async syncSalida(tx: PendingTransaction, userId?: string): Promise<void> {
    const data: SalidaFormData = tx.data

    // Validate stock for all items
    for (const item of data.items) {
      const producto = await productosService.getById(item.producto.id)
      if (!producto) {
        throw new Error(`Producto ${item.producto.nombre} no encontrado`)
      }

      if (producto.stock_actual < item.cantidad_kg) {
        // Stock conflict!
        throw new Error(
          `Stock insuficiente para ${item.producto.nombre}. ` +
          `Disponible: ${producto.stock_actual} kg, Requerido: ${item.cantidad_kg} kg`
        )
      }
    }

    // Register sale
    await inventarioService.registrarSalida(data, userId)

    // Update local cache
    for (const item of data.items) {
      const producto = await productosService.getById(item.producto.id)
      if (producto) {
        await db.updateProductoStock(
          item.producto.id,
          producto.stock_actual - item.cantidad_kg
        )
      }
    }
  }

  // Get pending transactions count
  async getPendingCount(): Promise<number> {
    const pending = await db.getPendingTransactions()
    return pending.length
  }

  // Force sync
  async forceSync(userId?: string): Promise<void> {
    await this.syncToServer(userId)
  }

  // Initialize - sync from server on app start
  async initialize(): Promise<void> {
    await db.init()

    // Check if we have cached data
    const productosLastSync = await db.getLastSyncTime('productos')
    const clientesLastSync = await db.getLastSyncTime('clientes')

    // If no cache or cache is old (> 24 hours), sync from server
    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000

    if (
      this.isOnline() &&
      (now - productosLastSync > oneDayMs || now - clientesLastSync > oneDayMs)
    ) {
      await this.syncFromServer()
    }

    // Setup auto-sync on network reconnection
    window.addEventListener('online', () => {
      console.log('Network reconnected, syncing...')
      this.syncToServer()
    })
  }
}

export const syncManager = new SyncManager()
