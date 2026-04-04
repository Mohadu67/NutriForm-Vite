import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';
import logger from '../../services/logger';

/**
 * SubscriptionScreen - Gestion de l'abonnement Premium
 */
export default function SubscriptionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Charger le statut de l'abonnement
  const loadSubscription = useCallback(async () => {
    try {
      const response = await apiClient.get(endpoints.subscription.status);
      setSubscription(response.data);
    } catch (error) {
      logger.app.error('[SUBSCRIPTION] Error loading:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSubscription();
  }, [loadSubscription]);

  // Passer Premium (Stripe Checkout)
  const handleUpgrade = async () => {
    try {
      setCheckoutLoading(true);
      const response = await apiClient.post(endpoints.subscription.create);

      if (response.data?.url) {
        // Ouvrir l'URL Stripe Checkout dans le navigateur
        const supported = await Linking.canOpenURL(response.data.url);
        if (supported) {
          await Linking.openURL(response.data.url);
          // Rafraichir apres retour
          setTimeout(() => loadSubscription(), 5000);
        } else {
          Alert.alert('Erreur', 'Impossible d\'ouvrir le lien de paiement');
        }
      }
    } catch (error) {
      logger.app.error('[SUBSCRIPTION] Checkout error:', error);
      const message = error.response?.data?.error || 'Erreur lors de la creation de la session de paiement';
      Alert.alert('Erreur', message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Annuler l'abonnement
  const handleCancel = () => {
    Alert.alert(
      'Annuler l\'abonnement',
      'Etes-vous sur ? Vous conserverez l\'acces Premium jusqu\'a la fin de la periode en cours.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelLoading(true);
              await apiClient.post(endpoints.subscription.cancel);
              Alert.alert(
                'Abonnement annule',
                'Vous conservez l\'acces Premium jusqu\'a la fin de la periode.'
              );
              await loadSubscription();
            } catch (error) {
              logger.app.error('[SUBSCRIPTION] Cancel error:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler l\'abonnement');
            } finally {
              setCancelLoading(false);
            }
          },
        },
      ]
    );
  };

  // Ouvrir le portail client Stripe
  const handleManage = async () => {
    try {
      setCheckoutLoading(true);
      const response = await apiClient.post(endpoints.subscription.portal);

      if (response.data?.url) {
        const supported = await Linking.canOpenURL(response.data.url);
        if (supported) {
          await Linking.openURL(response.data.url);
          setTimeout(() => loadSubscription(), 5000);
        }
      }
    } catch (error) {
      logger.app.error('[SUBSCRIPTION] Portal error:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le portail client');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isPremium = subscription?.tier === 'premium';
  const hasSubscription = subscription?.hasSubscription;
  const hasXpPremium = subscription?.hasXpPremium;
  // Calculer isInTrial basé sur trialEndsAt ou trialEnd
  const trialEndDate = subscription?.trialEndsAt || subscription?.trialEnd;
  const isInTrial = subscription?.isInTrial || (trialEndDate && new Date(trialEndDate) > new Date());
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd;
  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Avantages Premium
  const premiumFeatures = [
    { icon: 'people', label: 'Matching sportif illimite', description: 'Trouvez votre partenaire ideal' },
    { icon: 'chatbubbles', label: 'Chat avec les matchs', description: 'Communiquez directement' },
    { icon: 'create', label: 'Creer des programmes', description: 'Creez vos propres entrainements' },
    { icon: 'nutrition', label: 'Creer des recettes', description: 'Partagez vos recettes' },
    { icon: 'trophy', label: 'Defis entre utilisateurs', description: 'Challengez vos amis' },
    { icon: 'gift', label: 'Recompenses exclusives', description: 'Acces aux recompenses premium' },
    { icon: 'sparkles', label: 'Assistant IA avance', description: 'Reponses personnalisees' },
    { icon: 'ribbon', label: 'Badge Premium', description: 'Mettez en avant votre profil' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#72baa1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#f3f3f6' : '#1c1917'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Abonnement</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#72baa1"
            colors={['#72baa1']}
          />
        }
      >
        {/* Statut actuel */}
        <View style={[styles.statusCard, isDark && styles.cardDark]}>
          <View style={[styles.statusBadge, isPremium && styles.statusBadgePremium]}>
            <Ionicons
              name={isPremium ? 'star' : 'star-outline'}
              size={24}
              color={isPremium ? '#f0a47a' : '#a8a29e'}
            />
          </View>

          <View style={styles.statusTitleRow}>
            <Text style={[styles.statusTitle, isDark && styles.textDark]}>
              {isPremium ? 'Premium' : 'Gratuit'}
            </Text>
            {hasXpPremium && (
              <View style={styles.xpBadgeSmall}>
                <Text style={styles.xpBadgeText}>XP</Text>
              </View>
            )}
          </View>

          {isPremium && isInTrial && (
            <View style={styles.trialBadge}>
              <Text style={styles.trialText}>Essai gratuit</Text>
            </View>
          )}

          {/* Infos dates */}
          {isPremium && (
            <View style={styles.statusDetails}>
              {hasXpPremium && subscription?.xpPremiumExpiresAt && (
                <>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={isDark ? '#7a7a88' : '#a8a29e'} />
                    <Text style={[styles.detailText, isDark && styles.textMutedDark]}>
                      Expire le {formatDate(subscription.xpPremiumExpiresAt)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.renewButton}
                    onPress={() => navigation.navigate('Rewards')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={16} color="#72baa1" />
                    <Text style={styles.renewButtonText}>Prolonger avec XP</Text>
                  </TouchableOpacity>
                </>
              )}
              {hasSubscription && subscription?.currentPeriodEnd && (
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={isDark ? '#7a7a88' : '#a8a29e'} />
                  <Text style={[styles.detailText, isDark && styles.textMutedDark]}>
                    {cancelAtPeriodEnd
                      ? `Expire le ${formatDate(subscription.currentPeriodEnd)}`
                      : `Prochain renouvellement le ${formatDate(subscription.currentPeriodEnd)}`}
                  </Text>
                </View>
              )}
              {isInTrial && trialEndDate && (
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={isDark ? '#7a7a88' : '#a8a29e'} />
                  <Text style={[styles.detailText, isDark && styles.textMutedDark]}>
                    Essai gratuit jusqu'au {formatDate(trialEndDate)}
                  </Text>
                </View>
              )}
              {!hasXpPremium && !hasSubscription && !isInTrial && (
                <View style={styles.detailRow}>
                  <Ionicons name="information-circle-outline" size={16} color={isDark ? '#7a7a88' : '#a8a29e'} />
                  <Text style={[styles.detailText, isDark && styles.textMutedDark]}>
                    Statut Premium actif
                  </Text>
                </View>
              )}
            </View>
          )}

          {cancelAtPeriodEnd && (
            <View style={styles.cancelledBadge}>
              <Ionicons name="warning" size={16} color="#EF4444" />
              <Text style={styles.cancelledText}>Annule - acces jusqu'a la fin</Text>
            </View>
          )}
        </View>


        {/* Actions - Afficher seulement si y'a quelque chose à afficher */}
        {(!isPremium || (isPremium && hasSubscription)) && (
          <View style={[styles.actionsCard, isDark && styles.cardDark]}>
            {!isPremium ? (
              // Utilisateur Free - Bouton upgrade
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
                disabled={checkoutLoading}
                activeOpacity={0.8}
              >
                {checkoutLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="star" size={22} color="#FFFFFF" />
                    <Text style={styles.upgradeButtonText}>Passer Premium</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              // Utilisateur Premium avec abonnement Stripe
              <>
                {hasSubscription && !cancelAtPeriodEnd && (
                  <TouchableOpacity
                    style={[styles.actionButton, isDark && styles.actionButtonDark]}
                    onPress={handleManage}
                    disabled={checkoutLoading}
                    activeOpacity={0.7}
                  >
                    {checkoutLoading ? (
                      <ActivityIndicator size="small" color="#72baa1" />
                    ) : (
                      <>
                        <Ionicons name="card-outline" size={20} color="#72baa1" />
                        <Text style={[styles.actionButtonText, { color: '#72baa1' }]}>
                          Gerer le paiement
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {hasSubscription && !cancelAtPeriodEnd && (
                  <TouchableOpacity
                    style={[styles.cancelButton, isDark && styles.cancelButtonDark]}
                    onPress={handleCancel}
                    disabled={cancelLoading}
                    activeOpacity={0.7}
                  >
                    {cancelLoading ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                        <Text style={styles.cancelButtonText}>Annuler l'abonnement</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {/* Prix */}
        {!isPremium && (
          <View style={[styles.pricingCard, isDark && styles.cardDark]}>
            <View style={styles.pricingHeader}>
              <Text style={[styles.price, isDark && styles.textDark]}>3,99 EUR</Text>
              <Text style={[styles.priceInterval, isDark && styles.textMutedDark]}>/mois</Text>
            </View>
            <View style={styles.trialInfo}>
              <Ionicons name="gift-outline" size={18} color="#72baa1" />
              <Text style={styles.trialInfoText}>7 jours d'essai gratuit</Text>
            </View>
            <Text style={[styles.pricingNote, isDark && styles.textMutedDark]}>
              Annulation possible a tout moment
            </Text>
          </View>
        )}

        {/* Avantages Premium */}
        <View style={[styles.featuresCard, isDark && styles.cardDark]}>
          <Text style={[styles.featuresTitle, isDark && styles.textDark]}>
            {isPremium ? 'Vos avantages Premium' : 'Avantages Premium'}
          </Text>

          {premiumFeatures.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureItem,
                index < premiumFeatures.length - 1 && styles.featureItemBorder,
                isDark && styles.featureItemBorderDark,
              ]}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={20} color="#72baa1" />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureLabel, isDark && styles.textDark]}>
                  {feature.label}
                </Text>
                <Text style={[styles.featureDescription, isDark && styles.textMutedDark]}>
                  {feature.description}
                </Text>
              </View>
              {isPremium && (
                <Ionicons name="checkmark-circle" size={22} color="#72baa1" />
              )}
            </View>
          ))}
        </View>

        {/* Info Premium XP */}
        <View style={[styles.xpInfoCard, isDark && styles.cardDark]}>
          <View style={styles.xpInfoHeader}>
            <Ionicons name="trophy-outline" size={24} color="#72baa1" />
            <Text style={[styles.xpInfoTitle, isDark && styles.textDark]}>
              Premium gratuit avec XP
            </Text>
          </View>
          <Text style={[styles.xpInfoText, isDark && styles.textMutedDark]}>
            Gagnez des XP en faisant du sport et debloquez 1 mois de Premium gratuit
            en echangeant 1 000 XP dans les recompenses !
          </Text>
          <TouchableOpacity
            style={styles.xpInfoButton}
            onPress={() => navigation.navigate('Rewards')}
            activeOpacity={0.7}
          >
            <Text style={styles.xpInfoButtonText}>Voir les recompenses</Text>
            <Ionicons name="chevron-forward" size={18} color="#72baa1" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcfbf9',
  },
  containerDark: {
    backgroundColor: '#0e0e11',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#efedea',
  },
  headerDark: {
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.5,
  },
  spacer: {
    width: 32,
  },
  textDark: {
    color: '#f3f3f6',
  },
  textMutedDark: {
    color: '#7a7a88',
  },
  content: {
    padding: 20,
    paddingBottom: 180,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  cardDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statusBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusBadgePremium: {
    backgroundColor: 'rgba(240,164,122,0.15)',
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.5,
  },
  xpBadgeSmall: {
    backgroundColor: '#72baa1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  xpBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#78716c',
    textAlign: 'center',
  },
  trialBadge: {
    backgroundColor: 'rgba(114,186,161,0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  trialText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#72baa1',
  },
  statusDetails: {
    marginTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#78716c',
    flex: 1,
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(114,186,161,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(114,186,161,0.2)',
  },
  renewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#72baa1',
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  cancelledText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 16,
    marginBottom: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#72baa1',
    borderRadius: 14,
    paddingVertical: 14,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(114,186,161,0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  actionButtonDark: {
    backgroundColor: 'rgba(114,186,161,0.12)',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 14,
  },
  cancelButtonDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: '#72baa1',
  },
  priceInterval: {
    fontSize: 15,
    color: '#78716c',
    marginLeft: 4,
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(114,186,161,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  trialInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#72baa1',
  },
  pricingNote: {
    fontSize: 13,
    color: '#78716c',
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 16,
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  featureItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#efedea',
  },
  featureItemBorderDark: {
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(114,186,161,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1917',
  },
  featureDescription: {
    fontSize: 13,
    color: '#78716c',
    marginTop: 2,
  },
  xpInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 16,
    marginBottom: 16,
  },
  xpInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  xpInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1917',
  },
  xpInfoText: {
    fontSize: 13,
    color: '#78716c',
    lineHeight: 20,
    marginBottom: 12,
  },
  xpInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpInfoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#72baa1',
  },
  // XP Premium Card
  xpPremiumCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 16,
    marginBottom: 16,
  },
  xpPremiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  xpPremiumBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(114,186,161,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpPremiumInfo: {
    flex: 1,
  },
  xpPremiumLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 4,
  },
  xpPremiumExpiry: {
    fontSize: 13,
    color: '#78716c',
  },
  renewXpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(114,186,161,0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(114,186,161,0.2)',
  },
  renewXpButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#72baa1',
  },
});
