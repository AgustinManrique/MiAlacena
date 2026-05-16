-- HogarStock - Schema SQL completo para Supabase
-- Este script es idempotente: puede reejecutarse sin errores.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS house_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(house_id, user_id)
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#D7CCC8',
  "order" INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unidad',
  min_stock NUMERIC NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('ok', 'low', 'out')) DEFAULT 'ok',
  barcode TEXT,
  expiry_date DATE,
  image_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'unidad',
  is_purchased BOOLEAN DEFAULT FALSE,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  purchased_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ,
  source TEXT NOT NULL CHECK (source IN ('auto', 'manual')) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS todos (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_house_members_user ON house_members(user_id);
CREATE INDEX IF NOT EXISTS idx_house_members_house ON house_members(house_id);
CREATE INDEX IF NOT EXISTS idx_products_house ON products(house_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_shopping_items_house ON shopping_items(house_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_purchased ON shopping_items(is_purchased);
CREATE INDEX IF NOT EXISTS idx_categories_house ON categories(house_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================

CREATE OR REPLACE FUNCTION is_house_member(target_house_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM house_members
    WHERE house_id = target_house_id AND user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_house_admin(target_house_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM house_members
    WHERE house_id = target_house_id AND user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ============================================================
-- POLICIES: profiles
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- POLICIES: houses
-- ============================================================

DROP POLICY IF EXISTS "Members can view their houses" ON houses;
CREATE POLICY "Members can view their houses"
  ON houses FOR SELECT USING (
    id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create houses" ON houses;
CREATE POLICY "Authenticated users can create houses"
  ON houses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- ============================================================
-- POLICIES: house_members
-- ============================================================

DROP POLICY IF EXISTS "Members can view house members" ON house_members;
CREATE POLICY "Members can view house members"
  ON house_members FOR SELECT USING (
    is_house_member(house_id)
  );

DROP POLICY IF EXISTS "Users can join houses" ON house_members;
CREATE POLICY "Users can join houses"
  ON house_members FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can remove members" ON house_members;
CREATE POLICY "Admins can remove members"
  ON house_members FOR DELETE USING (
    is_house_admin(house_id)
  );

-- ============================================================
-- POLICIES: categories
-- ============================================================

DROP POLICY IF EXISTS "Members can view categories" ON categories;
CREATE POLICY "Members can view categories"
  ON categories FOR SELECT USING (is_house_member(house_id));

DROP POLICY IF EXISTS "Members can manage categories" ON categories;
CREATE POLICY "Members can manage categories"
  ON categories FOR INSERT WITH CHECK (is_house_member(house_id));

DROP POLICY IF EXISTS "Members can update categories" ON categories;
CREATE POLICY "Members can update categories"
  ON categories FOR UPDATE USING (is_house_member(house_id));

DROP POLICY IF EXISTS "Members can delete categories" ON categories;
CREATE POLICY "Members can delete categories"
  ON categories FOR DELETE USING (is_house_member(house_id));

-- ============================================================
-- POLICIES: products
-- ============================================================

DROP POLICY IF EXISTS "Members can view products" ON products;
CREATE POLICY "Members can view products"
  ON products FOR SELECT USING (is_house_member(house_id));

DROP POLICY IF EXISTS "Members can insert products" ON products;
CREATE POLICY "Members can insert products"
  ON products FOR INSERT WITH CHECK (is_house_member(house_id));

DROP POLICY IF EXISTS "Members can update products" ON products;
CREATE POLICY "Members can update products"
  ON products FOR UPDATE USING (is_house_member(house_id));

DROP POLICY IF EXISTS "Members can delete products" ON products;
CREATE POLICY "Members can delete products"
  ON products FOR DELETE USING (is_house_member(house_id));

-- ============================================================
-- POLICIES: shopping_items
-- ============================================================

DROP POLICY IF EXISTS "Members can view shopping items" ON shopping_items;
CREATE POLICY "Members can view shopping items"
  ON shopping_items FOR SELECT USING (is_house_member(house_id));

DROP POLICY IF EXISTS "Members can insert shopping items" ON shopping_items;
CREATE POLICY "Members can insert shopping items"
  ON shopping_items FOR INSERT WITH CHECK (is_house_member(house_id));

DROP POLICY IF EXISTS "Members can update shopping items" ON shopping_items;
CREATE POLICY "Members can update shopping items"
  ON shopping_items FOR UPDATE USING (is_house_member(house_id));

DROP POLICY IF EXISTS "Members can delete shopping items" ON shopping_items;
CREATE POLICY "Members can delete shopping items"
  ON shopping_items FOR DELETE USING (is_house_member(house_id));

-- ============================================================
-- POLICIES: todos (lectura pública)
-- ============================================================

DROP POLICY IF EXISTS "Public read access" ON todos;
CREATE POLICY "Public read access"
  ON todos FOR SELECT USING (true);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

INSERT INTO todos (name)
SELECT 'Conexión Supabase OK'
WHERE NOT EXISTS (SELECT 1 FROM todos);

-- ============================================================
-- TRIGGER: crear perfil automáticamente al registrarse
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
