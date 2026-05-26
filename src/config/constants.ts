export const APP_NAME = 'MiAlacena';

export const DEFAULT_CATEGORIES = [
  { name: 'Lácteos', icon: '🥛', color: '#BBDEFB' },
  { name: 'Carnes', icon: '🥩', color: '#FFCDD2' },
  { name: 'Frutas y Verduras', icon: '🥬', color: '#C8E6C9' },
  { name: 'Panadería', icon: '🍞', color: '#FFE0B2' },
  { name: 'Bebidas', icon: '🥤', color: '#B3E5FC' },
  { name: 'Limpieza', icon: '🧹', color: '#E1BEE7' },
  { name: 'Higiene', icon: '🧴', color: '#F0F4C3' },
  { name: 'Snacks', icon: '🍿', color: '#FFF9C4' },
  { name: 'Congelados', icon: '🧊', color: '#B2EBF2' },
  { name: 'Otros', icon: '📦', color: '#D7CCC8' },
];

export const UNITS_OF_MEASURE = [
  { value: 'unidad', label: 'Unidades' },
  { value: 'kg', label: 'Kilogramos' },
  { value: 'g', label: 'Gramos' },
  { value: 'litro', label: 'Litros' },
  { value: 'ml', label: 'Mililitros' },
  { value: 'paquete', label: 'Paquetes' },
  { value: 'docena', label: 'Docenas' },
  { value: 'lata', label: 'Latas' },
  { value: 'botella', label: 'Botellas' },
] as const;

export const INVITE_CODE_LENGTH = 8;
