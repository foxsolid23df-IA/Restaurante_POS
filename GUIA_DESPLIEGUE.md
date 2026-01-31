# 🚀 GUÍA DE DESPLIEGUE LOCAL - Restaurante POS

## 📋 REQUISITOS PREVIOS

Antes de empezar, asegúrate de tener instalado:

- ✅ **Node.js** (versión 16 o superior)
- ✅ **npm** (viene con Node.js)
- ✅ Cuenta de **Supabase** con el proyecto configurado

---

## 🔧 PASO 1: Verificar Instalaciones

Abre una terminal (PowerShell o CMD) y ejecuta:

```bash
node --version
npm --version
```

**Resultado esperado:**

```
v18.x.x (o superior)
9.x.x (o superior)
```

Si no tienes Node.js instalado, descárgalo de: https://nodejs.org/

---

## 📁 PASO 2: Navegar al Proyecto

En la terminal, navega a la carpeta del proyecto:

```bash
cd "C:\Users\foxso\OneDrive - Universidad Abierta y a Distancia de México\Imágenes\Restaurante POS"
```

---

## 🔑 PASO 3: Configurar Variables de Entorno

1. Abre el archivo `.env` en la raíz del proyecto
2. Verifica que tenga estas dos líneas con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica-aqui
```

**¿Dónde encontrar estas credenciales?**

- Ve a tu proyecto en Supabase Dashboard
- **Settings** → **API**
- Copia:
  - **Project URL** → `VITE_SUPABASE_URL`
  - **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## 📦 PASO 4: Instalar Dependencias

En la terminal, ejecuta:

```bash
npm install
```

**Esto puede tardar 1-2 minutos.** Verás algo como:

```
added 150 packages in 45s
```

---

## ▶️ PASO 5: Iniciar el Servidor de Desarrollo

Ejecuta:

```bash
npm run dev
```

**Resultado esperado:**

```
  VITE v7.3.1  ready in 410 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## 🌐 PASO 6: Abrir en el Navegador

1. Abre tu navegador (Chrome, Edge, Firefox)
2. Ve a: **http://localhost:5174/**
3. Deberías ver la pantalla de **"Acceso Rápido"** (Login por PIN)

---

## 🎯 PASO 7: Primer Login

Como aún no tienes usuarios con PIN configurado, usa el login tradicional:

1. En la pantalla de PIN, haz clic en **"Usar correo y contraseña →"**
2. Inicia sesión con:
   - **Email:** `admin@restaurante.com`
   - **Contraseña:** `admin123`

**Si este usuario no existe**, créalo en Supabase SQL Editor:

```sql
-- Crear usuario admin
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'admin@restaurante.com',
  crypt('admin123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', '{}', FALSE
);

-- Crear perfil
INSERT INTO public.profiles (id, full_name, role, pin_code, is_active)
SELECT id, 'Administrador', 'admin'::user_role, '1111', true
FROM auth.users WHERE email = 'admin@restaurante.com';
```

---

## ✅ VERIFICACIÓN RÁPIDA

Una vez dentro, deberías ver:

- ✅ Sidebar con menús: Dashboard, Inventario, Productos, etc.
- ✅ Nombre "Administrador" en la parte superior del sidebar
- ✅ Rol "admin" debajo del nombre

---

## 🛑 DETENER EL SERVIDOR

Para detener el servidor de desarrollo:

1. Ve a la terminal donde está corriendo `npm run dev`
2. Presiona **Ctrl + C**
3. Confirma con **Y** (Yes)

---

## 🔄 REINICIAR EL SERVIDOR

Si haces cambios en el código y necesitas reiniciar:

```bash
npm run dev
```

El servidor se reinicia automáticamente con los cambios (Hot Reload).

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### Problema 1: "Puerto 5174 en uso"

**Error:**

```
Port 5174 is in use, trying another one...
```

**Solución:**

- Cierra todas las terminales que tengan `npm run dev` corriendo
- O usa el nuevo puerto que Vite asigna automáticamente (ej: 5175)

---

### Problema 2: "Cannot find module"

**Error:**

```
Error: Cannot find module '@/lib/supabase'
```

**Solución:**

```bash
npm install
npm run dev
```

---

### Problema 3: "Supabase connection error"

**Error en consola del navegador:**

```
Missing Supabase Environment Variables
```

**Solución:**

1. Verifica que el archivo `.env` existe en la raíz
2. Verifica que las variables estén correctas
3. Reinicia el servidor (`Ctrl+C` y luego `npm run dev`)

---

### Problema 4: "Login no funciona"

**Síntoma:** Al dar login, no pasa nada o da error.

**Solución:**

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Busca errores en rojo
4. Verifica que el usuario existe en Supabase → **Authentication** → **Users**

---

## 📱 ACCESO DESDE OTROS DISPOSITIVOS (Opcional)

Para probar en tablet o celular en la misma red WiFi:

```bash
npm run dev -- --host
```

Verás algo como:

```
➜  Local:   http://localhost:5174/
➜  Network: http://192.168.1.100:5174/
```

Usa la URL de **Network** en tu tablet/celular.

---

## 🎉 ¡LISTO PARA PROBAR!

Ahora puedes seguir el documento **PRUEBAS_USUARIOS.md** para validar el módulo de usuarios.

---

## 📞 COMANDOS ÚTILES

| Comando           | Descripción                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Inicia servidor de desarrollo       |
| `npm run build`   | Compila para producción             |
| `npm run preview` | Vista previa de build de producción |

---

## 🔗 RECURSOS

- **Proyecto Local:** http://localhost:5174/
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Documentación Vite:** https://vitejs.dev/
