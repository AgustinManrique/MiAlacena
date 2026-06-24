# Changelog

Todos los cambios notables de **MiAlacena** se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y el proyecto
adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [1.1.0] - 2026-06-23 — Entrega 2

Cierra los 6 objetivos del roadmap de la Entrega 2: lista de compras inteligente, búsqueda
en la alacena, edición de productos, persistencia offline, mejoras de UX/UI y gestión de
miembros.

### Añadido

- **Lista de compras inteligente.** Los productos que quedan con stock bajo o agotado se
  agregan automáticamente a la lista de compras, y se quitan solos cuando se reponen. No
  genera duplicados ni toca los ítems agregados a mano. (#8)
- **Búsqueda en la Alacena.** Barra de búsqueda en tiempo real que combina filtro por
  categoría y por texto (insensible a tildes y mayúsculas), con un estado vacío específico
  cuando no hay resultados. (#7)
- **Edición de productos.** Nueva pantalla para editar nombre, categoría, cantidad, unidad y
  stock mínimo, con validación de los datos tanto al crear como al editar. (#6)
- **Persistencia offline con sincronización.** La app funciona sin conexión: los cambios se
  guardan localmente y se encolan, y se sincronizan solos con el servidor al recuperar
  internet. Un indicador muestra el estado (sincronizado / sin conexión / sincronizando). (#9)
- **Gestión de miembros (panel de administrador).** Los administradores de una casa pueden ver
  a todos los integrantes, promover un miembro a administrador, bajarlo a miembro o quitarlo de
  la casa. (#10)

### Cambiado

- **Mejoras de UX/UI:** transiciones y animaciones de navegación, feedback táctil en los
  botones (efecto de escala al presionar) y refinamientos visuales generales. (#9)
- El inventario y la lista de compras reflejan los cambios al instante (actualización
  optimista), sin esperar la respuesta del servidor. (#9)

### Corregido

- **Visibilidad de miembros:** se corrigió el permiso (RLS) que hacía que cada usuario solo se
  viera a sí mismo en la lista de integrantes; ahora se ven todos los miembros de la casa. (#10)
- Se reforzaron los permisos de administración: un administrador no puede quitarse a sí mismo ni
  quitar a otro administrador, y una casa no puede quedar sin ningún administrador. (#10)

## [1.0.0] - Entrega 1

- Arquitectura modular (services / stores / screens) con TypeScript.
- Autenticación (registro + login) y creación/unión a casas por código de invitación.
- Inventario de productos (CRUD) con categorías y estados (OK / Bajo / Agotado).
- Lista de compras manual y dashboard con resumen del hogar.
- Navegación completa (Stack + Tabs), design system propio y schema SQL con RLS.
