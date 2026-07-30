# Changelog

Todos los cambios notables de **MiAlacena** se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y el proyecto
adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [1.2.0] - 2026-07-29 - Entrega 3 final

### Añadido

- **Estadísticas de consumo en Inicio.** Se agregó una sección al final del dashboard con la cantidad mensual de consumos, selector de mes, gráfico circular tipo donut, total de consumos en el centro y desglose por categoría con cantidad y porcentaje.
- **Eventos reales de consumo.** Se agregó la tabla `consumption_events` en Supabase para registrar decrementos confirmados del inventario por casa, producto, categoría, mes y año.
- **Buffer de confirmación.** Los decrementos del inventario se registran como consumo solo si no son revertidos dentro del intervalo de confirmación.
- **Servicio de estadísticas.** Se agregó `consumptionStatsService`, que consulta `consumption_events`, agrupa por mes/categoría y calcula totales, porcentajes y detalle por producto.
- **Detalle expandible por categoría.** Cada categoría de estadísticas ahora funciona como acordeón y muestra los productos consumidos en el mes seleccionado junto con su cantidad total consumida.
- **Componente reutilizable.** Se agregó `ConsumptionStatsSection` en `src/components/home/`, manteniendo el uso de `Card`, tokens del tema y patrones visuales existentes.
- **Soporte gráfico.** Se instaló `react-native-svg` para renderizar el gráfico circular tipo donut en React Native/Expo.
- **Datos SQL de prueba.** Se agregó `supabase_seed_consumption_events.sql` para poblar eventos de consumo de los últimos tres meses en todas las casas existentes.
- **Escáner de código de barras.** Se incorporó un lector de códigos EAN/UPC utilizando la cámara del dispositivo, con integración a Open Food Facts para obtener automáticamente información del producto y precargar los datos durante el alta.
- **Edición de perfil y casa.** Se añadió una pantalla de configuración que permite modificar el nombre de usuario, el nombre de la casa y el código de invitación, aplicando actualizaciones optimistas en memoria para mejorar la respuesta de la interfaz.
- **Refactor visual del Home.** Se homogeneizó el diseño del banner principal de la pantalla de inicio para alinearlo con la identidad visual y los componentes utilizados en el resto de las pestañas de la aplicación.
- **Sistema de Recetas Inteligentes.** Se implementó un módulo conectado al inventario actual que consulta TheMealDB para recomendar recetas dinámicamente. El sistema traduce términos comunes en español al inglés para realizar las búsquedas, mostrando el nombre de la receta, su imagen y el detalle completo de ingredientes e instrucciones, sin necesidad de almacenar un catálogo local de recetas. Como limitación de la API utilizada, las instrucciones se presentan en inglés.


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
