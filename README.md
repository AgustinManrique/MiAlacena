# MiAlacena

Aplicación móvil colaborativa para gestión de inventario doméstico e inteligencia de compras en tiempo real.

## Problema

Eliminar la incertidumbre sobre productos disponibles en el hogar y evitar compras duplicadas entre miembros de una vivienda.

## Propuesta de Valor

- Inventario del hogar sincronizado entre todos los miembros
- Lista de compras inteligente (automática + manual)
- Actualizaciones en tiempo real
- Reducción de compras duplicadas
- Experiencia colaborativa y simple

---

## Stack Tecnológico

| Tecnología | Justificación |
|---|---|
| **React Native + Expo** | Framework cross-platform maduro. Expo simplifica el build pipeline y provee acceso a APIs nativas sin configuración manual. |
| **TypeScript** | Tipado estático para prevenir errores en tiempo de compilación y mejorar la documentación del código. |
| **Supabase** | BaaS con PostgreSQL, autenticación, Row Level Security y Realtime subscriptions. Reemplaza un backend completo. |
| **Zustand** | Estado global ligero (2KB), sin boilerplate, con excelente soporte TypeScript y selectores optimizados. |
| **React Navigation v7** | Librería de navegación estándar de React Native, con stack y tabs nativos. |
| **AsyncStorage** | Persistencia local para sesión y datos offline. |

### Versiones Mínimas
- **Android**: API 23 (Android 6.0)
- **iOS**: 13.0

---

## Arquitectura

```
MiAlacena/
├── src/
│   ├── types/              # Interfaces y tipos TypeScript
│   │   └── index.ts
│   ├── config/             # Configuración (supabase.ts re-exporta desde utils/)
│   │   ├── supabase.ts
│   │   └── constants.ts
│   ├── services/           # Capa de acceso a datos (Supabase queries)
│   │   ├── auth.service.ts
│   │   ├── house.service.ts
│   │   ├── product.service.ts
│   │   ├── category.service.ts
│   │   └── shopping.service.ts
│   ├── stores/             # Estado global (Zustand)
│   │   ├── auth.store.ts
│   │   ├── house.store.ts
│   │   ├── product.store.ts
│   │   └── shopping.store.ts
│   ├── components/         # Componentes reutilizables
│   │   ├── ui/             # Design system (Button, Input, Card, etc.)
│   │   ├── inventory/      # Componentes de inventario
│   │   └── shopping/       # Componentes de lista de compras
│   ├── screens/            # Pantallas organizadas por feature
│   │   ├── auth/
│   │   ├── home/
│   │   ├── inventory/
│   │   ├── shopping/
│   │   └── profile/
│   ├── navigation/         # Navegación (Root + Tabs)
│   │   ├── RootNavigator.tsx
│   │   └── MainTabs.tsx
│   ├── theme/              # Design tokens (colores, spacing, tipografía)
│   │   └── index.ts
│   └── utils/              # Utilidades generales
├── utils/                  # Utilidades compartidas (cliente Supabase, helpers)
│   └── supabase.ts
├── docs/                   # Documentación extendida
├── supabase_schema.sql     # Schema SQL para inicializar la base de datos
├── .env                    # Variables de entorno (no commitear)
└── ...
```

### Justificación Arquitectónica

- **Feature-based structure**: Cada feature tiene sus propias pantallas, componentes y lógica. Facilita la escalabilidad.
- **Services layer**: Abstrae la comunicación con Supabase. Si se migra a otro backend, solo se modifica esta capa.
- **Stores separados**: Cada dominio (auth, house, product, shopping) tiene su propio store. Evita un estado monolítico.
- **UI components**: Design system propio para mantener consistencia visual.

---

## Modelo de Datos

### Entidades

| Entidad | Descripción |
|---|---|
| **House** | Hogar compartido con código de invitación |
| **UserProfile** | Perfil del usuario (nombre, email, avatar) |
| **HouseMember** | Relación usuario-casa con rol (admin/member) |
| **Category** | Categoría de productos (Lácteos, Carnes, etc.) |
| **Product** | Producto del inventario con cantidad, stock mínimo y estado |
| **ShoppingItem** | Item en la lista de compras (manual o automático) |

### Reglas de Negocio

- `cantidad_actual <= 0` → Estado: **Agotado** (rojo)
- `cantidad_actual <= stock_minimo` → Estado: **Bajo** (naranja)
- `cantidad_actual > stock_minimo` → Estado: **OK** (verde)
- Productos con stock bajo pueden agregarse automáticamente a la lista de compras

---

## Seguridad

- **Row Level Security (RLS)**: Cada tabla tiene políticas que restringen acceso solo a miembros de la casa.
- **Autenticación**: Email/password con Supabase Auth. Tokens JWT con refresh automático.
- **Persistencia segura**: Sesión almacenada en AsyncStorage con token refresh.

---

## Setup

### Requisitos
- Node.js >= 18
- npm o yarn
- Expo CLI
- Cuenta en [Supabase](https://supabase.com)

### Instalación

```bash
# Clonar e instalar
cd hogarstock
npm install

# Configurar Supabase
# 1. Crear proyecto en supabase.com
# 2. Ejecutar supabase_schema.sql en SQL Editor
# 3. Copiar URL y anon key en src/config/supabase.ts

# Ejecutar
npx expo start
```

---

## Licencia

Proyecto académico - Todos los derechos reservados.
