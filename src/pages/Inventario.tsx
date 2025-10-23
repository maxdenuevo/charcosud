import { useState, useEffect, FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, Plus, Minus, ShoppingCart, Trash2, X } from 'lucide-react'
import { Button, Input, Select, Card, Loading, Modal } from '@/components'
import { offlineInventarioService } from '@/services/offlineInventario'
import { Producto, Cliente, CarritoItem, EntradaFormData } from '@/types'
import { formatCurrency, formatKg } from '@/utils/format'
import { useAuth } from '@/contexts/AuthContext'

type Tab = 'entrada' | 'salida'

export default function Inventario() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('action') as Tab) || 'entrada'
  )

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventario</h1>
        <p className="text-gray-600">Gestión de entradas y salidas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('entrada')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'entrada'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowDownToLine size={20} />
          Entradas
        </button>
        <button
          onClick={() => setActiveTab('salida')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'salida'
              ? 'border-success text-success'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowUpFromLine size={20} />
          Salidas
        </button>
      </div>

      {/* Content */}
      {activeTab === 'entrada' ? <EntradaTab userId={user?.id} /> : <SalidaTab userId={user?.id} />}
    </div>
  )
}

// Entrada (Entry) Tab Component
function EntradaTab({ userId }: { userId?: string }) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<EntradaFormData>({
    producto_id: '',
    cantidad_kg: 0,
    guia_despacho: '',
    notas: '',
  })

  useEffect(() => {
    loadProductos()
  }, [])

  const loadProductos = async () => {
    try {
      setLoading(true)
      const data = await offlineInventarioService.getProductos()
      setProductos(data)
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, producto_id: data[0].id }))
      }
    } catch (error) {
      console.error('Error loading productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await offlineInventarioService.registrarEntrada(formData, userId)
      setSuccess(`Entrada registrada: ${formatKg(formData.cantidad_kg)}`)
      setFormData({
        producto_id: productos[0]?.id || '',
        cantidad_kg: 0,
        guia_despacho: '',
        notas: '',
      })
      // Reload productos to get updated stock
      await loadProductos()
    } catch (error: any) {
      console.error('Error registering entrada:', error)
      setError(error.message || 'Error al registrar la entrada')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProducto = productos.find(p => p.id === formData.producto_id)

  if (loading) {
    return <Loading text="Cargando productos..." />
  }

  return (
    <div className="max-w-2xl">
      <Card title="Nueva Entrada de Mercadería">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Producto"
            value={formData.producto_id}
            onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
            options={productos.map(p => ({
              value: p.id,
              label: `${p.nombre} - Stock actual: ${formatKg(p.stock_actual)}`
            }))}
            required
          />

          {selectedProducto && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">SKU:</p>
                  <p className="font-medium">{selectedProducto.sku}</p>
                </div>
                <div>
                  <p className="text-gray-600">Stock Actual:</p>
                  <p className="font-medium">{formatKg(selectedProducto.stock_actual)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Proveedor:</p>
                  <p className="font-medium">{selectedProducto.proveedor}</p>
                </div>
                <div>
                  <p className="text-gray-600">Stock Mínimo:</p>
                  <p className="font-medium">{formatKg(selectedProducto.stock_minimo)}</p>
                </div>
              </div>
            </div>
          )}

          <Input
            label="Cantidad Recibida (kg)"
            type="number"
            step="0.001"
            min="0.001"
            value={formData.cantidad_kg || ''}
            onChange={(e) => setFormData({ ...formData, cantidad_kg: parseFloat(e.target.value) || 0 })}
            required
            placeholder="15.500"
            helperText="Ingrese la cantidad en kilogramos (hasta 3 decimales)"
          />

          <Input
            label="N° Guía de Despacho"
            value={formData.guia_despacho}
            onChange={(e) => setFormData({ ...formData, guia_despacho: e.target.value })}
            placeholder="Opcional"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={3}
              className="input w-full"
              placeholder="Observaciones adicionales (opcional)"
            />
          </div>

          {selectedProducto && formData.cantidad_kg > 0 && (
            <div className="bg-primary-light bg-opacity-10 border border-primary p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Stock después de la entrada:</p>
              <p className="text-2xl font-bold text-primary">
                {formatKg(selectedProducto.stock_actual + formData.cantidad_kg)}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? 'Registrando...' : 'Confirmar Entrada'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

// Salida (Exit/Sale) Tab Component
function SalidaTab({ userId }: { userId?: string }) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [clienteSearchTerm, setClienteSearchTerm] = useState('')
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Numeric keypad state
  const [showNumPad, setShowNumPad] = useState(false)
  const [numPadProducto, setNumPadProducto] = useState<Producto | null>(null)
  const [numPadValue, setNumPadValue] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productosData, clientesData] = await Promise.all([
        offlineInventarioService.getProductos(),
        offlineInventarioService.getClientes(),
      ])
      setProductos(productosData)
      setClientes(clientesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setShowClienteModal(false)
    setClienteSearchTerm('')
  }

  const handleOpenNumPad = (producto: Producto) => {
    setNumPadProducto(producto)
    const existing = carrito.find(item => item.producto.id === producto.id)
    setNumPadValue(existing ? existing.cantidad_kg.toString() : '')
    setShowNumPad(true)
  }

  const handleNumPadClick = (value: string) => {
    if (value === 'C') {
      setNumPadValue('')
    } else if (value === '⌫') {
      setNumPadValue(prev => prev.slice(0, -1))
    } else if (value === '.') {
      if (!numPadValue.includes('.')) {
        setNumPadValue(prev => prev + '.')
      }
    } else {
      // Limit to 3 decimal places
      const parts = numPadValue.split('.')
      if (parts.length === 2 && parts[1].length >= 3) {
        return
      }
      setNumPadValue(prev => prev + value)
    }
  }

  const handleAddToCart = () => {
    if (!numPadProducto || !numPadValue || parseFloat(numPadValue) <= 0) return

    const cantidad = parseFloat(numPadValue)

    if (cantidad > numPadProducto.stock_actual) {
      alert(`Stock insuficiente. Disponible: ${formatKg(numPadProducto.stock_actual)}`)
      return
    }

    const existingIndex = carrito.findIndex(item => item.producto.id === numPadProducto.id)

    if (existingIndex >= 0) {
      const newCarrito = [...carrito]
      newCarrito[existingIndex].cantidad_kg = cantidad
      setCarrito(newCarrito)
    } else {
      setCarrito([...carrito, { producto: numPadProducto, cantidad_kg: cantidad }])
    }

    setShowNumPad(false)
    setNumPadValue('')
    setNumPadProducto(null)
  }

  const handleRemoveFromCart = (productoId: string) => {
    setCarrito(carrito.filter(item => item.producto.id !== productoId))
  }

  const handleConfirmSalida = async () => {
    if (!selectedCliente) {
      alert('Debe seleccionar un cliente')
      return
    }

    if (carrito.length === 0) {
      alert('El carrito está vacío')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      await offlineInventarioService.registrarSalida(
        {
          cliente_id: selectedCliente.id,
          items: carrito,
        },
        userId
      )

      alert('Despacho registrado exitosamente')
      setCarrito([])
      setSelectedCliente(null)
      await loadData()
    } catch (error: any) {
      console.error('Error registering salida:', error)
      setError(error.message || 'Error al registrar la salida')
    } finally {
      setSubmitting(false)
    }
  }

  const totalClp = carrito.reduce(
    (sum, item) => sum + item.cantidad_kg * item.producto.precio_venta_por_kg,
    0
  )

  const totalKg = carrito.reduce((sum, item) => sum + item.cantidad_kg, 0)

  const filteredProductos = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredClientes = clientes.filter(c =>
    c.nombre_tienda.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
    c.rut.includes(clienteSearchTerm)
  )

  if (loading) {
    return <Loading text="Cargando..." />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Product Selection */}
      <div className="lg:col-span-2">
        <Card>
          {/* Client Selection */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            {selectedCliente ? (
              <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Cliente:</p>
                  <p className="font-semibold text-gray-900">{selectedCliente.nombre_tienda}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowClienteModal(true)}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowClienteModal(true)}
                variant="primary"
                fullWidth
              >
                Seleccionar Cliente
              </Button>
            )}
          </div>

          {/* Product Search */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
            {filteredProductos.map(producto => (
              <button
                key={producto.id}
                onClick={() => handleOpenNumPad(producto)}
                disabled={producto.stock_actual === 0}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  producto.stock_actual === 0
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-primary hover:bg-primary hover:bg-opacity-5 active:scale-95'
                }`}
              >
                <h3 className="font-semibold text-sm mb-1">{producto.nombre}</h3>
                <p className="text-xs text-gray-600 mb-2">{producto.sku}</p>
                <p className="text-xs text-gray-600">Stock: {formatKg(producto.stock_actual)}</p>
                <p className="text-sm font-medium text-primary mt-1">
                  {formatCurrency(producto.precio_venta_por_kg)}/kg
                </p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Right: Cart */}
      <div>
        <Card title="Carrito">
          {carrito.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-30" />
              <p>Carrito vacío</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                {carrito.map(item => (
                  <div key={item.producto.id} className="flex items-start justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.producto.nombre}</p>
                      <p className="text-xs text-gray-600">
                        {formatKg(item.cantidad_kg)} × {formatCurrency(item.producto.precio_venta_por_kg)}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {formatCurrency(item.cantidad_kg * item.producto.precio_venta_por_kg)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.producto.id)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total kg:</span>
                  <span className="font-medium">{formatKg(totalKg)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(totalClp)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleConfirmSalida}
                variant="success"
                fullWidth
                className="mt-4"
                disabled={!selectedCliente || submitting}
              >
                {submitting ? 'Procesando...' : 'Confirmar Despacho'}
              </Button>
            </>
          )}
        </Card>
      </div>

      {/* Cliente Selection Modal */}
      <Modal
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        title="Seleccionar Cliente"
        size="md"
      >
        <Input
          type="text"
          placeholder="Buscar por nombre o RUT..."
          value={clienteSearchTerm}
          onChange={(e) => setClienteSearchTerm(e.target.value)}
          className="mb-4"
        />
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredClientes.map(cliente => (
            <button
              key={cliente.id}
              onClick={() => handleSelectCliente(cliente)}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary transition-colors"
            >
              <p className="font-semibold">{cliente.nombre_tienda}</p>
              <p className="text-sm text-gray-600">{cliente.contacto_nombre}</p>
              <p className="text-xs text-gray-500">{cliente.comuna}</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* Numeric Keypad Modal */}
      <Modal
        isOpen={showNumPad}
        onClose={() => setShowNumPad(false)}
        title={numPadProducto?.nombre || ''}
        size="sm"
      >
        {numPadProducto && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Stock disponible:</p>
              <p className="text-lg font-semibold">{formatKg(numPadProducto.stock_actual)}</p>
              <p className="text-sm text-gray-600 mt-2">Precio:</p>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(numPadProducto.precio_venta_por_kg)}/kg
              </p>
            </div>

            {/* Display */}
            <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Cantidad (kg):</p>
              <p className="text-3xl font-bold text-gray-900 min-h-[44px]">
                {numPadValue || '0'}
              </p>
              {numPadValue && (
                <p className="text-sm text-primary mt-2">
                  Total: {formatCurrency(parseFloat(numPadValue || '0') * numPadProducto.precio_venta_por_kg)}
                </p>
              )}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'].map(key => (
                <button
                  key={key}
                  onClick={() => handleNumPadClick(key)}
                  className="btn btn-outline text-xl font-semibold h-14"
                >
                  {key}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => handleNumPadClick('C')}>
                Limpiar
              </Button>
              <Button variant="primary" onClick={handleAddToCart}>
                Agregar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
