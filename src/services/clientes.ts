import { supabase } from './supabase'
import { Cliente, ClienteFormData } from '@/types'

export const clientesService = {
  // Get all clients
  async getAll(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre_tienda', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get active clients
  async getActive(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('activo', true)
      .order('nombre_tienda', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get client by ID
  async getById(id: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Get client by RUT
  async getByRUT(rut: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('rut', rut)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data || null
  },

  // Create client
  async create(cliente: ClienteFormData): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .insert([
        {
          ...cliente,
          activo: true,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update client
  async update(id: string, cliente: Partial<ClienteFormData>): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        ...cliente,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete client (soft delete)
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .update({ activo: false })
      .eq('id', id)

    if (error) throw error
  },

  // Hard delete client
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Search clients by name or RUT
  async search(query: string): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .or(`nombre_tienda.ilike.%${query}%,rut.ilike.%${query}%`)
      .eq('activo', true)
      .order('nombre_tienda', { ascending: true })
      .limit(10)

    if (error) throw error
    return data || []
  },
}
