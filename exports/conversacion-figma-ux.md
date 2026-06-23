# Exportacion de conversacion - HogarStock UX/UI y Figma

Fecha: 2026-05-16

## Pedido del usuario

Actuar como arquitecto de software y disenador UX/UI senior con experiencia en analisis de proyectos, documentacion tecnica y diseno de interfaces en Figma.

Objetivo: revisar integralmente el proyecto existente y toda su documentacion asociada para continuar el trabajo ya realizado, manteniendo consistencia funcional, visual y tecnica.

Tareas solicitadas:

- Analizar todo el codigo fuente disponible.
- Analizar estructura, modulos, componentes, funcionalidades y flujos existentes.
- Detectar relaciones entre funcionalidades y dependencias.
- Leer y analizar documentacion disponible: requisitos, casos de uso, historias de usuario, diagramas, reglas de negocio, flujos y arquitectura.
- Considerar la documentacion como fuente principal de verdad.
- Senalar contradicciones entre implementacion y documentacion.
- Volver a conectarse al espacio/proyecto Figma utilizado anteriormente.
- Analizar disenos existentes.
- Continuar el trabajo sin reemplazar lo existente.
- Mantener identidad visual, componentes, estilos, tipografias, colores, espaciados y convenciones.
- Disenar pantallas faltantes necesarias segun documentacion.
- Crear componentes reutilizables cuando corresponda.
- Definir conexiones y navegacion entre pantallas.
- Incluir flujos de autenticacion, navegacion principal, secundaria, rutas protegidas y errores.
- No modificar funcionalidades implementadas sin justificacion.
- No eliminar pantallas existentes.
- No inventar requisitos no respaldados por documentacion.

Resultado esperado:

- A. Resumen del analisis realizado
- B. Lista de pantallas identificadas
- C. Pantallas nuevas agregadas
- D. Mapa completo de navegacion
- E. Relaciones entre pantallas
- F. Componentes reutilizados y nuevos componentes
- G. Inconsistencias detectadas
- H. Justificacion de decisiones tomadas
- I. Estado final del diseno actualizado en Figma

## Trabajo realizado

Se reviso el proyecto completo y se continuo el trabajo en Figma sin reemplazar el board anterior.

Archivos y areas analizadas:

- README.md
- supabase_schema.sql
- App.tsx
- index.ts
- app.json
- package.json
- src/navigation/RootNavigator.tsx
- src/navigation/MainTabs.tsx
- src/types/index.ts
- src/theme/index.ts
- src/config/constants.ts
- src/config/supabase.ts
- utils/supabase.ts
- src/services/*
- src/stores/*
- src/screens/*
- src/components/ui/*
- src/components/inventory/*
- src/components/shopping/*

Stack confirmado:

- Expo + React Native
- TypeScript
- Supabase
- Zustand
- React Navigation v7
- AsyncStorage

## Pantallas identificadas

- Login
- Register
- HouseSetup
- Inicio
- Alacena
- Nuevo Producto
- Detalle Producto
- Compras
- Perfil

Estados identificados:

- Loading inicial
- Inventario vacio
- Lista de compras vacia
- Errores de formulario
- Confirmaciones
- Producto no encontrado

## Pantallas nuevas agregadas en Figma

Se agregaron pantallas editables para el flujo actual y una pantalla faltante clave:

- Login
- Register
- HouseSetup - Elegir
- HouseSetup - Crear
- HouseSetup - Unirse
- Inicio - Dashboard
- Alacena - Lista
- Alacena - Vacia
- Nuevo Producto
- Detalle Producto
- Editar Producto
- Compras
- Perfil

Archivo nuevo de diseno:

https://www.figma.com/design/LkBdZMR9Mhz8SpU09jnMui

## Mapa de navegacion

Se actualizo el board original con un mapa completo de navegacion, rutas protegidas, errores y estados.

Board existente:

https://www.figma.com/board/9L3NTbeeuRAXeRuVVinpKH

## Relaciones entre pantallas

- Auth protege todo el flujo principal.
- HouseSetup aparece solo si el usuario autenticado no tiene casa.
- MainTabs agrupa Inicio, Alacena, Compras y Perfil.
- Alacena conecta con Nuevo Producto y Detalle.
- Detalle conecta con Editar, Eliminar y Agregar a compras.
- Perfil conecta con Compartir codigo y Logout.

## Componentes reutilizados y nuevos componentes

Componentes reutilizados en el diseno:

- Button
- Input
- Card
- StatusBadge
- EmptyState
- ProductCard
- CategoryFilter
- ShoppingItemCard
- TabBar conceptual

Tambien se agrego en Figma un mini design system basado en `src/theme/index.ts`:

- Colores
- Botones
- Inputs
- Cards
- Badges

## Inconsistencias detectadas

- `ProductDetailScreen` navega a `EditProduct`, pero `RootNavigator` no registra esa pantalla.
- README dice que edicion de productos esta en Entrega 1, pero tambien la marca pendiente en Entrega 2.
- `ProfileScreen` muestra `members`, pero no llama `loadMembers`; puede verse vacio aunque existan miembros.
- README menciona configuracion en `src/config/supabase.ts`, pero ese archivo reexporta desde `utils/supabase.ts`.
- Hay texto con mojibake en README, schema y strings visibles.
- `supabase_schema.sql` incluye tabla `todos`, no documentada como parte del dominio.
- Expo aviso dependencias fuera de version esperada para SDK 54.

## Justificacion de decisiones

Se priorizo la documentacion como fuente de verdad.

Por eso se agrego `Editar Producto` al diseno aunque falte implementacion, porque esta respaldada por US-006 y el flujo documentado.

No se inventaron pantallas fuera del alcance de Entrega 1. Las features de Entrega 2 y Entrega 3 quedaron senaladas como pendientes.

## Estado final

Figma queda con dos artefactos:

Board existente actualizado con arquitectura, modelo de datos, navegacion y estados:

https://www.figma.com/board/9L3NTbeeuRAXeRuVVinpKH

Archivo nuevo con pantallas UX/UI editables y especificacion por pantalla:

https://www.figma.com/design/LkBdZMR9Mhz8SpU09jnMui

No se modifico codigo fuente durante esa pasada.
