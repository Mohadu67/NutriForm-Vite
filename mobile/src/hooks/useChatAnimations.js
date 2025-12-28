import { useRef } from 'react';
import { Animated } from 'react-native';

export default function useChatAnimations() {
  const createMessageAnimation = () => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const scale = useRef(new Animated.Value(0.95)).current;

    const animateIn = () => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }),
      ]).start();
    };

    return { opacity, translateY, scale, animateIn };
  };

  const createButtonPressAnimation = () => {
    const scale = useRef(new Animated.Value(1)).current;
    const animatePress = () => {
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    };
    return { scale, animatePress };
  };

  const createTypingAnimation = () => {
    const dot1Opacity = useRef(new Animated.Value(0.3)).current;
    const dot2Opacity = useRef(new Animated.Value(0.3)).current;
    const dot3Opacity = useRef(new Animated.Value(0.3)).current;

    const dot1Y = useRef(new Animated.Value(0)).current;
    const dot2Y = useRef(new Animated.Value(0)).current;
    const dot3Y = useRef(new Animated.Value(0)).current;

    const animateTyping = () => {
      const createDotAnimation = (opacityValue, yValue, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(opacityValue, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(yValue, {
                toValue: -4,
                duration: 400,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(opacityValue, {
                toValue: 0.3,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(yValue, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
      };

      Animated.parallel([
        createDotAnimation(dot1Opacity, dot1Y, 0),
        createDotAnimation(dot2Opacity, dot2Y, 150),
        createDotAnimation(dot3Opacity, dot3Y, 300),
      ]).start();
    };

    return {
      dot1: { opacity: dot1Opacity, translateY: dot1Y },
      dot2: { opacity: dot2Opacity, translateY: dot2Y },
      dot3: { opacity: dot3Opacity, translateY: dot3Y },
      animateTyping,
    };
  };

  return { createMessageAnimation, createButtonPressAnimation, createTypingAnimation };
}
