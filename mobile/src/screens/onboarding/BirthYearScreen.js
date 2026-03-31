import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import NextButton from '../../components/onboarding/NextButton';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../theme';

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const MIN_YEAR = 1940;
const MAX_YEAR = 2012;
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

export default function BirthYearScreen({ navigation }) {
  const { isDark } = useTheme();
  const { data, updateData } = useOnboarding();
  const scrollRef = useRef(null);

  const selectedYear = data.birthYear || 1999;

  useEffect(() => {
    const index = selectedYear - MIN_YEAR;
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: false,
      });
    }, 100);
  }, []);

  const handleScroll = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const year = Math.max(MIN_YEAR, Math.min(MAX_YEAR, MIN_YEAR + index));
    if (year !== data.birthYear) {
      updateData({ birthYear: year });
    }
  }, [data.birthYear, updateData]);

  const handleMomentumEnd = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const snapped = Math.round(offsetY / ITEM_HEIGHT) * ITEM_HEIGHT;
    scrollRef.current?.scrollTo({ y: snapped, animated: true });
  }, []);

  return (
    <OnboardingLayout
      currentStep={2}
      onBack={() => navigation.goBack()}
      scrollable={false}
    >
      <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
        Votre année de{'\n'}naissance ?
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
        Cela aide à personnaliser votre plan nutritionnel.
      </Text>

      <View style={styles.pickerWrapper}>
        {/* Selected highlight */}
        <View
          style={[
            styles.selectedHighlight,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              top: (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2,
            },
          ]}
        />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumEnd}
          scrollEventThrottle={16}
          style={{ height: CONTAINER_HEIGHT }}
          contentContainerStyle={{
            paddingVertical: (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2,
          }}
        >
          {YEARS.map((year) => {
            const isSelected = year === selectedYear;
            return (
              <View key={year} style={styles.yearItem}>
                <Text
                  style={[
                    styles.yearText,
                    {
                      color: isSelected
                        ? (isDark ? '#f3f3f6' : '#1c1917')
                        : (isDark ? '#44444f' : '#d6d3d1'),
                      fontSize: isSelected ? 36 : 22,
                      fontWeight: isSelected ? '800' : '400',
                    },
                  ]}
                >
                  {year}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <NextButton
        onPress={() => navigation.navigate('Height')}
        disabled={!data.birthYear}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 8,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  pickerWrapper: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 16,
    zIndex: 0,
  },
  yearItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearText: {
    letterSpacing: 1,
  },
});
