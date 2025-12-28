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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';

const CATEGORIES = {
  sport: 'Sport',
  nutrition: 'Nutrition',
  wellness: 'Bien-etre',
  equipement: 'Equipement',
  vetements: 'Vetements',
  autre: 'Autre',
};

export default function RewardsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('premium');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userXp, setUserXp] = useState(0);
  const [partners, setPartners] = useState([]);
  const [myRewards, setMyRewards] = useState([]);
  const [redeemedPartners, setRedeemedPartners] = useState(new Set());
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Charger les donnees
  const loadData = useCallback(async () => {
    try {
      // Eligibilite XP
      try {
        const eligResponse = await apiClient.get(endpoints.xpRedemption.eligibility);
        setUserXp(eligResponse.data?.currentXp || 0);
      } catch {
        setUserXp(user?.xp || 0);
      }

      // Partenaires actifs
      try {
        const partnersResponse = await apiClient.get(endpoints.partners.list);
        if (partnersResponse.data?.success) {
          setPartners(partnersResponse.data.partners || []);
        }
      } catch (e) {
        console.log('[REWARDS] Partners error:', e);
      }

      // Mes recompenses
      try {
        const rewardsResponse = await apiClient.get(endpoints.partners.myRewards);
        if (rewardsResponse.data?.success) {
          setMyRewards(rewardsResponse.data.rewards || []);
          const redeemed = new Set(rewardsResponse.data.rewards.map(r => r.partner?._id));
          setRedeemedPartners(redeemed);
        }
      } catch (e) {
        console.log('[REWARDS] My rewards error:', e);
      }
    } catch (error) {
      console.error('[REWARDS] Load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  // Echanger XP contre Premium
  const handleRedeemPremium = () => {
    if (userXp < 10000) {
      Alert.alert('XP insuffisant', `Il te manque ${(10000 - userXp).toLocaleString()} XP`);
      return;
    }

    Alert.alert(
      'Debloquer Premium',
      'Utiliser 10 000 XP pour obtenir 1 mois Premium ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setRedeemLoading(true);
              const response = await apiClient.post(endpoints.xpRedemption.redeem, { months: 1 });
              if (response.data?.success) {
                Alert.alert('Felicitations !', '1 mois Premium debloque !');
                setUserXp(response.data.redemption?.remainingXp || userXp - 10000);
              }
            } catch (error) {
              Alert.alert('Erreur', error.response?.data?.error || 'Erreur lors du deblocage');
            } finally {
              setRedeemLoading(false);
            }
          },
        },
      ]
    );
  };

  // Echanger XP contre offre partenaire
  const handleRedeemPartner = (partner) => {
    if (userXp < partner.xpCost) {
      Alert.alert('XP insuffisant', `Il te manque ${(partner.xpCost - userXp).toLocaleString()} XP`);
      return;
    }

    Alert.alert(
      'Debloquer cette offre',
      `Utiliser ${partner.xpCost.toLocaleString()} XP pour "${partner.offerTitle}" chez ${partner.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setRedeemLoading(true);
              const response = await apiClient.post(endpoints.partners.redeem(partner._id));
              if (response.data?.success) {
                Alert.alert('Felicitations !', 'Code promo debloque !');
                setUserXp(response.data.redemption?.remainingXp || userXp - partner.xpCost);
                setRedeemedPartners(prev => new Set([...prev, partner._id]));
                setMyRewards(prev => [{
                  id: response.data.redemption?.id,
                  partner: {
                    _id: partner._id,
                    name: partner.name,
                    logo: partner.logo,
                    offerTitle: partner.offerTitle,
                    website: partner.website,
                    address: partner.address,
                  },
                  promoCode: response.data.redemption?.promoCode,
                  xpSpent: partner.xpCost,
                  redeemedAt: new Date().toISOString(),
                }, ...prev]);
                setActiveTab('codes');
              }
            } catch (error) {
              Alert.alert('Erreur', error.response?.data?.error || 'Erreur lors du deblocage');
            } finally {
              setRedeemLoading(false);
            }
          },
        },
      ]
    );
  };

  // Copier le code
  const copyToClipboard = async (code, rewardId) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopiedCode(rewardId);
      Alert.alert('Copie !', 'Code copie dans le presse-papier');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      Alert.alert('Erreur', 'Impossible de copier le code');
    }
  };

  // Ouvrir Maps
  const openInMaps = (address) => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  // Affichage offre
  const getOfferDisplay = (partner) => {
    switch (partner.offerType) {
      case 'percentage': return `-${partner.offerValue}%`;
      case 'fixed': return `-${partner.offerValue}€`;
      case 'gift': return 'Cadeau';
      case 'freebie': return 'Gratuit';
      default: return partner.offerTitle;
    }
  };

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
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Recompenses</Text>
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
          />
        }
      >
        {/* XP Balance */}
        <View style={[styles.xpCard, isDark && styles.cardDark]}>
          <View style={styles.xpInfo}>
            <Text style={[styles.xpLabel, isDark && styles.textMutedDark]}>Ton solde</Text>
            <Text style={[styles.xpAmount, isDark && styles.textDark]}>
              {userXp.toLocaleString()} XP
            </Text>
          </View>
          <View style={styles.xpIcon}>
            <Ionicons name="star" size={32} color="#F59E0B" />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'premium' && styles.tabActive]}
            onPress={() => setActiveTab('premium')}
          >
            <Ionicons
              name="diamond"
              size={18}
              color={activeTab === 'premium' ? theme.colors.primary : (isDark ? '#888' : '#666')}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'premium' && styles.tabTextActive,
              isDark && styles.textMutedDark,
            ]}>
              Premium
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'partners' && styles.tabActive]}
            onPress={() => setActiveTab('partners')}
          >
            <Ionicons
              name="gift"
              size={18}
              color={activeTab === 'partners' ? theme.colors.primary : (isDark ? '#888' : '#666')}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'partners' && styles.tabTextActive,
              isDark && styles.textMutedDark,
            ]}>
              Partenaires
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'codes' && styles.tabActive]}
            onPress={() => setActiveTab('codes')}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={activeTab === 'codes' ? theme.colors.primary : (isDark ? '#888' : '#666')}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'codes' && styles.tabTextActive,
              isDark && styles.textMutedDark,
            ]}>
              Mes codes
            </Text>
            {myRewards.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{myRewards.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Premium Tab */}
        {activeTab === 'premium' && (
          <View style={[styles.premiumCard, isDark && styles.cardDark]}>
            <View style={styles.premiumBadge}>
              <Ionicons name="diamond" size={32} color="#8B5CF6" />
            </View>
            <Text style={[styles.premiumTitle, isDark && styles.textDark]}>
              1 Mois Premium
            </Text>
            <Text style={[styles.premiumDesc, isDark && styles.textMutedDark]}>
              Acces illimite : GymBro, creation de programmes/recettes, defis, et plus encore.
            </Text>
            <View style={styles.premiumCost}>
              <Text style={styles.premiumXp}>10 000 XP</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.min((userXp / 10000) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressText, isDark && styles.textMutedDark]}>
              {userXp >= 10000 ? 'Disponible !' : `${userXp.toLocaleString()} / 10 000 XP`}
            </Text>

            {userXp >= 10000 ? (
              <TouchableOpacity
                style={styles.redeemButton}
                onPress={handleRedeemPremium}
                disabled={redeemLoading}
              >
                {redeemLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="flash" size={20} color="#FFF" />
                    <Text style={styles.redeemButtonText}>Debloquer maintenant</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.lockedButton}>
                <Ionicons name="lock-closed" size={18} color="#6B7280" />
                <Text style={styles.lockedButtonText}>
                  Il te manque {(10000 - userXp).toLocaleString()} XP
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <View style={styles.partnersSection}>
            {partners.length === 0 ? (
              <View style={[styles.emptyState, isDark && styles.cardDark]}>
                <Ionicons name="gift-outline" size={48} color={isDark ? '#555' : '#CCC'} />
                <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                  Aucune offre partenaire disponible
                </Text>
                <Text style={[styles.emptySubtext, isDark && styles.textMutedDark]}>
                  Reviens bientot !
                </Text>
              </View>
            ) : (
              partners.map(partner => {
                const isRedeemed = redeemedPartners.has(partner._id);
                const canAfford = userXp >= partner.xpCost;
                const reward = myRewards.find(r => r.partner?._id === partner._id);

                return (
                  <View
                    key={partner._id}
                    style={[
                      styles.partnerCard,
                      isDark && styles.cardDark,
                      isRedeemed && styles.partnerCardRedeemed,
                    ]}
                  >
                    <View style={styles.partnerHeader}>
                      {partner.logo ? (
                        <Image source={{ uri: partner.logo }} style={styles.partnerLogo} />
                      ) : (
                        <View style={[styles.partnerLogoPlaceholder, isDark && { backgroundColor: '#333' }]}>
                          <Text style={styles.partnerLogoText}>{partner.name[0]}</Text>
                        </View>
                      )}
                      <View style={styles.partnerInfo}>
                        <Text style={[styles.partnerName, isDark && styles.textDark]}>
                          {partner.name}
                        </Text>
                        <Text style={[styles.partnerCategory, isDark && styles.textMutedDark]}>
                          {CATEGORIES[partner.category] || partner.category}
                        </Text>
                      </View>
                      {isRedeemed && (
                        <View style={styles.unlockedBadge}>
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                      )}
                    </View>

                    <View style={styles.partnerOffer}>
                      <Text style={styles.partnerOfferValue}>{getOfferDisplay(partner)}</Text>
                      <Text style={[styles.partnerOfferTitle, isDark && styles.textMutedDark]}>
                        {partner.offerTitle}
                      </Text>
                    </View>

                    {isRedeemed && reward ? (
                      <View style={styles.partnerCodeBox}>
                        <Text style={styles.partnerCode}>{reward.promoCode}</Text>
                        <TouchableOpacity
                          style={styles.copyButton}
                          onPress={() => copyToClipboard(reward.promoCode, reward.id)}
                        >
                          <Ionicons
                            name={copiedCode === reward.id ? 'checkmark' : 'copy-outline'}
                            size={18}
                            color={theme.colors.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.partnerFooter}>
                        <Text style={[styles.partnerCost, isDark && styles.textMutedDark]}>
                          {partner.xpCost.toLocaleString()} XP
                        </Text>
                        {canAfford ? (
                          <TouchableOpacity
                            style={styles.partnerButton}
                            onPress={() => handleRedeemPartner(partner)}
                            disabled={redeemLoading}
                          >
                            <Text style={styles.partnerButtonText}>Debloquer</Text>
                          </TouchableOpacity>
                        ) : (
                          <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* My Codes Tab */}
        {activeTab === 'codes' && (
          <View style={styles.codesSection}>
            {myRewards.length === 0 ? (
              <View style={[styles.emptyState, isDark && styles.cardDark]}>
                <Ionicons name="ticket-outline" size={48} color={isDark ? '#555' : '#CCC'} />
                <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                  Aucun code debloque
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setActiveTab('partners')}
                >
                  <Text style={styles.emptyButtonText}>Voir les offres</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myRewards.map(reward => (
                <View key={reward.id} style={[styles.codeCard, isDark && styles.cardDark]}>
                  <View style={styles.codeHeader}>
                    {reward.partner?.logo ? (
                      <Image source={{ uri: reward.partner.logo }} style={styles.codeLogo} />
                    ) : (
                      <View style={[styles.codeLogoPlaceholder, isDark && { backgroundColor: '#333' }]}>
                        <Text style={styles.codeLogoText}>{reward.partner?.name?.[0]}</Text>
                      </View>
                    )}
                    <View style={styles.codeInfo}>
                      <Text style={[styles.codeName, isDark && styles.textDark]}>
                        {reward.partner?.name}
                      </Text>
                      <Text style={[styles.codeOffer, isDark && styles.textMutedDark]}>
                        {reward.partner?.offerTitle}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.codeBox}>
                    <Text style={styles.codeText}>{reward.promoCode}</Text>
                    <TouchableOpacity
                      style={styles.codeCopyBtn}
                      onPress={() => copyToClipboard(reward.promoCode, reward.id)}
                    >
                      <Ionicons
                        name={copiedCode === reward.id ? 'checkmark' : 'copy-outline'}
                        size={20}
                        color={copiedCode === reward.id ? '#22C55E' : theme.colors.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.codeActions}>
                    {reward.partner?.address && (
                      <TouchableOpacity
                        style={styles.codeActionBtn}
                        onPress={() => openInMaps(reward.partner.address)}
                      >
                        <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                        <Text style={styles.codeActionText}>Voir l'adresse</Text>
                      </TouchableOpacity>
                    )}
                    {reward.partner?.website && (
                      <TouchableOpacity
                        style={styles.codeActionBtn}
                        onPress={() => Linking.openURL(reward.partner.website)}
                      >
                        <Ionicons name="globe-outline" size={16} color={theme.colors.primary} />
                        <Text style={styles.codeActionText}>Site web</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
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
  xpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  cardDark: {
    backgroundColor: '#2A2A2A',
  },
  xpInfo: {
    flex: 1,
  },
  xpLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  xpAmount: {
    fontSize: 28,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  xpIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: '#6B7280',
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  tabBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  premiumBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  premiumTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  premiumDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  premiumCost: {
    marginBottom: theme.spacing.md,
  },
  premiumXp: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#8B5CF6',
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
  },
  redeemButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: '#FFFFFF',
  },
  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
  },
  lockedButtonText: {
    fontSize: theme.fontSize.sm,
    color: '#6B7280',
  },
  partnersSection: {
    gap: theme.spacing.md,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  emptyButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.medium,
  },
  partnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  partnerCardRedeemed: {
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  partnerLogo: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
  },
  partnerLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerLogoText: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  partnerInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  partnerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  partnerCategory: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  unlockedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerOffer: {
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  partnerOfferValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  partnerOfferTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  partnerCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#22C55E',
    borderStyle: 'dashed',
  },
  partnerCode: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#047857',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  partnerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partnerCost: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.secondary,
  },
  partnerButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  partnerButtonText: {
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.medium,
  },
  codesSection: {
    gap: theme.spacing.md,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  codeLogo: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
  },
  codeLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeLogoText: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  codeInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  codeName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  codeOffer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  codeText: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    letterSpacing: 2,
  },
  codeCopyBtn: {
    padding: 8,
  },
  codeActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  codeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeActionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
});
