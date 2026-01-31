# 🖨️ Guía Completa de Configuración de Impresoras Térmicas

## 📋 **Índice**
1. [Requisitos de Hardware](#requisitos-de-hardware)
2. [Instalación de Drivers](#instalación-de-drivers) 
3. [Configuración de Red](#configuración-de-red)
4. [Configuración en el Sistema POS](#configuración-en-el-sistema-pos)
5. [Pruebas y Troubleshooting](#pruebas-y-troubleshooting)
6. [Mantenimiento Preventivo](#mantenimiento-preventivo)

---

## 🔧 **Requisitos de Hardware**

### **Impresoras Térmicas Recomendadas**
| Modelo | Interfaz | Papel | Comentarios |
|--------|----------|-------|-------------|
| Epson TM-T88V | USB/Ethernet | 80mm | Estándar industria, confiable |
| Star Micronics TSP650II | USB/Ethernet/Bluetooth | 58mm/80mm | Excelente relación costo-beneficio |
| Citizen CT-S310II | USB/Ethernet | 58mm | Compacta y económica |
| Custom POS-58 Auto-Cut | USB/Bluetooth | 58mm | Incluye cortador automático |
| RP58 Mobile | USB/Bluetooth | 58mm | Ideal para delivery |

### **Especificaciones Técnicas Mínimas**
- **Resolución**: 203 DPI o superior
- **Velocidad**: 150 mm/s mínimo
- **Memoria**: 4KB+ buffer
- **Voltaje**: 100-240V AC, 50/60Hz
- **Temperatura**: 5-45°C operación
- **Humedad**: 20-80% RH

---

## 💻 **Instalación de Drivers**

### **Windows 10/11 (Tablets Windows)**
```powershell
# Descargar desde sitio oficial
# Epson: https://epson.com/pos
# Star: https://starmicronics.com/support

# Instalación silenciosa
driver-install.exe /S /v/qn

# Verificar instalación
Get-Printer | Where-Object {$_.DriverName -like "*Epson*"}
```

### **Ubuntu/Debian Linux**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar CUPS y drivers ESC/POS
sudo apt install -y cups printer-driver-escpos cups-pdf

# Agregar usuario a grupo lp
sudo usermod -a -G lp $USER

# Reiniciar servicio CUPS
sudo systemctl restart cups

# Configurar impresora
sudo lpadmin -p POS_Kitchen -v escpos://usb/ -E
sudo lpadmin -d POS_Kitchen
```

### **Android (Tablets)**
1. **Habilitar USB OTG** en configuración
2. **Instalar app "USB Printer Helper"**
3. **Conectar impresora** y aceptar permisos
4. **Seleccionar driver "Generic ESC/POS"**

---

## 🌐 **Configuración de Red**

### **Configurar IP Estática en Impresora**
```
Menú > Network > TCP/IP:
- IP Address: 192.168.1.100
- Subnet Mask: 255.255.255.0
- Default Gateway: 192.168.1.1
- DNS Server: 8.8.8.8
```

### **Configuración en Router**
```bash
# Reservar IPs para impresoras
DHCP Reservation:
- 192.168.1.100 -> MAC:00:11:22:33:44:55 (Cocina)
- 192.168.1.101 -> MAC:00:11:22:33:44:56 (Bar)
- 192.168.1.102 -> MAC:00:11:22:33:44:57 (General)

# Habilitar puerto de impresión
Port Forwarding: 9100 -> 192.168.1.100:9100
```

### **Firewall Configuration**
```bash
# Linux (iptables)
sudo iptables -A INPUT -p tcp --dport 9100 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 9100 -j ACCEPT

# Windows Firewall
netsh advfirewall firewall add rule name="POS_Printer" dir=in action=allow protocol=TCP localport=9100
```

---

## ⚙️ **Configuración en el Sistema POS**

### **1. Detección Automática**
El sistema incluye detección automática vía:
- **Network Scan** (192.168.1.100-150)
- **USB Device Detection** (WebUSB API)
- **Bluetooth Discovery** (Web Bluetooth API)

### **2. Configuración de Impresoras**
```javascript
// Configurar impresoras en el sistema
const printerConfig = {
  kitchen: {
    id: 'printer_kitchen_1',
    name: 'Impresora Cocina Principal',
    type: 'network',
    ip: '192.168.1.100',
    port: 9100,
    paperSize: '80mm',
    enabled: true,
    area: 'kitchen'
  },
  bar: {
    id: 'printer_bar_1', 
    name: 'Impresora Bar',
    type: 'network',
    ip: '192.168.1.101',
    port: 9100,
    paperSize: '58mm',
    enabled: true,
    area: 'bar'
  }
}
```

### **3. Testing de Conexión**
```bash
# Test de red
telnet 192.168.1.100 9100

# Test con curl
curl -X POST -d "TEST PRINT" http://192.168.1.100:9100

# Test desde sistema POS
npm run test-printer --printer=kitchen
```

---

## 🧪 **Pruebas y Troubleshooting**

### **Test Básico de Impresión**
1. **Generar test de impresora** desde configuración
2. **Verificar impresión** de logo y texto
3. **Validar corte automático** (si aplica)
4. **Comprobar calidad** de impresión

### **Problemas Comunes y Soluciones**

#### **❌ Impresora no responde**
```
✅ Soluciones:
1. Verificar cable de red/USB
2. Revisar configuración IP
3. Reiniciar impresora (desconectar 30 seg)
4. Probar puerto diferente
5. Verificar firewall
```

#### **❌ Impresión ilegible**
```
✅ Soluciones:
1. Limpiar cabezal térmico
2. Reemplazar papel térmico
3. Ajustar densidad de impresión
4. Verificar drivers actualizados
```

#### **❌ Corte automático no funciona**
```
✅ Soluciones:
1. Verificar modelo con auto-cut
2. Calibrar mecanismo de corte
3. Revisar firmware actualizado
4. Habilitar auto-cut en configuración
```

#### **❌ Conexión Bluetooth inestable**
```
✅ Soluciones:
1. Reducir distancia (<10m)
2. Eliminar interferencias (WiFi, microondas)
3. Recompar dispositivos
4. Actualizar drivers Bluetooth
```

---

## 🔧 **Mantenimiento Preventivo**

### **Diario**
- ✅ **Verificar papel** en impresoras
- ✅ **Limpiar área** alrededor de impresoras
- ✅ **Revisar luces** de estado

### **Semanal**
- ✅ **Limpiar cabezal** con alcohol isopropílico
- ✅ **Verificar cables** y conexiones
- ✅ **Actualizar firmware** si disponible
- ✅ **Probar impresión** de test

### **Mensual**
- ✅ **Calibrar corte** automático
- ✅ **Limpiar rodillos** de papel
- ✅ **Verificar drivers** actualizados
- ✅ **Crear backup** de configuración

### **Anual**
- ✅ **Reemplazar cabezal** térmico (si necesita)
- ✅ **Service completo** técnico
- ✅ **Evaluar upgrade** de impresoras
- ✅ **Documentar** ciclo de vida

---

## 📱 **Configuración Móvil**

### **Configuración para Delivery**
```javascript
const mobilePrinter = {
  id: 'printer_delivery_1',
  name: 'Impresora Mobile', 
  type: 'bluetooth',
  connection: 'auto',
  area: 'delivery',
  features: ['auto-cut', 'battery', 'portable']
}
```

### **Estrategia de Impresión para Delivery**
1. **Confirmar orden** → Imprimir en cocina
2. **Orden lista** → Imprimir ticket para delivery
3. **Entregado** → Imprimir recibo final

---

## 📊 **Monitoreo de Impresoras**

### **Métricas Importantes**
```javascript
const printerMetrics = {
  uptime: '99.9%',
  response_time: '<3s', 
  success_rate: '98.5%',
  daily_prints: '150-200',
  error_rate: '<1%',
  maintenance_last: '30 days ago'
}
```

### **Alertas Configuradas**
- 🚨 **Impresora desconectada** (>5 min)
- 🟡 **Papel bajo** (<20% restante)
- 🟠 **Error de impresión** (>3 intentos)
- 🔴 **Comunicación perdida** (>10 min)

---

## 📞 **Soporte Técnico**

### **Contacto con Fabricantes**
- **Epson**: +1 (562) 276-4345
- **Star**: +1 (800) 782-7637  
- **Citizen**: +1 (800) 222-0571

### **Documentación Online**
- **Manual de ESC/POS**: https://reference.epson-pos.com
- **Guía Star**: https://www.starmicronics.com/support
- **Foros POS**: https://pos.stackexchange.com

---

## ✅ **Checklist Final de Instalación**

- [ ] **Impresora conectada** y encendida
- [ ] **Drivers instalados** correctamente
- [ ] **Configuración de red** validada
- [ ] **Test de impresión** exitoso
- [ ] **Integración POS** funcionando
- [ ] **Impresión por área** configurada
- [ ] **Backup de configuración** creado
- [ ] **Personal capacitado** en uso básico
- [ ] **Manual de troubleshooting** disponible
- [ ] **Contacto soporte** técnico configurado

---

## 🎉 **¡Listo para Producción!**

Con esta guía completa, tu sistema de impresoras térmicas estará:
- ✅ **Profesionalmente configurado**
- ✅ **Optimizado para restaurant**
- ✅ **Con soporte técnico**
- ✅ **Documentado y mantenible**

**El sistema está listo para impresión automática de comandas y tickets en tu restaurante!** 🖨️🍽️