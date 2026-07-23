# Restaurante SaaS — POS

Sistema POS (Point of Sale) para restaurantes, multi-sucursal, con gestión completa de pedidos, inventario, cocina, bar, entregas, CRM, programas de lealtad y reportes avanzados.

---

## Stack Tecnológico

| Capa          | Tecnologías |
|---------------|-------------|
| **Frontend**  | React 19, Vite 7, Tailwind CSS 3, TanStack React Query 5, Zustand 5, React Router 7 |
| **Backend**   | Supabase (PostgreSQL, Auth, Realtime, RLS) |
| **UI/UX**     | Lucide React, Sonner, Recharts, jsPDF, SheetJS |
| **Impresión** | ESC/POS vía bridge Node.js (USB/Red) |
| **Testing**   | Vitest, React Testing Library, Playwright |
| **Infra**     | Docker, NGINX, Prometheus, Vercel |

---

## Módulos del Sistema

### Núcleo POS
- **POS** — grid de productos, carrito multi-mesa, IVA, modificadores, validación de stock
- **Pedidos** — ciclo de vida completo con actualizaciones en tiempo real
- **Mesas / Salón** — layout visual, asignación, combinación y división de mesas
- **Split Bill** — división de cuentas entre comensales
- **Pagos** — efectivo, tarjeta, transferencia, billetera digital

### Cocina y Bar
- **Kitchen Display** — visualizador de órdenes para cocina en tiempo real
- **Bar Display** — visualizador de órdenes para barra en tiempo real
- **Comandas Divididas** — enrutamiento automático cocina/bar/sushi/parrilla

### Inventario y Compras
- **Inventario** — control de stock, alertas de críticos, ajustes, transferencias entre sucursales
- **Recetario** — recetas con vínculo directo a inventario
- **Compras** — órdenes de compra, proveedores, historial, PDF

### CRM y Lealtad
- **CRM** — perfil de clientes, historial de visitas, analytics
- **Programa de Lealtad** — puntos, recompensas, canje, auditoría

### Gestión
- **Staff / Usuarios** — roles, permisos, PIN login, bienvenida por email
- **Sucursales** — multi-tenant completo con transferencias
- **Reservaciones** — calendario, mapa de mesas, gestión de reservas
- **Menús** — menús por horario / temporada

### Reportes y Analytics
- **Dashboard** — overview con métricas clave y KPI
- **Reportes de Ventas** — filtros avanzados, exportación
- **Desempeño de Productos** — rentabilidad, tendencias
- **Pronósticos** — proyecciones basadas en históricos

### Delivery
- **Gestión de Entregas** — asignación, seguimiento, historial
- **Optimizador de Rutas** — mapa interactivo con rutas optimizadas
- **Mapa en Tiempo Real** — seguimiento de pedidos

### Configuración
- **Configuración del Negocio** — datos fiscales, identidad, preferencias
- **Impresoras Térmicas** — configuración de equipos ESC/POS
- **Ticket / Comanda** — formato y personalización de impresión

### Infraestructura
- **Autenticación** — Supabase Auth + PIN code + roles con RLS
- **Monitoreo** — Prometheus + alertas (errores, latency, SSL, DB)
- **Seguridad** — CSP, rate limiting, hardening headers
- **Notificaciones** — WhatsApp, centro de notificaciones

---

## Inicio Rápido

### Requisitos
- Node.js ≥ 18
- Cuenta Supabase (gratuita)

### 1. Clonar e instalar
```bash
git clone <repo-url>
cd restaurante-pos
npm install
```

### 2. Configurar variables de entorno
Crear archivo `.env` en la raíz:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
```
Las credenciales se obtienen de Supabase Dashboard → Settings → API.

### 3. Inicializar DB (opcional con Supabase local)
```bash
npx supabase start          # Docker local
npx supabase db push        # Migraciones
```

### 4. Iniciar en desarrollo
```bash
npm run dev
```

### Scripts principales
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build producción |
| `npm run preview` | Preview build |
| `npm test` | Pruebas unitarias |
| `npm run test:e2e` | Pruebas E2E (Playwright) |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript check |
| `npm run docker:build` | Build Docker |

---

## Estructura del Proyecto

```
restaurante-pos/
├── src/                    # Código fuente frontend
│   ├── components/         # Componentes reutilizables
│   ├── pages/              # Páginas/rutas
│   ├── hooks/              # Custom hooks
│   ├── store/              # Zustand stores
│   ├── lib/                # Utilidades, APIs, helpers
│   ├── features/           # Lógica de negocio
│   ├── router/             # Router con lazy loading
│   └── test/               # Mocks y setup de testing
├── backend/db/             # Schemas SQL, migraciones, RLS
├── supabase/               # Edge Functions, migraciones
├── printer-bridge/         # Bridge Node.js para impresoras térmicas
├── config/                 # Seguridad, CSP, rate limiting
├── monitoring/             # Prometheus + alertas
├── scripts/                # Deploy, backup, health check
├── docs/                   # Documentación en inglés
├── tests/                  # Tests E2E (Playwright)
├── docker-compose.prod.yml
├── Dockerfile / Dockerfile.prod
├── nginx.conf
└── .env.local              # Variables de entorno locales
```

---

## Documentación

El proyecto cuenta con documentación extensa en la raíz (español) y en `docs/` (inglés):

| Documento | Descripción |
|-----------|-------------|
| [`GUIA_DESPLIEGUE.md`](./GUIA_DESPLIEGUE.md) | Guía paso a paso para despliegue local |
| [`SISTEMA_POS_COMPLETO.md`](./SISTEMA_POS_COMPLETO.md) | Arquitectura del módulo POS/Órdenes |
| [`SISTEMA_CAJA_COMPLETO.md`](./SISTEMA_CAJA_COMPLETO.md) | Sistema de cortes de caja |
| [`COMANDAS_DIVIDIDAS.md`](./COMANDAS_DIVIDIDAS.md) | Enrutamiento cocina/bar |
| [`REPORTES_AVANZADOS.md`](./REPORTES_AVANZADOS.md) | Reportes y analytics |
| [`GUIDE_IMPRESORAS_TERMICAS.md`](./GUIDE_IMPRESORAS_TERMICAS.md) | Configuración de impresoras |
| [`IMPLEMENTACION_COMPLETA_PRODUCCION.md`](./IMPLEMENTACION_COMPLETA_PRODUCCION.md) | Plan de implementación producción |
| [`CHECKLIST_GO_LIVE_COMPLETO.md`](./CHECKLIST_GO_LIVE_COMPLETO.md) | Checklist go-live |
| [`PLAN_CAPACITACION_STAFF.md`](./PLAN_CAPACITACION_STAFF.md) | Plan de capacitación (15 días) |
| [`PRUEBAS_USUARIOS.md`](./PRUEBAS_USUARIOS.md) | Scripts de pruebas manuales |
| [`README_TESTING.md`](./README_TESTING.md) | Guía de testing automatizado |
| [`docs/production-security-guide.md`](./docs/production-security-guide.md) | Guía de seguridad en producción |
| [`docs/go-live-checklist.md`](./docs/go-live-checklist.md) | Go-live checklist (English) |
| [`docs/printer-configuration-guide.md`](./docs/printer-configuration-guide.md) | Printer config guide (English) |
| [`docs/staff-training-plan.md`](./docs/staff-training-plan.md) | Staff training plan (English) |
| [`docs/PRODUCTION-IMPLEMENTATION-PLAN.md`](./docs/PRODUCTION-IMPLEMENTATION-PLAN.md) | Production plan (English) |

---

## Licencia

Proyecto privado — todos los derechos reservados.
