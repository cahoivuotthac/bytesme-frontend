import React, { useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Dimensions,
	Platform,
	ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import DishDecoration from '@/components/shared/DishDecoration'
import { addToWishlist, removeFromWishlist } from '@/utils/api'

// Get screen dimensions for responsive sizing
const { width } = Dimensions.get('window')
const CARD_WIDTH = width * 0.45 // Card takes up ~45% of screen width

interface GradientProductCardProps {
	/**
	 * Product data object
	 */
	product: {
		productId: number
		name: string
		price: number
		imageUrl: string
		isFavorite?: boolean
		gradientColors?: string[]
	}
	/**
	 * Optional style overrides
	 */
	style?: object
	/**
	 * Handler for favorite button press
	 */
	onToggleFavorite?: (productId: number) => void
}

/**
 * Gradient product card component for premium/special products
 */
const GradientProductCard: React.FC<GradientProductCardProps> = ({
	product,
	style,
	onToggleFavorite,
}) => {
	const [isFavorite, setIsFavorite] = useState(product.isFavorite || false)
	const [isLoading, setIsLoading] = useState(false)

	// Format price with Vietnamese dong symbol
	const formatPrice = (price: number) => {
		return `${price.toLocaleString('vi-VN')} đ`
	}

	// Default gradient colors if not provided
	const gradientColors = product.gradientColors || ['#C67C4E', '#986644']

	// Navigate to product details page
	const handlePress = () => {
		router.push({
			pathname: '/(home)/product/[id]',
			params: { id: product.productId },
		})
	}

	// Toggle favorite status with API call
	const handleFavoritePress = async (e: any) => {
		e.stopPropagation()

		try {
			setIsLoading(true)

			if (isFavorite) {
				// Remove from wishlist
				await removeFromWishlist(product.productId)
			} else {
				// Add to wishlist
				await addToWishlist(product.productId)
			}

			// Update local state
			setIsFavorite(!isFavorite)

			// Call the parent handler if provided
			if (onToggleFavorite) {
				onToggleFavorite(product.productId)
			}
		} catch (error) {
			console.error('Wishlist operation failed:', error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<TouchableOpacity
			style={[styles.container, style]}
			activeOpacity={0.8}
			onPress={handlePress}
		>
			{/* Dish decoration positioned to float above card */}
			<View style={styles.dishWrapper}>
				<DishDecoration
					imageSource={{ uri: product.imageUrl }}
					size={CARD_WIDTH * 0.7}
					containerStyle={styles.dishContainer}
					imageStyle={styles.dishImage}
				/>
			</View>

			{/* Card container with gradient background */}
			<LinearGradient
				colors={gradientColors}
				style={styles.card}
				start={{ x: 0.5, y: 0 }}
				end={{ x: 0.5, y: 1 }}
			>
				{/* Empty space for the dish that floats above */}
				<View style={styles.imageContainer} />

				{/* Product info */}
				<View style={styles.infoContainer}>
					<Text style={styles.name} numberOfLines={1}>
						{product.name}
					</Text>

					<Text style={styles.price}>{formatPrice(product.price)}</Text>
				</View>

				{/* Favorite button */}
				<TouchableOpacity
					style={styles.favoriteButton}
					onPress={handleFavoritePress}
					hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
				>
					{isLoading ? (
						<ActivityIndicator size="small" color="#FFFFFF" />
					) : (
						<Ionicons
							name={isFavorite ? 'heart' : 'heart-outline'}
							size={18}
							color={isFavorite ? '#DF7A82' : '#FFFFFF'}
						/>
					)}
				</TouchableOpacity>
			</LinearGradient>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		width: CARD_WIDTH,
		height: CARD_WIDTH * 1.3, // Taller aspect ratio for the gradient card
		marginHorizontal: 8,
		marginVertical: 10,
		position: 'relative',
		paddingTop: CARD_WIDTH * 0.35, // Make space for the floating dish
	},
	dishWrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		zIndex: 10,
		alignItems: 'center',
	},
	card: {
		flex: 1,
		borderRadius: 27,
		padding: 10,
		overflow: 'hidden',
		borderWidth: 0,
		paddingTop: CARD_WIDTH * 0.35, // Space for the dish that overlaps
		shadowColor: '#8A5A44',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 10,
		elevation: 7,
	},
	imageContainer: {
		width: '100%',
		height: CARD_WIDTH * 0.1, // Reduced height since dish is now above
	},
	dishContainer: {
		backgroundColor: '#FFF8EF', // Updated to match our warm palette
		shadowColor: '#8A5A44',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.4,
		shadowRadius: 12,
		elevation: 10,
	},
	dishImage: {
		width: '85%',
		height: '85%',
	},
	infoContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 8,
	},
	name: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 13,
		color: '#FFFFFF',
		marginBottom: 6,
		textAlign: 'center',
		textShadowColor: 'rgba(0, 0, 0, 0.2)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	price: {
		fontFamily: 'Inter-Bold',
		fontSize: 12,
		color: '#FFF8EF',
		textAlign: 'center',
		textShadowColor: 'rgba(0, 0, 0, 0.2)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	favoriteButton: {
		position: 'absolute',
		top: CARD_WIDTH * 0.35 + 6, // Adjusted to account for dish overlap
		right: 12,
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'rgba(255,255,255,0.25)',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
})

export default GradientProductCard
