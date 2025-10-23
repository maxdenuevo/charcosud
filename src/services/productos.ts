import { supabase } from './supabase'
import { Producto, ProductoFormData } from '@/types'

export const productosService = {
  // Get all products
  async getAll(): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get active products
  async getActive(): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get product by ID
  async getById(id: string): Promise<Producto | null> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create product
  async create(producto: ProductoFormData): Promise<Producto> {
    const { data, error } = await supabase
      .from('productos')
      .insert([
        {
          ...producto,
          stock_actual: 0, // Initial stock is 0
          activo: true,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update product
  async update(id: string, producto: Partial<ProductoFormData>): Promise<Producto> {
    const { data, error } = await supabase
      .from('productos')
      .update({
        ...producto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete product (soft delete)
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', id)

    if (error) throw error
  },

  // Hard delete product
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Check if product has stock movements
  async hasMovements(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('movimientos')
      .select('id')
      .eq('producto_id', id)
      .limit(1)

    if (error) throw error
    return (data?.length || 0) > 0
  },
}
