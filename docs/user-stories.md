# Historias de Usuario

## US-001: Registro de usuario

**Como** nuevo usuario  
**Quiero** crear una cuenta con email y contraseña  
**Para** acceder a la aplicación  

**Criterios de aceptación:**
- El formulario valida email, contraseña (mín 6 chars) y nombre
- Se muestra error descriptivo si el registro falla
- Al registrarse exitosamente, se crea el perfil automáticamente

## US-002: Inicio de sesión

**Como** usuario registrado  
**Quiero** iniciar sesión con mis credenciales  
**Para** acceder a mi hogar  

**Criterios de aceptación:**
- Login con email y contraseña
- Sesión persistente (no requiere login cada vez)
- Error descriptivo si las credenciales son incorrectas

## US-003: Crear casa

**Como** usuario autenticado sin casa  
**Quiero** crear un nuevo hogar  
**Para** empezar a gestionar mi inventario  

**Criterios de aceptación:**
- Se ingresa nombre de la casa
- Se genera código de invitación alfanumérico automáticamente
- El creador obtiene rol "admin"
- Se crean categorías por defecto

## US-004: Unirse a una casa

**Como** usuario autenticado  
**Quiero** unirme a una casa existente con un código  
**Para** colaborar en el inventario compartido  

**Criterios de aceptación:**
- Se ingresa código de invitación
- Validación de código existente
- El usuario se une como "miembro"
- Error si ya es miembro o el código es inválido

## US-005: Ver dashboard

**Como** miembro de una casa  
**Quiero** ver un resumen del estado del hogar  
**Para** conocer rápidamente qué necesito  

**Criterios de aceptación:**
- Muestra total de productos, stock bajo y agotados
- Lista de productos agotados con detalle
- Cantidad de items pendientes en lista de compras
- Pull-to-refresh para actualizar datos

## US-006: Gestionar inventario

**Como** miembro de una casa  
**Quiero** agregar, editar y eliminar productos  
**Para** mantener el inventario actualizado  

**Criterios de aceptación:**
- Agregar producto con nombre, categoría, cantidad, unidad y stock mínimo
- Incrementar/decrementar cantidad desde la lista
- Ver detalle completo del producto
- Eliminar producto con confirmación
- Filtrar por categoría

## US-007: Gestionar lista de compras

**Como** miembro de una casa  
**Quiero** agregar productos a la lista y marcarlos como comprados  
**Para** coordinar las compras del hogar  

**Criterios de aceptación:**
- Agregar items manualmente con nombre
- Marcar/desmarcar items como comprados
- Eliminar items individuales
- Limpiar todos los items comprados
- Badge en tab con cantidad pendiente

## US-008: Ver y compartir código

**Como** admin de una casa  
**Quiero** ver y compartir el código de invitación  
**Para** invitar a otros miembros  

**Criterios de aceptación:**
- Código visible en perfil
- Botón para compartir vía Share nativo
- Muestra lista de miembros actuales
