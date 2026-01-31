# 📋 PRUEBAS MANUALES - Módulo de Usuarios y Seguridad

## ✅ OBJETIVO COMPLETADO

- Gestión de Empleados ✓
- Acceso por PIN ✓
- Control de Roles ✓

---

## 🧪 PRUEBAS A REALIZAR

### PRUEBA 1: Gestión de Empleados (Edición de Perfiles)

**Objetivo:** Verificar que un Admin puede editar los datos de los empleados.

**Pasos:**

1. Inicia sesión con el usuario Admin (admin@restaurante.com / admin123)
2. Ve al menú lateral → **Usuarios**
3. Deberías ver una tarjeta con el perfil del Administrador
4. Haz clic en **"Editar Perfil"**
5. Cambia el **Nombre** a "Admin Principal"
6. Cambia el **PIN** a `1111`
7. Haz clic en **"Guardar Cambios"**

**Resultado Esperado:**

- ✅ El modal se cierra
- ✅ La tarjeta muestra el nuevo nombre
- ✅ Aparece el indicador "PIN Configurado" con 4 círculos rellenos

---

### PRUEBA 2: Crear Usuario Mesero (Manual en Supabase)

**Objetivo:** Crear un mesero de prueba para validar el login por PIN.

**Pasos:**

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Ejecuta este código:

```sql
-- Crear usuario mesero
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'mesero@restaurante.com',
  crypt('mesero123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', '{}', FALSE
);

-- Crear perfil del mesero
INSERT INTO public.profiles (id, full_name, role, pin_code, is_active)
SELECT id, 'Carlos Mesero', 'waiter'::user_role, '2222', true
FROM auth.users WHERE email = 'mesero@restaurante.com';
```

3. Regresa a la app → **Usuarios**
4. Deberías ver 2 tarjetas: Admin y Carlos Mesero

**Resultado Esperado:**

- ✅ Aparece la tarjeta de "Carlos Mesero"
- ✅ Su rol es "Mesero" (badge naranja)
- ✅ Estado: Activo (punto verde)

---

### PRUEBA 3: Login por PIN (Mesero)

**Objetivo:** Validar que un mesero puede entrar con su PIN de 4 dígitos.

**Pasos:**

1. Cierra sesión (botón "Cerrar Sesión" en el sidebar) (NO REGRESA A LA PANTALLA DE ACCESO RAPIDO REVISAR)
2. Deberías ver la pantalla de **"Acceso Rápido"** con el teclado numérico
3. Ingresa el PIN: `2` `2` `2` `2`
4. Haz clic en **"ENTRAR"**

**Resultado Esperado:**

- ✅ Los círculos se llenan en azul conforme escribes
- ✅ Al dar ENTRAR, redirige a **"/orders"** (Punto de Venta)
- ✅ En el sidebar aparece "Carlos Mesero" y su rol "waiter"

---

### PRUEBA 4: Control de Roles (Mesero NO ve Inventario)

**Objetivo:** Verificar que un mesero NO tiene acceso a módulos de Admin.

**Pasos:**

1. Con la sesión de "Carlos Mesero" activa
2. Revisa el menú lateral
 
**Resultado Esperado:**

- ✅ **SÍ** aparecen: Mesas, Punto de Venta, Órdenes Activas
- ❌ **NO** aparecen: Dashboard, Inventario, Productos, Categorías, Usuarios

3. Intenta acceder manualmente escribiendo en la URL: `http://localhost:5174/inventory`

**Resultado Esperado:**

- ✅ El sistema permite el acceso (porque las políticas RLS de Supabase ya filtran por autenticación)
- ⚠️ Nota: Para bloquear completamente el acceso por URL, necesitarías agregar validación de roles en el componente ProtectedRoute

---

### PRUEBA 5: Login por PIN (Admin)

**Objetivo:** Validar que el Admin también puede usar PIN.

**Pasos:**

1. Cierra sesión
2. En la pantalla de PIN, ingresa: `1` `1` `1` `1` (el PIN que configuraste en Prueba 1)
3. Haz clic en **"ENTRAR"**

**Resultado Esperado:**

- ✅ Redirige a **"/dashboard"** (porque es Admin)
- ✅ En el sidebar aparece "Admin Principal" y rol "admin"
- ✅ **SÍ** aparecen todos los menús (Dashboard, Inventario, Productos, etc.)

---

### PRUEBA 6: PIN Incorrecto

**Objetivo:** Validar que un PIN inválido muestra error.

**Pasos:**

1. Cierra sesión
2. Ingresa un PIN incorrecto: `9` `9` `9` `9`
3. Haz clic en **"ENTRAR"**

**Resultado Esperado:**

- ✅ Aparece mensaje de error: "PIN incorrecto o usuario inactivo"
- ✅ Los círculos se vacían automáticamente
- ✅ El teclado sigue disponible para reintentar

---

### PRUEBA 7: Alternar entre Login por PIN y Email

**Objetivo:** Verificar que se puede cambiar de método de login.

**Pasos:**

1. En la pantalla de PIN, haz clic en **"Usar correo y contraseña →"**
2. Deberías ver la pantalla de login tradicional
3. Inicia sesión con: admin@restaurante.com / admin123

**Resultado Esperado:**

- ✅ Funciona el login tradicional
- ✅ Redirige al Dashboard

---

## 📊 RESUMEN DE VALIDACIÓN

| Funcionalidad                | Estado |
| ---------------------------- | ------ |
| Ver lista de empleados       | ⬜     |
| Editar perfil de empleado    | ⬜     |
| Configurar PIN de 4 dígitos  | ⬜     |
| Login por PIN (Mesero)       | ⬜     |
| Login por PIN (Admin)        | ⬜     |
| Redireccionamiento según rol | ⬜     |
| Menú filtrado por rol        | ⬜     |
| Validación de PIN incorrecto | ⬜     |
| Alternar método de login     | ⬜     |

---

## 🐛 PROBLEMAS CONOCIDOS

1. **Creación de usuarios:** Por ahora se hace manualmente en Supabase. En el futuro implementaremos una Edge Function para que el Admin cree usuarios desde la UI.

2. **Bloqueo por URL:** Un mesero técnicamente puede acceder a `/inventory` escribiendo la URL. Las políticas RLS de Supabase protegen los datos, pero para UX profesional deberías agregar validación de roles en el frontend.

---

## ✅ SIGUIENTE PASO

Una vez validadas estas pruebas, podemos implementar:

- **Comandas Divididas** (Impresión por área: Cocina/Bar)
- **Cortes de Caja y Cierres de Día**
- **Reportes Avanzados**
