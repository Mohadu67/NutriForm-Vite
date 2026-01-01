/**
 * Purchase Service - Gestion des achats in-app avec RevenueCat
 * Gere les abonnements Premium pour iOS et Android
 */

import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// Cles API RevenueCat
const REVENUECAT_API_KEY_IOS = 'test_eDmFKRutoQgMCEsFgvBPJcyPqKr';
const REVENUECAT_API_KEY_ANDROID = 'test_eDmFKRutoQgMCEsFgvBPJcyPqKr';

// Identifiants des produits
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'harmonith_premium_monthly',
  PREMIUM_YEARLY: 'harmonith_premium_yearly',
};

// Entitlements (droits d'acces)
export const ENTITLEMENTS = {
  PREMIUM: 'premium',
};

class PurchaseService {
  constructor() {
    this.isConfigured = false;
    this.customerInfo = null;
  }

  /**
   * Configure RevenueCat avec les cles API
   * @param {string} userId - ID utilisateur optionnel pour l'identifier
   */
  async configure(userId = null) {
    try {
      const apiKey = Platform.select({
        ios: REVENUECAT_API_KEY_IOS,
        android: REVENUECAT_API_KEY_ANDROID,
      });

      await Purchases.configure({
        apiKey,
        appUserID: userId,
      });

      this.isConfigured = true;
      console.log('[PURCHASES] RevenueCat configured');

      // Recuperer les infos client initiales
      this.customerInfo = await Purchases.getCustomerInfo();

      return true;
    } catch (error) {
      console.error('[PURCHASES] Configuration error:', error);
      return false;
    }
  }

  /**
   * Identifie l'utilisateur dans RevenueCat
   * @param {string} userId - ID de l'utilisateur
   */
  async login(userId) {
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      this.customerInfo = customerInfo;
      console.log('[PURCHASES] User logged in:', userId);
      return customerInfo;
    } catch (error) {
      console.error('[PURCHASES] Login error:', error);
      throw error;
    }
  }

  /**
   * Deconnecte l'utilisateur de RevenueCat
   */
  async logout() {
    try {
      const { customerInfo } = await Purchases.logOut();
      this.customerInfo = customerInfo;
      console.log('[PURCHASES] User logged out');
      return customerInfo;
    } catch (error) {
      console.error('[PURCHASES] Logout error:', error);
      throw error;
    }
  }

  /**
   * Verifie si l'utilisateur a un abonnement Premium actif
   */
  async isPremium() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;

      const isPremium = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined;
      console.log('[PURCHASES] Is premium:', isPremium);

      return isPremium;
    } catch (error) {
      console.error('[PURCHASES] Check premium error:', error);
      return false;
    }
  }

  /**
   * Recupere les offres disponibles
   */
  async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      console.log('[PURCHASES] Offerings:', offerings);

      if (offerings.current) {
        return {
          current: offerings.current,
          monthly: offerings.current.availablePackages.find(
            p => p.identifier === '$rc_monthly'
          ),
          yearly: offerings.current.availablePackages.find(
            p => p.identifier === '$rc_annual'
          ),
          all: offerings.current.availablePackages,
        };
      }

      return null;
    } catch (error) {
      console.error('[PURCHASES] Get offerings error:', error);
      return null;
    }
  }

  /**
   * Achete un package
   * @param {Object} package_ - Le package a acheter
   */
  async purchasePackage(package_) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(package_);
      this.customerInfo = customerInfo;

      const isPremium = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined;

      console.log('[PURCHASES] Purchase successful, is premium:', isPremium);

      return {
        success: true,
        isPremium,
        customerInfo,
      };
    } catch (error) {
      if (error.userCancelled) {
        console.log('[PURCHASES] User cancelled purchase');
        return { success: false, cancelled: true };
      }

      console.error('[PURCHASES] Purchase error:', error);
      throw error;
    }
  }

  /**
   * Restaure les achats precedents
   */
  async restorePurchases() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;

      const isPremium = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined;

      console.log('[PURCHASES] Restore successful, is premium:', isPremium);

      return {
        success: true,
        isPremium,
        customerInfo,
      };
    } catch (error) {
      console.error('[PURCHASES] Restore error:', error);
      throw error;
    }
  }

  /**
   * Recupere les informations de l'abonnement actif
   */
  async getSubscriptionInfo() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;

      const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];

      if (premiumEntitlement) {
        return {
          isActive: true,
          productIdentifier: premiumEntitlement.productIdentifier,
          expirationDate: premiumEntitlement.expirationDate,
          willRenew: premiumEntitlement.willRenew,
          periodType: premiumEntitlement.periodType,
          store: premiumEntitlement.store,
        };
      }

      return {
        isActive: false,
      };
    } catch (error) {
      console.error('[PURCHASES] Get subscription info error:', error);
      return { isActive: false };
    }
  }

  /**
   * Ajoute un listener pour les changements de customerInfo
   * @param {Function} callback - Fonction appelee lors des changements
   */
  addCustomerInfoListener(callback) {
    return Purchases.addCustomerInfoUpdateListener(callback);
  }

  /**
   * Formate le prix pour l'affichage
   * @param {Object} package_ - Le package
   */
  formatPrice(package_) {
    if (!package_) return '';
    return package_.product.priceString;
  }

  /**
   * Calcule l'economie pour l'abonnement annuel
   * @param {Object} monthly - Package mensuel
   * @param {Object} yearly - Package annuel
   */
  calculateYearlySavings(monthly, yearly) {
    if (!monthly || !yearly) return 0;

    const monthlyPrice = monthly.product.price;
    const yearlyPrice = yearly.product.price;
    const yearlyAtMonthlyRate = monthlyPrice * 12;

    const savings = ((yearlyAtMonthlyRate - yearlyPrice) / yearlyAtMonthlyRate) * 100;
    return Math.round(savings);
  }
}

// Instance singleton
const purchaseService = new PurchaseService();
export default purchaseService;
