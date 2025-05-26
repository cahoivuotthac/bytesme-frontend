import React, { useRef, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface RAGResponseBubbleProps {
	/**
	 * Text content to display in the bubble
	 */
	text: string
	/**
	 * Whether the response is still being generated/streamed
	 */
	isLoading?: boolean
}

/**
 * A tech-inspired transparent bubble that displays AI response with word-by-word streaming animation
 */
const RAGResponseBubble: React.FC<RAGResponseBubbleProps> = ({
	text,
	isLoading = false,
}) => {
	const [displayedText, setDisplayedText] = useState('')
	const [wordIndex, setWordIndex] = useState(0)
	
	// Animation refs
	const fadeAnim = useRef(new Animated.Value(0)).current
	const borderAnim = useRef(new Animated.Value(0)).current
	const cursorOpacity = useRef(new Animated.Value(1)).current
	const scaleAnim = useRef(new Animated.Value(0.95)).current

	// Split text into words for streaming animation
	const words = text.split(' ')

	// Entrance animation
	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				tension: 100,
				friction: 8,
				useNativeDriver: true,
			}),
		]).start()

		// Start border animation
		Animated.loop(
			Animated.timing(borderAnim, {
				toValue: 1,
				duration: 2000,
				useNativeDriver: false,
			})
		).start()
	}, [])

	// Word-by-word streaming animation
	useEffect(() => {
		if (words.length === 0) return

		const streamWords = () => {
			if (wordIndex < words.length) {
				const timer = setTimeout(() => {
					setDisplayedText(prev => {
						const newText = prev + (prev ? ' ' : '') + words[wordIndex]
						return newText
					})
					setWordIndex(prev => prev + 1)
				}, 50 + Math.random() * 100) // Variable delay for natural feel

				return () => clearTimeout(timer)
			}
		}

		return streamWords()
	}, [wordIndex, words])

	// Reset animation when text changes
	useEffect(() => {
		setDisplayedText('')
		setWordIndex(0)
	}, [text])

	// Cursor blinking animation
	useEffect(() => {
		if (isLoading || wordIndex < words.length) {
			Animated.loop(
				Animated.sequence([
					Animated.timing(cursorOpacity, {
						toValue: 0,
						duration: 500,
						useNativeDriver: true,
					}),
					Animated.timing(cursorOpacity, {
						toValue: 1,
						duration: 500,
						useNativeDriver: true,
					}),
				])
			).start()
		} else {
			// Hide cursor when done
			Animated.timing(cursorOpacity, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}).start()
		}
	}, [isLoading, wordIndex, words.length])

	// Animated border color interpolation
	const borderColor = borderAnim.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: ['#00D4FF', '#7C3AED', '#00D4FF'],
	})

	const shadowColor = borderAnim.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: ['rgba(0, 212, 255, 0.3)', 'rgba(124, 58, 237, 0.3)', 'rgba(0, 212, 255, 0.3)'],
	})

	return (
		<Animated.View
			style={[
				styles.container,
				{
					opacity: fadeAnim,
					transform: [{ scale: scaleAnim }],
				},
			]}
		>
			{/* Animated border gradient */}
			<Animated.View
				style={[
					styles.borderContainer,
					{
						shadowColor: shadowColor,
					},
				]}
			>
				<LinearGradient
					colors={['transparent', 'rgba(0, 212, 255, 0.1)', 'transparent']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.gradientBorder}
				/>
				
				{/* Tech corner indicators */}
				<View style={styles.cornerIndicators}>
					<View style={[styles.corner, styles.topLeft]} />
					<View style={[styles.corner, styles.topRight]} />
					<View style={[styles.corner, styles.bottomLeft]} />
					<View style={[styles.corner, styles.bottomRight]} />
				</View>

				{/* Content area */}
				<View style={styles.contentContainer}>
					{/* AI indicator dot */}
					<View style={styles.aiIndicator}>
						<Animated.View
							style={[
								styles.aiDot,
								{
									backgroundColor: borderColor,
								},
							]}
						/>
						<Text style={styles.aiLabel}>AI</Text>
					</View>

					{/* Streaming text */}
					<View style={styles.textContainer}>
						<Text style={styles.streamingText}>
							{displayedText}
							{(isLoading || wordIndex < words.length) && (
								<Animated.Text
									style={[
										styles.cursor,
										{
											opacity: cursorOpacity,
										},
									]}
								>
									▊
								</Animated.Text>
							)}
						</Text>
					</View>
				</View>

				{/* Animated tech lines */}
				<Animated.View
					style={[
						styles.techLine,
						styles.topLine,
						{
							backgroundColor: borderColor,
						},
					]}
				/>
				<Animated.View
					style={[
						styles.techLine,
						styles.bottomLine,
						{
							backgroundColor: borderColor,
						},
					]}
				/>
			</Animated.View>
		</Animated.View>
	)
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
	container: {
		marginVertical: 8,
		marginHorizontal: 16,
		width: width - 64,
		alignSelf: 'flex-start',
	},
	borderContainer: {
		position: 'relative',
		borderRadius: 12,
		padding: 1,
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 1,
		shadowRadius: 8,
		elevation: 8,
	},
	gradientBorder: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: 12,
	},
	cornerIndicators: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: 12,
	},
	corner: {
		position: 'absolute',
		width: 8,
		height: 8,
		borderColor: '#00D4FF',
	},
	topLeft: {
		top: -1,
		left: -1,
		borderTopWidth: 2,
		borderLeftWidth: 2,
		borderTopLeftRadius: 12,
	},
	topRight: {
		top: -1,
		right: -1,
		borderTopWidth: 2,
		borderRightWidth: 2,
		borderTopRightRadius: 12,
	},
	bottomLeft: {
		bottom: -1,
		left: -1,
		borderBottomWidth: 2,
		borderLeftWidth: 2,
		borderBottomLeftRadius: 12,
	},
	bottomRight: {
		bottom: -1,
		right: -1,
		borderBottomWidth: 2,
		borderRightWidth: 2,
		borderBottomRightRadius: 12,
	},
	contentContainer: {
		backgroundColor: 'rgba(15, 23, 42, 0.05)',
		borderRadius: 11,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: 'rgba(0, 212, 255, 0.2)',
		backdropFilter: 'blur(10px)',
	},
	aiIndicator: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	aiDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		marginRight: 6,
	},
	aiLabel: {
		fontFamily: 'Inter-Medium',
		fontSize: 10,
		color: '#64748B',
		letterSpacing: 1,
		textTransform: 'uppercase',
	},
	textContainer: {
		minHeight: 20,
	},
	streamingText: {
		fontFamily: 'Inter-Regular',
		fontSize: 14,
		color: '#1E293B',
		lineHeight: 22,
		letterSpacing: 0.3,
	},
	cursor: {
		color: '#00D4FF',
		fontSize: 14,
		fontWeight: '600',
	},
	techLine: {
		position: 'absolute',
		height: 1,
		width: 40,
		opacity: 0.6,
	},
	topLine: {
		top: 0,
		left: 20,
	},
	bottomLine: {
		bottom: 0,
		right: 20,
	},
})

export default RAGResponseBubble
