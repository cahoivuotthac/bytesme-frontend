import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	SafeAreaView,
	Image,
	FlatList,
	TouchableOpacity,
	Dimensions,
	ActivityIndicator,
} from 'react-native'
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from '@/providers/locale'
import Button from '@/components/ui/Button'
import QuantityControl from '@/components/ui/QuantityControl'
import Checkbox from '@/components/ui/Checkbox'
import { useAlert } from '@/hooks/useAlert'
import DishDecoration from '@/components/shared/DishDecoration'
import { addToWishlist, cartAPI, removeFromWishlist } from '@/utils/api'
import DashedLine from 'react-native-dashed-line'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Get screen dimensions
const { width, height } = Dimensions.get('window')
const ITEM_WIDTH = width - 32

// Example cart item interface
export interface CartItem {
	productId: number
	productName: string
	prices: number[]
	sizes: string[]
	quantity: number
	imageUrl: string
	isSelected: boolean
	isWishlisted: boolean
	selectedSizeIndex: number
	discountPercentage: number
	recommendationMessage?: string // Recommendation message
}

export default function CartScreen() {
	const { t } = useTranslation()
	const router = useRouter()
	const { AlertComponent, showError } = useAlert()

	// State variables
	const [cartItems, setCartItems] = useState<CartItem[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [selectAll, setSelectAll] = useState(false)
	const [totalPrice, setTotalPrice] = useState(0)

	// Fetch cart items on component mount
	useEffect(() => {
		fetchCartItems()
	}, [])

	// Calculate total price whenever cart items change
	useEffect(() => {
		calculateTotalPrice()
	}, [cartItems])

	// Fetch cart items from API (or use mock data for now)
	const fetchCartItems = async () => {
		setIsLoading(true)
		try {
			// 	// Simulating API call with mock data
			// 	setTimeout(() => {
			// 		const mockItems: CartItem[] = [
			// 			{
			// 				productId: 18,
			// 				productName: 'Cappuccino',
			// 				prices: [59000, 69000, 79000],
			// 				sizes: ['S', 'M', 'L'],
			// 				quantity: 1,
			// 				imageUrl:
			// 					'https://images.unsplash.com/photo-1572442388796-11668a67e53d',
			// 				selectedSizeIndex: 1, // Start with M size selected
			// 				isSelected: false,
			// 				isWishlisted: false,
			// 			},
			// 			{
			// 				productId: 19,
			// 				productName: 'Tiramisu Cake',
			// 				prices: [79000, 89000, 99000, 109000],
			// 				sizes: ['S', 'M', 'L', 'XL'],
			// 				quantity: 2,
			// 				imageUrl:
			// 					'https://images.unsplash.com/photo-1571115177098-24ec42ed204d',
			// 				selectedSizeIndex: 2, // Start with L size selected
			// 				isSelected: true,
			// 				isWishlisted: false,
			// 			},
			// 			{
			// 				productId: 20,
			// 				productName: 'Chocolate Croissant',
			// 				prices: [35000, 45000, 55000],
			// 				sizes: ['S', 'M', 'L'],
			// 				quantity: 1,
			// 				imageUrl:
			// 					'https://images.unsplash.com/photo-1608198093002-ad4e005484ec',
			// 				selectedSizeIndex: 1, // Start with M size selected
			// 				isSelected: true,
			// 				isWishlisted: false,
			// 			},
			// 		]
			// 		setCartItems(mockItems)
			// 		setSelectAll(mockItems.every((item) => item.isSelected))
			// setIsLoading(false)
			// }, 800)

			// Fetch cart items from API
			const response = await cartAPI.getCartItems()
			const { cartItems } = response.data

			if (!cartItems || !Array.isArray(cartItems)) {
				showError(t('errorFetchingCartItems') || 'Failed to load cart items')
				return
			}

			console.log('Fetched cart items:', cartItems)

			// Pre-processing data
			const getSelectedSizeIndex = (currentSize: string, sizes: string[]) => {
				if (!currentSize) {
					return 0
				}
				if (!sizes || !Array.isArray(sizes)) {
					return 0
				}
				const index = sizes.indexOf(currentSize)
				return index !== -1 ? index : 0
			}

			const promises = cartItems.map(async (item: Record<string, any>) => {
				return {
					productId: item.product.product_id,
					productName: item.product.product_name,
					prices: [25000, 30000, 35000], // @TODO: replace with actual prices later;
					sizes: ['S', 'M', 'L'],
					quantity: item.cart_items_quantity,
					imageUrl: item.product.product_images[0].image_url, // @TODO: fill images into db later
					isSelected:
						(await AsyncStorage.getItem(
							`cartItemsSelected/${item.product_id}`
						)) === 'true',
					isWishlisted: item.is_wishlisted,
					selectedSizeIndex: getSelectedSizeIndex(
						item.cart_items_size,
						item.product.product_sizes_prices
					),
					discountPercentage: item.product.product_discount_percentage,
					recommendationMessage: '', // @TODO: implement this later
				}
			})

			// Resolve all promises before setting state
			const processedCartItems = await Promise.all(promises)
			setCartItems(processedCartItems)
		} catch (error) {
			console.error('Failed to fetch cart items:', error)
			showError(t('errorFetchingCart') || 'Failed to load cart items')
			setIsLoading(false)
		} finally {
			setIsLoading(false)
		}
	}

	// Change the size of a product
	const changeSize = (productId: number, sizeIndex: number) => {
		try {
			let selectedSize = ''
			setCartItems((prevItems) =>
				prevItems.map((item) => {
					if (item.productId === productId) {
						selectedSize = item.sizes[sizeIndex]
						return { ...item, selectedSizeIndex: sizeIndex }
					} else {
						return item
					}
				})
			)

			cartAPI.updateItemSize(productId, selectedSize)
		} catch (error) {}
	}

	// Calculate total price based on selected items
	const calculateTotalPrice = () => {
		const total = cartItems.reduce((sum, item) => {
			if (item.isSelected) {
				return sum + item.prices[item.selectedSizeIndex] * item.quantity
			}
			return sum
		}, 0)
		setTotalPrice(total)
	}

	// Format price with Vietnamese dong symbol
	const formatPrice = (price: number) => {
		return `${price.toLocaleString('vi-VN')}đ`
	}

	// Handle quantity increment
	const incrementQuantity = async (id: number) => {
		let currentQuantity = 0
		setCartItems((prevItems) =>
			prevItems.map((item) => {
				if (item.productId === id) {
					currentQuantity = item.quantity
					return { ...item, quantity: item.quantity + 1 }
				} else {
					return item
				}
			})
		)

		try {
			await cartAPI.updateItemQuantity(id, currentQuantity + 1)
		} catch (error) {
			console.error('Failed to update quantity:', error)
			showError(t('errorUpdatingQuantity') || 'Failed to update quantity')
		}
	}

	// Handle quantity decrement
	const decrementQuantity = async (id: number) => {
		let currentQuantity = 0
		setCartItems((prevItems) =>
			prevItems.map((item) => {
				if (item.productId === id) {
					currentQuantity = item.quantity
					return { ...item, quantity: item.quantity - 1 }
				} else {
					return item
				}
			})
		)

		if (currentQuantity > 1) {
			await cartAPI.updateItemQuantity(id, currentQuantity - 1)
		} else {
			removeFromCart(id)
		}
	}

	// Toggle selection of an item
	const toggleSelectItem = async (id: number) => {
		// Persist selection state
		let stateAfterToggle = false
		setCartItems((prevItems) => {
			const updatedItems = prevItems.map((item) => {
				if (item.productId === id) {
					stateAfterToggle = !item.isSelected
					return { ...item, isSelected: stateAfterToggle }
				} else {
					return item
				}
			})
			setSelectAll(updatedItems.every((item) => item.isSelected))
			return updatedItems
		})
		await AsyncStorage.setItem(
			`cartItemsSelected/${id}`,
			stateAfterToggle.toString()
		)
	}

	// Toggle select all items
	const toggleSelectAll = async () => {
		const newSelectAll = !selectAll
		setSelectAll(newSelectAll)
		setCartItems((prevItems) =>
			prevItems.map((item) => ({ ...item, isSelected: newSelectAll }))
		)
		cartItems.forEach(async (item) => {
			await AsyncStorage.setItem(
				`cartItemsSelected/${item.productId}`,
				newSelectAll.toString()
			)
		})
	}

	// Remove an item from cart
	const removeFromCart = async (productId: number) => {
		try {
			await cartAPI.removeFromCart(productId)
			setCartItems((prevItems) =>
				prevItems.filter((item) => item.productId !== productId)
			)
		} catch (error) {
			console.error('Failed to remove item from cart:', error)
			showError(t('errorRemovingFromCart') || 'Failed to remove item from cart')
		}
	}

	const toggleIsWishlisted = async (productId: number) => {
		const isItemWishlisted = cartItems.find(
			(item) => item.productId === productId
		)?.isWishlisted

		try {
			// Call API to remove from wishlist
			if (isItemWishlisted) {
				await removeFromWishlist(productId)
			} else {
				await addToWishlist(productId)
			}

			setCartItems((prev) =>
				prev.map((item) =>
					item.productId === productId
						? { ...item, isWishlisted: !isItemWishlisted }
						: item
				)
			)
		} catch (error) {
			console.error('Failed to toggle wishlist status:', error)
			showError(
				isItemWishlisted
					? t('errorRemovingFromWishlist')
					: t('errorAddingToWishlist')
			)
		}
	}

	// Handle checkout
	const handleCheckout = async () => {
		if (totalPrice === 0) {
			showError(t('noItemsSelected') || 'No items selected for checkout')
			return
		}

		// Navigate to checkout page or process checkout
		console.log('Proceeding to checkout with total:', totalPrice)
		await AsyncStorage.setItem(
			'checkoutItems',
			JSON.stringify(cartItems.filter((item) => item.isSelected))
		)
		router.push('/(home)/order/checkout')
	}

	// Navigate to product detail
	const navigateToProduct = (productId: number) => {
		router.push({
			pathname: '/(home)/product/[id]',
			params: { id: productId },
		})
	}

	// Render a cart item
	const renderCartItem = ({
		item,
		index,
	}: {
		item: CartItem
		index: number
	}) => (
		<>
			<View style={styles.cartItem}>
				<TouchableOpacity
					style={styles.checkboxContainer}
					onPress={() => toggleSelectItem(item.productId)}
				>
					<Checkbox
						isChecked={item.isSelected}
						onToggle={() => toggleSelectItem(item.productId)}
						size={22}
					/>
				</TouchableOpacity>

				<View style={styles.itemContentContainer}>
					<TouchableOpacity
						style={styles.productImageContainer}
						onPress={() => navigateToProduct(item.productId)}
					>
						<DishDecoration
							imageSource={{ uri: item.imageUrl }}
							containerStyle={styles.dishContainer}
							imageStyle={styles.dishImage}
						/>
					</TouchableOpacity>

					<View style={styles.itemDetails}>
						<View style={styles.itemHeaderRow}>
							<TouchableOpacity
								onPress={() => navigateToProduct(item.productId)}
							>
								<Text style={styles.itemName} numberOfLines={1}>
									{item.productName}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => removeFromCart(item.productId)}
								hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
							>
								<Feather name="trash-2" size={20} color="#8D8D8D" />
							</TouchableOpacity>
						</View>

						{/* Size selector */}
						<View style={styles.sizeContainer}>
							<Text style={styles.sizeLabel}>{t('size')}:</Text>
							<View style={styles.sizeSelector}>
								{item.sizes.map((size, sizeIndex) => (
									<TouchableOpacity
										key={`${item.productId}-${size}`}
										style={[
											styles.sizeButton,
											sizeIndex === item.selectedSizeIndex &&
												styles.selectedSizeButton,
										]}
										onPress={() => changeSize(item.productId, sizeIndex)}
									>
										<Text
											style={[
												styles.sizeButtonText,
												sizeIndex === item.selectedSizeIndex &&
													styles.selectedSizeButtonText,
											]}
										>
											{size}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>

						<View style={styles.itemPriceRow}>
							<Text style={styles.itemPrice}>
								{item.discountPercentage && (
									<Text
										style={{
											textDecorationLine: 'line-through',
											color: '#9B9B9B',
										}}
									>
										{formatPrice(
											item.prices[item.selectedSizeIndex] *
												(1 - item.discountPercentage / 100)
										)}
									</Text>
								)}
								{'  '}
								{formatPrice(item.prices[item.selectedSizeIndex])}
							</Text>
							{/* Heart button */}
							<TouchableOpacity
								style={styles.heartButton}
								onPress={() => toggleIsWishlisted(item.productId)}
							>
								{item.isWishlisted ? (
									<AntDesign name="heart" size={22} color="#C67C4E" />
								) : (
									<AntDesign name="hearto" size={22} color="#C67C4E" />
								)}
							</TouchableOpacity>
						</View>
						<View style={styles.quantityControlContainer}>
							<QuantityControl
								value={item.quantity}
								onIncrement={() => incrementQuantity(item.productId)}
								onDecrement={() => decrementQuantity(item.productId)}
								size="small"
								buttonColor="#968B7B"
							/>
						</View>
					</View>
				</View>
			</View>

			{/* Recommendation message */}
			{item.recommendationMessage && (
				<View style={styles.recommendationContainer}>
					<Text style={styles.recommendationText}>
						{item.recommendationMessage}
					</Text>
				</View>
			)}

			{/* Separator line - show for all items except the last one */}
			{index < cartItems.length - 1 && <View style={styles.separatorLine} />}
		</>
	)

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}

			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#C67C4E" />
				</View>
			) : cartItems.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Ionicons name="cart-outline" size={64} color="#CCCCCC" />
					<Text style={styles.emptyText}>
						{t('emptyCart') || 'Your cart is empty'}
					</Text>
					<TouchableOpacity
						style={styles.browseButton}
						onPress={() => router.push('/(home)/product')}
					>
						<Text style={styles.browseButtonText}>{t('browseProducts')}</Text>
					</TouchableOpacity>
				</View>
			) : (
				<>
					<View style={styles.selectAllContainer}>
						<TouchableOpacity
							style={styles.selectAllButton}
							onPress={toggleSelectAll}
						>
							<Checkbox
								isChecked={selectAll}
								onToggle={toggleSelectAll}
								size={22}
							/>
							<Text style={styles.selectAllText}>
								{t('selectAll') || 'Select All'}
							</Text>
						</TouchableOpacity>
					</View>

					<FlatList
						data={cartItems}
						renderItem={renderCartItem}
						keyExtractor={(item, index) =>
							!!item ? item.productId.toString() : index.toString()
						}
						contentContainerStyle={styles.listContainer}
						showsVerticalScrollIndicator={false}
						ListFooterComponent={
							<DashedLine dashColor="#A0998E" dashGap={5} dashThickness={1} />
						}
					/>

					<View style={styles.summaryContainer}>
						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>{t('total')}</Text>
							<Text style={styles.totalValue}>{formatPrice(totalPrice)}</Text>
						</View>

						<Button
							text={t('checkout')}
							backgroundColor="#C67C4E"
							onPress={handleCheckout}
							style={styles.checkoutButton}
						/>
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
	quantityControlContainer: {
		alignItems: 'flex-start',
		marginTop: 8,
	},
	header: {
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#F1F1F1',
	},
	headerTitle: {
		fontSize: 20,
		fontFamily: 'Inter-SemiBold',
		color: '#2F2D2C',
		textAlign: 'center',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
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
		shadowColor: '#C67C4E',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	browseButtonText: {
		fontFamily: 'Inter-Bold',
		fontSize: 14,
		color: '#FFFFFF',
	},
	selectAllContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#F1F1F1',
	},
	selectAllButton: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	selectAllText: {
		fontFamily: 'Inter-Medium',
		fontSize: 14,
		color: '#2F2D2C',
		marginLeft: 12,
	},
	listContainer: {
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 16,
	},
	heartButton: {
		width: 32,
		height: 32,
	},
	cartItem: {
		width: '100%',
		flexDirection: 'row',
		backgroundColor: '#FFFFFF',
		padding: 12,
		paddingBottom: 8,
		marginBottom: 8,
		shadowColor: '#00000010',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 10,
		elevation: 2,
	},
	recommendationContainer: {
		paddingHorizontal: 16,
		paddingVertical: 6,
		marginBottom: 8,
	},
	recommendationText: {
		fontFamily: 'Inter-Regular',
		fontSize: 12,
		color: '#C67C4E',
	},
	separatorLine: {
		height: 1,
		backgroundColor: '#F1F1F1',
		marginHorizontal: 16,
		marginBottom: 16,
	},
	checkboxContainer: {
		justifyContent: 'center',
		marginRight: 10,
	},
	itemContentContainer: {
		flex: 1,
		flexDirection: 'row',
	},
	productImageContainer: {
		width: ITEM_WIDTH * 0.35,
		height: ITEM_WIDTH * 0.35,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	dishContainer: {
		backgroundColor: '#EDE9E0',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.5,
		shadowRadius: 12,
		elevation: 8,
	},
	dishImage: {
		width: '100%',
		height: '100%',
	},
	itemDetails: {
		flex: 1,
		justifyContent: 'space-between',
	},
	itemHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	itemName: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 16,
		color: '#2F2D2C',
		flex: 1,
		marginRight: 8,
	},
	itemSize: {
		fontFamily: 'Inter-Regular',
		fontSize: 12,
		color: '#9B9B9B',
		marginTop: 4,
	},
	itemPriceRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 8,
	},
	itemPrice: {
		fontFamily: 'Inter-Medium',
		fontSize: 14,
		color: '#968B7B',
	},
	favoriteButton: {
		padding: 4,
	},
	summaryContainer: {
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 24,
		borderTopWidth: 1,
		borderTopColor: '#F1F1F1',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	totalLabel: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 16,
		color: '#2F2D2C',
	},
	totalValue: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 16,
		color: '#C67C4E',
	},
	checkoutButton: {
		marginTop: 4,
		width: width * 0.9,
		height: width * 0.15,
		shadowColor: '#C67C4E',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 10,
		elevation: 8,
	},
	sizeContainer: {
		marginTop: 4,
		marginBottom: 8,
	},
	sizeLabel: {
		fontFamily: 'Inter-Regular',
		fontSize: 12,
		color: '#9B9B9B',
		marginBottom: 4,
	},
	sizeSelector: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 2,
	},
	sizeButton: {
		width: 30,
		height: 24,
		borderRadius: 6,
		backgroundColor: 'rgba(191, 173, 142, 0.2)',
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
	dashedLineContainer: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	dashedLine: {
		marginVertical: 8,
	},
})
