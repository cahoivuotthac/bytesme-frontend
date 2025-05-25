import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface LinearGradientButtonProps {
  text: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  gradientColors?: readonly [string, string, ...string[]]
  start?: { x: number; y: number }
  end?: { x: number; y: number }
}

export default function LinearGradientButton({
  text,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  gradientColors = ['#C67C4E', '#FFAC6B'],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
}: LinearGradientButtonProps) {
  return (
    <LinearGradient
      colors={gradientColors}
      start={start}
      end={end}
      style={[styles.gradient, style]}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        disabled={loading || disabled}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={[styles.text, textStyle]}>{text}</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 120,
  },
  text: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
})
