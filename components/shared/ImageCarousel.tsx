import React, { useState, useRef, useEffect } from 'react'
import {
	View,
	Image,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	Animated,
	Text,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const { width: screenWidth } = Dimensions.get('window')

interface CarouselItem {
	id: string
	imageUrl: string
	title: string
	description?: string
	linkTo?: string
}

interface ImageCarouselProps {
	/**
	 * Array of items to display in the carousel
	 */
	items: CarouselItem[]

	/**
	 * Auto-play interval in milliseconds (0 to disable auto-play)
	 */
	autoPlayInterval?: number

	/**
	 * Height of the carousel
	 */
	height?: number

	/**
	 * Optional additional styling for the container
	 */
	style?: object

	/**
	 * Whether to show the text overlay with title and description
	 * @default true
	 */
	showTextOverlay?: boolean

	/**
	 * Whether to allow navigation to other screens on item press
	 * @default true
	 */
	enableNavigation?: boolean

	/**
	 * Custom border radius for the carousel items
	 * @default 20
	 */
	borderRadius?: number
}

/**
 * Image carousel component for displaying promotional banners and hot products
 */
const ImageCarousel: React.FC<ImageCarouselProps> = ({
	items,
	autoPlayInterval = 5000,
	height = 200,
	style,
	showTextOverlay = true,
	enableNavigation = true,
	borderRadius = 20,
}) => {
	const [activeIndex, setActiveIndex] = useState(0)
	const scrollX = useRef(new Animated.Value(0)).current
	const flatListRef = useRef<any>(null)
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	// Auto-play functionality
	useEffect(() => {
		if (autoPlayInterval > 0 && items.length > 1) {
			intervalRef.current = setInterval(() => {
				if (activeIndex < items.length - 1) {
					setActiveIndex(activeIndex + 1)
				} else {
					setActiveIndex(0)
				}
			}, autoPlayInterval)
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [activeIndex, autoPlayInterval, items.length])

	// Update scroll position when activeIndex changes
	useEffect(() => {
		if (flatListRef.current) {
			flatListRef.current.scrollTo({
				x: activeIndex * screenWidth,
				animated: true,
			})
		}
	}, [activeIndex])

	// Navigate to item details
	const handleItemPress = (item: CarouselItem) => {
		if (!enableNavigation) return

		if (item.linkTo) {
			router.push(item.linkTo)
		} else if (item.id) {
			router.push({
				pathname: '/(home)/product/[id]',
				params: { id: item.id },
			})
		}
	}

	// Go to previous item
	const goToPrevious = () => {
		if (activeIndex > 0) {
			setActiveIndex(activeIndex - 1)
		}
	}

	// Go to next item
	const goToNext = () => {
		if (activeIndex < items.length - 1) {
			setActiveIndex(activeIndex + 1)
		}
	}

	// Handle manual scroll
	const handleScroll = Animated.event(
		[{ nativeEvent: { contentOffset: { x: scrollX } } }],
		{ useNativeDriver: false }
	)

	// Handle end of scroll to update active index
	const handleScrollEnd = (e: any) => {
		const contentOffset = e.nativeEvent.contentOffset
		const viewSize = e.nativeEvent.layoutMeasurement
		const newIndex = Math.floor(contentOffset.x / viewSize.width)

		if (newIndex !== activeIndex) {
			setActiveIndex(newIndex)
		}
	}

	return (
		<View style={[styles.container, { height }, style]}>
			<Animated.ScrollView
				ref={flatListRef}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onScroll={handleScroll}
				onMomentumScrollEnd={handleScrollEnd}
				scrollEventThrottle={16}
				style={styles.scrollView}
			>
				{items.map((item, index) => (
					<TouchableOpacity
						key={`carousel-item-${index}`}
						activeOpacity={enableNavigation ? 0.9 : 1}
						onPress={() => handleItemPress(item)}
						style={[
							styles.itemContainer,
							{
								width: screenWidth,
								borderRadius: borderRadius,
							},
						]}
					>
						<View style={[styles.imageWrapper, { borderRadius: borderRadius }]}>
							<Image
								source={{ uri: item.imageUrl }}
								style={[styles.image, { borderRadius: borderRadius }]}
								resizeMode="cover"
							/>
						</View>

						{showTextOverlay && item.title && (
							<View style={[styles.overlay, { borderRadius: borderRadius }]}>
								<View style={styles.textContainer}>
									<Text style={styles.title} numberOfLines={1}>
										{item.title}
									</Text>
									{item.description && (
										<Text style={styles.description} numberOfLines={1}>
											{item.description}
										</Text>
									)}
								</View>
							</View>
						)}
					</TouchableOpacity>
				))}
			</Animated.ScrollView>

			{/* Navigation buttons */}
			{items.length > 1 && (
				<>
					<TouchableOpacity
						style={[styles.navButton, styles.prevButton]}
						onPress={goToPrevious}
						disabled={activeIndex === 0}
					>
						<Ionicons
							name="chevron-back"
							size={20}
							color="#FFFFFF"
							style={{ opacity: activeIndex === 0 ? 0.5 : 1 }}
						/>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.navButton, styles.nextButton]}
						onPress={goToNext}
						disabled={activeIndex === items.length - 1}
					>
						<Ionicons
							name="chevron-forward"
							size={20}
							color="#FFFFFF"
							style={{ opacity: activeIndex === items.length - 1 ? 0.5 : 1 }}
						/>
					</TouchableOpacity>
				</>
			)}

			{/* Pagination indicators */}
			{items.length > 1 && (
				<View style={styles.paginationContainer}>
					{items.map((_, index) => (
						<TouchableOpacity
							key={`dot-${index}`}
							style={[
								styles.paginationDot,
								index === activeIndex && styles.paginationDotActive,
							]}
							onPress={() => setActiveIndex(index)}
						/>
					))}
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		width: '100%',
		overflow: 'hidden',
	},
	scrollView: {
		width: '100%',
	},
	itemContainer: {
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
	imageWrapper: {
		width: '94%',
		height: '100%',
		overflow: 'hidden',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	overlay: {
		position: 'absolute',
		bottom: 0,
		left: '3%',
		right: '3%',
		backgroundColor: 'rgba(0, 0, 0, 0.25)',
		justifyContent: 'flex-end',
	},
	textContainer: {
		padding: 16,
		backgroundColor: 'rgba(0, 0, 0, 0.4)',
	},
	title: {
		color: '#FFFFFF',
		fontSize: 18,
		fontWeight: 'bold',
		fontFamily: 'Inter-Bold',
	},
	description: {
		color: '#FFFFFF',
		fontSize: 14,
		marginTop: 4,
		fontFamily: 'Inter-Regular',
	},
	navButton: {
		position: 'absolute',
		top: '50%',
		marginTop: -18,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	prevButton: {
		left: 12,
	},
	nextButton: {
		right: 12,
	},
	paginationContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		bottom: 10,
		width: '100%',
		zIndex: 10,
	},
	paginationDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginHorizontal: 4,
		backgroundColor: 'rgba(255, 255, 255, 0.5)',
	},
	paginationDotActive: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: '#FFFFFF',
	},
})

export default ImageCarousel
