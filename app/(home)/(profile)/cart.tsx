import React, { useState, useEffect, useRef } from 'react'
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
import { cartAPI, addToWishlist, removeFromWishlist } from '@/utils/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DishDecoration from '@/components/shared/DishDecoration'
import BottomSpacer from '@/components/shared/BottomSpacer'
// import DashedLine from '@/components/ui/DashedLine'
import { formatPrice } from '@/utils/display'

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
	discountPrice?: number
	recommendationMessage?: string // Recommendation message
}

// Update the CoOccurData interface to match the new server response format
interface CoOccurData {
	[key: string]: {
		product_id: number
		product_name: string
	}[]
}

// Update the ProductSuggestion interface to include the suggestion text
interface ProductSuggestion {
	productId: number
	productName: string
	imageUrl: string
	price: number
	originalProductId: number
	suggestionText: string
}

export default function CartScreen() {
	const { t, locale } = useTranslation()
	const router = useRouter()
	const { AlertComponent, showError } = useAlert()

	// State variables
	const [cartItems, setCartItems] = useState<CartItem[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [selectAll, setSelectAll] = useState(false)
	const [totalPrice, setTotalPrice] = useState(0)
	const [coOccurProducts, setCoOccurProducts] = useState<ProductSuggestion[]>(
		[]
	)
	const [loadingSuggestions, setLoadingSuggestions] = useState(false)

	// New state to store stable suggestion data
	const [stableSuggestions, setStableSuggestions] = useState<
		Record<number, ProductSuggestion[]>
	>({})

	// Flag to track if suggestions have been initialized
	const suggestionsInitialized = useRef(false)

	// Fetch cart items on component mount
	useEffect(() => {
		fetchCartItems()
	}, [])

	// Calculate total price whenever cart items change
	useEffect(() => {
		calculateTotalPrice()
	}, [cartItems])

	// Fetch co-occurring products when cart items are loaded
	useEffect(() => {
		if (cartItems.length > 0) {
			fetchCoOccurProducts()
		}
	}, [cartItems])

	// Set up stable suggestions ONLY ONCE when co-occur products are first loaded
	useEffect(() => {
		// Skip if no co-occur products or if suggestions were already initialized
		if (coOccurProducts.length === 0 || suggestionsInitialized.current) return

		console.log(
			'Initializing stable suggestions - this should happen only once'
		)

		const suggestionsMap: Record<number, ProductSuggestion[]> = {}

		// Group suggestions by original product
		cartItems.forEach((item) => {
			const itemSuggestions = coOccurProducts.filter(
				(suggestion) => suggestion.originalProductId === item.productId
			)

			// Randomly determine how many suggestions to show (0-2)
			const maxToShow = Math.min(
				itemSuggestions.length,
				Math.floor(Math.random() * 3)
			)

			// Shuffle and get a stable subset
			const selectedSuggestions = [...itemSuggestions]
				.sort(() => 0.5 - Math.random())
				.slice(0, maxToShow)

			// Store the stable suggestions
			suggestionsMap[item.productId] = selectedSuggestions
		})

		setStableSuggestions(suggestionsMap)

		// Mark suggestions as initialized to prevent future updates
		suggestionsInitialized.current = true
	}, [coOccurProducts]) // Only depends on coOccurProducts, not cartItems

	// Fetch cart items from API (or use mock data for now)
	const fetchCartItems = async () => {
		setIsLoading(true)
		try {
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
					prices: item.product.product_unit_price.prices,
					sizes: item.product.product_unit_price.sizes,
					quantity: item.cart_items_quantity,
					imageUrl: item.product.product_images[0].product_image_url, // @TODO: fill images into db later
					isSelected:
						(await AsyncStorage.getItem(
							`cartItemsSelected/${item.product_id}`
						)) === 'true',
					isWishlisted: item.is_wishlisted,
					selectedSizeIndex: getSelectedSizeIndex(
						item.cart_items_size,
						item.product.product_unit_price.sizes
					),
					discountPercentage: item.product.product_discount_percentage,
					recommendationMessage: '', // @TODO: implement this later
				}
			})

			// Resolve all promises before setting state
			const processedCartItems = await Promise.all(promises)
			console.log('Processed cart items:', processedCartItems)
			setCartItems(processedCartItems)
		} catch (error) {
			console.error('Failed to fetch cart items:', error)
			showError(t('errorFetchingCart') || 'Failed to load cart items')
			setIsLoading(false)
		} finally {
			setIsLoading(false)
		}
	}

	// Get a random suggestion template from translations and format with product name
	const getRandomSuggestionText = (productName: string) => {
		// There are 10 suggestion templates
		const templateIndex = Math.floor(Math.random() * 10) + 1
		const template = t(`suggestionTemplate_${templateIndex}`)
		return template.replace('{productName}', productName)
	}

	// Fetch co-occurring products
	const fetchCoOccurProducts = async () => {
		if (cartItems.length === 0) return

		setLoadingSuggestions(true)
		try {
			// Create comma-separated string of product IDs
			const productIds = cartItems.map((item) => item.productId).join(',')

			// Call API to get co-occur products
			const response = await cartAPI.getCoOccurProducts(productIds)
			const coOccurData: CoOccurData = response.data

			if (!coOccurData) {
				setLoadingSuggestions(false)
				return
			}

			// Process co-occur data to get product details
			const suggestions: ProductSuggestion[] = []

			// For each original product, get co-occurring products from the new data format
			for (const [origProductId, coProducts] of Object.entries(coOccurData)) {
				console.log('Co-occurring products for:', origProductId, coProducts)
				if (coProducts && coProducts.length > 0) {
					for (const coProduct of coProducts) {
						try {
							// Now we directly have the product name from the response
							const productName = coProduct.product_name || 'sản phẩm này'

							// We'll still need to get the product image URL through a separate API call
							const productResponse = await cartAPI.getCoOccurProducts(
								coProduct.product_id.toString()
							)
							const productDetails = productResponse.data

							const imageUrl =
								productDetails?.product_images?.[0]?.product_image_url || ''

							suggestions.push({
								productId: coProduct.product_id,
								productName: productName,
								imageUrl: imageUrl,
								price: productDetails?.product_unit_price?.prices?.[0] || 0,
								originalProductId: parseInt(origProductId),
								// Generate a personalized suggestion text with product name
								suggestionText: getRandomSuggestionText(productName),
							})
						} catch (error) {
							console.error('Error fetching co-occur product details:', error)
						}
					}
				}
			}

			setCoOccurProducts(suggestions)
		} catch (error) {
			console.error('Failed to fetch co-occur products:', error)
		} finally {
			setLoadingSuggestions(false)
		}
	}

	// Change the size of a product
	const changeSize = async (productId: number, sizeIndex: number) => {
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

			await cartAPI.updateItemSize(productId, selectedSize)
		} catch (error) {
			showError(t('errorUpdatingSize'))
			console.error('Error updating size:', error)
		}
	}

	// Calculate total price based on selected items
	const calculateTotalPrice = () => {
		const total = cartItems.reduce((sum, item) => {
			if (item.isSelected) {
				const unitPrice = Math.round(
					(item.prices[item.selectedSizeIndex] *
						(100 - item.discountPercentage)) /
						100
				)
				return sum + unitPrice * item.quantity
			}
			return sum
		}, 0)
		setTotalPrice(total)
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

	// Add suggested product to cart
	const addSuggestedProductToCart = async (productId: number) => {
		try {
			await cartAPI.addItemToCart(productId, 1, 'M')
			showError(t('addedToCart'))
		} catch (error) {
			console.error('Failed to add suggested product to cart:', error)
			showError(t('errorAddingToCart'))
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

	// Create a memoized version of renderCartItem that doesn't change on re-renders
	const renderCartItem = React.useCallback(
		({ item, index }: { item: CartItem; index: number }) => {
			// Use the pre-determined stable suggestions from the ref
			const itemSuggestions = stableSuggestions[item.productId] || []

			return (
				<>
					<View style={styles.cartItem}>
						<TouchableOpacity
							style={styles.checkboxContainer}
							onPress={() => toggleSelectItem(item.productId)}
						>
							<Checkbox
								isChecked={item.isSelected}
								onToggle={toggleSelectItem}
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
									resizeMode="contain"
									adjustForBowl={true}
									imageScale={1.4}
								/>
							</TouchableOpacity>

							<View style={styles.itemDetails}>
								<View style={styles.itemHeaderRow}>
									<TouchableOpacity
										onPress={() => navigateToProduct(item.productId)}
										style={styles.productNameContainer}
									>
										<Text style={styles.itemName} numberOfLines={1}>
											{item.productName}
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => removeFromCart(item.productId)}
										hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
										style={styles.deleteButton}
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
										{item.discountPercentage && item.discountPercentage > 0 ? (
											<>
												<Text
													style={{
														textDecorationLine: 'line-through',
														color: '#9B9B9B',
													}}
												>
													{formatPrice(
														item.prices[item.selectedSizeIndex],
														locale
													)}
												</Text>
												{'  '}
											</>
										) : null}
										{formatPrice(
											Math.round(
												item.prices[item.selectedSizeIndex] *
													(1 - item.discountPercentage / 100)
											),
											locale
										)}
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

					{/* Suggestion cards - only show if we have any stable suggestions */}
					{itemSuggestions.length > 0 && (
						<View style={styles.suggestionsContainer}>
							{itemSuggestions.map((suggestion) =>
								renderSuggestionCard(suggestion)
							)}
						</View>
					)}

					{/* Separator line - show for all items except the last one */}
					{index < cartItems.length - 1 && (
						<View style={styles.separatorLine} />
					)}
				</>
			)
		},
		[stableSuggestions]
	) // Only depends on stableSuggestions, which is set once

	// Memoize the renderSuggestionCard function too
	const renderSuggestionCard = React.useCallback(
		(suggestion: ProductSuggestion) => {
			return (
				<TouchableOpacity
					key={`suggestion-${suggestion.productId}`}
					style={styles.suggestionCard}
					onPress={() => navigateToProduct(suggestion.productId)}
				>
					<View style={styles.suggestionContent}>
						<View style={styles.suggestionIconContainer}>
							<Ionicons name="sparkles" size={14} color="#C67C4E" />
						</View>
						<Text style={styles.suggestionText}>
							{suggestion.suggestionText}
						</Text>
						<TouchableOpacity
							style={styles.addSuggestionButton}
							onPress={() => addSuggestedProductToCart(suggestion.productId)}
						>
							<AntDesign name="plus" size={16} color="#fff" />
						</TouchableOpacity>
					</View>
				</TouchableOpacity>
			)
		},
		[]
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
						keyExtractor={(item) => item.productId.toString()}
						contentContainerStyle={styles.listContainer}
						showsVerticalScrollIndicator={false}
						ListFooterComponent={
							// <DashedLine dashColor="#A0998E" dashGap={5} dashThickness={1} />

							<View style={styles.dashedLine}>
								{Array.from({ length: Math.ceil(height / 6) }).map(
									(_, index) => (
										<View key={index} style={styles.dashedLine} />
									)
								)}
							</View>
						}
					/>

					<View style={styles.summaryContainer}>
						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>{t('total')}</Text>
							<Text style={styles.totalValue}>
								{formatPrice(totalPrice, locale)}
							</Text>
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
			<BottomSpacer />
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
		flex: 1,
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
		backgroundColor: '#FFFFFF',
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
		width: '100%',
	},
	productNameContainer: {
		flex: 1,
		marginRight: 8,
		paddingRight: 8,
	},
	deleteButton: {
		width: 28,
		height: 28,
		justifyContent: 'center',
		alignItems: 'center',
	},
	itemName: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 16,
		color: '#2F2D2C',
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
		// width: 30, // Removed fixed width to allow content to grow
		paddingHorizontal: 12,
		height: 24,
		borderRadius: 6,
		backgroundColor: 'rgba(191, 173, 142, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
		alignSelf: 'center',
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
	// Suggestion styles
	suggestionsContainer: {
		marginLeft: 8,
		marginRight: 8,
		marginBottom: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
	},
	suggestionCard: {
		backgroundColor: 'rgba(249, 246, 244, 0.85)',
		borderRadius: 20,
		paddingVertical: 8,
		paddingHorizontal: 12,
		marginRight: 8,
		flexDirection: 'row',
		alignItems: 'center',
		width: width * 0.91,
		height: 45,
		shadowColor: '#8D6E63',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 1,
		borderWidth: 0.5,
		borderColor: 'rgba(198, 124, 78, 0.2)',
	},
	suggestionContent: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	suggestionIconContainer: {
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: 'rgba(198, 124, 78, 0.1)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
	},
	suggestionText: {
		fontFamily: 'Inter-Medium',
		fontSize: 13,
		color: '#5D4037',
		flex: 1,
		marginRight: 8,
	},
	addSuggestionButton: {
		backgroundColor: '#C67C4E',
		width: 26,
		height: 26,
		borderRadius: 13,
		justifyContent: 'center',
		alignItems: 'center',
	},
})
