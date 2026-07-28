# Notificaciones Push (Entrega 3)

Notificaciones push remotas para avisar a los miembros de una casa de eventos
relevantes (stock bajo/agotado, nuevo miembro).

## ⚠️ Importante: no funciona en Expo Go

Desde **Expo SDK 53**, las **push remotas en Android no funcionan en Expo Go**.
Para probarlas necesitás un **development build** (APK/instalación nativa propia).
El resto de la app sí corre en Expo Go; solo la recepción de la push requiere dev build.

## Arquitectura

```
Cliente (RN)                         Supabase                        Expo
────────────                         ────────                        ────
usePushNotifications()  ─registro─▶  push_tokens (RLS: dueño)
  └ registerForPush...()

product.store / joinHouse
  └ sendHousePush()      ─invoke─▶   Edge Function send-push
                                      └ service_role: lee tokens
                                        de la casa  ─POST lotes≤100─▶  exp.host/--/api/v2/push/send
                                                                        └ entrega la push al device
```

## Puesta en marcha

### 1. Base de datos
Corré en el **SQL Editor** de Supabase el bloque `PUSH NOTIFICATIONS` que está al
final de [`supabase_schema.sql`](../supabase_schema.sql) (tabla `push_tokens` + RLS).
El script es idempotente, se puede reejecutar.

### 2. EAS project ID
`getExpoPushTokenAsync` necesita el `projectId` de EAS. Configuralo:

```bash
npm install -g eas-cli
eas login
eas init          # crea/asocia el projectId
```

Esto completa `extra.eas.projectId` en `app.json` (hoy tiene un placeholder
`REEMPLAZAR_CON_TU_EAS_PROJECT_ID`). Verificá que quede el UUID real.

### 3. Edge Function
```bash
# requiere supabase CLI y estar logueado (supabase login) + link al proyecto
supabase functions deploy send-push
```
`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` se inyectan solos en el entorno de la
función (no hay que setearlos). La función valida el JWT del usuario que la invoca
(el cliente lo manda automáticamente vía `supabase.functions.invoke`).

### 4. Development build
Opción A — build local (requiere Android SDK / Android Studio):
```bash
npx expo run:android
```
Opción B — build en la nube con EAS:
```bash
eas build --profile development --platform android
# instalás el APK que te da EAS en el dispositivo
```

## Cómo probar (paso a paso)

1. Corré el SQL, deployá la function y hacé un **dev build** (secciones de arriba).
2. Instalá el dev build en **dos dispositivos** (o un dispositivo + un emulador con
   Google Play; recordá que el emulador puede no recibir push — preferí 2 físicos).
3. Iniciá sesión con **dos cuentas distintas que sean miembros de la misma casa**
   (una crea la casa y comparte el código; la otra se une con ese código).
   - Al loguear, cada dispositivo registra su Expo push token en `push_tokens`.
   - Aceptá el permiso de notificaciones cuando lo pida.
4. Desde la cuenta A, en el inventario, **bajá el stock** de un producto por debajo
   de su `min_stock` (o a 0). El estado pasa a *bajo*/*agotado*.
5. La cuenta B recibe la push: **"Stock bajo — Queda poco de {producto}"**.
   (La cuenta A no la recibe: se auto-excluye con `exclude_user_id`.)
6. Prueba alternativa: con una tercera cuenta, unite a la casa con el código →
   los miembros existentes reciben **"{nombre} se unió a la casa"**.

## Notas de diseño

- **Anti-spam**: la push de stock se dispara solo en la *transición* a bajo/agotado
  (no en cada decremento mientras ya está bajo).
- **Best-effort**: todas las llamadas de push van en `try/catch`. Si la function
  falla o no hay red, el flujo principal (crear producto, unirse) nunca se rompe.
- **Privacidad/RLS**: `push_tokens` tiene RLS por dueño (`user_id = auth.uid()`).
  El fan-out a la casa lo hace la Edge Function con `service_role`, no el cliente.
- **Logout**: se elimina el token de ese dispositivo (`unregisterPushToken`).
