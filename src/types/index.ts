export interface House {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  owner_id: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface HouseMember {
  id: string;
  house_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile?: UserProfile;
}

export interface Category {
  id: string;
  house_id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

export type ProductStatus = 'ok' | 'low' | 'out';

export type UnitOfMeasure =
  | 'unidad'
  | 'kg'
  | 'g'
  | 'litro'
  | 'ml'
  | 'paquete'
  | 'docena'
  | 'lata'
  | 'botella';

export interface Product {
  id: string;
  house_id: string;
  category_id: string | null;
  name: string;
  quantity: number;
  unit: UnitOfMeasure;
  min_stock: number;
  status: ProductStatus;
  barcode: string | null;
  expiry_date: string | null;
  image_url: string | null;
  created_by: string;
  updated_at: string;
  created_at: string;
  category?: Category;
}

export interface ShoppingItem {
  id: string;
  house_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit: UnitOfMeasure;
  is_purchased: boolean;
  added_by: string;
  purchased_by: string | null;
  purchased_at: string | null;
  source: 'auto' | 'manual';
  created_at: string;
  product?: Product;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  CreateHouse: undefined;
  JoinHouse: undefined;
  HouseSetup: undefined;
  ProductDetail: { productId: string };
  AddProduct: { categoryId?: string };
  EditProduct: { productId: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  InventoryTab: undefined;
  ShoppingTab: undefined;
  ProfileTab: undefined;
};
