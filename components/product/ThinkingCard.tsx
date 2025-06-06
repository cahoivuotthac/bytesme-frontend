import React, { useRef, useEffect, useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	Animated,
	Easing,
	Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from '@/providers/locale'

interface ThinkingCardProps {
	/**
	 * Stream of background thinking text coming from SSE
	 */
	streamingText: string
	/**
	 * Title to display at the top of the card
	 */
	title?: string
	/**
	 * Whether the card is in loading state
	 */
	isLoading: boolean
}

/**
 * A tech-inspired glass-like thinking card that displays a loading animation and streaming background text
 */
const ThinkingCard: React.FC<ThinkingCardProps> = ({
	streamingText,
	title = 'Bytesme đang phân tích',
	isLoading,
}) => {
	// Track the actual text content to display
	const [displayText, setDisplayText] = useState('')
	const { t } = useTranslation()

	// Text scroll animation
	const scrollAnim = useRef(new Animated.Value(0)).current

	// Other animation refs
	const fadeAnim = useRef(new Animated.Value(0)).current
	const slideAnim = useRef(new Animated.Value(20)).current
	const loadingSpinnerAnim = useRef(new Animated.Value(0)).current
	const borderAnim = useRef(new Animated.Value(0)).current
	const pulseAnim = useRef(new Animated.Value(1)).current

	// Keep track of running animations for cleanup
	const animationsRef = useRef<Animated.CompositeAnimation[]>([])

	// Text processing
	useEffect(() => {
		if (streamingText && isLoading) {
			// Update the displayed text
			setDisplayText(streamingText)

			// Create a subtle pulse effect every time new text arrives
			const pulseAnimation = Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.02,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true,
				}),
			])
			pulseAnimation.start()
		}
	}, [streamingText, isLoading, pulseAnim])

	// Control display of the card and animations
	useEffect(() => {
		// Clear previous animations
		animationsRef.current.forEach(animation => animation.stop())
		animationsRef.current = []

		if (isLoading) {
			// Fade in and slide up when shown
			const fadeInAnimation = Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 500,
					useNativeDriver: true,
				}),
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 500,
					useNativeDriver: true,
				}),
			])

			// Start spinner rotation animation
			const spinnerAnimation = Animated.loop(
				Animated.timing(loadingSpinnerAnim, {
					toValue: 1,
					duration: 1500,
					easing: Easing.linear,
					useNativeDriver: true,
				})
			)

			// Animate glowing border
			const borderAnimation = Animated.loop(
				Animated.timing(borderAnim, {
					toValue: 1,
					duration: 2000,
					easing: Easing.linear,
					useNativeDriver: false,
				})
			)

			// Start continuous text sliding animation
			const scrollAnimation = Animated.loop(
				Animated.timing(scrollAnim, {
					toValue: 1,
					duration: 15000, // 15 seconds for one complete scroll
					easing: Easing.linear,
					useNativeDriver: true,
				})
			)

			// Store animations for cleanup
			animationsRef.current = [fadeInAnimation, spinnerAnimation, borderAnimation, scrollAnimation]

			// Start all animations
			fadeInAnimation.start()
			spinnerAnimation.start()
			borderAnimation.start()
			scrollAnimation.start()
		} else {
			// Fade out when hidden
			const fadeOutAnimation = Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			})
			fadeOutAnimation.start()
		}

		return () => {
			// Cleanup animations on effect cleanup
			animationsRef.current.forEach(animation => animation.stop())
		}
	}, [isLoading, fadeAnim, slideAnim, loadingSpinnerAnim, borderAnim, scrollAnim])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			// Stop all animations and reset values when component unmounts
			animationsRef.current.forEach(animation => animation.stop())
			scrollAnim.setValue(0)
			loadingSpinnerAnim.setValue(0)
			borderAnim.setValue(0)
			fadeAnim.setValue(0)
			slideAnim.setValue(20)
			pulseAnim.setValue(1)
		}
	}, [])

	// Calculate scroll position based on text length
	const getScrollTransform = () => {
		if (!displayText) return { transform: [{ translateY: 0 }] }

		// Adjust the multiplier based on text length to ensure sufficient scrolling
		const contentLength = Math.max(300, displayText.length * 0.8)

		return {
			transform: [
				{
					translateY: scrollAnim.interpolate({
						inputRange: [0, 1],
						outputRange: [0, -contentLength],
					}),
				},
			],
		}
	}

	// Spinner rotation interpolation
	const spinnerRotation = loadingSpinnerAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '360deg'],
	})

	// Border animation
	const borderColor = borderAnim.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: [
			'rgba(74, 144, 226, 0.7)',
			'rgba(0, 212, 255, 0.9)',
			'rgba(74, 144, 226, 0.7)',
		],
	})

	const glowColor = borderAnim.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: [
			'rgba(74, 144, 226, 0.2)',
			'rgba(0, 212, 255, 0.3)',
			'rgba(74, 144, 226, 0.2)',
		],
	})

	// If not loading, don't render
	if (!isLoading) return null

	return (
		<Animated.View
			style={[
				styles.container,
				{
					opacity: fadeAnim,
					transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
				},
			]}
		>
			{/* Dots at the top - staggered sizes for more tech look */}
			<View style={styles.dotsContainer}>
				<View style={[styles.dot, styles.dotSmall]} />
				<View style={[styles.dot, styles.dotMedium]} />
				<View style={[styles.dot, styles.dotLarge]} />
			</View>

			{/* Animated border container */}
			<Animated.View
				style={[
					styles.borderContainer,
					{
						borderColor: borderColor,
						shadowColor: glowColor,
					},
				]}
			>
				{/* Glass card with blur effect */}
				<LinearGradient
					colors={['rgba(220, 240, 255, 0.95)', 'rgba(180, 225, 255, 0.90)']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.glassCard}
				>
					{/* Tech corner indicators */}
					<View style={styles.cornerIndicators}>
						<View style={[styles.corner, styles.topLeft]} />
						<View style={[styles.corner, styles.topRight]} />
						<View style={[styles.corner, styles.bottomLeft]} />
						<View style={[styles.corner, styles.bottomRight]} />
					</View>

					{/* Title and loading spinner */}
					<View style={styles.headerContainer}>
						<Text style={styles.title}>{title}</Text>
						<View style={styles.spinnerContainer}>
							<Text style={styles.thinkingText}>{t('isThinking')}</Text>
						</View>
					</View>

					{/* Absolutely positioned loading spinner (at the middle of card) */}
					<Animated.View
						style={[
							styles.spinner,
							{
								transform: [{ rotate: spinnerRotation }],
							},
						]}
					>
						<LinearGradient
							colors={['#4A90E2', '#00D4FF']}
							style={styles.spinnerGradient}
						>
							<View style={styles.spinnerInner} />
						</LinearGradient>
					</Animated.View>

					{/* Streaming background text with continuous sliding animation */}
					<View style={styles.streamTextContainer}>
						{/* This duplicates the text to create a seamless looping effect */}
						<Animated.View style={getScrollTransform()}>
							{/* First instance of text */}
							<Text style={styles.streamText}>{displayText}</Text>

							{/* Duplicated text to create seamless scrolling */}
							<Text style={styles.streamText}>{displayText}</Text>
						</Animated.View>
					</View>

					{/* Tech decorations */}
					<View style={styles.techDecoration}>
						<Animated.View
							style={[styles.techLine, { backgroundColor: borderColor }]}
						/>
						<View style={styles.techDot} />
					</View>

					{/* Gradient overlays for text fading effect */}
					<LinearGradient
						colors={[
							'rgba(220, 240, 255, 0.95)',
							'rgba(220, 240, 255, 0.3)',
							'transparent',
						]}
						style={styles.topGradient}
						pointerEvents="none"
					/>
					<LinearGradient
						colors={[
							'transparent',
							'rgba(180, 225, 255, 0.3)',
							'rgba(180, 225, 255, 0.95)',
						]}
						style={styles.bottomGradient}
						pointerEvents="none"
					/>
				</LinearGradient>
			</Animated.View>
		</Animated.View>
	)
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
	container: {
		width: width - 32,
		marginHorizontal: 16,
		marginBottom: 16,
	},
	dotsContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginBottom: 10,
	},
	dot: {
		borderRadius: 50,
		backgroundColor: '#4A90E2',
		marginHorizontal: 2,
	},
	dotSmall: {
		width: 4,
		height: 4,
		opacity: 0.5,
	},
	dotMedium: {
		width: 6,
		height: 6,
		opacity: 0.7,
	},
	dotLarge: {
		width: 8,
		height: 8,
		opacity: 0.9,
	},
	borderContainer: {
		borderRadius: 20,
		borderWidth: 1.5,
		overflow: 'hidden',
		shadowOffset: {
			width: 0,
			height: 0,
		},
		shadowOpacity: 1,
		shadowRadius: 10,
		elevation: 10,
	},
	glassCard: {
		position: 'relative',
		padding: 20,
		borderRadius: 18,
		overflow: 'hidden',
		// Removed unsupported backdropFilter for React Native
		// Instead using higher opacity gradients for better glass effect
	},
	cornerIndicators: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		pointerEvents: 'none',
	},
	corner: {
		position: 'absolute',
		width: 12,
		height: 12,
		borderColor: 'rgba(74, 144, 226, 0.8)',
	},
	topLeft: {
		top: 8,
		left: 8,
		borderTopWidth: 2,
		borderLeftWidth: 2,
	},
	topRight: {
		top: 8,
		right: 8,
		borderTopWidth: 2,
		borderRightWidth: 2,
	},
	bottomLeft: {
		bottom: 8,
		left: 8,
		borderBottomWidth: 2,
		borderLeftWidth: 2,
	},
	bottomRight: {
		bottom: 8,
		right: 8,
		borderBottomWidth: 2,
		borderRightWidth: 2,
	},
	headerContainer: {
		marginBottom: 15,
		zIndex: 5,
	},
	title: {
		fontSize: 22,
		fontFamily: 'Inter-Bold',
		color: '#1E293B',
		marginBottom: 8,
	},
	spinnerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	thinkingText: {
		fontSize: 16,
		fontFamily: 'Inter-Medium',
		color: '#3B5D87',
		marginRight: 10,
	},
	spinner: {
		width: 22,
		height: 22,
		position: 'absolute',
		top: '60%',
		left: '53%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	spinnerGradient: {
		width: 22,
		height: 22,
		borderRadius: 11,
		justifyContent: 'center',
		alignItems: 'center',
	},
	spinnerInner: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: 'white',
	},
	streamTextContainer: {
		height: 80,
		marginBottom: 10,
		overflow: 'hidden',
		position: 'relative',
		zIndex: 2,
	},
	scrollView: {
		maxHeight: 80,
	},
	scrollViewContent: {
		paddingBottom: 20,
	},
	streamText: {
		fontFamily: 'Inter-Regular',
		fontSize: 14,
		color: '#1E293B',
		lineHeight: 22,
		letterSpacing: 0.2,
		marginBottom: 20, // Add space between the repeated text blocks
	},
	techDecoration: {
		position: 'absolute',
		bottom: 12,
		left: 20,
		flexDirection: 'row',
		alignItems: 'center',
	},
	techLine: {
		height: 2,
		width: 30,
	},
	techDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: '#4A90E2',
		marginLeft: 5,
	},
	topGradient: {
		position: 'absolute',
		top: 70,
		left: 0,
		right: 0,
		height: 20,
		zIndex: 3,
	},
	bottomGradient: {
		position: 'absolute',
		bottom: 10,
		left: 0,
		right: 0,
		height: 30,
		zIndex: 3,
	},
})

export default ThinkingCard
