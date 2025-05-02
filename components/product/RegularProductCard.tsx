import React, { useState } from 'react'
import {
	View,
	Text,
	Image,
	StyleSheet,
	TouchableOpacity,
	Dimensions,
	Platform,
	ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import DishDecoration from '@/components/shared/DishDecoration'
import { addToWishlist, removeFromWishlist } from '@/utils/api'

// Get screen dimensions for responsive sizing
const { width } = Dimensions.get('window')
const CARD_WIDTH = width * 0.33 //

interface RegularProductCardProps {
	/**
	 * Product data object
	 */
	product: {
		id: string
		name: string
		price: number
		imageUrl: string
		rating?: number
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
 * Regular product card component with clean white background
 */
const RegularProductCard: React.FC<RegularProductCardProps> = ({
	product,
	style,
	onToggleFavorite,
}) => {
	const [isFavorite, setIsFavorite] = useState(product.isFavorite || false);
	const [isLoading, setIsLoading] = useState(false);

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

	// Toggle favorite status with API call
	const handleFavoritePress = async (e: any) => {
		e.stopPropagation();
		
		try {
			setIsLoading(true);
			
			if (isFavorite) {
				// Remove from wishlist
				await removeFromWishlist(product.id);
			} else {
				// Add to wishlist
				await addToWishlist(product.id);
			}
			
			// Update local state
			setIsFavorite(!isFavorite);
			
			// Call the parent handler if provided
			if (onToggleFavorite) {
				onToggleFavorite(product.id);
			}
		} catch (error) {
			console.error('Wishlist operation failed:', error);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<TouchableOpacity
			style={[styles.container, style]}
			activeOpacity={0.7}
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

			{/* Card container */}
			<View style={styles.card}>
				{/* Empty space for the dish that floats above */}
				<View style={styles.imageContainer} />

				{/* Product info */}
				<View style={styles.infoContainer}>
					<Text style={styles.name} numberOfLines={1}>
						{product.name}
					</Text>

					{product.rating && (
						<View style={styles.ratingContainer}>
							<Ionicons name="star" size={12} color="#F7C554" />
							<Text style={styles.rating}>{product.rating.toFixed(2)} sao</Text>
						</View>
					)}

					<Text style={styles.price}>{formatPrice(product.price)}</Text>
				</View>

				{/* Favorite button */}
				<TouchableOpacity
					style={styles.favoriteButton}
					onPress={handleFavoritePress}
					hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
				>
					{isLoading ? (
						<ActivityIndicator size="small" color="#FF5E5E" />
					) : (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<g id="love_fill" fill="none">
								<path d="M24 0v24H0V0zM12.594 23.258l-.012.002-.071.035-.02.004-.014-.004-.071-.036c-.01-.003-.019 0-.024.006l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.016-.018m.264-.113-.014.002-.184.093-.01.01-.003.011.018.43.005.012.008.008.201.092c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.003-.011.018-.43-.003-.012-.01-.01z" />
								<path
									fill={isFavorite ? '#FF5E5E' : '#D1D1D1'}
									d="M9.498 5.793c1.42-1.904 3.555-2.46 5.519-1.925 2.12.577 3.984 2.398 4.603 4.934.032.13.06.26.083.39a4.453 4.453 0 0 0-2.774-.07c-1.287-.952-2.881-1.112-4.298-.59-1.775.655-3.161 2.316-3.482 4.406-.41 2.676 1.22 5.08 3.525 7.124l.388.336c-.313.022-.631-.027-.935-.092a9.474 9.474 0 0 1-.466-.112l-.537-.15C6.35 18.701 3.154 16.6 2.237 13.46c-.732-2.506-.028-5.015 1.52-6.575 1.434-1.445 3.56-2.031 5.741-1.092m1.628 7.448c.428-2.792 3.657-4.168 5.315-1.772a.104.104 0 0 0 .144.025c2.377-1.684 4.94.713 4.387 3.483-.32 1.606-1.81 2.94-4.47 4l-.435.17-.263.108c-.227.089-.467.16-.684.122-.216-.038-.417-.188-.6-.348l-.31-.28c-2.313-1.991-3.341-3.827-3.084-5.508"
								/>
							</g>
						</svg>
					)}
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		width: CARD_WIDTH * 1.1,
		marginHorizontal: 8,
		marginVertical: 10,
		position: 'relative',
		paddingTop: CARD_WIDTH * 0.18, // Make space for the floating dish
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
		borderRadius: 34,
		backgroundColor: '#F9F9F2',
		height: CARD_WIDTH,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#000000',
		padding: 10,
		paddingTop: CARD_WIDTH * 0.35, // Space for the dish that overlaps
	},
	imageContainer: {
		width: '100%',
		height: CARD_WIDTH * 0.23, // Reduced height since dish is now above
	},
	dishContainer: {
		backgroundColor: '#FAF9F2',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.35,
		shadowRadius: 12,
		elevation: 11,
	},
	dishImage: {
		width: '85%',
		height: '85%',
	},
	infoContainer: {
		paddingHorizontal: 6,
	},
	name: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 13,
		fontWeight: '600',
		color: '#474747',
		marginBottom: 4,
		textAlign: 'center',
	},
	ratingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 4,
	},
	rating: {
		fontFamily: 'Inter-Bold',
		fontSize: 11,
		marginLeft: 4,
		color: '#FF7622',
		textAlign: 'center',
	},
	price: {
		fontFamily: 'Inter-Bold',
		fontSize: 12,
		color: '#2D2D30',
		textAlign: 'center',
	},
	favoriteButton: {
		position: 'absolute',
		top: CARD_WIDTH * 0.65, // Adjusted to account for dish overlap
		right: 10,
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
})

export default RegularProductCard
