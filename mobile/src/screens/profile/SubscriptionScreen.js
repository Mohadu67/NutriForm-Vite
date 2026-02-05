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

import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';

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
      console.error('[SUBSCRIPTION] Error loading:', error);
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
      console.error('[SUBSCRIPTION] Checkout error:', error);
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
              console.error('[SUBSCRIPTION] Cancel error:', error);
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
      console.error('[SUBSCRIPTION] Portal error:', error);
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

  // Debug subscription data
  useEffect(() => {
    if (subscription) {
      console.log('[SUBSCRIPTION DEBUG]', {
        hasXpPremium,
        xpPremiumExpiresAt: subscription?.xpPremiumExpiresAt,
        hasSubscription,
        isPremium,
        tier: subscription?.tier,
        allData: subscription
      });
    }
  }, [subscription, hasXpPremium, hasSubscription, isPremium]);

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
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
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
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Statut actuel */}
        <View style={[styles.statusCard, isDark && styles.cardDark]}>
          <View style={[styles.statusBadge, isPremium && styles.statusBadgePremium]}>
            <Ionicons
              name={isPremium ? 'star' : 'star-outline'}
              size={24}
              color={isPremium ? '#F59E0B' : '#6B7280'}
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
                    <Ionicons name="calendar-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    <Text style={[styles.detailText, isDark && styles.textMutedDark]}>
                      Expire le {formatDate(subscription.xpPremiumExpiresAt)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.renewButton}
                    onPress={() => navigation.navigate('Rewards')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={16} color="#8B5CF6" />
                    <Text style={styles.renewButtonText}>Prolonger avec XP</Text>
                  </TouchableOpacity>
                </>
              )}
              {hasSubscription && subscription?.currentPeriodEnd && (
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text style={[styles.detailText, isDark && styles.textMutedDark]}>
                    {cancelAtPeriodEnd
                      ? `Expire le ${formatDate(subscription.currentPeriodEnd)}`
                      : `Prochain renouvellement le ${formatDate(subscription.currentPeriodEnd)}`}
                  </Text>
                </View>
              )}
              {isInTrial && trialEndDate && (
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text style={[styles.detailText, isDark && styles.textMutedDark]}>
                    Essai gratuit jusqu'au {formatDate(trialEndDate)}
                  </Text>
                </View>
              )}
              {!hasXpPremium && !hasSubscription && !isInTrial && (
                <View style={styles.detailRow}>
                  <Ionicons name="information-circle-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
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
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
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
              <Ionicons name="gift-outline" size={18} color="#22C55E" />
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
              <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Ionicons name={feature.icon} size={20} color={theme.colors.primary} />
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
                <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
              )}
            </View>
          ))}
        </View>

        {/* Info Premium XP */}
        <View style={[styles.xpInfoCard, isDark && styles.cardDark]}>
          <View style={styles.xpInfoHeader}>
            <Ionicons name="trophy-outline" size={24} color="#8B5CF6" />
            <Text style={[styles.xpInfoTitle, isDark && styles.textDark]}>
              Premium gratuit avec XP
            </Text>
          </View>
          <Text style={[styles.xpInfoText, isDark && styles.textMutedDark]}>
            Gagnez des XP en faisant du sport et debloquez 1 mois de Premium gratuit
            en echangeant 10 000 XP dans les recompenses !
          </Text>
          <TouchableOpacity
            style={styles.xpInfoButton}
            onPress={() => navigation.navigate('Rewards')}
            activeOpacity={0.7}
          >
            <Text style={styles.xpInfoButtonText}>Voir les recompenses</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
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
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  spacer: {
    width: 32,
  },
  textDark: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#888888',
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#2A2A2A',
  },
  statusBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  statusBadgePremium: {
    backgroundColor: '#FEF3C7',
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statusTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  xpBadgeSmall: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  xpBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  statusSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  trialBadge: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  trialText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: '#1D4ED8',
  },
  statusDetails: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: '#8B5CF610',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#8B5CF630',
  },
  renewButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semiBold,
    color: '#8B5CF6',
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.sm,
  },
  cancelledText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: '#EF4444',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
  },
  upgradeButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semiBold,
    color: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  actionButtonDark: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  actionButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
  },
  cancelButtonDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  cancelButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: '#EF4444',
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  price: {
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  priceInterval: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: '#F0FDF4',
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  trialInfoText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: '#22C55E',
  },
  pricingNote: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  featureItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  featureItemBorderDark: {
    borderBottomColor: '#333',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  featureDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  xpInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#8B5CF620',
  },
  xpInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  xpInfoTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  xpInfoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  xpInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  xpInfoButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  // XP Premium Card
  xpPremiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#8B5CF630',
  },
  xpPremiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  xpPremiumBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF615',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpPremiumInfo: {
    flex: 1,
  },
  xpPremiumLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  xpPremiumExpiry: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  renewXpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: '#8B5CF610',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: '#8B5CF630',
  },
  renewXpButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semiBold,
    color: '#8B5CF6',
  },
});
