import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';

/**
 * SupportScreen - Aide et Support
 */
export default function SupportScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();

  // Ouvrir le chat support (via AI Chat avec escalade)
  const handleOpenSupportChat = () => {
    // Naviguer vers le chat AI qui peut escalader vers le support
    // AIChat est maintenant dans MatchingStack
    navigation.navigate('MatchingTab', {
      screen: 'AIChat',
      params: { mode: 'support' },
    });
  };

  // FAQ items
  const faqItems = [
    {
      question: 'Comment devenir Premium ?',
      answer: 'Rendez-vous dans Profil > Abonnement pour decouvrir les avantages Premium et vous abonner.',
    },
    {
      question: 'Comment trouver un partenaire de sport ?',
      answer: 'Activez le matching dans votre profil, renseignez vos disponibilites et swipez pour trouver des partenaires compatibles.',
    },
    {
      question: 'Comment creer un programme ?',
      answer: 'Les utilisateurs Premium peuvent creer leurs propres programmes depuis l\'onglet Programmes > bouton +.',
    },
    {
      question: 'Comment gagner des XP ?',
      answer: 'Completez des seances d\'entrainement pour gagner des XP. Plus la seance est longue et intense, plus vous gagnez d\'XP.',
    },
    {
      question: 'Comment echanger mes XP ?',
      answer: 'Rendez-vous dans Profil > Recompenses. Avec 10 000 XP, vous pouvez obtenir 1 mois de Premium gratuit.',
    },
  ];

  const [expandedFaq, setExpandedFaq] = useState(null);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Aide & Support</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section FAQ */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            Questions frequentes
          </Text>

          {faqItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.faqItem,
                index < faqItems.length - 1 && styles.faqItemBorder,
                isDark && styles.faqItemBorderDark,
              ]}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, isDark && styles.textDark]}>
                  {item.question}
                </Text>
                <Ionicons
                  name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isDark ? '#888' : '#666'}
                />
              </View>
              {expandedFaq === index && (
                <Text style={[styles.faqAnswer, isDark && styles.textMutedDark]}>
                  {item.answer}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Section Chat Support */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.chatSupportHeader}>
            <View style={styles.chatSupportIcon}>
              <Ionicons name="chatbubbles" size={32} color={theme.colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
              Besoin d'aide ?
            </Text>
            <Text style={[styles.chatSupportText, isDark && styles.textMutedDark]}>
              Notre equipe est disponible pour repondre a toutes vos questions.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.chatButton}
            onPress={handleOpenSupportChat}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
            <Text style={styles.chatButtonText}>Discuter avec le support</Text>
          </TouchableOpacity>
        </View>

        {/* Liens utiles */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            Liens utiles
          </Text>

          <TouchableOpacity
            style={[styles.linkItem, isDark && styles.linkItemDark]}
            onPress={() => Linking.openURL('mailto:support@nutriform.app')}
            activeOpacity={0.7}
          >
            <View style={[styles.linkIcon, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="mail-outline" size={22} color="#3B82F6" />
            </View>
            <View style={styles.linkContent}>
              <Text style={[styles.linkLabel, isDark && styles.textDark]}>Email</Text>
              <Text style={[styles.linkValue, isDark && styles.textMutedDark]}>
                support@nutriform.app
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#CCC'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkItem, isDark && styles.linkItemDark]}
            onPress={() => Linking.openURL('https://nutriform.app/privacy')}
            activeOpacity={0.7}
          >
            <View style={[styles.linkIcon, { backgroundColor: '#8B5CF620' }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#8B5CF6" />
            </View>
            <View style={styles.linkContent}>
              <Text style={[styles.linkLabel, isDark && styles.textDark]}>
                Politique de confidentialite
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#CCC'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkItem, isDark && styles.linkItemDark]}
            onPress={() => Linking.openURL('https://nutriform.app/terms')}
            activeOpacity={0.7}
          >
            <View style={[styles.linkIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="document-text-outline" size={22} color="#F59E0B" />
            </View>
            <View style={styles.linkContent}>
              <Text style={[styles.linkLabel, isDark && styles.textDark]}>
                Conditions d'utilisation
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#CCC'} />
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
  section: {
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
  sectionDark: {
    backgroundColor: '#2A2A2A',
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  faqItem: {
    paddingVertical: theme.spacing.md,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqItemBorderDark: {
    borderBottomColor: '#333',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    paddingRight: theme.spacing.md,
  },
  faqAnswer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  chatSupportHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  chatSupportIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  chatSupportText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
  },
  chatButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: '#FFFFFF',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  linkItemDark: {
    borderBottomColor: '#333',
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkContent: {
    flex: 1,
  },
  linkLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  linkValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
});
