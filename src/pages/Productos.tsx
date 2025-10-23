import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { Button, Input, Modal, Loading, Card } from '@/components'
import { productosService } from '@/services/productos'
import { Producto, ProductoFormData } from '@/types'
import { formatCurrency, formatKg } from '@/utils/format'
import { DEFAULT_PROVEEDOR, DEFAULT_UNIDAD, DEFAULT_STOCK_MINIMO } from '@/utils/constants'

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [formData, setFormData] = useState<ProductoFormData>({
    sku: '',
    nombre: '',
    proveedor: DEFAULT_PROVEEDOR,
    unidad: DEFAULT_UNIDAD,
    costo_por_kg: 0,
    precio_venta_por_kg: 0,
    stock_minimo: DEFAULT_STOCK_MINIMO,
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadProductos()
  }, [])

  const loadProductos = async () => {
    try {
      setLoading(true)
      const data = await productosService.getAll()
      setProductos(data)
    } catch (error) {
      console.error('Error loading productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (producto?: Producto) => {
    if (producto) {
      setEditingProducto(producto)
      setFormData({
        sku: producto.sku,
        nombre: producto.nombre,
        proveedor: producto.proveedor,
        unidad: producto.unidad,
        costo_por_kg: producto.costo_por_kg,
        precio_venta_por_kg: producto.precio_venta_por_kg,
        stock_minimo: producto.stock_minimo,
      })
    } else {
      setEditingProducto(null)
      setFormData({
        sku: '',
        nombre: '',
        proveedor: DEFAULT_PROVEEDOR,
        unidad: DEFAULT_UNIDAD,
        costo_por_kg: 0,
        precio_venta_por_kg: 0,
        stock_minimo: DEFAULT_STOCK_MINIMO,
      })
    }
    setFormError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProducto(null)
    setFormError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      if (editingProducto) {
        await productosService.update(editingProducto.id, formData)
      } else {
        await productosService.create(formData)
      }
      await loadProductos()
      handleCloseModal()
    } catch (error: any) {
      console.error('Error saving producto:', error)
      setFormError(error.message || 'Error al guardar el producto')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (producto: Producto) => {
    if (!confirm(`¿Está seguro de eliminar el producto "${producto.nombre}"?`)) {
      return
    }

    try {
      await productosService.delete(producto.id)
      await loadProductos()
    } catch (error: any) {
      console.error('Error deleting producto:', error)
      alert('Error al eliminar el producto: ' + error.message)
    }
  }

  const filteredProductos = productos.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <Loading text="Cargando productos..." />
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Productos</h1>
        <p className="text-gray-600">Gestión de productos (SKUs)</p>
      </div>

      {/* Actions Bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => handleOpenModal()} className="sm:w-auto">
          <Plus size={20} className="inline mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Products List */}
      {filteredProductos.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredProductos.map((producto) => {
            const bajoStock = producto.stock_actual < producto.stock_minimo
            return (
              <Card key={producto.id} className={bajoStock ? 'border-2 border-alert' : ''}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{producto.nombre}</h3>
                    <p className="text-sm text-gray-500">SKU: {producto.sku}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(producto)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(producto)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock:</span>
                    <span className={`font-medium ${bajoStock ? 'text-alert' : 'text-gray-900'}`}>
                      {formatKg(producto.stock_actual)}
                      {bajoStock && <AlertCircle size={16} className="inline ml-1" />}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock Mínimo:</span>
                    <span className="font-medium">{formatKg(producto.stock_minimo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Costo:</span>
                    <span className="font-medium">{formatCurrency(producto.costo_por_kg)}/kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio Venta:</span>
                    <span className="font-medium text-primary">
                      {formatCurrency(producto.precio_venta_por_kg)}/kg
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="SKU / Código"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
            placeholder="Ej: LONG-001"
          />

          <Input
            label="Nombre del Producto"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
            placeholder="Ej: Longaniza Tradicional"
          />

          <Input
            label="Proveedor"
            value={formData.proveedor}
            onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
            required
          />

          <Input
            label="Unidad"
            value={formData.unidad}
            onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
            required
            disabled
            helperText="Por defecto: kg"
          />

          <Input
            label="Costo por Kg (CLP)"
            type="number"
            step="1"
            min="0"
            value={formData.costo_por_kg}
            onChange={(e) => setFormData({ ...formData, costo_por_kg: parseFloat(e.target.value) || 0 })}
            required
            placeholder="5000"
          />

          <Input
            label="Precio Venta por Kg (CLP)"
            type="number"
            step="1"
            min="0"
            value={formData.precio_venta_por_kg}
            onChange={(e) => setFormData({ ...formData, precio_venta_por_kg: parseFloat(e.target.value) || 0 })}
            required
            placeholder="8000"
          />

          <Input
            label="Stock Mínimo (kg)"
            type="number"
            step="0.001"
            min="0"
            value={formData.stock_minimo}
            onChange={(e) => setFormData({ ...formData, stock_minimo: parseFloat(e.target.value) || 0 })}
            required
            helperText="Alerta cuando el stock sea menor a este valor"
          />

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal} fullWidth>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" fullWidth disabled={submitting}>
              {submitting ? 'Guardando...' : editingProducto ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
