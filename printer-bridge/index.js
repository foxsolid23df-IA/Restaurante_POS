const express = require('express');
const cors = require('cors');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');
escpos.Network = require('escpos-network');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

/**
 * Handle printing requests
 */
app.post('/print', async (req, res) => {
  const { type, data, printer: printerConfig } = req.body;

  console.log(`\n--- Nueva solicitud de impresión ---`);
  console.log(`Tipo: ${type}`);
  console.log(`Impresora: ${printerConfig.name} (${printerConfig.connection_type})`);

  try {
    let device;
    
    if (printerConfig.connection_type === 'network') {
      device = new escpos.Network(printerConfig.ip_address, printerConfig.port || 9100);
    } else if (printerConfig.connection_type === 'usb') {
      // Intenta conectar al primer dispositivo USB disponible si no se especifica dirección
      try {
        device = new escpos.USB();
      } catch (err) {
        throw new Error('No se encontró ninguna impresora USB conectada.');
      }
    } else {
      throw new Error(`Tipo de conexión no soportado: ${printerConfig.connection_type}`);
    }

    const printer = new escpos.Printer(device);

    device.open((error) => {
      if (error) {
        console.error('Error al abrir el dispositivo:', error);
        return res.status(500).json({ success: false, error: 'No se pudo abrir la impresora.' });
      }

      if (type === 'test') {
        printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(1, 1)
          .text('TEST DE IMPRESION')
          .text('BRIDGE FUNCIONANDO CORRECTAMENTE')
          .text(new Date().toLocaleString())
          .feed(3)
          .cut()
          .close();
        
        console.log('Test de impresión enviado con éxito.');
        res.json({ success: true, message: 'Ticket de prueba enviado.' });
      } 
      else if (type === 'raw') {
        const buffer = Buffer.from(data, 'base64');
        
        // Enviar buffer raw directamente al dispositivo
        device.write(buffer, (err) => {
          if (err) {
            console.error('Error al escribir buffer raw:', err);
            device.close();
            return res.status(500).json({ success: false, error: 'Error al enviar datos a la impresora.' });
          }
          
          device.close();
          console.log('Comandos ESC/POS (raw) enviados con éxito.');
          res.json({ success: true, message: 'Impresión completada.' });
        });
      }
      else {
        device.close();
        res.status(400).json({ success: false, error: 'Tipo de comando no reconocido.' });
      }
    });

  } catch (error) {
    console.error('Error general en el bridge:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/status', (req, res) => {
  res.json({ status: 'online', bridge: 'Restaurante POS Printer Bridge v1.0' });
});

app.listen(port, () => {
  console.log(`-------------------------------------------------`);
  console.log(`🚀 Restaurante POS Printer Bridge ejecutándose`);
  console.log(`📡 Puerto: ${port}`);
  console.log(`🔗 URL: http://localhost:${port}`);
  console.log(`-------------------------------------------------`);
  console.log(`Presione Ctrl+C para detener el servidor.`);
});
