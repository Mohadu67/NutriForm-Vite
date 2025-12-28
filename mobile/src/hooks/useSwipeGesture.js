import { useRef, useEffect, useCallback } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

/**
 * Hook pour gérer les gestes de swipe (gauche/droite) sur des cartes
 *
 * @param {Object} options - Options du hook
 * @param {Array} options.items - Tableau d'items à swiper
 * @param {number} options.currentIndex - Index de l'item courant
 * @param {Function} options.onSwipeRight - Callback appelé lors d'un swipe à droite (reçoit l'item courant)
 * @param {Function} options.onSwipeLeft - Callback appelé lors d'un swipe à gauche (reçoit l'item courant)
 * @param {Function} options.onNextCard - Callback appelé quand on passe à la carte suivante
 * @param {boolean} options.disabled - Si true, désactive les swipes
 *
 * @returns {Object} Objet contenant panResponder, position, animations et fonctions de swipe
 */
export default function useSwipeGesture({
  items = [],
  currentIndex = 0,
  onSwipeRight = () => {},
  onSwipeLeft = () => {},
  onNextCard = () => {},
  disabled = false,
}) {
  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const nextCardScale = useRef(new Animated.Value(0.92)).current;
  const nextCardOpacity = useRef(new Animated.Value(0.7)).current;

  // Refs pour éviter les stale closures dans PanResponder
  const actionLoadingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const itemsLengthRef = useRef(0);
  const disabledRef = useRef(disabled);
  const swipeRightRef = useRef(null);
  const swipeLeftRef = useRef(null);

  // Garder les refs synchronisées avec les props/state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    itemsLengthRef.current = items.length;
  }, [items]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  /**
   * Reset la position de la carte à l'origine avec une animation
   */
  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
    nextCardScale.setValue(0.92);
    nextCardOpacity.setValue(0.7);
  }, [position, nextCardScale, nextCardOpacity]);

  /**
   * Passe à la carte suivante
   */
  const goToNextCard = useCallback(() => {
    position.setValue({ x: 0, y: 0 });
    nextCardScale.setValue(0.92);
    nextCardOpacity.setValue(0.7);
    onNextCard();
  }, [position, nextCardScale, nextCardOpacity, onNextCard]);

  /**
   * Swipe vers la droite (like)
   */
  const swipeRight = useCallback(async () => {
    if (actionLoadingRef.current || currentIndexRef.current >= itemsLengthRef.current || disabledRef.current) {
      return;
    }

    const currentItem = items[currentIndexRef.current];
    if (!currentItem) {
      return;
    }

    actionLoadingRef.current = true;

    // Animation de swipe
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      goToNextCard();
      actionLoadingRef.current = false;
    });

    // Appel du callback
    try {
      await onSwipeRight(currentItem);
    } catch (err) {
      console.error('[useSwipeGesture] Error in onSwipeRight callback:', err);
    }
  }, [items, position, onSwipeRight, goToNextCard]);

  /**
   * Swipe vers la gauche (reject)
   */
  const swipeLeft = useCallback(async () => {
    if (actionLoadingRef.current || currentIndexRef.current >= itemsLengthRef.current || disabledRef.current) {
      return;
    }

    const currentItem = items[currentIndexRef.current];
    if (!currentItem) {
      return;
    }

    actionLoadingRef.current = true;

    // Animation de swipe
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      goToNextCard();
      actionLoadingRef.current = false;
    });

    // Appel du callback
    try {
      await onSwipeLeft(currentItem);
    } catch (err) {
      console.error('[useSwipeGesture] Error in onSwipeLeft callback:', err);
    }
  }, [items, position, onSwipeLeft, goToNextCard]);

  // Mettre à jour les refs quand les fonctions changent
  useEffect(() => {
    swipeRightRef.current = swipeRight;
  }, [swipeRight]);

  useEffect(() => {
    swipeLeftRef.current = swipeLeft;
  }, [swipeLeft]);

  // PanResponder pour gérer les gestes tactiles
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return !actionLoadingRef.current &&
               !disabledRef.current &&
               currentIndexRef.current < itemsLengthRef.current;
      },
      onMoveShouldSetPanResponder: () => {
        return !actionLoadingRef.current &&
               !disabledRef.current &&
               currentIndexRef.current < itemsLengthRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        if (actionLoadingRef.current || disabledRef.current) return;

        position.setValue({ x: gesture.dx, y: gesture.dy });

        // Scale up de la carte suivante pendant le mouvement
        const progress = Math.min(Math.abs(gesture.dx) / SWIPE_THRESHOLD, 1);
        nextCardScale.setValue(0.92 + (0.08 * progress));
        nextCardOpacity.setValue(0.7 + (0.3 * progress));
      },
      onPanResponderRelease: (_, gesture) => {
        if (actionLoadingRef.current ||
            disabledRef.current ||
            currentIndexRef.current >= itemsLengthRef.current) {
          resetPosition();
          return;
        }

        // Swipe à droite
        if (gesture.dx > SWIPE_THRESHOLD) {
          if (swipeRightRef.current) {
            swipeRightRef.current();
          }
        }
        // Swipe à gauche
        else if (gesture.dx < -SWIPE_THRESHOLD) {
          if (swipeLeftRef.current) {
            swipeLeftRef.current();
          }
        }
        // Swipe pas assez fort, reset
        else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        resetPosition();
      },
    })
  ).current;

  return {
    panResponder,
    position,
    nextCardScale,
    nextCardOpacity,
    swipeRight,
    swipeLeft,
    resetPosition,
  };
}
