# HogarStock

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
src/
├── types/              # Interfaces y tipos TypeScript
│   └── index.ts
├── config/             # Configuración de Supabase y constantes
│   ├── supabase.ts
│   └── constants.ts
├── services/           # Capa de acceso a datos (Supabase queries)
│   ├── auth.service.ts
│   ├── house.service.ts
│   ├── product.service.ts
│   ├── category.service.ts
│   └── shopping.service.ts
├── stores/             # Estado global (Zustand)
│   ├── auth.store.ts
│   ├── house.store.ts
│   ├── product.store.ts
│   └── shopping.store.ts
├── components/         # Componentes reutilizables
│   ├── ui/             # Design system (Button, Input, Card, etc.)
│   ├── inventory/      # Componentes de inventario
│   └── shopping/       # Componentes de lista de compras
├── screens/            # Pantallas organizadas por feature
│   ├── auth/
│   ├── home/
│   ├── inventory/
│   ├── shopping/
│   └── profile/
├── navigation/         # Navegación (Root + Tabs)
│   ├── RootNavigator.tsx
│   └── MainTabs.tsx
├── theme/              # Design tokens (colores, spacing, tipografía)
│   └── index.ts
└── utils/              # Utilidades generales
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

## Navegación

```
Auth Flow:
  Login → Register (ida y vuelta)

House Setup:
  Elegir → Crear Casa / Unirse con código

Main (Tabs):
  Inicio | Alacena | Compras | Perfil

Stack adicional:
  Alacena → AddProduct
  Alacena → ProductDetail → EditProduct
```

---

## User Stories (Entrega 1)

### US-001: Registro de usuario
**Como** nuevo usuario  
**Quiero** crear una cuenta con email y contraseña  
**Para** acceder a la aplicación  

**Criterios de aceptación:**
- El formulario valida email, contraseña (mín 6 chars) y nombre
- Se muestra error descriptivo si el registro falla
- Al registrarse exitosamente, se crea el perfil automáticamente

### US-002: Inicio de sesión
**Como** usuario registrado  
**Quiero** iniciar sesión con mis credenciales  
**Para** acceder a mi hogar  

**Criterios de aceptación:**
- Login con email y contraseña
- Sesión persistente (no requiere login cada vez)
- Error descriptivo si las credenciales son incorrectas

### US-003: Crear casa
**Como** usuario autenticado sin casa  
**Quiero** crear un nuevo hogar  
**Para** empezar a gestionar mi inventario  

**Criterios de aceptación:**
- Se ingresa nombre de la casa
- Se genera código de invitación alfanumérico automáticamente
- El creador obtiene rol "admin"
- Se crean categorías por defecto

### US-004: Unirse a una casa
**Como** usuario autenticado  
**Quiero** unirme a una casa existente con un código  
**Para** colaborar en el inventario compartido  

**Criterios de aceptación:**
- Se ingresa código de invitación
- Validación de código existente
- El usuario se une como "miembro"
- Error si ya es miembro o el código es inválido

### US-005: Ver dashboard
**Como** miembro de una casa  
**Quiero** ver un resumen del estado del hogar  
**Para** conocer rápidamente qué necesito  

**Criterios de aceptación:**
- Muestra total de productos, stock bajo y agotados
- Lista de productos agotados con detalle
- Cantidad de items pendientes en lista de compras
- Pull-to-refresh para actualizar datos

### US-006: Gestionar inventario
**Como** miembro de una casa  
**Quiero** agregar, editar y eliminar productos  
**Para** mantener el inventario actualizado  

**Criterios de aceptación:**
- Agregar producto con nombre, categoría, cantidad, unidad y stock mínimo
- Incrementar/decrementar cantidad desde la lista
- Ver detalle completo del producto
- Eliminar producto con confirmación
- Filtrar por categoría

### US-007: Gestionar lista de compras
**Como** miembro de una casa  
**Quiero** agregar productos a la lista y marcarlos como comprados  
**Para** coordinar las compras del hogar  

**Criterios de aceptación:**
- Agregar items manualmente con nombre
- Marcar/desmarcar items como comprados
- Eliminar items individuales
- Limpiar todos los items comprados
- Badge en tab con cantidad pendiente

### US-008: Ver y compartir código
**Como** admin de una casa  
**Quiero** ver y compartir el código de invitación  
**Para** invitar a otros miembros  

**Criterios de aceptación:**
- Código visible en perfil
- Botón para compartir vía Share nativo
- Muestra lista de miembros actuales

---

## Entregas

### Entrega 1 (Actual)
- [x] Arquitectura modular y escalable
- [x] Sistema de tipos TypeScript completo
- [x] Autenticación (registro + login)
- [x] Creación/unión a casas con código de invitación
- [x] Inventario básico (CRUD de productos)
- [x] Categorías con íconos
- [x] Sistema de estados (OK/Bajo/Agotado)
- [x] Lista de compras manual
- [x] Dashboard con resumen
- [x] Navegación completa (Stack + Tabs)
- [x] Design system (Button, Input, Card, StatusBadge, EmptyState)
- [x] Schema SQL con RLS
- [x] Documentación técnica

### Entrega 2 (Pendiente)
- [x] Lista de compras inteligente (auto-agregar productos con stock bajo)
- [ ] Sincronización en tiempo real (Supabase Realtime)
- [ ] Mejoras UX/UI (animaciones, transiciones)
- [ ] Persistencia offline con sync
- [ ] Edición de productos
- [ ] Gestión de miembros (admin)

### Entrega 3 (Pendiente)
- [ ] Escáner de código de barras (EAN/UPC)
- [ ] Estadísticas de consumo
- [ ] Sistema de recetas inteligentes
- [ ] Notificaciones push
- [ ] Testing (unit + integration)
- [ ] Optimización de performance
- [ ] Release candidate

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

## Design System

### Paleta de Colores

| Token | Hex | Uso |
|---|---|---|
| Primary | `#4CAF50` | Acciones principales, estados OK |
| Secondary | `#FF9800` | Acciones secundarias, stock bajo |
| Error | `#F44336` | Errores, productos agotados |
| Background | `#F5F5F5` | Fondo general |
| Surface | `#FFFFFF` | Cards y contenedores |
| Text | `#212121` | Texto principal |
| TextSecondary | `#757575` | Texto secundario |

### Componentes

- **Button**: primary, secondary, outline, ghost (sm, md, lg)
- **Input**: Con label, error, focus state
- **Card**: Contenedor con sombra y border radius
- **StatusBadge**: OK (verde), Bajo (naranja), Agotado (rojo)
- **EmptyState**: Ícono + título + descripción + CTA
- **ProductCard**: Card de producto con controles de cantidad
- **CategoryFilter**: Scroll horizontal con chips de categoría
- **ShoppingItemCard**: Item con checkbox y acción de eliminar

---

## Licencia

Proyecto académico - Todos los derechos reservados.
