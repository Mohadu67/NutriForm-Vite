import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { getActivePartners, getMyRewards, redeemPartnerOffer } from '../../shared/api/partners';
import { checkXpRedemptionEligibility, redeemXpForPremium } from '../../shared/api/xpRedemption';
import { LockIcon, CheckIcon, CopyIcon } from '../../components/Icons/GlobalIcons';
import ConfirmModal from '../../components/Modal/ConfirmModal';
import styles from './RewardsPage.module.css';

const CATEGORIES = {
  sport: 'Sport',
  nutrition: 'Nutrition',
  wellness: 'Bien-etre',
  equipement: 'Equipement',
  vetements: 'Vetements',
  autre: 'Autre'
};

// Icons
const GiftIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="4" rx="1"/>
    <path d="M12 8v13"/>
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
  </svg>
);

const StarIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const DiamondIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/>
  </svg>
);

const MapPinIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const NavigationIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);

const CloseIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

export default function RewardsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('premium');
  const [partners, setPartners] = useState([]);
  const [myRewards, setMyRewards] = useState([]);
  const [userXp, setUserXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeemedPartners, setRedeemedPartners] = useState(new Set());
  const [redeemModal, setRedeemModal] = useState({ isOpen: false, partner: null, type: null });
  const [copiedCode, setCopiedCode] = useState(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [codePopup, setCodePopup] = useState({ isOpen: false, reward: null, partner: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      try {
        const eligibility = await checkXpRedemptionEligibility();
        setUserXp(eligibility.currentXp || 0);
      } catch {
        setUserXp(0);
      }

      const partnersData = await getActivePartners();
      if (partnersData.success) {
        setPartners(partnersData.partners || []);
      }

      try {
        const rewardsData = await getMyRewards();
        if (rewardsData.success) {
          setMyRewards(rewardsData.rewards || []);
          const redeemed = new Set(rewardsData.rewards.map(r => r.partner?._id));
          setRedeemedPartners(redeemed);
        }
      } catch {}
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemPremium = () => {
    if (userXp < 10000) {
      toast.error(`Il te manque ${(10000 - userXp).toLocaleString()} XP`);
      return;
    }
    setRedeemModal({ isOpen: true, partner: null, type: 'premium' });
  };

  const handleRedeemPartner = (partner) => {
    if (userXp < partner.xpCost) {
      toast.error(`Il te manque ${(partner.xpCost - userXp).toLocaleString()} XP`);
      return;
    }
    setRedeemModal({ isOpen: true, partner, type: 'partner' });
  };

  const handleConfirmRedeem = async () => {
    setRedeemLoading(true);
    try {
      if (redeemModal.type === 'premium') {
        const result = await redeemXpForPremium(1);
        if (result.success) {
          toast.success('1 mois Premium debloque !');
          setUserXp(result.redemption.remainingXp);
        }
      } else if (redeemModal.type === 'partner') {
        const partner = redeemModal.partner;
        const result = await redeemPartnerOffer(partner._id);
        if (result.success) {
          toast.success('Code promo debloque !');
          setUserXp(result.redemption.remainingXp);
          setRedeemedPartners(prev => new Set([...prev, partner._id]));
          setMyRewards(prev => [{
            id: result.redemption.id,
            partner: {
              _id: partner._id,
              name: result.redemption.partnerName,
              logo: partner.logo,
              offerTitle: result.redemption.offerTitle,
              website: result.redemption.website,
              address: partner.address
            },
            promoCode: result.redemption.promoCode,
            xpSpent: result.redemption.xpSpent,
            redeemedAt: new Date().toISOString()
          }, ...prev]);
          setActiveTab('codes');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors du deblocage');
    } finally {
      setRedeemLoading(false);
      setRedeemModal({ isOpen: false, partner: null, type: null });
    }
  };

  const copyToClipboard = async (code, rewardId) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(rewardId);
      toast.success('Code copie !');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error('Erreur lors de la copie');
    }
  };

  const openInMaps = (address) => {
    const encodedAddress = encodeURIComponent(address);
    // Detecter si iOS pour ouvrir Apple Maps, sinon Google Maps
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const mapsUrl = isIOS
      ? `maps://maps.apple.com/?q=${encodedAddress}`
      : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
  };

  const openCodePopup = (reward, partner) => {
    setCodePopup({ isOpen: true, reward, partner });
  };

  const closeCodePopup = () => {
    setCodePopup({ isOpen: false, reward: null, partner: null });
  };

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
      <>
        <Header />
        <div className={styles.page}>
          <div className={styles.loader}>
            <div className={styles.spinner} />
            <span>Chargement...</span>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Hero */}
          <div className={styles.hero}>
            <div className={styles.heroIcon}>
              <GiftIcon size={32} />
            </div>
            <h1 className={styles.title}>Recompenses</h1>
            <p className={styles.subtitle}>Echange tes XP contre des avantages exclusifs</p>
          </div>

          {/* XP Balance */}
          <div className={styles.xpCard}>
            <div className={styles.xpInfo}>
              <span className={styles.xpLabel}>Ton solde</span>
              <span className={styles.xpAmount}>{userXp.toLocaleString()} XP</span>
            </div>
            <div className={styles.xpIcon}>
              <StarIcon size={28} />
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'premium' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('premium')}
            >
              <DiamondIcon size={18} />
              Premium
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'partners' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('partners')}
            >
              <GiftIcon size={18} />
              Partenaires
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'codes' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('codes')}
            >
              <CheckIcon size={18} />
              Mes codes {myRewards.length > 0 && <span className={styles.tabBadge}>{myRewards.length}</span>}
            </button>
          </div>

          {/* Premium Tab */}
          {activeTab === 'premium' && (
            <div className={styles.section}>
              <div className={styles.premiumCard}>
                <div className={styles.premiumBadge}>
                  <DiamondIcon size={24} />
                </div>
                <h3 className={styles.premiumTitle}>1 Mois Premium</h3>
                <p className={styles.premiumDesc}>
                  Acces illimite a toutes les fonctionnalites: GymBro, creation de contenu, et plus encore.
                </p>
                <div className={styles.premiumCost}>
                  <span className={styles.premiumXp}>10 000 XP</span>
                </div>
                <div className={styles.premiumProgress}>
                  <div
                    className={styles.premiumProgressBar}
                    style={{ width: `${Math.min((userXp / 10000) * 100, 100)}%` }}
                  />
                </div>
                <span className={styles.premiumProgressText}>
                  {userXp >= 10000 ? 'Disponible !' : `${userXp.toLocaleString()} / 10 000 XP`}
                </span>
                {userXp >= 10000 ? (
                  <button className={styles.premiumBtn} onClick={handleRedeemPremium}>
                    Debloquer maintenant
                  </button>
                ) : (
                  <button className={styles.premiumBtnLocked} disabled>
                    <LockIcon size={16} />
                    Il te manque {(10000 - userXp).toLocaleString()} XP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Partners Tab */}
          {activeTab === 'partners' && (
            <div className={styles.section}>
              {partners.length === 0 ? (
                <div className={styles.empty}>
                  <GiftIcon size={48} />
                  <p>Aucune offre partenaire disponible</p>
                  <span>Reviens bientot !</span>
                </div>
              ) : (
                <div className={styles.partnersGrid}>
                  {partners.map(partner => {
                    const isRedeemed = redeemedPartners.has(partner._id);
                    const canAfford = userXp >= partner.xpCost;
                    const reward = myRewards.find(r => r.partner?._id === partner._id);

                    return (
                      <div key={partner._id} className={`${styles.partnerCard} ${isRedeemed ? styles.partnerCardRedeemed : ''}`}>
                        <div className={styles.partnerHeader}>
                          {partner.logo ? (
                            <img src={partner.logo} alt={partner.name} className={styles.partnerLogo} />
                          ) : (
                            <div className={styles.partnerLogoPlaceholder}>{partner.name[0]}</div>
                          )}
                          <div className={styles.partnerInfo}>
                            <h4 className={styles.partnerName}>{partner.name}</h4>
                            <span className={styles.partnerCategory}>{CATEGORIES[partner.category]}</span>
                          </div>
                          {isRedeemed && (
                            <span className={styles.partnerBadgeUnlocked}>
                              <CheckIcon size={12} /> Debloque
                            </span>
                          )}
                        </div>

                        <div className={styles.partnerOffer}>
                          <span className={styles.partnerOfferValue}>{getOfferDisplay(partner)}</span>
                          <span className={styles.partnerOfferTitle}>{partner.offerTitle}</span>
                        </div>

                        {isRedeemed && reward ? (
                          <>
                            <div className={styles.partnerCodeBox}>
                              <code className={styles.partnerCode}>{reward.promoCode}</code>
                              <button
                                className={styles.partnerCopyBtn}
                                onClick={() => copyToClipboard(reward.promoCode, reward.id)}
                              >
                                {copiedCode === reward.id ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                              </button>
                            </div>
                            {partner.website && (
                              <a
                                href={partner.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.partnerWebsiteLink}
                              >
                                Utiliser sur le site →
                              </a>
                            )}
                          </>
                        ) : (
                          <div className={styles.partnerFooter}>
                            <span className={styles.partnerCost}>{partner.xpCost.toLocaleString()} XP</span>
                            {canAfford ? (
                              <button className={styles.partnerBtn} onClick={() => handleRedeemPartner(partner)}>
                                Debloquer
                              </button>
                            ) : (
                              <span className={styles.partnerLocked}>
                                <LockIcon size={14} />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* My Codes Tab */}
          {activeTab === 'codes' && (
            <div className={styles.section}>
              {myRewards.length === 0 ? (
                <div className={styles.empty}>
                  <CheckIcon size={48} />
                  <p>Aucun code debloque</p>
                  <button className={styles.emptyBtn} onClick={() => setActiveTab('partners')}>
                    Voir les offres
                  </button>
                </div>
              ) : (
                <div className={styles.codesList}>
                  {myRewards.map(reward => {
                    const partnerData = partners.find(p => p._id === reward.partner?._id) || reward.partner;
                    return (
                      <div
                        key={reward.id}
                        className={styles.codeCard}
                        onClick={() => openCodePopup(reward, partnerData)}
                      >
                        <div className={styles.codeHeader}>
                          {reward.partner?.logo ? (
                            <img src={reward.partner.logo} alt={reward.partner?.name} className={styles.codeLogo} />
                          ) : (
                            <div className={styles.codeLogoPlaceholder}>{reward.partner?.name?.[0]}</div>
                          )}
                          <div className={styles.codeInfo}>
                            <h4>{reward.partner?.name}</h4>
                            <span>{reward.partner?.offerTitle}</span>
                          </div>
                          {partnerData?.address && (
                            <span className={styles.codeAddressBadge}>
                              <MapPinIcon size={14} />
                            </span>
                          )}
                        </div>

                        <div className={styles.codeBox} onClick={(e) => e.stopPropagation()}>
                          <code>{reward.promoCode}</code>
                          <button
                            className={styles.copyBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(reward.promoCode, reward.id);
                            }}
                          >
                            {copiedCode === reward.id ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                          </button>
                        </div>

                        <div className={styles.codeActions}>
                          {partnerData?.address && (
                            <button
                              className={styles.codeAddressBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                openCodePopup(reward, partnerData);
                              }}
                            >
                              <MapPinIcon size={16} /> Voir l'adresse
                            </button>
                          )}
                          {reward.partner?.website && (
                            <a
                              href={reward.partner.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.codeLink}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Utiliser sur le site →
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />

      <ConfirmModal
        isOpen={redeemModal.isOpen}
        onClose={() => setRedeemModal({ isOpen: false, partner: null, type: null })}
        onConfirm={handleConfirmRedeem}
        title={redeemModal.type === 'premium' ? 'Debloquer Premium' : 'Debloquer cette offre'}
        message={
          redeemModal.type === 'premium'
            ? `Utiliser 10 000 XP pour obtenir 1 mois Premium ?`
            : redeemModal.partner
              ? `Utiliser ${redeemModal.partner.xpCost.toLocaleString()} XP pour debloquer "${redeemModal.partner.offerTitle}" chez ${redeemModal.partner.name} ?`
              : ''
        }
        confirmText={redeemLoading ? 'Deblocage...' : 'Confirmer'}
        type="default"
      />

      {/* Popup Code Promo */}
      {codePopup.isOpen && codePopup.reward && (
        <div className={styles.popupOverlay} onClick={closeCodePopup}>
          <div className={styles.popupContainer} onClick={(e) => e.stopPropagation()}>
            <button className={styles.popupClose} onClick={closeCodePopup}>
              <CloseIcon size={20} />
            </button>

            {/* Header */}
            <div className={styles.popupHeader}>
              {codePopup.partner?.logo ? (
                <img src={codePopup.partner.logo} alt={codePopup.partner?.name} className={styles.popupLogo} />
              ) : (
                <div className={styles.popupLogoPlaceholder}>{codePopup.partner?.name?.[0]}</div>
              )}
              <div className={styles.popupInfo}>
                <h2 className={styles.popupName}>{codePopup.partner?.name?.toUpperCase()}</h2>
                <span className={styles.popupOffer}>{codePopup.partner?.offerTitle}</span>
              </div>
            </div>

            {/* Code Promo */}
            <div className={styles.popupCodeSection}>
              <span className={styles.popupCodeLabel}>Ton code promo</span>
              <div className={styles.popupCodeBox}>
                <code className={styles.popupCode}>{codePopup.reward.promoCode}</code>
                <button
                  className={styles.popupCopyBtn}
                  onClick={() => copyToClipboard(codePopup.reward.promoCode, codePopup.reward.id)}
                >
                  {copiedCode === codePopup.reward.id ? <CheckIcon size={20} /> : <CopyIcon size={20} />}
                  {copiedCode === codePopup.reward.id ? 'Copie !' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Adresse */}
            {codePopup.partner?.address && (
              <div className={styles.popupAddressSection}>
                <div className={styles.popupAddressHeader}>
                  <MapPinIcon size={18} />
                  <span>Adresse du partenaire</span>
                </div>
                <p className={styles.popupAddress}>{codePopup.partner.address}</p>
                <button
                  className={styles.popupNavigateBtn}
                  onClick={() => openInMaps(codePopup.partner.address)}
                >
                  <NavigationIcon size={18} />
                  Ouvrir dans Maps
                </button>
              </div>
            )}

            {/* Actions */}
            <div className={styles.popupActions}>
              {codePopup.partner?.website && (
                <a
                  href={codePopup.partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.popupWebsiteBtn}
                >
                  Voir le site web →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
