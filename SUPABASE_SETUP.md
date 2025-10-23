# Supabase Setup Guide

Quick guide to set up Supabase for CharcoSud.

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: CharcoSud
   - **Database Password**: (create a strong password - save it!)
   - **Region**: Choose closest to Chile (São Paulo or Oregon)
   - **Pricing Plan**: Free tier is fine for MVP
5. Click **"Create new project"**
6. Wait ~2 minutes for project to be ready

---

## Step 2: Get API Credentials

1. In your project, go to **Settings** (gear icon)
2. Go to **API** section
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

4. Update your `.env` file:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Create Database Tables

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy and paste the SQL below
4. Click **"Run"**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Productos table
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

-- Clientes table
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

-- Despachos table
CREATE TABLE despachos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  total_clp NUMERIC(12,2),
  usuario_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movimientos table
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
  usuario_id UUID,
  despacho_id UUID REFERENCES despachos(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_movimientos_producto ON movimientos(producto_id);
CREATE INDEX idx_movimientos_cliente ON movimientos(cliente_id);
CREATE INDEX idx_movimientos_fecha ON movimientos(fecha);
CREATE INDEX idx_movimientos_tipo ON movimientos(tipo);
CREATE INDEX idx_productos_stock ON productos(stock_actual);
CREATE INDEX idx_despachos_cliente ON despachos(cliente_id);
CREATE INDEX idx_despachos_fecha ON despachos(fecha);
```

✅ You should see: "Success. No rows returned"

---

## Step 4: Enable Row Level Security (RLS)

1. Still in **SQL Editor**, create a new query
2. Paste this SQL:

```sql
-- Enable RLS on all tables
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to do everything
-- (Simple policy for MVP - refine later for multi-user)

-- Productos policies
CREATE POLICY "Enable all for authenticated users" ON productos
  FOR ALL USING (auth.role() = 'authenticated');

-- Clientes policies
CREATE POLICY "Enable all for authenticated users" ON clientes
  FOR ALL USING (auth.role() = 'authenticated');

-- Movimientos policies
CREATE POLICY "Enable all for authenticated users" ON movimientos
  FOR ALL USING (auth.role() = 'authenticated');

-- Despachos policies
CREATE POLICY "Enable all for authenticated users" ON despachos
  FOR ALL USING (auth.role() = 'authenticated');
```

✅ Click **"Run"** - you should see success messages

---

## Step 5: Create User Account

1. Go to **Authentication** → **Users** (left sidebar)
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: mathias@charcosud.cl (or your email)
   - **Password**: (create a password)
   - **Auto Confirm User**: ✅ Check this
4. Click **"Create user"**

Repeat for second user if needed (e.g., gabriel@charcosud.cl)

---

## Step 6: (Optional) Add Sample Data

To test the app, you can add some sample products:

```sql
INSERT INTO productos (sku, nombre, proveedor, costo_por_kg, precio_venta_por_kg, stock_actual, stock_minimo)
VALUES
  ('LONG-001', 'Longaniza Tradicional', 'Delicias del Sur', 5000, 8000, 10.500, 5),
  ('LONG-002', 'Longaniza Merkén', 'Delicias del Sur', 5500, 8500, 8.250, 5),
  ('JAMON-001', 'Jamón Artesanal', 'Delicias del Sur', 7000, 11000, 15.000, 5),
  ('QUESO-001', 'Queso Chanco', 'Delicias del Sur', 6000, 9500, 12.750, 5);

INSERT INTO clientes (nombre_tienda, rut, direccion, comuna, contacto_nombre, contacto_telefono)
VALUES
  ('Delicatessen El Gourmet', '76123456-7', 'Av. Providencia 1234', 'Providencia', 'Juan Pérez', '+56 9 1234 5678'),
  ('Tienda Gourmet Las Condes', '76234567-8', 'Av. Apoquindo 5678', 'Las Condes', 'María González', '+56 9 2345 6789'),
  ('Sabores del Sur', '76345678-9', 'Av. Vicuña Mackenna 890', 'Ñuñoa', 'Pedro Silva', '+56 9 3456 7890');
```

---

## Step 7: Test the Application

1. Make sure your `.env` file is configured
2. Run the dev server:
```bash
npm run dev
```
3. Open http://localhost:5173
4. Log in with the credentials you created in Step 5
5. ✅ You should see the dashboard!

---

## Troubleshooting

### Can't log in?
- Check that you created a user in Step 5
- Check "Auto Confirm User" was enabled
- Verify `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Tables not showing up?
- Go to **Table Editor** in Supabase to verify tables exist
- Check SQL ran without errors

### RLS blocking access?
- Verify RLS policies were created in Step 4
- Make sure you're logged in with an authenticated user

### Need to reset?
- You can drop all tables and re-run Step 3
```sql
DROP TABLE IF EXISTS movimientos CASCADE;
DROP TABLE IF EXISTS despachos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
```

---

## Next Steps

Once everything is working:
1. ✅ Test creating products
2. ✅ Test creating clients
3. ✅ Test inventory entries
4. ✅ Test sales with the cart
5. ✅ Check dashboard updates in real-time

---

## Security Notes

⚠️ **For Production:**
- Use stronger passwords
- Implement more granular RLS policies
- Enable MFA for admin accounts
- Consider adding user roles (admin, employee)
- Set up backup policies

---

## Support

If you need help:
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- This project's README.md

---

**That's it! You're ready to use CharcoSud** 🎉
