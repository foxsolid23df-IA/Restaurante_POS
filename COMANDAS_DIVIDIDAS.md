# 🍽️ Comandas Divididas - Guía de Uso

## 📋 Funcionalidades Implementadas

### ✅ **Vista de Cocina** (`/kitchen`)
- **Filtrado automático**: Solo muestra productos de cocina y parrilla
- **Estados visuales**: Pendientes → En preparación → Listos → Entregados
- **Actualización en tiempo real**: Suscripción a cambios en la base de datos
- **Acciones directas**: Iniciar preparación, marcar listo, entregar

### ✅ **Vista de Bar** (`/bar`)
- **Filtrado automático**: Solo muestra bebidas y productos de bar
- **Íconos por categoría**: Bebidas, cervezas, vinos, etc.
- **Actualización en tiempo real**: Sincronización instantánea
- **Control de flujo**: Pendientes → En preparación → Listos → Entregados

### ✅ **Configuración de Áreas**
- **Asignación automática**: Por nombre de categoría
- **Manual**: Selección por dropdown
- **4 áreas disponibles**: Cocina, Bar, Barra de Sushi, Parrilla

## 🔧 **Configuración Inicial**

### 1. **Configurar Áreas de Categorías**
1. Ve a **Categorías** en el sidebar
2. Haz clic en **"Configurar Áreas"** (botón morado)
3. Usa **"Auto-configurar"** para asignación inteligente
4. O selecciona manualmente cada categoría:
   - **Cocina**: Platos principales, entradas, postres
   - **Bar**: Bebidas, cócteles, refrescos
   - **Barra de Sushi**: Rolls, sashimi, tempuras
   - **Parrilla**: Carnes asadas, brochetas

### 2. **Asignar Permisos**
Las vistas de área están disponibles para:
- **Admin**: Acceso completo a todas las áreas
- **Manager**: Acceso a cocina y bar
- **Captain**: Acceso a cocina y bar

## 🚀 **Flujo de Trabajo**

### Para Meseros:
1. **Crear orden** en POS normal
2. **Productos se filtran automáticamente** por área
3. **Cada área recibe solo sus productos correspondientes**

### Para Cocina:
1. **Acceder a `/kitchen`**
2. **Ver solo platos de cocina/parrilla**
3. **Marcar estados**: Pendiente → Preparando → Listo → Entregado
4. **Actualizaciones en tiempo real** desde cualquier dispositivo

### Para Bar:
1. **Acceder a `/bar`**
2. **Ver solo bebidas y productos de bar**
3. **Controlar flujo de preparación**
4. **Sincronización instantánea** con el mesero

## 📱 **Características Técnicas**

### 🔄 **Actualización en Tiempo Real**
- **WebSockets**: Suscripción a cambios en `order_items`
- **Filtros**: Por `printer_destination` y `status`
- **Optimización**: Solo carga items relevantes por área

### 🎨 **Interfaz Adaptada**
- **Colores por área**: Naranja (cocina), Azul (bar)
- **Estados visuales**: Iconos y colores intuitivos
- **Responsive**: Funciona en tablets y móviles

### 🗂️ **Estructura de Datos**
```javascript
// Categorías con destino de impresión
{
  id: "uuid",
  name: "Bebidas",
  printer_destination: "bar" // kitchen | bar | sushi_bar | grill
}

// Items filtrados por área
{
  order_items: [
    {
      status: "pending", // sent_to_kitchen | ready | delivered
      products: {
        name: "Cerveza",
        categories: {
          printer_destination: "bar"
        }
      }
    }
  ]
}
```

## 🎯 **Beneficios**

1. **Separación clara**: Cada área solo ve lo que necesita
2. **Eficiencia**: Sin distracciones de productos de otras áreas
3. **Control total**: Seguimiento individual de cada item
4. **Flexibilidad**: Configuración manual o automática
5. **Escalabilidad**: Fácil añadir nuevas áreas

## 📞 **Soporte**

Si necesitas ayuda:
1. **Verifica configuración** en Categorías → Configurar Áreas
2. **Confirma permisos** de usuario en Administración
3. **Prueba flujo** con ordenes de prueba
4. **Revisa consola** para errores específicos

---

**¡Listo para usar!** Las comandas divididas están completamente integradas con el sistema existente.