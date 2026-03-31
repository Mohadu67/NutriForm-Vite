import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useTheme } from '../../theme';

const ITEM_WIDTH = 12;
const ITEM_SPACING = 4;
const STEP_WIDTH = ITEM_WIDTH + ITEM_SPACING;

export default function HorizontalRuler({
  min = 40,
  max = 200,
  value = 70,
  step = 1,
  unit = 'kg',
  onValueChange,
  accentColor = '#22c55e',
}) {
  const { isDark } = useTheme();
  const scrollRef = useRef(null);
  const totalSteps = Math.floor((max - min) / step);
  const [containerWidth, setContainerWidth] = useState(0);

  const halfContainer = containerWidth / 2;

  useEffect(() => {
    if (!containerWidth) return;
    const offset = ((value - min) / step) * STEP_WIDTH;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: offset, animated: false });
    }, 50);
  }, [containerWidth]);

  const handleScroll = useCallback((event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newVal = Math.round(offsetX / STEP_WIDTH) * step + min;
    const clamped = Math.max(min, Math.min(max, newVal));
    if (clamped !== value) {
      onValueChange?.(clamped);
    }
  }, [min, max, step, value, onValueChange]);

  const handleMomentumEnd = useCallback((event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const snapped = Math.round(offsetX / STEP_WIDTH) * STEP_WIDTH;
    scrollRef.current?.scrollTo({ x: snapped, animated: true });
  }, []);

  const onLayout = useCallback((e) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  return (
    <View style={styles.container}>
      {/* Value display */}
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
          {value}
        </Text>
        <Text style={[styles.unit, { color: isDark ? '#7a7a88' : '#a8a29e' }]}>
          {unit}
        </Text>
      </View>

      {/* Ruler */}
      <View style={styles.rulerContainer} onLayout={onLayout}>
        {/* Center indicator - positioned relative to container, not screen */}
        {containerWidth > 0 && (
          <View style={[
            styles.centerLine,
            {
              backgroundColor: accentColor,
              left: halfContainer - 1,
            },
          ]} />
        )}

        {containerWidth > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={STEP_WIDTH}
            decelerationRate="fast"
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumEnd}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: halfContainer - STEP_WIDTH / 2,
            }}
          >
            {Array.from({ length: totalSteps + 1 }).map((_, i) => {
              const tickValue = min + i * step;
              const isMajor = tickValue % 10 === 0;
              const isMid = tickValue % 5 === 0;
              return (
                <View key={i} style={[styles.tickContainer, { width: STEP_WIDTH }]}>
                  <View
                    style={[
                      styles.tick,
                      {
                        height: isMajor ? 32 : isMid ? 20 : 12,
                        backgroundColor: isMajor
                          ? (isDark ? '#c1c1cb' : '#57534e')
                          : (isDark ? '#44444f' : '#d6d3d1'),
                        width: isMajor ? 2 : 1,
                      },
                    ]}
                  />
                  {isMajor && (
                    <Text style={[styles.tickLabel, { color: isDark ? '#7a7a88' : '#a8a29e' }]}>
                      {tickValue}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  value: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  unit: {
    fontSize: 20,
    fontWeight: '500',
    marginLeft: 8,
  },
  rulerContainer: {
    height: 80,
    width: '100%',
    position: 'relative',
  },
  centerLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 40,
    zIndex: 10,
    borderRadius: 1,
  },
  tickContainer: {
    alignItems: 'center',
  },
  tick: {
    borderRadius: 0.5,
  },
  tickLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
});
