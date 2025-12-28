import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SvgUri } from 'react-native-svg';
import { getExercises } from '../../api/exercises';
import { theme } from '../../theme';

export default function ExerciseSelector({
  visible,
  onClose,
  onSelect,
  currentExercise,
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les exercices
  const loadExercises = useCallback(async (query = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: 50,
      };
      if (query.trim()) {
        params.q = query.trim();
      }

      const result = await getExercises(params);

      if (result.success) {
        setExercises(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    if (visible) {
      loadExercises();
    }
  }, [visible, loadExercises]);

  // Debounce recherche
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      loadExercises(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, visible, loadExercises]);

  // Selectionner un exercice
  const handleSelect = (exercise) => {
    onSelect({
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      exerciseImage: exercise.mainImage || (exercise.images && exercise.images[0]?.url) || null,
      exerciseType: exercise.type || 'exercise',
    });
    onClose();
  };

  // Verifier si une URL est un SVG
  const isSvgUrl = (url) => {
    if (!url) return false;
    return url.includes('.svg') || url.includes('/svg/') || url.includes('format=svg');
  };

  // Rendre une image d'exercice (SVG ou image normale)
  const renderExerciseImage = (exercise) => {
    const imageUrl = exercise.mainImage || (exercise.images && exercise.images[0]?.url);

    if (!imageUrl) {
      return (
        <View style={[styles.imagePlaceholder, isDark && styles.imagePlaceholderDark]}>
          <Ionicons name="barbell-outline" size={24} color={isDark ? '#555' : '#CCC'} />
        </View>
      );
    }

    // Si c'est un SVG
    if (isSvgUrl(imageUrl)) {
      return (
        <View style={[styles.svgContainer, isDark && styles.svgContainerDark]}>
          <SvgUri
            width={56}
            height={56}
            uri={imageUrl}
            onError={() => console.log('[ExerciseSelector] SVG load error:', imageUrl)}
          />
        </View>
      );
    }

    // Image normale
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.exerciseImage}
        resizeMode="contain"
      />
    );
  };

  const renderExercise = ({ item }) => {
    const isSelected = currentExercise?.exerciseId === item._id;

    return (
      <TouchableOpacity
        style={[
          styles.exerciseItem,
          isDark && styles.exerciseItemDark,
          isSelected && styles.exerciseItemSelected,
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        {renderExerciseImage(item)}

        <View style={styles.exerciseInfo}>
          <Text
            style={[styles.exerciseName, isDark && styles.exerciseNameDark]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View style={styles.exerciseMeta}>
            {item.primaryMuscle && (
              <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
                {item.primaryMuscle}
              </Text>
            )}
            {item.difficulty && (
              <View style={[styles.difficultyBadge, getDifficultyStyle(item.difficulty)]}>
                <Text style={styles.difficultyText}>
                  {item.difficulty === 'beginner' ? 'Deb' :
                   item.difficulty === 'intermediate' ? 'Int' : 'Av'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={isDark ? '#FFF' : '#333'} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            Choisir un exercice
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
          <Ionicons
            name="search"
            size={20}
            color={isDark ? '#888' : '#999'}
          />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Rechercher un exercice..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#888' : '#999'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadExercises(searchQuery)}>
              <Text style={styles.retryText}>Reessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {!loading && !error && (
          <FlatList
            data={exercises}
            renderItem={renderExercise}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="barbell-outline"
                  size={48}
                  color={isDark ? '#555' : '#CCC'}
                />
                <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                  {searchQuery ? 'Aucun exercice trouve' : 'Aucun exercice disponible'}
                </Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const getDifficultyStyle = (difficulty) => {
  switch (difficulty) {
    case 'beginner':
      return { backgroundColor: '#D1FAE5' };
    case 'intermediate':
      return { backgroundColor: '#FEF3C7' };
    case 'advanced':
      return { backgroundColor: '#FEE2E2' };
    default:
      return { backgroundColor: '#F3F4F6' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchContainerDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#404040',
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  searchInputDark: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  exerciseItemDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#404040',
  },
  exerciseItemSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderDark: {
    backgroundColor: '#333',
  },
  svgContainer: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  svgContainerDark: {
    backgroundColor: '#2A2A2A',
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  exerciseName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  exerciseNameDark: {
    color: '#FFFFFF',
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  metaTextDark: {
    color: '#888',
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  emptyTextDark: {
    color: '#888',
  },
});
