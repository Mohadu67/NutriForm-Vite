import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { theme } from '../../theme';

/**
 * Formater une date relative
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/**
 * Carte d'historique horizontale
 */
const HistoryCard = ({ item, type, onPress, isDark, isFirst }) => {
  const getValue = () => {
    switch (type) {
      case 'imc':
        return `${item.imc?.toFixed(1) || item.imc}`;
      case 'calories':
        return `${item.calories}`;
      case 'rm':
        return `${item.rm}`;
      case 'cardio':
        return `${item.fcMax}`;
      default:
        return '';
    }
  };

  const getUnit = () => {
    switch (type) {
      case 'imc':
        return '';
      case 'calories':
        return 'kcal';
      case 'rm':
        return 'kg';
      case 'cardio':
        return 'bpm';
      default:
        return '';
    }
  };

  const getSubLabel = () => {
    switch (type) {
      case 'rm':
        return item.exercice || '';
      case 'calories':
        const labels = { perte: 'Perte', stabiliser: 'Maintien', prise: 'Prise' };
        return labels[item.objectif] || '';
      default:
        return '';
    }
  };

  const subLabel = getSubLabel();

  return (
    <TouchableOpacity
      style={[
        styles.historyCard,
        isDark && styles.historyCardDark,
        isFirst && styles.historyCardFirst,
      ]}
      onPress={() => onPress(item, type)}
      activeOpacity={0.7}
    >
      <Text style={[styles.historyValue, isDark && styles.historyValueDark]}>
        {getValue()}
        <Text style={styles.historyUnit}> {getUnit()}</Text>
      </Text>
      {subLabel ? (
        <Text style={[styles.historySubLabel, isDark && styles.historyDateDark]} numberOfLines={1}>
          {subLabel}
        </Text>
      ) : null}
      <Text style={[styles.historyDate, isDark && styles.historyDateDark]}>
        {formatDate(item.savedAt)}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Section de métrique avec scroll horizontal
 */
const MetricSection = ({ title, icon, iconColor, data, type, history, onCardPress, isDark }) => {
  if (!data && (!history || history.length === 0)) return null;

  const displayHistory = history || [];

  return (
    <View style={styles.metricSection}>
      {/* Header avec icône */}
      <TouchableOpacity
        style={styles.metricHeader}
        onPress={() => displayHistory.length > 0 && onCardPress(displayHistory[0], type)}
        activeOpacity={0.7}
      >
        <View style={[styles.metricIcon, { backgroundColor: iconColor }]}>
          <Ionicons name={icon} size={20} color="#FFFFFF" />
        </View>
        <Text style={[styles.metricTitle, isDark && styles.metricTitleDark]}>{title}</Text>
        <Ionicons name="chevron-forward" size={18} color={isDark ? '#666' : '#999'} />
      </TouchableOpacity>

      {/* Scroll horizontal des entrées */}
      {displayHistory.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.historyScroll}
        >
          {displayHistory.map((item, index) => (
            <HistoryCard
              key={`${type}-${item.id || item.savedAt || index}-${index}`}
              item={item}
              type={type}
              onPress={onCardPress}
              isDark={isDark}
              isFirst={index === 0}
            />
          ))}
        </ScrollView>
      ) : (
        <Text style={[styles.noDataText, isDark && styles.noDataTextDark]}>
          Aucune donnée enregistrée
        </Text>
      )}
    </View>
  );
};

/**
 * Modal de détails
 */
const DetailModal = ({ visible, onClose, data, type, isDark }) => {
  if (!data) return null;

  const renderContent = () => {
    switch (type) {
      case 'imc':
        return (
          <>
            <View style={styles.modalMainValue}>
              <Text style={[styles.modalBigValue, isDark && styles.modalBigValueDark]}>
                {data.imc?.toFixed(1) || data.imc}
              </Text>
              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>IMC</Text>
            </View>
            <View style={[styles.modalDetails, isDark && styles.modalDetailsDark]}>
              <DetailRow label="Catégorie" value={data.categorie} isDark={isDark} />
              <DetailRow label="Poids" value={`${data.poids} kg`} isDark={isDark} />
              <DetailRow label="Taille" value={`${data.taille} cm`} isDark={isDark} />
              {data.poidsIdealMin && data.poidsIdealMax && (
                <DetailRow
                  label="Poids idéal"
                  value={`${data.poidsIdealMin} - ${data.poidsIdealMax} kg`}
                  isDark={isDark}
                />
              )}
            </View>
          </>
        );

      case 'calories':
        const objectifLabels = {
          perte: 'Perte de poids',
          stabiliser: 'Maintien',
          prise: 'Prise de masse',
        };
        return (
          <>
            <View style={styles.modalMainValue}>
              <Text style={[styles.modalBigValue, isDark && styles.modalBigValueDark]}>
                {data.calories}
              </Text>
              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>kcal/jour</Text>
            </View>
            <View style={[styles.modalDetails, isDark && styles.modalDetailsDark]}>
              <DetailRow
                label="Objectif"
                value={objectifLabels[data.objectif] || data.objectif}
                isDark={isDark}
              />
              <DetailRow label="Maintien" value={`${data.maintenance} kcal`} isDark={isDark} />
              <DetailRow label="TMB" value={`${data.tmb} kcal`} isDark={isDark} />
              {data.macros && (
                <>
                  <View style={styles.modalDivider} />
                  <Text style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}>
                    Macros recommandées
                  </Text>
                  <DetailRow label="Protéines" value={`${data.macros.proteines}g`} isDark={isDark} />
                  <DetailRow label="Glucides" value={`${data.macros.glucides}g`} isDark={isDark} />
                  <DetailRow label="Lipides" value={`${data.macros.lipides}g`} isDark={isDark} />
                </>
              )}
            </View>
          </>
        );

      case 'rm':
        return (
          <>
            <View style={styles.modalMainValue}>
              <Text style={[styles.modalBigValue, isDark && styles.modalBigValueDark]}>
                {data.rm}
              </Text>
              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>kg (1RM)</Text>
              {data.exercice && (
                <Text style={[styles.modalExerciceName, isDark && styles.modalLabelDark]}>
                  {data.exercice}
                </Text>
              )}
            </View>
            <View style={[styles.modalDetails, isDark && styles.modalDetailsDark]}>
              <DetailRow label="Poids soulevé" value={`${data.poidsSouleve} kg`} isDark={isDark} />
              <DetailRow label="Répétitions" value={`${data.reps} reps`} isDark={isDark} />
              {data.percentages && Array.isArray(data.percentages) && data.percentages.length > 0 && (
                <>
                  <View style={styles.modalDivider} />
                  <Text style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}>
                    Charges par %
                  </Text>
                  {data.percentages.slice(0, 6).map((p, index) => (
                    <DetailRow
                      key={`pct-${p.percent}-${index}`}
                      label={`${p.percent}% (${p.zone})`}
                      value={`${p.weight} kg`}
                      isDark={isDark}
                    />
                  ))}
                </>
              )}
            </View>
          </>
        );

      case 'cardio':
        return (
          <>
            <View style={styles.modalMainValue}>
              <Text style={[styles.modalBigValue, isDark && styles.modalBigValueDark]}>
                {data.fcMax}
              </Text>
              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>bpm (FC Max)</Text>
            </View>
            <View style={[styles.modalDetails, isDark && styles.modalDetailsDark]}>
              <DetailRow label="Âge" value={`${data.age} ans`} isDark={isDark} />
              {data.fcMaxTanaka && (
                <DetailRow label="FC Max (Tanaka)" value={`${data.fcMaxTanaka} bpm`} isDark={isDark} />
              )}
              {data.zones && (
                <>
                  <View style={styles.modalDivider} />
                  <Text style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}>
                    Zones cardiaques
                  </Text>
                  {data.zones.echauffement && (
                    <DetailRow
                      label="Échauffement"
                      value={`${data.zones.echauffement.min}-${data.zones.echauffement.max} bpm`}
                      isDark={isDark}
                    />
                  )}
                  {data.zones.cardio && (
                    <DetailRow
                      label="Cardio"
                      value={`${data.zones.cardio.min}-${data.zones.cardio.max} bpm`}
                      isDark={isDark}
                    />
                  )}
                  {data.zones.anaerobie && (
                    <DetailRow
                      label="Anaérobie"
                      value={`${data.zones.anaerobie.min}-${data.zones.anaerobie.max} bpm`}
                      isDark={isDark}
                    />
                  )}
                </>
              )}
            </View>
          </>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'imc':
        return 'Indice de Masse Corporelle';
      case 'calories':
        return 'Objectif Calorique';
      case 'rm':
        return '1RM - Charge Maximale';
      case 'cardio':
        return 'Fréquence Cardiaque Max';
      default:
        return 'Détails';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.modalBlur}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                  {getTitle()}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                  <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#333'} />
                </TouchableOpacity>
              </View>

              {/* Date */}
              <Text style={[styles.modalDate, isDark && styles.modalDateDark]}>
                {formatDate(data.savedAt)}
              </Text>

              {/* Scrollable Content */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {renderContent()}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
};

/**
 * Ligne de détail
 */
const DetailRow = ({ label, value, isDark }) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>{label}</Text>
    <Text style={[styles.detailValue, isDark && styles.detailValueDark]}>{value}</Text>
  </View>
);

/**
 * BodyMetrics - Métriques corporelles avec historique et modal
 */
export const BodyMetrics = ({ weightData, calorieTargets, rmData, cardioData }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // Ne pas afficher si pas de données
  if (!weightData && !calorieTargets && !rmData && !cardioData) {
    return null;
  }

  const handleCardPress = (data, type) => {
    setSelectedData(data);
    setSelectedType(type);
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Corps & Nutrition
      </Text>

      {/* IMC */}
      <MetricSection
        title="IMC"
        icon="scale"
        iconColor="#8B5CF6"
        data={weightData}
        type="imc"
        history={weightData?.history}
        onCardPress={handleCardPress}
        isDark={isDark}
      />

      {/* Calories */}
      <MetricSection
        title="Calories"
        icon="flame"
        iconColor={theme.colors.primary}
        data={calorieTargets}
        type="calories"
        history={calorieTargets?.history}
        onCardPress={handleCardPress}
        isDark={isDark}
      />

      {/* 1RM */}
      <MetricSection
        title="1RM"
        icon="barbell"
        iconColor="#3B82F6"
        data={rmData}
        type="rm"
        history={rmData?.history}
        onCardPress={handleCardPress}
        isDark={isDark}
      />

      {/* FC Max */}
      <MetricSection
        title="FC Max"
        icon="heart"
        iconColor="#EF4444"
        data={cardioData}
        type="cardio"
        history={cardioData?.history}
        onCardPress={handleCardPress}
        isDark={isDark}
      />

      {/* Modal de détails */}
      <DetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        data={selectedData}
        type={selectedType}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  containerDark: {
    backgroundColor: '#2A2A2A',
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },

  // Metric Section
  metricSection: {
    marginBottom: theme.spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  metricTitle: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  metricTitleDark: {
    color: '#FFFFFF',
  },

  // History Scroll
  historyScroll: {
    paddingRight: theme.spacing.md,
  },
  historyCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    minWidth: 85,
    maxWidth: 120,
    alignItems: 'center',
  },
  historyCardDark: {
    backgroundColor: '#3A3A3A',
  },
  historyCardFirst: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  historyValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  historyValueDark: {
    color: '#FFFFFF',
  },
  historyUnit: {
    fontSize: theme.fontSize.xs,
    fontWeight: '400',
  },
  historySubLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
    maxWidth: 80,
  },
  historyDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  historyDateDark: {
    color: '#888',
  },
  noDataText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.sm,
  },
  noDataTextDark: {
    color: '#666',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBlur: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
  },
  modalContentDark: {
    backgroundColor: '#2A2A2A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  modalTitleDark: {
    color: '#FFFFFF',
  },
  modalClose: {
    padding: theme.spacing.xs,
  },
  modalDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.lg,
  },
  modalDateDark: {
    color: '#888',
  },
  modalMainValue: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalBigValue: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  modalBigValueDark: {
    color: theme.colors.primary,
  },
  modalLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  modalLabelDark: {
    color: '#999',
  },
  modalExerciceName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 8,
  },
  modalDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  modalDetailsDark: {
    backgroundColor: '#1A1A1A',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: theme.spacing.md,
  },
  modalSubtitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  modalSubtitleDark: {
    color: '#FFFFFF',
  },

  // Detail Row
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  detailLabelDark: {
    color: '#999',
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  detailValueDark: {
    color: '#FFFFFF',
  },
});
