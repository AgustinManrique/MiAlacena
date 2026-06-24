# MiAlacena — Persistencia offline con sync + Mejoras UX/UI

Tu parte del trabajo, lista para integrar. Pegá los archivos sobre `src/`
(respetan la estructura de carpetas) y seguí estos 3 pasos.

---

## 1) Instalar dependencias

```bash
npx expo install @react-native-community/netinfo react-native-reanimated
# AsyncStorage y zustand ya están en el proyecto
```

## 2) Activar Reanimated en Babel

En `babel.config.js`, agregá el plugin **como último de la lista**:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // <-- SIEMPRE el último
  };
};
```

Después reiniciá con cache limpio: `npx expo start -c`

## 3) Arrancar el motor de sync en el root

En `App.tsx`, llamá al hook una vez:

```tsx
import { useSyncEngine } from './src/hooks/useSyncEngine';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  useSyncEngine();            // <-- arranca NetInfo + cola de sync
  return <RootNavigator />;
}
```

Listo. No hace falta tocar nada más.

---

## Cómo demostrar el offline (para la defensa)

1. Abrí la app online → todo dice **"Sincronizado"** (verde, arriba a la derecha).
2. Activá **modo avión**. El badge pasa a **"Sin conexión"** (naranja).
3. Agregá productos, cambiá cantidades, marcá compras. Todo funciona al toque
   y el badge muestra **"Sin conexión (N)"** con N = cambios en cola.
4. **Cerrá y volvé a abrir la app** todavía en modo avión → los datos siguen
   ahí (persistencia local) y la cola de N cambios también.
5. Sacá el modo avión → el badge pasa a **"Sincronizando…"** (pulsa) y luego
   **"Sincronizado"**. Entrá a Supabase y vas a ver todo subido.

---

## Requisito en la base de datos

La sincronización manda el `id` generado en el cliente (UUID v4) al insertar.
Esto funciona out-of-the-box si la PK `id` de `products` y `shopping_items`
es `uuid` (con o sin `default gen_random_uuid()`): Postgres acepta un id
explícito sin problema. No hay que cambiar nada salvo que tu PK no sea uuid.

---

## Arquitectura (resumen para el informe)

**Patrón: offline-first con cola de mutaciones y optimistic UI.**

Toda ESCRITURA sigue un único camino:

```
acción del usuario
   → update OPTIMISTA en el store (la UI cambia al instante)
   → se ENCOLA la mutación (persistida en AsyncStorage)
   → el motor intenta drenar la cola contra Supabase
        • con internet  → la sube y la saca de la cola
        • sin internet   → queda en cola hasta reconectar
```

Las LECTURAS se persisten con el middleware `persist` de Zustand sobre
AsyncStorage, así el último estado conocido está disponible sin conexión.

### Piezas

| Archivo | Rol |
|---|---|
| `stores/sync.store.ts` | Estado de red + **cola de mutaciones** (persistida). Hace *coalescing*: si borrás algo que aún no subió, cancela el create en vez de mandar create+delete. |
| `lib/syncEngine.ts` | Escucha **NetInfo**; al volver la conexión **drena la cola en orden FIFO** reproduciendo cada mutación contra los services. Reintentos con tope (descarta mensajes "envenenados" para no bloquear la cola). |
| `lib/uuid.ts` | UUID v4 en el cliente → ids estables para registros creados offline. |
| `lib/storage.ts` | Adaptador AsyncStorage para Zustand `persist`. |
| `stores/product.store.ts`, `shopping.store.ts`, `house.store.ts` | `persist` + escrituras optimistas que encolan. |
| `services/*.ts` | Se agregaron `createProductWithId`, `addItemWithId`, `setPurchased` para que el replay no necesite leer antes de escribir. |
| `components/ui/SyncStatusBadge.tsx` | Indicador animado del estado de sync. **Conecta las dos partes del trabajo**: hace visible la persistencia. |

### Decisiones de diseño defendibles

- **Optimistic UI**: la app nunca "espera" al servidor → se siente instantánea.
- **Un solo camino de escritura** (siempre encola): el código es simple de
  explicar y no se duplica la lógica online/offline.
- **FIFO + ids de cliente**: garantiza que un `create` siempre corre antes de
  su `update`/`delete`, evitando pegarle a un id que el server no tiene.
- **Coalescing**: menos requests y sin inconsistencias (create+delete offline).

---

## Mejoras UX/UI (animaciones y transiciones)

Todo con **react-native-reanimated** (60fps, corre en el hilo de UI).

| Dónde | Animación |
|---|---|
| Listas (inventario y compras) | Entrada `FadeInDown`, salida, y **layout animation** (`LinearTransition`): al agregar/borrar/reordenar, los items se acomodan con resorte. |
| Checkbox de compras | El relleno y el ✓ aparecen con **resorte**; la tarjeta se atenúa al marcar comprado. |
| Cantidad de stock | **Rebote** del número cada vez que cambia. |
| Botones / FAB / controles | `PressableScale`: se achican al presionar (feedback táctil). FAB entra con `ZoomIn`. |
| Transiciones de pantalla | `slide_from_right` por defecto; **"Nuevo Producto" entra como modal** (`slide_from_bottom`); auth y tabs con `fade`. |
| Tabs | Transición `shift` al cambiar de pestaña. |
| Badge de sync | Punto que **pulsa** mientras sincroniza, colores por estado, entra con `FadeIn`. |

> Nota: si tu versión de reanimated es vieja (< 3.5) y `LinearTransition` no
> existe, reemplazalo por `Layout` (mismo uso). Es solo el nombre.
