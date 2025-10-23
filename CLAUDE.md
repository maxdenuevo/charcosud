# CHARCOSUD - Sistema de Control de Inventario

## Contexto del Proyecto

**Cliente:** Mathias y Gabriel  
**Rubro:** Venta de charcutería y quesos a tiendas especializadas  
**Zona:** Región Metropolitana, Santiago, Chile  
**Proveedor:** Delicias del Sur (único proveedor, envíos desde el sur)  
**Clientes:** ~20 tiendas establecidas  
**SKUs:** 20-40 productos  
**Unidad de medida:** Kilogramos con decimales (ej: 1.85 kg)

---

## Stack Tecnológico

- **Frontend:** React + TypeScript + Vite
- **Estilos:** Tailwind CSS
- **Backend:** Supabase (BaaS)
- **Base de Datos:** PostgreSQL (incluido en Supabase)
- **Tipo App:** PWA (Progressive Web App)
- **Auth:** Supabase Auth
- **Hosting:** Vercel (frontend) + Supabase (backend/DB)

### Justificación del Stack

- **React + TypeScript:** Robusto, tipado seguro, ecosistema maduro
- **Supabase:** Reduce desarrollo backend dramáticamente (Auth, DB, API REST automática, Row Level Security)
- **PostgreSQL:** Maneja decimales perfectamente con `NUMERIC(10,3)`, ideal para kilos
- **Tailwind CSS:** Desarrollo rápido de UI, mobile-first por defecto
- **PWA:** Un solo código base, funciona en iOS/Android/Desktop, instalable, modo offline básico

---

## FASE 1: MVP (60-80 horas)

### Módulos Core

#### 1. Gestión de Productos (SKUs)
- CRUD completo
- Campos:
  - Nombre (ej: "Salame Ahumado")
  - SKU/Código interno
  - Proveedor: "Delicias del Sur" (default)
  - Unidad: "kg" (fijo)
  - Costo por Kg (CLP)
  - Precio Venta por Kg (CLP)
  - Stock Actual (calculado, no editable manualmente)
  - Stock Mínimo (para alertas)

#### 2. Gestión de Clientes (Tiendas)
- CRUD completo
- Campos:
  - Nombre Tienda
  - RUT (formato: 12.345.678-9)
  - Dirección
  - Comuna
  - Contacto (nombre + teléfono)
  - Email (opcional)
- Búsqueda/filtrado rápido
- Autocomplete al seleccionar en ventas

#### 3. Módulo de Inventario - Entradas (Recepción)
- Formulario simple para registro de mercadería recibida
- Campos:
  - Fecha recepción (default: hoy)
  - Producto (selector)
  - Kilos Recibidos (input numérico con hasta 3 decimales)
  - N° Guía Despacho (opcional, texto)
  - Notas (opcional)
- Acción: `stock_actual = stock_actual + kilos_recibidos`

#### 4. Módulo de Inventario - Salidas (Ventas/Despachos)
- Interfaz tipo "carrito de compras" optimizada para touch
- Flujo:
  1. Seleccionar Cliente (autocomplete con búsqueda)
  2. Agregar productos al carrito:
     - Cuadrícula visual de productos (cards con nombre)
     - Al tocar producto → Modal/slide con teclado numérico grande
     - Input: kilos vendidos (ej: 1.85)
     - Botón "Agregar al Carrito"
  3. Vista del carrito (resumen)
  4. Botón "Confirmar Despacho"
- Validación: No permitir vender más de lo disponible en stock

#### 5. Dashboard (Pantalla Principal)
- Vista de stock actual de todos los productos
- Alerta visual: Resaltar en rojo/naranja productos bajo stock mínimo
- Búsqueda/filtro por nombre de producto
- Botones de acción rápida: "Nueva Entrada" / "Nueva Venta"

#### 6. Historial de Movimientos (Kardex Simplificado)
- Tabla con todos los movimientos (entradas y salidas)
- Columnas:
  - Fecha (DD-MM-YYYY HH:mm)
  - Tipo (Entrada/Salida)
  - Producto
  - Cliente (solo en salidas)
  - Cantidad (kg)
  - Stock Resultante
  - Usuario (Mathias/Gabriel)
- Filtros: Por rango de fechas, tipo, producto, cliente
- Exportar a CSV

#### 7. Reporte Básico: Ventas por Cliente
- Período seleccionable (últimos 7/30/90 días)
- Mostrar por cada cliente:
  - Total vendido (CLP)
  - Total vendido (kg)
  - N° de transacciones
  - Último despacho (fecha)

---

## Consideraciones UX/UI para MVP

### Mobile-First (Crítico)
- Diseño pensado primero para móvil (trabajan en terreno)
- Botones táctiles grandes (mínimo 44×44px)
- Inputs numéricos con teclado nativo optimizado
- Scroll suave

### Interfaz inspirada en "Pesa de Supermercado"
- Visual limpia, mínima distracción
- Números grandes y legibles
- Feedback inmediato
- Confirmaciones claras

### Paleta de Colores (Chile/Charcutería)
- Primario: Rojo vino (#8B0000) o terracota
- Secundario: Mostaza/dorado
- Alertas: Rojo brillante (stock bajo)
- Éxito: Verde suave
- Neutros: Grises para backgrounds

### Navegación
- Bottom navigation bar (móvil) con íconos:
  - Dashboard
  - Inventario (entradas/salidas)
  - Clientes
  - Reportes
- Sidebar para desktop

---

## Modelo de Datos (PostgreSQL/Supabase)

### Tabla: productos
```sql
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  proveedor VARCHAR(255) DEFAULT 'Delicias del Sur',
  unidad VARCHAR(10) DEFAULT 'kg',
  costo_por_kg NUMERIC(10,2) NOT NULL,
  precio_venta_por_kg NUMERIC(10,2) NOT NULL,
  stock_actual NUMERIC(10,3) DEFAULT 0,
  stock_minimo NUMERIC(10,3) DEFAULT 5,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: clientes
```sql
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_tienda VARCHAR(255) NOT NULL,
  rut VARCHAR(12) UNIQUE NOT NULL,
  direccion TEXT,
  comuna VARCHAR(100),
  contacto_nombre VARCHAR(255),
  contacto_telefono VARCHAR(20),
  email VARCHAR(255),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: movimientos
```sql
CREATE TABLE movimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cantidad_kg NUMERIC(10,3) NOT NULL,
  stock_resultante NUMERIC(10,3) NOT NULL,
  guia_despacho VARCHAR(100),
  notas TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  despacho_id UUID REFERENCES despachos(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: despachos
```sql
CREATE TABLE despachos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  total_clp NUMERIC(12,2),
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Índices Importantes
```sql
CREATE INDEX idx_movimientos_producto ON movimientos(producto_id);
CREATE INDEX idx_movimientos_cliente ON movimientos(cliente_id);
CREATE INDEX idx_movimientos_fecha ON movimientos(fecha);
CREATE INDEX idx_movimientos_tipo ON movimientos(tipo);
CREATE INDEX idx_productos_stock ON productos(stock_actual);
```

---

## Formatos y Convenciones Chilenas

### Fechas
- **Formato display:** DD-MM-YYYY (ej: 22-10-2025)
- **Formato con hora:** DD-MM-YYYY HH:mm
- **Storage en DB:** TIMESTAMPTZ (UTC)

### RUT
- **Formato:** 12.345.678-9
- **Validación:** Algoritmo módulo 11

### Moneda
- **Símbolo:** $ (peso chileno - CLP)
- **Formato:** $12.500 (punto como separador de miles)

### Decimales (Kilos)
- **Máximo 3 decimales:** 1.850 kg
- **Separador decimal:** Punto (.) para simplificar

---

## Flujos Clave

### Flujo 1: Registrar Entrada
1. Usuario va a "Inventario → Nueva Entrada"
2. Selecciona producto del dropdown
3. Ingresa kilos recibidos (ej: 15.5)
4. (Opcional) Ingresa N° guía despacho
5. Click "Confirmar Recepción"
6. Backend actualiza stock_actual
7. Muestra confirmación

### Flujo 2: Registrar Salida (Venta)
1. Usuario va a "Inventario → Nueva Venta"
2. Selecciona cliente (autocomplete)
3. Agrega productos al carrito con teclado numérico
4. Revisa resumen en carrito
5. Click "Confirmar Despacho"
6. Backend:
   - Crea despacho
   - Crea movimientos por cada producto
   - Actualiza stock_actual
7. Muestra confirmación

---

## Catálogo de Productos

### LONGANIZAS
1. Longaniza Tradicional - A granel y envasado (1kg)
2. Longaniza Merkén - A granel y envasado (1kg)
3. Longaniza Parrillera - A granel y envasado (1kg)
4. Longaniza Premium - A granel y envasado (1kg)
5. Longaniza Artesanal Parrilla - Desde 1kg
6. Longaniza Artesanal Tradicional - Desde 1kg
7. Longaniza Artesanal Española - Desde 1kg (pedido especial)

### CERDO
8. Prieta - Envasado 1kg
9. Pernil Cocido - Pieza desde 1kg
10. Costillar Ahumado - Pieza desde 1kg

### EMBUTIDOS
11. Mortadela Jamonada - Laminado 250gr y pieza desde 1kg
12. Mortadela Lisa - Laminado 250gr y pieza desde 1kg
13. Jamón Artesanal - Laminado 250gr y pieza desde 1kg
14. Jamón Sandwich - Laminado 250gr y pieza desde 1kg
15. Lomo Kassler - Laminado 250gr y pieza desde 1kg
16. Arrollado Prensado - Laminado 250gr y pieza desde 1kg
17. Arrollado Huaso Prensado - Pieza desde 1kg
18. Queso de Cerdo - Laminado 250gr y pieza desde 1kg
19. Paté de Campo - Unitarios desde 1un

### QUESOS
20. Queso Chanco - Pieza desde 1kg
21. Quesillo - Pieza 250gr desde 1un
22. Queso Chacra - Pieza 2kg desde 1un
23. Manteca de Cerdo - Unitario 1kg desde 1un

---

## Roadmap de Desarrollo (60-80h)

### Semana 1-2: Setup + Core Backend
- Setup proyecto React + Vite + TypeScript + Tailwind
- Configurar Supabase (proyecto, DB, Auth)
- Crear esquema de base de datos
- Implementar autenticación (login/logout)
- CRUD Productos

### Semana 3-4: Inventario Core
- CRUD Clientes
- Módulo Entradas
- Módulo Salidas (interfaz carrito)
- Dashboard con stock actual
- Validaciones

### Semana 5-6: Reportes + UX
- Historial de movimientos con filtros
- Reporte ventas por cliente
- Pulir UI/UX
- Alertas de stock bajo
- Responsive design

### Semana 7-8: PWA + Testing
- Configurar Service Worker
- Manifest.json
- Testing en dispositivos reales
- Deploy producción

---

## Seguridad (Supabase RLS)

```sql
-- Row Level Security
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados pueden leer/escribir todo
CREATE POLICY "Usuarios autenticados acceso completo"
  ON productos FOR ALL
  USING (auth.role() = 'authenticated');
```

---

## Features Nice-to-Have (Si sobra tiempo)

- Dark mode
- Export a Excel (CSV) de reportes
- Fotos de productos
- Scanner de código de barras
- Notificaciones push
- Modo offline robusto con sincronización

---

## Fases Futuras

### FASE 2: Mejoras Operacionales
- Sistema de Pedidos (Estados: Pendiente → En Preparación → Despachado)
- Trazabilidad por Lotes (N° Lote + Fecha Vencimiento)
- Reportes Avanzados (margen, rotación, proyecciones)
- Alertas Automáticas

### FASE 3: Mini-ERP
- Integración SII (Facturación Electrónica vía API terceros)
- Cuentas por Cobrar (Cobranza)
- Órdenes de Compra al Proveedor

---

## Entregables del MVP

1. PWA instalable (iOS/Android/Desktop)
2. Sistema de autenticación (2 usuarios)
3. CRUD Productos (20-40 SKUs)
4. CRUD Clientes (20 tiendas)
5. Registro de Entradas
6. Registro de Salidas (con carrito)
7. Dashboard de stock con alertas
8. Historial de movimientos con filtros
9. Reporte ventas por cliente
10. Export CSV
11. UI Mobile-first responsive
12. Documentación básica de uso

---

## Costos Estimados (Infra)

### Supabase
- **Free tier:** Suficiente para empezar
  - 500 MB database
  - 1 GB file storage
  - 50,000 usuarios activos mensuales
- **Pro:** $25/mes (cuando escalen)

### Hosting Frontend
- **Vercel:** Free tier suficiente

### Dominio
- ~$15.000 CLP/año (.cl)

**Total infraestructura inicial: ~$0-15.000 CLP/año**

---

## Key Success Factors

- Mobile-first (trabajan en terreno)
- UX simple tipo "pesa de supermercado"
- Stock en tiempo real con alertas
- Escalable a facturación futura sin reescribir todo
