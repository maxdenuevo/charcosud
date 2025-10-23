# CharcoSud - Sistema de Control de Inventario

Sistema de gestión de inventario para venta de charcutería y quesos.

## Stack Tecnológico

- **Frontend:** React 19 + TypeScript + Vite
- **Estilos:** Tailwind CSS
- **Backend:** Supabase (BaaS)
- **Base de Datos:** PostgreSQL (Supabase)
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Tipo:** Progressive Web App (PWA)

## Estructura del Proyecto

```
charcosud/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Loading.tsx
│   │   ├── Layout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/          # Páginas/vistas
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Productos.tsx
│   │   ├── Clientes.tsx
│   │   ├── Inventario.tsx
│   │   └── Reportes.tsx
│   ├── services/       # Servicios y API
│   │   └── supabase.ts
│   ├── types/         # TypeScript types
│   │   └── index.ts
│   ├── utils/         # Utilidades
│   │   ├── format.ts
│   │   └── constants.ts
│   ├── hooks/         # Custom hooks
│   ├── assets/        # Imágenes, fonts, etc.
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example       # Variables de entorno ejemplo
├── .env              # Variables de entorno (no commiteado)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Copiar `.env.example` a `.env`
3. Actualizar las variables de entorno:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Ejecutar el proyecto

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Características Implementadas

### ✅ Configuración Base
- [x] React 19 + TypeScript + Vite
- [x] Tailwind CSS configurado con tema personalizado (rojo vino, mostaza/dorado)
- [x] Estructura de carpetas organizada
- [x] TypeScript types para el modelo de datos completo
- [x] Lucide React icons

### ✅ Autenticación
- [x] Integración con Supabase Auth
- [x] Context API para manejo de autenticación
- [x] Página de Login completa con validación
- [x] Rutas protegidas
- [x] Logout funcional
- [x] Auto-redirect a login cuando no autenticado

### ✅ Navegación
- [x] React Router v6 configurado
- [x] Layout responsive con navegación
- [x] Bottom navigation (móvil) - 5 iconos
- [x] Sidebar navigation (desktop)
- [x] Mobile-first design con touch targets de 44px mínimo
- [x] Header con logo y logout

### ✅ Componentes Base
- [x] Button (variantes: primary, secondary, danger, success, outline)
- [x] Input (con label, error, helper text)
- [x] Select (dropdown con opciones)
- [x] Card (contenedor reutilizable)
- [x] Modal (diálogo modal responsive)
- [x] Loading spinner
- [x] Layout con header y navegación
- [x] ProtectedRoute

### ✅ Módulo de Productos
- [x] CRUD completo (Create, Read, Update, Delete)
- [x] Lista de productos en grid responsive
- [x] Búsqueda por nombre o SKU
- [x] Modal de formulario para crear/editar
- [x] Validación de campos
- [x] Visualización de stock actual y mínimo
- [x] Indicadores visuales de bajo stock
- [x] Soft delete (marcar como inactivo)
- [x] Mostrar costo y precio de venta

### ✅ Módulo de Clientes
- [x] CRUD completo (Create, Read, Update, Delete)
- [x] Lista de clientes en grid responsive
- [x] Búsqueda por nombre, RUT o contacto
- [x] Validación de RUT chileno (módulo 11)
- [x] Formato automático de RUT (12.345.678-9)
- [x] Selector de comunas de la RM
- [x] Información de contacto completa
- [x] Modal de formulario responsive
- [x] Soft delete

### ✅ Dashboard
- [x] Vista general de inventario
- [x] Estadísticas principales (total productos, stock total, valor inventario)
- [x] Alertas de productos sin stock (rojo)
- [x] Alertas de productos con stock bajo (naranja)
- [x] Tabla completa de stock con búsqueda
- [x] Indicadores de estado visual (OK, Bajo, Sin Stock)
- [x] Botones de acción rápida
- [x] Navegación directa a módulos
- [x] Cálculo de valor total del inventario

### ✅ Módulo de Inventario
- [x] Tabbed interface (Entradas / Salidas)
- [x] **Entradas (Recepción de Mercadería)**
  - [x] Formulario de entrada con selector de producto
  - [x] Visualización de stock actual antes de la entrada
  - [x] Input de cantidad en kg con 3 decimales
  - [x] Campo para guía de despacho
  - [x] Campo de notas
  - [x] Preview de stock resultante
  - [x] Actualización automática de stock en base de datos
  - [x] Registro de movimiento en tabla movimientos
- [x] **Salidas (Ventas/Despachos)**
  - [x] Interfaz tipo "carrito de compras"
  - [x] Selección de cliente con búsqueda
  - [x] Grid de productos con información visual
  - [x] Teclado numérico modal grande (tipo pesa de supermercado)
  - [x] Validación de stock disponible
  - [x] Carrito con items agregados
  - [x] Cálculo automático de totales (kg y CLP)
  - [x] Confirmación de despacho
  - [x] Actualización de stock para múltiples productos
  - [x] Creación de despacho en base de datos
  - [x] Registro de movimientos por cada producto vendido

### ✅ Servicios (API/Supabase)
- [x] Service de Productos (getAll, getActive, create, update, delete)
- [x] Service de Clientes (getAll, getActive, create, update, delete, search)
- [x] Service de Inventario (registrarEntrada, registrarSalida, getMovimientos)
- [x] Integración completa con Supabase
- [x] Transacciones para mantener consistencia de datos

### ✅ Utilidades
- [x] Formateo de moneda chilena (CLP) - $12.500
- [x] Formateo de RUT chileno con validación - 12.345.678-9
- [x] Validación de RUT con algoritmo módulo 11
- [x] Formateo de fechas (DD-MM-YYYY)
- [x] Formateo de kilos (3 decimales) - 1.850 kg
- [x] Constantes de la aplicación
- [x] Lista de comunas RM

## Paleta de Colores

- **Primary (Rojo vino):** `#8B0000`
- **Secondary (Mostaza/Dorado):** `#D4AF37`
- **Alert (Rojo brillante):** `#DC2626`
- **Success (Verde suave):** `#10B981`

## ✅ PWA & Offline Mode - IMPLEMENTED!

### 🎉 Robust Offline Functionality
- [x] **Service Worker** with Workbox
- [x] **IndexedDB** for local data storage
- [x] **Offline transaction queue** with auto-sync
- [x] **Conflict resolution** for stock management
- [x] **Optimistic updates** for instant feedback
- [x] **Network status indicators** (visual feedback)
- [x] **PWA manifest** - installable on mobile
- [x] **Auto-sync** on network reconnection
- [x] **Manual sync** trigger available

### How It Works
- ✅ **Products & clients cached** locally
- ✅ **Sales work offline** - queued for sync
- ✅ **Stock updates instantly** (local)
- ✅ **Auto-sync when online** returns
- ✅ **Conflict detection** prevents overselling
- ✅ **Visual indicators** show sync status

**See `OFFLINE_MODE.md` for complete documentation!**

## Próximos Pasos

### ⏳ Opcional - Mejoras Adicionales
- [ ] Historial de movimientos (Kardex) en página de Reportes
  - Vista de todos los movimientos
  - Filtros por fecha, tipo, producto, cliente
  - Exportar a CSV
- [ ] Reportes básicos (página de Reportes)
  - Ventas por cliente (período seleccionable)
  - Total vendido (CLP y kg)
  - Número de transacciones
  - Gráficos de ventas
- [ ] Testing con Supabase
  - Crear proyecto en Supabase
  - Ejecutar schema SQL
  - Configurar RLS policies
  - Probar flujos completos

### 🔮 Futuro - Nice to Have
- [ ] Dark mode
- [ ] Fotos de productos
- [ ] Scanner de código de barras
- [ ] Notificaciones push
- [ ] Modo offline robusto con sincronización
- [ ] Gráficos y análisis avanzado

## Licencia

ISC
