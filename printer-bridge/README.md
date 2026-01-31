# 🖨️ Restaurante POS Printer Bridge

Este es el puente de comunicación necesario para que el sistema web pueda imprimir directamente en impresoras térmicas (USB o Red) sin mostrar el cuadro de diálogo de impresión del navegador.

## 📋 Requisitos

- **Node.js** instalado (v14 o superior).
- Drivers de la impresora térmica instalados en el sistema (solo para detección USB).
- Los cables de la impresora conectados o acceso por red (IP).

## 🚀 Instalación y Uso

1.  Abra una terminal o consola de Windows.
2.  Navegue hasta esta carpeta:
    ```bash
    cd "printer-bridge"
    ```
3.  Instale las dependencias (solo la primera vez):
    ```bash
    npm install
    ```
4.  Inicie el Bridge:
    ```bash
    npm start
    ```

## ⚙️ Configuración en el POS

Una vez que el Bridge esté corriendo, el sistema POS en el navegador se conectará automáticamente a `http://localhost:5000`.

- **Para impresoras USB**: Asegúrese de que la impresora esté encendida y sea la única conectada vía USB (o el Bridge tomará la primera que encuentre).
- **Para impresoras de Red**: Indique la dirección IP y el puerto (generalmente 9100) en el panel de Administración del POS.

## 🛠️ Solución de Problemas

- **Error "Printer Bridge no encontrado"**: Asegúrese de que la consola donde ejecutó `npm start` no se haya cerrado y que no haya errores visibles.
- **Error "USB device not found"**: En Windows, a veces es necesario usar una herramienta como [Zadig](https://zadig.akeo.ie/) para reemplazar el driver de la impresora por el driver `WinUSB` si la librería nativa de Node.js no la reconoce.

---

**Desarrollado para Restaurante POS**
