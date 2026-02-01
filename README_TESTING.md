# Guía de Testing

## Requisitos Previos

1. **Node.js**: Instalado (ya lo tienes).
2. **Docker Desktop**: Necesario para levantar la base de datos de pruebas local (Supabase). Asegúrate de que esté **ejecutándose** si quieres correr pruebas de integración/backend.

## Comandos

### 1. Pruebas Unitarias (Lógica)

Prueban la lógica de los Hooks y Componentes de forma aislada (sin base de datos real).

```bash
npm run test:unit
```

_Herramienta: Vitest + Testing Library_

### 2. Pruebas End-to-End (Simulación de Usuario)

Prueban flujos completos en el navegador. Requiere que la aplicación esté corriendo (`npm run dev`) o que Playwright la levante automáticamente.

```bash
npm run test:e2e
```

_Herramienta: Playwright_

Para ver la interfaz gráfica de Playwright:

```bash
npm run test:e2e:ui
```

### 3. Pruebas de Integración (Backend)

Prueban la conexión real con la base de datos y reglas de seguridad.
**Requiere:**

1. Iniciar Docker Desktop.
2. Levantar Supabase local:
   ```bash
   npx supabase start
   ```
3. Correr las pruebas (aún por configurar scripts específicos, usarían la instancia local).

## Estructura de Pruebas

- `src/hooks/__tests__/`: Pruebas unitarias de hooks.
- `src/test/mocks/`: Mocks para simular Supabase y otras librerías externas.
- `tests/`: Pruebas E2E de Playwright.
