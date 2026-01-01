/**
 * usePurchases - Hook pour gerer les achats in-app
 * Utilise RevenueCat pour iOS et Android
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import purchaseService from '../services/purchaseService';

export default function usePurchases(userId = null) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [error, setError] = useState(null);

  // Initialisation
  useEffect(() => {
    initializePurchases();
  }, [userId]);

  const initializePurchases = async () => {
    try {
      setIsLoading(true);
      await purchaseService.configure(userId);

      // Verifier le statut premium
      const premium = await purchaseService.isPremium();
      setIsPremium(premium);

      // Recuperer les offres
      const offers = await purchaseService.getOfferings();
      setOfferings(offers);

      // Recuperer les infos d'abonnement
      if (premium) {
        const subInfo = await purchaseService.getSubscriptionInfo();
        setSubscriptionInfo(subInfo);
      }

      // Ajouter un listener pour les changements
      purchaseService.addCustomerInfoListener((info) => {
        const premiumActive = info.entitlements.active['premium'] !== undefined;
        setIsPremium(premiumActive);
      });
    } catch (err) {
      console.error('[usePurchases] Init error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Achete l'abonnement mensuel
   */
  const purchaseMonthly = useCallback(async () => {
    if (!offerings?.monthly) {
      Alert.alert('Erreur', 'Offre non disponible');
      return false;
    }

    try {
      setIsLoading(true);
      const result = await purchaseService.purchasePackage(offerings.monthly);

      if (result.success) {
        setIsPremium(result.isPremium);
        Alert.alert(
          'Bienvenue Premium !',
          'Votre abonnement est maintenant actif. Profitez de toutes les fonctionnalites !'
        );
        return true;
      } else if (result.cancelled) {
        return false;
      }
    } catch (err) {
      console.error('[usePurchases] Purchase monthly error:', err);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'achat. Veuillez reessayer.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [offerings]);

  /**
   * Achete l'abonnement annuel
   */
  const purchaseYearly = useCallback(async () => {
    if (!offerings?.yearly) {
      Alert.alert('Erreur', 'Offre non disponible');
      return false;
    }

    try {
      setIsLoading(true);
      const result = await purchaseService.purchasePackage(offerings.yearly);

      if (result.success) {
        setIsPremium(result.isPremium);
        Alert.alert(
          'Bienvenue Premium !',
          'Votre abonnement annuel est maintenant actif. Profitez de toutes les fonctionnalites !'
        );
        return true;
      } else if (result.cancelled) {
        return false;
      }
    } catch (err) {
      console.error('[usePurchases] Purchase yearly error:', err);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'achat. Veuillez reessayer.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [offerings]);

  /**
   * Restaure les achats
   */
  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await purchaseService.restorePurchases();

      if (result.isPremium) {
        setIsPremium(true);
        Alert.alert('Succes', 'Vos achats ont ete restaures avec succes !');
        return true;
      } else {
        Alert.alert('Information', 'Aucun achat precedent trouve.');
        return false;
      }
    } catch (err) {
      console.error('[usePurchases] Restore error:', err);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la restauration.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Recupere le prix formate
   */
  const getMonthlyPrice = useCallback(() => {
    return offerings?.monthly ? purchaseService.formatPrice(offerings.monthly) : '';
  }, [offerings]);

  const getYearlyPrice = useCallback(() => {
    return offerings?.yearly ? purchaseService.formatPrice(offerings.yearly) : '';
  }, [offerings]);

  /**
   * Calcule l'economie annuelle
   */
  const getYearlySavings = useCallback(() => {
    if (!offerings?.monthly || !offerings?.yearly) return 0;
    return purchaseService.calculateYearlySavings(offerings.monthly, offerings.yearly);
  }, [offerings]);

  return {
    // Etat
    isLoading,
    isPremium,
    error,
    offerings,
    subscriptionInfo,

    // Prix
    monthlyPrice: getMonthlyPrice(),
    yearlyPrice: getYearlyPrice(),
    yearlySavings: getYearlySavings(),

    // Actions
    purchaseMonthly,
    purchaseYearly,
    restorePurchases,
  };
}
