import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	FlatList,
	Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { getWishlist, removeFromWishlist } from '@/utils/api'
import { useAlert } from '@/hooks/useAlert'
import DishDecoration from '@/components/shared/DishDecoration'
import { useTranslation } from '@/providers/locale'
import QuantityControl from '@/components/ui/QuantityControl'

const { width } = Dimensions.get('window')
const ITEM_WIDTH = width * 0.9

// Mocked data - replace with your actual API call
// const FAVORITE_PRODUCTS = [
// 	{
// 		productId: 1,
// 		name: 'Tiramisu Cake',
// 		price: 45000,
// 		imageUrl: 'https://example.com/tiramisu.jpg',
// 		sizes: ['S', 'M', 'L'],
// 		isFavorite: true,
// 	},
// 	{
// 		productId: 2,
// 		name: 'Chocolate Croissant',
// 		price: 35000,
// 		imageUrl: 'https://example.com/croissant.jpg',
// 		sizes: ['S', 'M'],
// 		isFavorite: true,
// 	},
// 	{
// 		productId: 3,
// 		name: 'Caramel Macchiato',
// 		price: 55000,
// 		imageUrl: 'https://example.com/macchiato.jpg',
// 		sizes: ['S', 'M', 'L'],
// 		isFavorite: true,
// 	},
// ]

interface Product {
	productId: number
	name: string
	price: number
	imageUrl: string
	sizes: string[]
	isFavorite: boolean
}

export default function FavoritesScreen() {
	const { t } = useTranslation()
	const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
	const [productQuantities, setProductQuantities] = useState<
		Record<number, number>
	>({})
	const [productSizes, setProductSizes] = useState<Record<number, string>>({})
	const [isLoading, setIsLoading] = useState(false)
	const [removingProductId, setRemovingProductId] = useState<number | null>(
		null
	)

	const { AlertComponent, showError } = useAlert()

	// Fetch wishlist products from API on mount
	useEffect(() => {
		setIsLoading(true)

		const fetchWishlistProducts = async () => {
			try {
				const response = await getWishlist()

				// pre-processing if needed
				const products: Product[] = response.data.wishlist.map((item: any) => {
					return {
						productId: item.product_id,
						name: item.product.product_name,
						// price: item.product.price,
						price: [20000, 30000, 40000],
						imageUrl: item.product.product_images[0].product_image_url,
						// sizes: item.product.sizes,
						sizes: ['S', 'M', 'L'],
						isFavorite: true,
					}
				})

				setWishlistProducts(products)
			} catch (error) {
				console.error('Failed to fetch wishlist:', error)
				showError(t('errorFetchingWishlist'))
			}
		}

		fetchWishlistProducts()
	}, [])

	// Initialize quantities and sizes
	useEffect(() => {
		const initialQuantities: Record<number, number> = {}
		const initialSizes: Record<number, string> = {}

		wishlistProducts.forEach((product: Product) => {
			initialQuantities[product.productId] = 1
			initialSizes[product.productId] = product.sizes[0]
		})

		setProductQuantities(initialQuantities)
		setProductSizes(initialSizes)
	}, [wishlistProducts])

	// Format price with Vietnamese dong symbol
	const formatPrice = (price: number) => {
		return `${price.toLocaleString('vi-VN')}đ`
	}

	// Calculate total price of all items
	const calculateTotalPrice = () => {
		return wishlistProducts.reduce((total, product) => {
			const quantity = productQuantities[product.productId] || 0
			return total + product.price * quantity
		}, 0)
	}

	// Handle quantity changes
	const incrementQuantity = (productId: number) => {
		setProductQuantities((prev) => ({
			...prev,
			[productId]: (prev[productId] || 0) + 1,
		}))
	}

	const decrementQuantity = (productId: number) => {
		if (productQuantities[productId] > 1) {
			setProductQuantities((prev) => ({
				...prev,
				[productId]: prev[productId] - 1,
			}))
		}
	}

	// Handle size selection
	const changeSize = (productId: number, size: string) => {
		setProductSizes((prev) => ({
			...prev,
			[productId]: size,
		}))
	}

	// Remove from favorites
	const handleRemoveFromWishlist = async (productId: number) => {
		setRemovingProductId(productId)
		try {
			// Call your API to remove from wishlist
			await removeFromWishlist(productId)

			// Update local state
			setWishlistProducts((prev) =>
				prev.filter((product) => product.productId !== productId)
			)
		} catch (error) {
			console.error('Failed to remove from favorites:', error)
		} finally {
			setRemovingProductId(null)
		}
	}

	// Add all items to cart
	const handleAddAllToCart = () => {
		// Implement cart functionality
		console.log(
			'Adding all items to cart',
			wishlistProducts.map((product) => ({
				id: product.productId,
				quantity: productQuantities[product.productId],
				size: productSizes[product.productId],
			}))
		)
		// Navigate to cart or show confirmation
	}

	// Render a single favorite item
	const renderFavoriteItem = ({ item }: { item: Product }) => (
		<View style={styles.favoriteItem}>
			<View style={styles.productImageContainer}>
				<DishDecoration
					imageSource={{ uri: item.imageUrl }}
					size={80}
					containerStyle={styles.dishContainer}
					imageStyle={styles.dishImage}
				/>
			</View>

			<View style={styles.productInfoContainer}>
				<View style={styles.productNameRow}>
					<Text style={styles.productName} numberOfLines={1}>
						{item.name}
					</Text>
					<TouchableOpacity
						onPress={() => handleRemoveFromWishlist(item.productId)}
						style={styles.favoriteButton}
						hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
					>
						{removingProductId === item.productId ? (
							<ActivityIndicator size="small" color="#FF5E5E" />
						) : (
							<Ionicons name="heart" size={24} color="#FF5E5E" />
						)}
					</TouchableOpacity>
				</View>

				<Text style={styles.productPrice}>{formatPrice(item.price)}</Text>

				<View style={styles.productControls}>
					<View style={styles.sizeSelector}>
						{item.sizes.map((size: string) => (
							<TouchableOpacity
								key={size}
								style={[
									styles.sizeButton,
									productSizes[item.productId] === size &&
										styles.selectedSizeButton,
								]}
								onPress={() => changeSize(item.productId, size)}
							>
								<Text
									style={[
										styles.sizeButtonText,
										productSizes[item.productId] === size &&
											styles.selectedSizeButtonText,
									]}
								>
									{size}
								</Text>
							</TouchableOpacity>
						))}
					</View>

					<QuantityControl
						value={productQuantities[item.productId] || 1}
						onIncrement={() => incrementQuantity(item.productId)}
						onDecrement={() => decrementQuantity(item.productId)}
						size="small"
					/>
				</View>
			</View>
		</View>
	)

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Ionicons name="arrow-back" size={24} color="#2D2A2A" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{t('favorites')}</Text>
				<View style={styles.placeholderView} />
			</View>

			{wishlistProducts.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Ionicons name="heart-outline" size={64} color="#CCCCCC" />
					<Text style={styles.emptyText}>{t('noFavorites')}</Text>
					<TouchableOpacity
						style={styles.browseButton}
						onPress={() => router.push('/(home)/product')}
					>
						<Text style={styles.browseButtonText}>{t('browseProducts')}</Text>
					</TouchableOpacity>
				</View>
			) : (
				<>
					<FlatList
						data={wishlistProducts}
						renderItem={renderFavoriteItem}
						keyExtractor={(item) => item.productId.toString()}
						contentContainerStyle={styles.listContainer}
						showsVerticalScrollIndicator={false}
						ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
					/>

					<View style={styles.bottomContainer}>
						<TouchableOpacity
							style={styles.addAllButton}
							onPress={handleAddAllToCart}
						>
							<Text style={styles.addAllButtonText}>
								{t('addAllToCart')} ({formatPrice(calculateTotalPrice())})
							</Text>
						</TouchableOpacity>
					</View>
				</>
			)}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#F4F4F4',
	},
	backButton: {
		padding: 8,
	},
	headerTitle: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 18,
		color: '#383838',
	},
	placeholderView: {
		width: 40,
	},
	listContainer: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 100,
	},
	favoriteItem: {
		width: ITEM_WIDTH,
		flexDirection: 'row',
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 12,
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 3,
	},
	itemSeparator: {
		height: 16,
	},
	productImageContainer: {
		width: 80,
		height: 80,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	dishContainer: {
		backgroundColor: '#EDE9E0',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 5,
	},
	dishImage: {
		width: '85%',
		height: '85%',
	},
	productInfoContainer: {
		flex: 1,
		justifyContent: 'space-between',
	},
	productNameRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	productName: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 16,
		color: '#383838',
		flex: 1,
		marginRight: 8,
	},
	favoriteButton: {
		padding: 4,
	},
	productPrice: {
		fontFamily: 'Inter-Medium',
		fontSize: 14,
		color: '#968B7B',
		marginBottom: 8,
	},
	productControls: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	sizeSelector: {
		flexDirection: 'row',
	},
	sizeButton: {
		width: 30,
		height: 24,
		borderRadius: 6,
		backgroundColor: 'rgba(191, 173, 142, 0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
	},
	selectedSizeButton: {
		backgroundColor: '#C67C4E',
	},
	sizeButtonText: {
		fontFamily: 'Inter-Medium',
		fontSize: 12,
		color: '#000000',
	},
	selectedSizeButtonText: {
		color: '#FFFFFF',
	},
	bottomContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderTopWidth: 1,
		borderTopColor: '#F4F4F4',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 5,
	},
	addAllButton: {
		backgroundColor: '#C67C4E',
		borderRadius: 19,
		paddingVertical: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	addAllButtonText: {
		fontFamily: 'Inter-Bold',
		fontSize: 16,
		color: '#FFFFFF',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
	},
	emptyText: {
		fontFamily: 'Inter-Medium',
		fontSize: 16,
		color: '#9B9B9B',
		marginTop: 16,
		marginBottom: 24,
	},
	browseButton: {
		backgroundColor: '#C67C4E',
		borderRadius: 16,
		paddingVertical: 14,
		paddingHorizontal: 24,
	},
	browseButtonText: {
		fontFamily: 'Inter-Bold',
		fontSize: 14,
		color: '#FFFFFF',
	},
})
