import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit2, Trash2, MapPin, Phone, Mail } from 'lucide-react'
import { Button, Input, Select, Modal, Loading, Card } from '@/components'
import { clientesService } from '@/services/clientes'
import { Cliente, ClienteFormData } from '@/types'
import { formatRUT, validateRUT, cleanRUT } from '@/utils/format'
import { COMUNAS_RM } from '@/utils/constants'

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [formData, setFormData] = useState<ClienteFormData>({
    nombre_tienda: '',
    rut: '',
    direccion: '',
    comuna: 'Santiago',
    contacto_nombre: '',
    contacto_telefono: '',
    email: '',
  })
  const [formError, setFormError] = useState('')
  const [rutError, setRutError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    try {
      setLoading(true)
      const data = await clientesService.getAll()
      setClientes(data)
    } catch (error) {
      console.error('Error loading clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente)
      setFormData({
        nombre_tienda: cliente.nombre_tienda,
        rut: cliente.rut,
        direccion: cliente.direccion,
        comuna: cliente.comuna,
        contacto_nombre: cliente.contacto_nombre,
        contacto_telefono: cliente.contacto_telefono,
        email: cliente.email || '',
      })
    } else {
      setEditingCliente(null)
      setFormData({
        nombre_tienda: '',
        rut: '',
        direccion: '',
        comuna: 'Santiago',
        contacto_nombre: '',
        contacto_telefono: '',
        email: '',
      })
    }
    setFormError('')
    setRutError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCliente(null)
    setFormError('')
    setRutError('')
  }

  const handleRutChange = (value: string) => {
    const formatted = formatRUT(value)
    setFormData({ ...formData, rut: formatted })

    if (formatted.length >= 3) {
      const isValid = validateRUT(formatted)
      setRutError(isValid ? '' : 'RUT inválido')
    } else {
      setRutError('')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')

    // Validate RUT
    if (!validateRUT(formData.rut)) {
      setRutError('RUT inválido')
      return
    }

    setSubmitting(true)

    try {
      const cleanedRut = cleanRUT(formData.rut)
      const dataToSubmit = {
        ...formData,
        rut: cleanedRut,
        email: formData.email || undefined,
      }

      if (editingCliente) {
        await clientesService.update(editingCliente.id, dataToSubmit)
      } else {
        await clientesService.create(dataToSubmit)
      }
      await loadClientes()
      handleCloseModal()
    } catch (error: any) {
      console.error('Error saving cliente:', error)
      setFormError(error.message || 'Error al guardar el cliente')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (cliente: Cliente) => {
    if (!confirm(`¿Está seguro de eliminar el cliente "${cliente.nombre_tienda}"?`)) {
      return
    }

    try {
      await clientesService.delete(cliente.id)
      await loadClientes()
    } catch (error: any) {
      console.error('Error deleting cliente:', error)
      alert('Error al eliminar el cliente: ' + error.message)
    }
  }

  const filteredClientes = clientes.filter((c) =>
    c.nombre_tienda.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rut.includes(searchTerm) ||
    c.contacto_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <Loading text="Cargando clientes..." />
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Clientes</h1>
        <p className="text-gray-600">Gestión de tiendas</p>
      </div>

      {/* Actions Bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder="Buscar por nombre, RUT o contacto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => handleOpenModal()} className="sm:w-auto">
          <Plus size={20} className="inline mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Clients List */}
      {filteredClientes.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredClientes.map((cliente) => (
            <Card key={cliente.id}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{cliente.nombre_tienda}</h3>
                  <p className="text-sm text-gray-500">RUT: {formatRUT(cliente.rut)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(cliente)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(cliente)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-900">{cliente.direccion}</p>
                    <p className="text-gray-500">{cliente.comuna}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-gray-900">{cliente.contacto_nombre}</p>
                    <p className="text-gray-500">{cliente.contacto_telefono}</p>
                  </div>
                </div>

                {cliente.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400 flex-shrink-0" />
                    <p className="text-gray-500">{cliente.email}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre de la Tienda"
              value={formData.nombre_tienda}
              onChange={(e) => setFormData({ ...formData, nombre_tienda: e.target.value })}
              required
              placeholder="Ej: Delicatessen El Gourmet"
            />

            <Input
              label="RUT"
              value={formData.rut}
              onChange={(e) => handleRutChange(e.target.value)}
              error={rutError}
              required
              placeholder="12.345.678-9"
              maxLength={12}
            />
          </div>

          <Input
            label="Dirección"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            required
            placeholder="Av. Providencia 1234"
          />

          <Select
            label="Comuna"
            value={formData.comuna}
            onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
            options={COMUNAS_RM.map(c => ({ value: c, label: c }))}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Contacto"
              value={formData.contacto_nombre}
              onChange={(e) => setFormData({ ...formData, contacto_nombre: e.target.value })}
              required
              placeholder="Juan Pérez"
            />

            <Input
              label="Teléfono"
              value={formData.contacto_telefono}
              onChange={(e) => setFormData({ ...formData, contacto_telefono: e.target.value })}
              required
              placeholder="+56 9 1234 5678"
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contacto@tienda.cl"
            helperText="Opcional"
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
            <Button type="submit" variant="primary" fullWidth disabled={submitting || !!rutError}>
              {submitting ? 'Guardando...' : editingCliente ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
