import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Producto, Cliente, Despacho } from '@/types'

// Define database schema
interface CharcoSudDB extends DBSchema {
  productos: {
    key: string
    value: Producto
    indexes: { 'by-sku': string }
  }
  clientes: {
    key: string
    value: Cliente
    indexes: { 'by-rut': string }
  }
  pendingTransactions: {
    key: string
    value: PendingTransaction
    indexes: { 'by-timestamp': number, 'by-status': string }
  }
  syncStatus: {
    key: string
    value: SyncMetadata
  }
}

export interface PendingTransaction {
  id: string
  type: 'entrada' | 'salida'
  timestamp: number
  status: 'pending' | 'syncing' | 'failed' | 'completed'
  data: any
  userId?: string
  error?: string
  retryCount: number
}

export interface SyncMetadata {
  key: string
  lastSync: number
  syncInProgress: boolean
}

const DB_NAME = 'charcosud-db'
const DB_VERSION = 1

class DatabaseService {
  private db: IDBPDatabase<CharcoSudDB> | null = null

  async init(): Promise<void> {
    if (this.db) return

    this.db = await openDB<CharcoSudDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Productos store
        if (!db.objectStoreNames.contains('productos')) {
          const productoStore = db.createObjectStore('productos', { keyPath: 'id' })
          productoStore.createIndex('by-sku', 'sku', { unique: true })
        }

        // Clientes store
        if (!db.objectStoreNames.contains('clientes')) {
          const clienteStore = db.createObjectStore('clientes', { keyPath: 'id' })
          clienteStore.createIndex('by-rut', 'rut', { unique: true })
        }

        // Pending transactions store
        if (!db.objectStoreNames.contains('pendingTransactions')) {
          const txStore = db.createObjectStore('pendingTransactions', { keyPath: 'id' })
          txStore.createIndex('by-timestamp', 'timestamp')
          txStore.createIndex('by-status', 'status')
        }

        // Sync metadata store
        if (!db.objectStoreNames.contains('syncStatus')) {
          db.createObjectStore('syncStatus', { keyPath: 'key' })
        }
      },
    })
  }

  private async getDB(): Promise<IDBPDatabase<CharcoSudDB>> {
    if (!this.db) {
      await this.init()
    }
    return this.db!
  }

  // ===== PRODUCTOS =====
  async saveProductos(productos: Producto[]): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction('productos', 'readwrite')
    await Promise.all(productos.map(p => tx.store.put(p)))
    await tx.done
  }

  async getProductos(): Promise<Producto[]> {
    const db = await this.getDB()
    return db.getAll('productos')
  }

  async getProducto(id: string): Promise<Producto | undefined> {
    const db = await this.getDB()
    return db.get('productos', id)
  }

  async updateProductoStock(id: string, newStock: number): Promise<void> {
    const db = await this.getDB()
    const producto = await db.get('productos', id)
    if (producto) {
      producto.stock_actual = newStock
      producto.updated_at = new Date().toISOString()
      await db.put('productos', producto)
    }
  }

  async deleteProducto(id: string): Promise<void> {
    const db = await this.getDB()
    await db.delete('productos', id)
  }

  async clearProductos(): Promise<void> {
    const db = await this.getDB()
    await db.clear('productos')
  }

  // ===== CLIENTES =====
  async saveClientes(clientes: Cliente[]): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction('clientes', 'readwrite')
    await Promise.all(clientes.map(c => tx.store.put(c)))
    await tx.done
  }

  async getClientes(): Promise<Cliente[]> {
    const db = await this.getDB()
    return db.getAll('clientes')
  }

  async getCliente(id: string): Promise<Cliente | undefined> {
    const db = await this.getDB()
    return db.get('clientes', id)
  }

  async deleteCliente(id: string): Promise<void> {
    const db = await this.getDB()
    await db.delete('clientes', id)
  }

  async clearClientes(): Promise<void> {
    const db = await this.getDB()
    await db.clear('clientes')
  }

  // ===== PENDING TRANSACTIONS =====
  async addPendingTransaction(transaction: Omit<PendingTransaction, 'id'>): Promise<string> {
    const db = await this.getDB()
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const tx: PendingTransaction = { id, ...transaction }
    await db.add('pendingTransactions', tx)
    return id
  }

  async getPendingTransactions(): Promise<PendingTransaction[]> {
    const db = await this.getDB()
    const index = db.transaction('pendingTransactions').store.index('by-status')
    return index.getAll('pending')
  }

  async getAllPendingTransactions(): Promise<PendingTransaction[]> {
    const db = await this.getDB()
    return db.getAll('pendingTransactions')
  }

  async updateTransactionStatus(
    id: string,
    status: PendingTransaction['status'],
    error?: string
  ): Promise<void> {
    const db = await this.getDB()
    const tx = await db.get('pendingTransactions', id)
    if (tx) {
      tx.status = status
      if (error) tx.error = error
      if (status === 'failed') tx.retryCount++
      await db.put('pendingTransactions', tx)
    }
  }

  async deletePendingTransaction(id: string): Promise<void> {
    const db = await this.getDB()
    await db.delete('pendingTransactions', id)
  }

  async clearCompletedTransactions(): Promise<void> {
    const db = await this.getDB()
    const all = await db.getAll('pendingTransactions')
    const completed = all.filter(t => t.status === 'completed')
    const tx = db.transaction('pendingTransactions', 'readwrite')
    await Promise.all(completed.map(t => tx.store.delete(t.id)))
    await tx.done
  }

  // ===== SYNC METADATA =====
  async getLastSyncTime(key: string): Promise<number> {
    const db = await this.getDB()
    const meta = await db.get('syncStatus', key)
    return meta?.lastSync || 0
  }

  async setLastSyncTime(key: string, timestamp: number): Promise<void> {
    const db = await this.getDB()
    await db.put('syncStatus', { key, lastSync: timestamp, syncInProgress: false })
  }

  async setSyncInProgress(key: string, inProgress: boolean): Promise<void> {
    const db = await this.getDB()
    const meta = await db.get('syncStatus', key) || { key, lastSync: 0, syncInProgress: false }
    meta.syncInProgress = inProgress
    await db.put('syncStatus', meta)
  }

  async isSyncInProgress(key: string): Promise<boolean> {
    const db = await this.getDB()
    const meta = await db.get('syncStatus', key)
    return meta?.syncInProgress || false
  }

  // ===== UTILITY =====
  async clearAll(): Promise<void> {
    const db = await this.getDB()
    await Promise.all([
      db.clear('productos'),
      db.clear('clientes'),
      db.clear('pendingTransactions'),
      db.clear('syncStatus'),
    ])
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Singleton instance
export const db = new DatabaseService()
