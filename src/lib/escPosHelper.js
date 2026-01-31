/**
 * Utility for ESC/POS thermal printer commands
 */
export const ESC_POS = {
  // Commands
  INIT: '\x1b\x40',
  LINE_FEED: '\x0a',
  CENTER: '\x1b\x61\x01',
  LEFT: '\x1b\x61\x00',
  RIGHT: '\x1b\x61\x02',
  BOLD_ON: '\x1b\x45\x01',
  BOLD_OFF: '\x1b\x45\x00',
  DOUBLE_HEIGHT_ON: '\x1b\x21\x10',
  DOUBLE_WIDTH_ON: '\x1b\x21\x20',
  NORMAL_SIZE: '\x1b\x21\x00',
  CUT: '\x1d\x56\x41', // Partial cut
  
  // Font sizes
  FONT_B: '\x1b\x4d\x01',
  FONT_A: '\x1b\x4d\x00',

  formatTicket: (data, settings) => {
    let ticket = '';
    ticket += ESC_POS.INIT;
    ticket += ESC_POS.CENTER;
    ticket += ESC_POS.BOLD_ON + ESC_POS.DOUBLE_HEIGHT_ON;
    ticket += (data.business_name || settings?.name || 'RESTAURANTE').toUpperCase() + '\n';
    ticket += ESC_POS.NORMAL_SIZE + ESC_POS.BOLD_OFF;
    
    if (settings?.ticket_header) {
      ticket += settings.ticket_header + '\n';
    }
    
    ticket += '\n' + ESC_POS.LEFT;
    ticket += `MESA: ${data.table_name || 'N/A'}\n`;
    ticket += `FECHA: ${new Date().toLocaleString()}\n`;
    ticket += `FOLIO: #${data.order_id?.slice(-6) || '000000'}\n`;
    ticket += `MESERO: ${data.waiter_name || 'N/A'}\n`;
    ticket += '-'.repeat(32) + '\n';
    
    data.items.forEach(item => {
      const name = item.name.substring(0, 20).padEnd(20);
      const qty = item.quantity.toString().padStart(3);
      const price = (item.price * item.quantity).toFixed(2).padStart(8);
      ticket += `${qty} ${name} ${price}\n`;
      if (item.notes) {
        ticket += `   * ${item.notes}\n`;
      }
    });
    
    ticket += '-'.repeat(32) + '\n';
    ticket += ESC_POS.RIGHT;
    ticket += `SUBTOTAL: $${data.subtotal?.toFixed(2)}\n`;
    ticket += `${data.tax_name || 'IVA'}: $${data.tax?.toFixed(2)}\n`;
    ticket += ESC_POS.BOLD_ON;
    ticket += `TOTAL: $${data.total?.toFixed(2)}\n`;
    ticket += ESC_POS.BOLD_OFF;
    
    ticket += '\n' + ESC_POS.CENTER;
    if (settings?.ticket_footer) {
      ticket += settings.ticket_footer + '\n';
    }
    ticket += '¡GRACIAS POR SU PREFERENCIA!\n';
    ticket += '\n\n\n';
    ticket += ESC_POS.CUT;
    
    return ticket;
  },

  formatComanda: (comanda) => {
    let ticket = '';
    ticket += ESC_POS.INIT;
    ticket += ESC_POS.CENTER;
    ticket += ESC_POS.BOLD_ON + ESC_POS.DOUBLE_HEIGHT_ON;
    ticket += `*** COMANDA ***\n`;
    ticket += `AREA: ${comanda.area_name?.toUpperCase()}\n`;
    ticket += ESC_POS.NORMAL_SIZE + ESC_POS.BOLD_OFF;
    
    ticket += '\n' + ESC_POS.LEFT;
    ticket += ESC_POS.BOLD_ON;
    ticket += `MESA: ${comanda.table_name}\n`;
    ticket += ESC_POS.BOLD_OFF;
    ticket += `HORA: ${new Date().toLocaleTimeString()}\n`;
    ticket += `ORDEN: #${comanda.order_id?.slice(-6)}\n`;
    ticket += '-'.repeat(32) + '\n';
    
    comanda.items.forEach(item => {
      ticket += ESC_POS.BOLD_ON + ESC_POS.DOUBLE_HEIGHT_ON;
      ticket += `${item.quantity}x ${item.name}\n`;
      ticket += ESC_POS.NORMAL_SIZE + ESC_POS.BOLD_OFF;
      if (item.notes) {
        ticket += `   📝 NOTA: ${item.notes}\n`;
      }
      ticket += '\n';
    });
    
    ticket += '-'.repeat(32) + '\n';
    ticket += '\n\n\n';
    ticket += ESC_POS.CUT;
    
    return ticket;
  }
};
