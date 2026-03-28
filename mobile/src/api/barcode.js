import apiClient from './client';
import logger from '../services/logger';

/**
 * Rechercher un produit alimentaire par code-barres
 * @param {string} barcode - Code EAN-8, EAN-13, UPC-A ou UPC-E
 */
export async function getProductByBarcode(barcode) {
  try {
    logger.app.debug('[BARCODE API] lookup:', barcode);
    const response = await apiClient.get(`/barcode/${barcode}`);
    return { success: true, product: response.data.product };
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    logger.app.debug('[BARCODE API] error:', message);
    return { success: false, error: message };
  }
}
