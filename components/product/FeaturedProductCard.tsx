import React from 'react'
import {
	View,
	Text,
	Image,
	StyleSheet,
	TouchableOpacity,
	Dimensions,
	Platform,
} from 'react-native'
import { addToWishlist, removeFromWishlist } from '@/utils/api'
import { router } from 'expo-router'

// Get screen dimensions for responsive sizing
const { width } = Dimensions.get('window')
const CARD_WIDTH = width * 0.45 // Card takes up ~42% of screen width

interface FeaturedProductCardProps {
	/**
	 * Product data object
	 */
	product: {
		id: string
		name: string
		price: number
		imageUrl: string
		isFavorite?: boolean
	}
	/**
	 * Optional style overrides
	 */
	style?: object
	/**
	 * Handler for favorite button press
	 */
	onToggleFavorite?: (id: string) => void
}

/**
 * Featured product card component displays a product with image, name and price
 */
const FeaturedProductCard: React.FC<FeaturedProductCardProps> = ({
	product,
	style,
	onToggleFavorite,
}) => {
	const [isFavorite, setIsFavorite] = React.useState(
		product.isFavorite || false
	)

	// Format price with Vietnamese dong symbol
	const formatPrice = (price: number) => {
		return `${price.toLocaleString('vi-VN')} đ`
	}

	// Navigate to product details page
	const handlePress = () => {
		router.push({
			pathname: '/(home)/product/[id]',
			params: { id: product.id },
		})
	}

	// Toggle favorite status
	const handleFavoritePress = async (e: any) => {
		e.stopPropagation()

		try {
			// setIsLoading(true)

			if (isFavorite) {
				// Remove from wishlist
				await removeFromWishlist(product.id)
			} else {
				// Add to wishlist
				await addToWishlist(product.id)
			}

			// Update local state
			setIsFavorite(!isFavorite)

			// Call the parent handler if provided
			if (onToggleFavorite) {
				onToggleFavorite(product.id)
			}
		} catch (error) {
			console.error('Wishlist operation failed:', error)
		} finally {
			// setIsLoading(false)
		}
	}

	return (
		<TouchableOpacity
			style={[styles.container, style]}
			activeOpacity={0.9}
			onPress={handlePress}
		>
			{/* Background color */}
			<View style={styles.backgroundCard} />

			{/* Product image */}
			<View style={styles.imageContainer}>
				<Image
					source={{ uri: product.imageUrl }}
					style={styles.image}
					resizeMode="contain"
				/>
			</View>

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
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
				>
					<g id="love_fill" fill="none">
						<path d="M24 0v24H0V0zM12.594 23.258l-.012.002-.071.035-.02.004-.014-.004-.071-.036c-.01-.003-.019 0-.024.006l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.016-.018m.264-.113-.014.002-.184.093-.01.01-.003.011.018.43.005.012.008.008.201.092c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.003-.011.018-.43-.003-.012-.01-.01z" />
						<path
							fill={isFavorite ? '#FF6B6B' : '#FFFFFF'}
							d="M9.498 5.793c1.42-1.904 3.555-2.46 5.519-1.925 2.12.577 3.984 2.398 4.603 4.934.032.13.06.26.083.39a4.453 4.453 0 0 0-2.774-.07c-1.287-.952-2.881-1.112-4.298-.59-1.775.655-3.161 2.316-3.482 4.406-.41 2.676 1.22 5.08 3.525 7.124l.388.336c-.313.022-.631-.027-.935-.092a9.474 9.474 0 0 1-.466-.112l-.537-.15C6.35 18.701 3.154 16.6 2.237 13.46c-.732-2.506-.028-5.015 1.52-6.575 1.434-1.445 3.56-2.031 5.741-1.092m1.628 7.448c.428-2.792 3.657-4.168 5.315-1.772a.104.104 0 0 0 .144.025c2.377-1.684 4.94.713 4.387 3.483-.32 1.606-1.81 2.94-4.47 4l-.435.17-.263.108c-.227.089-.467.16-.684.122-.216-.038-.417-.188-.6-.348l-.31-.28c-2.313-1.991-3.341-3.827-3.084-5.508"
						/>
					</g>
				</svg>
			</TouchableOpacity>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		width: CARD_WIDTH,
		height: CARD_WIDTH * 0.9, // Maintain a consistent aspect ratio
		marginHorizontal: 8,
		marginVertical: 10,
		position: 'relative',
	},
	backgroundCard: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: '#C67C4E', // Changed to match our primary accent color
		borderTopLeftRadius: 55,
		borderTopRightRadius: 55,
		borderBottomLeftRadius: 50,
		borderBottomRightRadius: 50,
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.25,
		shadowRadius: 6,
		elevation: 5,
	},
	imageContainer: {
		width: '95%', // Reduced from 100% to create gap
		height: '65%',
		borderRadius: 50,
		backgroundColor: '#FFF8EF', // Lighter background to match our warm theme
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 6,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'center', // Center the container horizontally
		marginTop: 3, // Add some top margin for spacing
	},
	image: {
		width: '90%',
		height: '90%',
	},
	infoContainer: {
		paddingTop: 8,
		paddingHorizontal: 16,
		marginLeft: 16,
	},
	name: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 14,
		color: '#FFFFFF',
		marginBottom: 4,
	},
	price: {
		fontFamily: 'Inter-Medium',
		fontSize: 12,
		color: '#FFF2E5', // Updated to a soft cream color for better readability
	},
	favoriteButton: {
		position: 'absolute',
		bottom: 4,
		right: 20,
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
})

export default FeaturedProductCard
