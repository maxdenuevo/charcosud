import { supabase } from './supabase'
import { Movimiento, Despacho, EntradaFormData, SalidaFormData, CarritoItem } from '@/types'

export const inventarioService = {
  // Register entry (receiving goods)
  async registrarEntrada(entrada: EntradaFormData, userId?: string): Promise<Movimiento> {
    // Get current stock
    const { data: producto, error: prodError } = await supabase
      .from('productos')
      .select('stock_actual')
      .eq('id', entrada.producto_id)
      .single()

    if (prodError) throw prodError

    const nuevoStock = producto.stock_actual + entrada.cantidad_kg

    // Create movement
    const { data: movimiento, error: movError } = await supabase
      .from('movimientos')
      .insert([
        {
          tipo: 'entrada',
          producto_id: entrada.producto_id,
          cantidad_kg: entrada.cantidad_kg,
          stock_resultante: nuevoStock,
          guia_despacho: entrada.guia_despacho,
          notas: entrada.notas,
          usuario_id: userId,
        },
      ])
      .select()
      .single()

    if (movError) throw movError

    // Update product stock
    const { error: updateError } = await supabase
      .from('productos')
      .update({
        stock_actual: nuevoStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', entrada.producto_id)

    if (updateError) throw updateError

    return movimiento
  },

  // Register exit (sale/dispatch)
  async registrarSalida(salida: SalidaFormData, userId?: string): Promise<Despacho> {
    // Calculate total
    let totalClp = 0
    const productosData: any[] = []

    // Validate stock and prepare data
    for (const item of salida.items) {
      const { data: producto, error } = await supabase
        .from('productos')
        .select('stock_actual, precio_venta_por_kg')
        .eq('id', item.producto.id)
        .single()

      if (error) throw error

      if (producto.stock_actual < item.cantidad_kg) {
        throw new Error(`Stock insuficiente para ${item.producto.nombre}`)
      }

      totalClp += item.cantidad_kg * producto.precio_venta_por_kg
      productosData.push({
        ...item,
        stock_actual: producto.stock_actual,
        precio_venta_por_kg: producto.precio_venta_por_kg,
      })
    }

    // Create despacho
    const { data: despacho, error: despachoError } = await supabase
      .from('despachos')
      .insert([
        {
          cliente_id: salida.cliente_id,
          total_clp: totalClp,
          usuario_id: userId,
        },
      ])
      .select()
      .single()

    if (despachoError) throw despachoError

    // Create movements for each item
    for (const itemData of productosData) {
      const nuevoStock = itemData.stock_actual - itemData.cantidad_kg

      // Create movement
      const { error: movError } = await supabase
        .from('movimientos')
        .insert([
          {
            tipo: 'salida',
            producto_id: itemData.producto.id,
            cliente_id: salida.cliente_id,
            cantidad_kg: itemData.cantidad_kg,
            stock_resultante: nuevoStock,
            despacho_id: despacho.id,
            usuario_id: userId,
          },
        ])

      if (movError) throw movError

      // Update product stock
      const { error: updateError } = await supabase
        .from('productos')
        .update({
          stock_actual: nuevoStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemData.producto.id)

      if (updateError) throw updateError
    }

    return despacho
  },

  // Get all movements
  async getMovimientos(): Promise<Movimiento[]> {
    const { data, error } = await supabase
      .from('movimientos')
      .select(`
        *,
        producto:productos(*),
        cliente:clientes(*)
      `)
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get movements by product
  async getMovimientosByProducto(productoId: string): Promise<Movimiento[]> {
    const { data, error } = await supabase
      .from('movimientos')
      .select(`
        *,
        producto:productos(*),
        cliente:clientes(*)
      `)
      .eq('producto_id', productoId)
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get movements by client
  async getMovimientosByCliente(clienteId: string): Promise<Movimiento[]> {
    const { data, error } = await supabase
      .from('movimientos')
      .select(`
        *,
        producto:productos(*),
        cliente:clientes(*)
      `)
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get movements by date range
  async getMovimientosByDateRange(startDate: string, endDate: string): Promise<Movimiento[]> {
    const { data, error } = await supabase
      .from('movimientos')
      .select(`
        *,
        producto:productos(*),
        cliente:clientes(*)
      `)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get all dispatches
  async getDespachos(): Promise<Despacho[]> {
    const { data, error } = await supabase
      .from('despachos')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .order('fecha', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get dispatch by ID with movements
  async getDespachoById(id: string): Promise<any> {
    const { data: despacho, error: despachoError } = await supabase
      .from('despachos')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .eq('id', id)
      .single()

    if (despachoError) throw despachoError

    const { data: movimientos, error: movError } = await supabase
      .from('movimientos')
      .select(`
        *,
        producto:productos(*)
      `)
      .eq('despacho_id', id)

    if (movError) throw movError

    return {
      ...despacho,
      movimientos,
    }
  },
}
