import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
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
	/**
	 * Whether this message should animate (only for new messages)
	 */
	shouldAnimate?: boolean
	/**
	 * Unique identifier for this message to prevent re-animation
	 */
	messageId?: string
}

/**
 * Parses text for basic markdown-style formatting
 * @param text The input text to parse
 * @returns Array of formatted text segments with type and content
 */
const parseFormattedText = (text: string) => {
	// Regex to match markdown-style bold text (**bold**)
	const boldRegex = /\*\*(.*?)\*\*/g

	let lastIndex = 0
	const segments = []
	let match

	// Find all bold segments
	while ((match = boldRegex.exec(text)) !== null) {
		// Add any regular text before this match
		if (match.index > lastIndex) {
			segments.push({
				type: 'regular',
				content: text.substring(lastIndex, match.index),
			})
		}

		// Add the bold text without the ** markers
		segments.push({
			type: 'bold',
			content: match[1],
		})

		// Update lastIndex to continue after this match
		lastIndex = match.index + match[0].length
	}

	// Add any remaining text after the last match
	if (lastIndex < text.length) {
		segments.push({
			type: 'regular',
			content: text.substring(lastIndex),
		})
	}

	return segments
}

/**
 * A tech-inspired transparent bubble that displays AI response with word-by-word streaming animation
 */
const RAGResponseBubble: React.FC<RAGResponseBubbleProps> = React.memo(({
	text,
	isLoading = false,
	shouldAnimate = true,
	messageId,
}) => {
	const [displayedText, setDisplayedText] = useState('')
	const [wordIndex, setWordIndex] = useState(0)
	const [formattedSegments, setFormattedSegments] = useState<
		Array<{ type: string; content: string }>
	>([])
	const [hasAnimated, setHasAnimated] = useState(false)
	const [isAnimationComplete, setIsAnimationComplete] = useState(false)

	// Animation refs
	const fadeAnim = useRef(new Animated.Value(0)).current
	const borderAnim = useRef(new Animated.Value(0)).current
	const cursorOpacity = useRef(new Animated.Value(1)).current
	const scaleAnim = useRef(new Animated.Value(0.95)).current
	
	// Memoize words to prevent recalculation
	const words = useMemo(() => text.split(' '), [text])

	// Entrance animation - only run once
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
	}, []) // Empty dependency array - only run once

	// Optimize word-by-word animation with better control
	useEffect(() => {
		if (words.length === 0 || isAnimationComplete) return

		// If this message shouldn't animate or has already animated, show all text immediately
		if (!shouldAnimate || hasAnimated) {
			setDisplayedText(text)
			setFormattedSegments(parseFormattedText(text))
			setWordIndex(words.length)
			setIsAnimationComplete(true)
			return
		}

		// Only animate if we haven't reached the end
		if (wordIndex < words.length) {
			const timer = setTimeout(() => {
				setDisplayedText((prev) => {
					const newText = prev + (prev ? ' ' : '') + words[wordIndex]
					setFormattedSegments(parseFormattedText(newText))
					return newText
				})
				setWordIndex((prev) => {
					const newIndex = prev + 1
					if (newIndex >= words.length) {
						setHasAnimated(true)
						setIsAnimationComplete(true)
					}
					return newIndex
				})
			}, 50 + Math.random() * 30)

			return () => clearTimeout(timer)
		}
	}, [wordIndex, words.length, shouldAnimate, hasAnimated, isAnimationComplete])

	// Reset animation when messageId changes (new message)
	useEffect(() => {
		if (shouldAnimate && !isAnimationComplete) {
			setDisplayedText('')
			setWordIndex(0)
			setFormattedSegments([])
			setHasAnimated(false)
			setIsAnimationComplete(false)
		} else if (!shouldAnimate) {
			// Show immediately if not animating
			setDisplayedText(text)
			setFormattedSegments(parseFormattedText(text))
			setWordIndex(words.length)
			setIsAnimationComplete(true)
		}
	}, [messageId]) // Only depend on messageId

	// Optimize cursor animation
	useEffect(() => {
		if ((isLoading || (wordIndex < words.length && shouldAnimate && !isAnimationComplete))) {
			const animation = Animated.loop(
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
			)
			animation.start()
			
			return () => animation.stop()
		} else {
			// Hide cursor when done
			Animated.timing(cursorOpacity, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}).start()
		}
	}, [isLoading, wordIndex, words.length, shouldAnimate, isAnimationComplete])

	// Memoize animated values to prevent recalculation
	const borderColor = useMemo(() => borderAnim.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: ['#00D4FF', '#7C3AED', '#00D4FF'],
	}), [borderAnim])

	const shadowColor = useMemo(() => borderAnim.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: [
			'rgba(0, 212, 255, 0.3)',
			'rgba(124, 58, 237, 0.3)',
			'rgba(0, 212, 255, 0.3)',
		],
	}), [borderAnim])

	// Memoize text rendering
	const renderFormattedText = useCallback(() => {
		return (
			<Text style={styles.streamingText}>
				{formattedSegments.map((segment, index) => (
					<Text
						key={index}
						style={segment.type === 'bold' ? styles.boldText : undefined}
					>
						{segment.content}
					</Text>
				))}

				{(isLoading || (wordIndex < words.length && shouldAnimate && !isAnimationComplete)) && (
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
		)
	}, [formattedSegments, isLoading, wordIndex, words.length, shouldAnimate, isAnimationComplete, cursorOpacity])

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

					{/* Streaming text with formatting */}
					<View style={styles.textContainer}>{renderFormattedText()}</View>
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
})

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
	boldText: {
		fontFamily: 'Inter-SemiBold',
		fontWeight: '600',
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
