-- HogarStock - Schema SQL para Supabase
-- Ejecutar en el SQL Editor de Supabase

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de perfiles (vinculada a auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de casas
CREATE TABLE houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de miembros de casa
CREATE TABLE house_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(house_id, user_id)
);

-- Tabla de categorías
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#D7CCC8',
  "order" INT NOT NULL DEFAULT 0
);

-- Tabla de productos
CREATE TABLE products (
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

-- Tabla de items de compras
CREATE TABLE shopping_items (
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

-- Índices para performance
CREATE INDEX idx_house_members_user ON house_members(user_id);
CREATE INDEX idx_house_members_house ON house_members(house_id);
CREATE INDEX idx_products_house ON products(house_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_shopping_items_house ON shopping_items(house_id);
CREATE INDEX idx_shopping_items_purchased ON shopping_items(is_purchased);
CREATE INDEX idx_categories_house ON categories(house_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad: profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas de seguridad: houses (los miembros pueden ver)
CREATE POLICY "Members can view their houses"
  ON houses FOR SELECT USING (
    id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create houses"
  ON houses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas de seguridad: house_members
CREATE POLICY "Members can view house members"
  ON house_members FOR SELECT USING (
    house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can join houses"
  ON house_members FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can remove members"
  ON house_members FOR DELETE USING (
    house_id IN (
      SELECT house_id FROM house_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas de seguridad: categories
CREATE POLICY "Members can view categories"
  ON categories FOR SELECT USING (
    house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can manage categories"
  ON categories FOR INSERT WITH CHECK (
    house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid())
  );

-- Políticas de seguridad: products
CREATE POLICY "Members can view products"
  ON products FOR SELECT USING (
    house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can manage products"
  ON products FOR ALL USING (
    house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid())
  );

-- Políticas de seguridad: shopping_items
CREATE POLICY "Members can view shopping items"
  ON shopping_items FOR SELECT USING (
    house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can manage shopping items"
  ON shopping_items FOR ALL USING (
    house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid())
  );

-- Trigger para crear perfil al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
