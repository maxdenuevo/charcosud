import { useState, useEffect } from 'react'
import { Wifi, WifiOff, CloudOff, Cloud, AlertCircle } from 'lucide-react'
import { syncManager } from '@/services/syncManager'
import { db } from '@/services/db'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncStatus, setSyncStatus] = useState<string>('')
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    const updatePendingCount = async () => {
      const count = await syncManager.getPendingCount()
      setPendingCount(count)
    }

    // Listen to online/offline events
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Listen to sync events
    const unsubscribe = syncManager.onSync((event) => {
      if (event.type === 'sync-start') {
        setSyncStatus(event.message || 'Sincronizando...')
      } else if (event.type === 'sync-progress') {
        setSyncStatus(event.message || '')
      } else if (event.type === 'sync-complete') {
        setSyncStatus(event.message || 'Sincronizado')
        updatePendingCount()
        setTimeout(() => setSyncStatus(''), 3000)
      } else if (event.type === 'sync-error') {
        setSyncStatus(event.message || 'Error al sincronizar')
        setTimeout(() => setSyncStatus(''), 5000)
      }
    })

    // Initial check
    updatePendingCount()

    // Check pending count every 30 seconds
    const interval = setInterval(updatePendingCount, 30000)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const handleForceSync = async () => {
    try {
      await syncManager.forceSync()
    } catch (error) {
      console.error('Force sync error:', error)
    }
  }

  return (
    <div className="fixed top-16 right-4 z-40">
      <div
        className="flex items-center gap-2 bg-white border-2 rounded-lg shadow-lg px-3 py-2 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setShowDetails(!showDetails)}
      >
        {/* Online/Offline Indicator */}
        {isOnline ? (
          <Wifi size={20} className="text-success" />
        ) : (
          <WifiOff size={20} className="text-alert" />
        )}

        {/* Pending Count Badge */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-1">
            <CloudOff size={16} className="text-orange-500" />
            <span className="text-xs font-semibold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          </div>
        )}

        {/* Sync Status */}
        {syncStatus && (
          <span className="text-xs text-gray-600 max-w-[150px] truncate">
            {syncStatus}
          </span>
        )}
      </div>

      {/* Details Dropdown */}
      {showDetails && (
        <div className="mt-2 bg-white border-2 rounded-lg shadow-xl p-4 min-w-[250px]">
          <div className="space-y-3">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Conexión:</span>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <Cloud size={16} className="text-success" />
                    <span className="text-sm text-success font-medium">En línea</span>
                  </>
                ) : (
                  <>
                    <CloudOff size={16} className="text-alert" />
                    <span className="text-sm text-alert font-medium">Sin conexión</span>
                  </>
                )}
              </div>
            </div>

            {/* Pending Transactions */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Pendientes:</span>
              <span className="text-sm font-semibold">
                {pendingCount} {pendingCount === 1 ? 'transacción' : 'transacciones'}
              </span>
            </div>

            {/* Warning if offline with pending */}
            {!isOnline && pendingCount > 0 && (
              <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded p-2">
                <AlertCircle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-800">
                  Las transacciones se sincronizarán automáticamente cuando se restablezca la conexión.
                </p>
              </div>
            )}

            {/* Force Sync Button */}
            {isOnline && pendingCount > 0 && (
              <button
                onClick={handleForceSync}
                className="w-full btn btn-primary text-sm py-2"
              >
                Sincronizar Ahora
              </button>
            )}

            {/* All synced message */}
            {isOnline && pendingCount === 0 && (
              <div className="text-center py-2">
                <Cloud size={32} className="text-success mx-auto mb-1" />
                <p className="text-sm text-success font-medium">
                  Todo sincronizado
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
