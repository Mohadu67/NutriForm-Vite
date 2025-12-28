import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import useThemedStyles from '../../hooks/useThemedStyles';

const MessageInput = ({ onSend, onMediaPress, disabled = false, placeholder = 'Message...' }) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const themedStyles = useThemedStyles((isDark) => ({
    containerBg: isDark ? 'rgba(15, 15, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    inputBg: isDark ? 'rgba(45, 45, 60, 0.6)' : 'rgba(245, 245, 247, 0.9)',
    inputBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    inputBorderFocused: isDark ? 'rgba(247, 177, 134, 0.4)' : 'rgba(247, 177, 134, 0.5)',
    inputText: isDark ? '#FFFFFF' : '#1A1A1A',
    placeholder: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
  }));

  const handleSend = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || disabled || isSending) return;

    try {
      setIsSending(true);
      await onSend(trimmedText);
      setText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    handleSend();
  };

  const canSend = text.trim().length > 0 && !disabled && !isSending;

  return (
    <View style={[styles.container, { backgroundColor: themedStyles.containerBg }]}>
      <View style={styles.inputRow}>
        {/* Bouton media */}
        {onMediaPress && (
          <TouchableOpacity
            onPress={onMediaPress}
            style={styles.mediaButton}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <View style={styles.mediaButtonInner}>
              <Ionicons name="add" size={24} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Input */}
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: themedStyles.inputBg,
              borderColor: isFocused ? themedStyles.inputBorderFocused : themedStyles.inputBorder,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: themedStyles.inputText }]}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={themedStyles.placeholder}
            multiline
            maxLength={1000}
            editable={!disabled && !isSending}
            returnKeyType="default"
            blurOnSubmit={false}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>

        {/* Bouton envoyer */}
        <Animated.View style={[styles.sendButtonContainer, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            onPress={handleSendPress}
            disabled={!canSend}
            activeOpacity={0.8}
            style={styles.sendButtonTouchable}
          >
            {canSend ? (
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButton}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" style={styles.sendIcon} />
                )}
              </LinearGradient>
            ) : (
              <View style={styles.sendButtonDisabled}>
                <Ionicons name="send" size={18} color="rgba(128, 128, 128, 0.4)" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 6 : 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  mediaButton: {
    marginBottom: 2,
  },
  mediaButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(247, 177, 134, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  input: {
    minHeight: 42,
    maxHeight: 120,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 22,
  },
  sendButtonContainer: {
    marginBottom: 2,
  },
  sendButtonTouchable: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendButtonDisabled: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    marginLeft: 2,
  },
});

export default MessageInput;
