/**
 * WhatsApp Notification Service
 * Utility for sending order updates via WhatsApp Web API (wa.me)
 */

const WHATSAPP_API_BASE = 'https://wa.me/';

/**
 * Formats a phone number for WhatsApp (removes non-digits)
 */
const formatPhoneNumber = (phone) => {
  return phone.replace(/\D/g, '');
};

/**
 * Generates localized messages based on order status
 */
const getStatusMessage = (customerName, orderId, status, trackingUrl) => {
  const businessName = 'Restaurante SaaS';
  
  const messages = {
    out_for_delivery: `¡Hola ${customerName}! 🛵 Tu pedido de *${businessName}* (#${orderId.slice(0, 8)}) va en camino. Puedes seguirlo aquí: ${trackingUrl || 'Pronto llegará a tu puerta.'}`,
    delivered: `¡Tu pedido ha llegado! 🏁 Disfruta tu comida. ¡Gracias por elegir *${businessName}*!`,
    ready: `¡Hola ${customerName}! 🍕 Tu pedido está listo y pronto saldrá para entrega.`
  };

  return encodeURIComponent(messages[status] || '');
};

/**
 * Generic function to open WhatsApp with a predefined message
 */
export const sendWhatsAppNotification = (phone, customerName, orderId, status, trackingUrl = '') => {
  if (!phone) return null;

  const formattedPhone = formatPhoneNumber(phone);
  const message = getStatusMessage(customerName, orderId, status, trackingUrl);
  
  if (!message) return null;

  const url = `${WHATSAPP_API_BASE}${formattedPhone}?text=${message}`;
  
  // Open in new window/tab
  window.open(url, '_blank');
  return url;
};
