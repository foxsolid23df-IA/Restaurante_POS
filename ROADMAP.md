# Roadmap — Restaurante POS

## Fase 1 — Fundación ✅ (Completada)
- README.md principal con descripción, stack, setup, estructura
- Enlaces a toda la documentación existente
- Limpieza de credenciales expuestas (`SUPABASE.txt` eliminado)

## Fase 2 — Calidad y Seguridad ✅ (Completada)
- Pruebas unitarias e integración (20 tests, 100% pass)
- CI/CD pipeline (GitHub Actions: lint, type-check, tests, build, E2E, security audit)
- Seguridad: CSP, rate limiting, validación de inputs, RLS auditados
- `config/security.js` reescrito con ESM válido

---

## Fase 3 — Experiencia Cliente y Mobile ✅ (Completada)

### 3.1 App Móvil / Menú Digital para Clientes
- Ruta pública `/menu/:tableId` para que clientes vean el menú desde su celular
- Vista responsive con categorías, productos, precios y modificadores
- Carrito simplificado para enviar pedido a cocina
- Schema `customer_orders` con RLS para inserts anónimos

### 3.2 PWA (Progressive Web App)
- Service worker (`public/sw.js`) para caché de assets estáticos
- Manifest (`public/manifest.json`) para instalación en homescreen
- Componente `PWARegister` registrado en `main.jsx`

### 3.3 Menús QR por Mesa
- Utilidad `src/utils/qrMenu.js` con generación de URLs por mesa
- Comandos ESC/POS para impresión de QR en tickets
- Ruta dinámica `/menu/:tableId`

### 3.4 Notificaciones Push
*(Pendiente — requiere Push API + backend para gestión de suscripciones)*

---

## Fase 4 — Internacionalización y Multi-moneda ✅ (Completada)

### 4.1 i18n
- Sistema de traducciones propio (`src/features/i18n/useI18n.js`)
- Soporte: Español (`es.json`) e Inglés (`en.json`) con 100+ claves
- Detección automática de idioma del navegador
- Selector de idioma en Settings → Idioma y Moneda
- Persistencia en `localStorage`

### 4.2 Multi-moneda
- 8 monedas soportadas: MXN, USD, EUR, COP, ARS, CLP, PEN, BRL
- Formateo con `Intl.NumberFormat`
- Conversión con `fetchExchangeRates()` (API externa + caché local)
- Selector de moneda en Settings

---

## Fase 5 — Integraciones y Hardware ✅ (Completada)

### 5.1 POS Físico / Pinpad
- Módulo `src/features/payments/posTerminal.js` — manager de terminal con estados
- Soporte para Pinpad USB (WebUSB) y Bluetooth (WebBluetooth)
- Hook `usePOSTerminal` con conexión, pago de prueba y monitoreo de estado
- Interfaz en Settings → POS Físico

### 5.2 Pasarelas de Pago
- Abstracción `src/features/payments/paymentGateway.js`
- Providers: Stripe, MercadoPago, ConektaPay + fallback offline
- Configuración persistida en `business_settings` via Supabase

---

## Fase 6 — Inteligencia y Analytics ✅ (Completada)

### 6.1 Analítica Avanzada
- Motor de pronóstico `src/features/analytics/forecastEngine.js`:
  - `predictNextPeriods()` — 3 métodos: linear regression, moving average, exponential smoothing
  - `detectAnomalies()` — detección por Z-Score
  - `getTopProducts()` — ranking por cantidad/ingresos
  - `getBusiestHours()` — análisis de horas pico
  - `segmentCustomers()` — segmentación VIP, frecuente, regular, en riesgo, nuevo
  - `calculateDayOverDay()` — comparativa día contra día
  - `getRecommendations()` — recomendaciones basadas en historial

### 6.2 API y Hook
- `src/features/analytics/api/analyticsApi.js` — 7 métodos de consulta con Supabase
- `src/features/analytics/useAnalytics.js` — hook con estado loading/error

---

## Fase 7 — Multi-idioma App Staff ✅ (Completada)

### 7.1 Traducción completa disponible
- Hook `useI18n()` con función `t(key, params)` para interpolación
- 100+ claves traducidas cubriendo: navegación, POS, menú cliente, settings, pagos, reportes, inventario, lealtad, errores
- Selector de idioma en configuración del negocio

---

## Leyenda
- ✅ Completado
- 🟡 En progreso (Fase actual)
- 🔵 Planeado a corto plazo
- 🟣 Planeado a mediano plazo
- 🟢 Planeado a largo plazo
