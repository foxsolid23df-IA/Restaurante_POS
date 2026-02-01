# Plan de Testing Backend - Módulo Administrador

Este documento describe la estrategia de pruebas para asegurar la calidad y robustez del módulo administrador (`/admin`) y su interacción con Supabase.

## 1. Alcance y Estrategia

Cubriremos tres niveles de pruebas para garantizar funcionalidad, lógica y seguridad.

### 1.1. Pruebas Unitarias de Lógica (Unit Tests)

**Objetivo:** Validar la lógica de negocio aislada en los Custom Hooks y utilidades, sin depender de la red ni de la base de datos real.

- **Herramienta:** `Vitest` (Rápido, compatible con Vite).
- **Enfoque:**
  - Mockear el cliente de Supabase (`supabase-js`).
  - Validar transformaciones de datos en hooks como `useReports`, `useInventory`.
  - Simular estados de carga y error.

### 1.2. Pruebas de Integración/Backend (Integration Tests)

**Objetivo:** Validar que las funciones de base de datos (RPC) y las políticas de seguridad (RLS) funcionen correctamente.

- **Herramienta:** `Vitest` + `Supabase Local` (Recomendado) o Scripts de Node.js.
- **Enfoque:**
  - Ejecutar consultas reales contra una base de datos de prueba local (contenedor Docker de Supabase).
  - Validar que un usuario "Cajero" no pueda ver datos de "Administrador".
  - Probar funciones complejas como cierres de caja o movimientos de inventario.

### 1.3. Pruebas End-to-End (E2E)

**Objetivo:** Validar flujos críticos completos desde la perspectiva del usuario final.

- **Herramienta:** `Playwright`.
- **Flujos Críticos:**
  - Login de Admin.
  - Creación y visualización de un nuevo Producto.
  - Generación de un reporte de ventas.
  - Ajuste de inventario.

---

## 2. Infraestructura y Herramientas

### Dependencias Nuevas

Se instalarán las siguientes bibliotecas de desarrollo:

- `vitest`: Runner de pruebas unitarias.
- `@testing-library/react` & `@testing-library/react-hooks`: Para probar hooks y componentes.
- `@playwright/test`: Para pruebas E2E.
- `jsdom`: Entorno simulado de navegador para Vitest.

### Configuración de Entorno

- **Local (Recomendado):** Usar Supabase CLI para levantar una base de datos local efímera para pruebas.
- **Remoto:** _No recomendado para pruebas destructivas._

---

## 3. Plan de Implementación

### Fase 1: Configuración

1. Instalar dependencias de `Vitest` y `Playwright`.
2. Configurar `vite.config.js` para soportar pruebas.
3. Configurar scripts en `package.json`.
4. Crear mocks globales para Supabase.

### Fase 2: Desarrollo de Pruebas Unitarias (Ejemplos)

1. `src/hooks/__tests__/useReports.test.js`: Validar cálculo de totales.
2. `src/hooks/__tests__/useInventory.test.js`: Validar alertas de bajo stock simuladas.

### Fase 3: Desarrollo de Pruebas E2E (Ejemplos)

1. `tests/e2e/auth.spec.js`: Login exitoso.
2. `tests/e2e/products.spec.js`: Crear procucto via UI y verificar en lista.

---

## 4. Ejecución

Para correr las pruebas:

- Unitarias: `npm run test:unit`
- E2E: `npm run test:e2e`
