import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Package, TrendingDown, Plus, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { Card, Loading, Button, Input } from '@/components'
import { productosService } from '@/services/productos'
import { Producto } from '@/types'
import { formatCurrency, formatKg } from '@/utils/format'

export default function Dashboard() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadProductos()
  }, [])

  const loadProductos = async () => {
    try {
      setLoading(true)
      const data = await productosService.getActive()
      setProductos(data)
    } catch (error) {
      console.error('Error loading productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProductos = productos.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const bajoStockProductos = filteredProductos.filter(p => p.stock_actual < p.stock_minimo)
  const sinStockProductos = filteredProductos.filter(p => p.stock_actual === 0)

  const totalValorStock = productos.reduce((sum, p) => sum + (p.stock_actual * p.costo_por_kg), 0)
  const totalKgStock = productos.reduce((sum, p) => sum + p.stock_actual, 0)

  if (loading) {
    return <Loading text="Cargando dashboard..." />
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Resumen de inventario y alertas</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Button
          variant="primary"
          onClick={() => navigate('/inventario?action=entrada')}
          className="flex-col h-auto py-4"
        >
          <ArrowDownToLine size={24} className="mb-2" />
          <span>Nueva Entrada</span>
        </Button>
        <Button
          variant="success"
          onClick={() => navigate('/inventario?action=salida')}
          className="flex-col h-auto py-4"
        >
          <ArrowUpFromLine size={24} className="mb-2" />
          <span>Nueva Salida</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/productos')}
          className="flex-col h-auto py-4"
        >
          <Package size={24} className="mb-2" />
          <span>Productos</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/reportes')}
          className="flex-col h-auto py-4"
        >
          <TrendingDown size={24} className="mb-2" />
          <span>Reportes</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{productos.length}</p>
            </div>
            <Package size={40} className="text-primary opacity-20" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Stock Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatKg(totalKgStock)}</p>
            </div>
            <Package size={40} className="text-secondary opacity-20" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Valor Inventario</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValorStock)}</p>
            </div>
            <Package size={40} className="text-success opacity-20" />
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {sinStockProductos.length > 0 && (
        <div className="mb-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center mb-2">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <h3 className="font-semibold text-red-900">
                Productos sin stock ({sinStockProductos.length})
              </h3>
            </div>
            <div className="text-sm text-red-700">
              {sinStockProductos.map(p => p.nombre).join(', ')}
            </div>
          </div>
        </div>
      )}

      {bajoStockProductos.length > 0 && (
        <div className="mb-6">
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <div className="flex items-center mb-2">
              <AlertCircle className="text-orange-500 mr-2" size={20} />
              <h3 className="font-semibold text-orange-900">
                Productos con stock bajo ({bajoStockProductos.length})
              </h3>
            </div>
            <div className="text-sm text-orange-700">
              {bajoStockProductos.map(p => p.nombre).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar producto por nombre o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stock Table */}
      <Card title="Stock Actual">
        {filteredProductos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-900">Producto</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-900">SKU</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-900">Stock</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-900">Mínimo</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-900">Valor</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-900">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProductos.map((producto) => {
                  const bajoStock = producto.stock_actual < producto.stock_minimo
                  const sinStock = producto.stock_actual === 0
                  const valorTotal = producto.stock_actual * producto.costo_por_kg

                  return (
                    <tr key={producto.id} className={sinStock ? 'bg-red-50' : bajoStock ? 'bg-orange-50' : ''}>
                      <td className="p-3 text-sm font-medium text-gray-900">{producto.nombre}</td>
                      <td className="p-3 text-sm text-gray-600">{producto.sku}</td>
                      <td className={`p-3 text-sm text-right font-medium ${sinStock ? 'text-red-600' : bajoStock ? 'text-orange-600' : 'text-gray-900'}`}>
                        {formatKg(producto.stock_actual)}
                      </td>
                      <td className="p-3 text-sm text-right text-gray-600">
                        {formatKg(producto.stock_minimo)}
                      </td>
                      <td className="p-3 text-sm text-right text-gray-900">
                        {formatCurrency(valorTotal)}
                      </td>
                      <td className="p-3 text-center">
                        {sinStock ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle size={14} className="mr-1" />
                            Sin Stock
                          </span>
                        ) : bajoStock ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <AlertCircle size={14} className="mr-1" />
                            Bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
