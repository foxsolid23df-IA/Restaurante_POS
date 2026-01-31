/**
 * Service to communicate with the local printer bridge
 * Typically a local server running on port 5000 or similar
 */
const BRIDGE_URL = 'http://localhost:5000/print';

export const printerBridge = {
  /**
   * Send raw data or structured data to the local bridge
   * @param {Object} payload 
   */
  send: async (payload) => {
    try {
      const response = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('No se pudo conectar con el bridge de impresión');
      }

      return await response.json();
    } catch (error) {
      console.error('Printer Bridge Error:', error);
      throw new Error('Asegúrese de que el Local Bridge esté ejecutándose en este equipo.');
    }
  },

  /**
   * Print raw ESC/POS commands
   * @param {string} rawData 
   * @param {Object} printerConfig 
   */
  printRaw: async (rawData, printerConfig) => {
    return await printerBridge.send({
      type: 'raw',
      data: btoa(rawData), // Send as base64 to avoid encoding issues
      printer: printerConfig
    });
  },

  /**
   * Print a test page to verify connection
   * @param {Object} printerConfig 
   */
  test: async (printerConfig) => {
    return await printerBridge.send({
      type: 'test',
      printer: printerConfig
    });
  }
};
