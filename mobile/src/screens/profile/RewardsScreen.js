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

import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';
import logger from '../../services/logger';
import { XP_COST_PER_MONTH } from '../../utils/xpConfig';

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
        logger.app.debug('[REWARDS] Partners error:', e);
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
        logger.app.debug('[REWARDS] My rewards error:', e);
      }
    } catch (error) {
      logger.app.error('[REWARDS] Load error:', error);
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
    if (userXp < XP_COST_PER_MONTH) {
      Alert.alert('XP insuffisant', `Il te manque ${(XP_COST_PER_MONTH - userXp).toLocaleString()} XP`);
      return;
    }

    Alert.alert(
      'Debloquer Premium',
      `Utiliser ${XP_COST_PER_MONTH.toLocaleString()} XP pour obtenir 1 mois Premium ?`,
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
            tintColor="#72baa1"
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
            <Ionicons name="star" size={32} color="#f0a47a" />
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, isDark && styles.tabsDark]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'premium' && styles.tabActive, activeTab === 'premium' && isDark && styles.tabActiveDark]}
            onPress={() => setActiveTab('premium')}
          >
            <Ionicons
              name="diamond"
              size={18}
              color={activeTab === 'premium' ? '#fff' : (isDark ? '#7a7a88' : '#78716c')}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'premium' && styles.tabTextActive,
              isDark && activeTab !== 'premium' && styles.textMutedDark,
            ]}>
              Premium
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'partners' && styles.tabActive, activeTab === 'partners' && isDark && styles.tabActiveDark]}
            onPress={() => setActiveTab('partners')}
          >
            <Ionicons
              name="gift"
              size={18}
              color={activeTab === 'partners' ? '#fff' : (isDark ? '#7a7a88' : '#78716c')}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'partners' && styles.tabTextActive,
              isDark && activeTab !== 'partners' && styles.textMutedDark,
            ]}>
              Partenaires
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'codes' && styles.tabActive, activeTab === 'codes' && isDark && styles.tabActiveDark]}
            onPress={() => setActiveTab('codes')}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={activeTab === 'codes' ? '#fff' : (isDark ? '#7a7a88' : '#78716c')}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'codes' && styles.tabTextActive,
              isDark && activeTab !== 'codes' && styles.textMutedDark,
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
              <Ionicons name="diamond" size={32} color="#72baa1" />
            </View>
            <Text style={[styles.premiumTitle, isDark && styles.textDark]}>
              1 Mois Premium
            </Text>
            <Text style={[styles.premiumDesc, isDark && styles.textMutedDark]}>
              Acces illimite : GymBro, creation de programmes/recettes, defis, et plus encore.
            </Text>
            <View style={styles.premiumCost}>
              <Text style={styles.premiumXp}>{XP_COST_PER_MONTH.toLocaleString()} XP</Text>
            </View>

            {/* Progress bar */}
            <View style={[styles.progressContainer, isDark && styles.progressContainerDark]}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.min((userXp / XP_COST_PER_MONTH) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressText, isDark && styles.textMutedDark]}>
              {userXp >= XP_COST_PER_MONTH ? 'Disponible !' : `${userXp.toLocaleString()} / ${XP_COST_PER_MONTH.toLocaleString()} XP`}
            </Text>

            {userXp >= XP_COST_PER_MONTH ? (
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
              <View style={[styles.lockedButton, isDark && styles.lockedButtonDark]}>
                <Ionicons name="lock-closed" size={18} color={isDark ? '#7a7a88' : '#a8a29e'} />
                <Text style={[styles.lockedButtonText, isDark && styles.textMutedDark]}>
                  Il te manque {(XP_COST_PER_MONTH - userXp).toLocaleString()} XP
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
                <Ionicons name="gift-outline" size={48} color={isDark ? '#7a7a88' : '#a8a29e'} />
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
                        <View style={[styles.partnerLogoPlaceholder, isDark && { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
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

                    <View style={[styles.partnerOffer, isDark && styles.partnerOfferDark]}>
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
                            color="#72baa1"
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.partnerFooter}>
                        <Text style={[styles.partnerCost, isDark && styles.textSecondaryDark]}>
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
                          <Ionicons name="lock-closed" size={20} color="#a8a29e" />
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
                <Ionicons name="ticket-outline" size={48} color={isDark ? '#7a7a88' : '#a8a29e'} />
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
                      <View style={[styles.codeLogoPlaceholder, isDark && { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
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

                  <View style={[styles.codeBox, isDark && styles.codeBoxDark]}>
                    <Text style={[styles.codeText, isDark && styles.textDark]}>{reward.promoCode}</Text>
                    <TouchableOpacity
                      style={styles.codeCopyBtn}
                      onPress={() => copyToClipboard(reward.promoCode, reward.id)}
                    >
                      <Ionicons
                        name={copiedCode === reward.id ? 'checkmark' : 'copy-outline'}
                        size={20}
                        color={copiedCode === reward.id ? '#72baa1' : '#72baa1'}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.codeActions}>
                    {reward.partner?.address && (
                      <TouchableOpacity
                        style={styles.codeActionBtn}
                        onPress={() => openInMaps(reward.partner.address)}
                      >
                        <Ionicons name="location-outline" size={16} color="#72baa1" />
                        <Text style={styles.codeActionText}>Voir l'adresse</Text>
                      </TouchableOpacity>
                    )}
                    {reward.partner?.website && (
                      <TouchableOpacity
                        style={styles.codeActionBtn}
                        onPress={() => Linking.openURL(reward.partner.website)}
                      >
                        <Ionicons name="globe-outline" size={16} color="#72baa1" />
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
  textSecondaryDark: {
    color: '#c1c1cb',
  },
  content: {
    padding: 20,
    paddingBottom: 180,
  },
  xpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 16,
    marginBottom: 16,
  },
  cardDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  xpInfo: {
    flex: 1,
  },
  xpLabel: {
    fontSize: 13,
    color: '#78716c',
  },
  xpAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#72baa1',
  },
  xpIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(240,164,122,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f4',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabsDark: {
    backgroundColor: '#18181d',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#72baa1',
  },
  tabActiveDark: {
    backgroundColor: '#72baa1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716c',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: '#f0a47a',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  premiumCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 24,
    alignItems: 'center',
  },
  premiumBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(114,186,161,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1c1917',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  premiumDesc: {
    fontSize: 13,
    color: '#78716c',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  premiumCost: {
    marginBottom: 12,
  },
  premiumXp: {
    fontSize: 17,
    fontWeight: '800',
    color: '#72baa1',
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#efedea',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressContainerDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#72baa1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#78716c',
    marginBottom: 16,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#72baa1',
    borderRadius: 14,
    paddingVertical: 14,
  },
  redeemButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#f5f5f4',
    borderRadius: 14,
    paddingVertical: 14,
  },
  lockedButtonDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  lockedButtonText: {
    fontSize: 13,
    color: '#a8a29e',
  },
  partnersSection: {
    gap: 12,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#78716c',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#a8a29e',
    marginTop: 4,
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: '#72baa1',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  partnerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 16,
  },
  partnerCardRedeemed: {
    borderWidth: 1,
    borderColor: '#72baa1',
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnerLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  partnerLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerLogoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#72baa1',
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1917',
  },
  partnerCategory: {
    fontSize: 13,
    color: '#78716c',
  },
  unlockedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#72baa1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerOffer: {
    backgroundColor: '#f5f5f4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  partnerOfferDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  partnerOfferValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#72baa1',
  },
  partnerOfferTitle: {
    fontSize: 13,
    color: '#78716c',
    marginTop: 2,
  },
  partnerCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(114,186,161,0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(114,186,161,0.2)',
    borderStyle: 'dashed',
  },
  partnerCode: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#72baa1',
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
    fontSize: 15,
    fontWeight: '800',
    color: '#72baa1',
  },
  partnerButton: {
    backgroundColor: '#72baa1',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  partnerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  codesSection: {
    gap: 12,
  },
  codeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 16,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  codeLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeLogoText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#72baa1',
  },
  codeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  codeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1917',
  },
  codeOffer: {
    fontSize: 13,
    color: '#78716c',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  codeBoxDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  codeText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: 2,
  },
  codeCopyBtn: {
    padding: 8,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  codeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeActionText: {
    fontSize: 13,
    color: '#72baa1',
    fontWeight: '600',
  },
});
