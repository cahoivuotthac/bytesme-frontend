import React, { useState, useEffect, useRef } from 'react'
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	TextInput,
	TouchableOpacity,
	FlatList,
	ActivityIndicator,
	Image,
	Dimensions,
	StatusBar,
	Modal,
	TouchableWithoutFeedback,
	ScrollView,
	Animated,
	Easing,
} from 'react-native'
import { router, useLocalSearchParams, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@/providers/locale'
import NavButton from '@/components/shared/NavButton'
import Button from '@/components/ui/Button'
import GradientProductCard from '@/components/product/GradientProductCard'
import { useAlert } from '@/hooks/useAlert'
import { SearchBar } from '@/components/shared/SearchBar'
import { Svg, G, Path } from 'react-native-svg'
import RAGResponseBubble from '@/components/product/RAGResponseBubble'
import RAGProductCard from '@/components/product/RAGProductCard'
import ThinkingCard from '@/components/product/ThinkingCard'
import { APIClient, productAPI } from '@/utils/api'
import URLs from '@/constants/URLs'
import EventSource from 'react-native-sse'
import { useAuth } from '@/providers/auth'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')

// Mock data for search results - in a real app, this would come from an API
const MOCK_PRODUCTS = [
	{
		productId: 1,
		name: 'Bánh xu kem',
		price: 30000,
		imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e',
		isFavorite: false,
	},
	{
		productId: 2,
		name: 'Bánh sầu riêng',
		price: 75000,
		imageUrl: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812',
		isFavorite: true,
	},
	{
		productId: 3,
		name: 'Bia nhiệt đới',
		price: 30000,
		imageUrl: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757',
		isFavorite: false,
	},
	{
		productId: 4,
		name: 'Bánh Tiramisu',
		price: 55000,
		imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9',
		isFavorite: true,
		gradientColors: ['#923B3C', '#D7595B'],
	},
	{
		productId: 5,
		name: 'Xu Kem bơ nướng giòn tan',
		price: 30000,
		imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e',
		isFavorite: false,
	},
	{
		productId: 6,
		name: 'Bánh sừng bò nhân sầu riêng',
		price: 30000,
		imageUrl: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812',
		isFavorite: false,
	},
]

// Filter categories
const FILTER_CATEGORIES = [
	{ id: 'all', name: 'all' },
	{ id: 'coffee', name: 'coffee' },
	{ id: 'pastry', name: 'pastry' },
	{ id: 'tea', name: 'tea' },
	{ id: 'colddrinks', name: 'coldDrinks' },
	{ id: 'cake', name: 'cake' },
]

// Price ranges
const PRICE_RANGES = [
	{ id: 'price_under50', name: '< 50.000đ', min: 0, max: 50000 },
	{ id: 'price_50to100', name: '50.000đ - 100.000đ', min: 50000, max: 100000 },
	{
		id: 'price_100to200',
		name: '100.000đ - 200.000đ',
		min: 100000,
		max: 200000,
	},
	{ id: 'price_over200', name: '> 200.000đ', min: 200000, max: Infinity },
]

// Type definitions for RAG search responses
interface RAGTextChunk {
	type: 'answer'
	chunk: string
}

interface RAGProductData {
	type: 'product'
	data: {
		product_code: string
		product_name: string
		category_name: string
		description: string
		product_id: number
		total_ratings: number
		overall_stars: number
		total_orders: number
		image_url: string
		sizes_prices: string // JSON string of sizes and prices
		discount_percentage: number
	}
}

// New type for "thinking" data stream
interface RAGThinkingChunk {
	type: 'thinking'
	chunk: string
}

type RAGChunk = RAGTextChunk | RAGProductData | RAGThinkingChunk

export default function SearchResultsScreen() {
	// Params
	const params = useLocalSearchParams()
	const presetQuery = (params.query as string).trim()

	const { t } = useTranslation()
	const [currentQuery, setCurrentQuery] = useState(presetQuery)
	const { AlertComponent, showError } = useAlert()
	const modalAnimation = useRef(new Animated.Value(height)).current
	const eventSourceRef = useRef<EventSource | null>(null)
	const scrollViewRef = useRef<ScrollView>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [results, setResults] = useState<typeof MOCK_PRODUCTS>([])
	const [activeFilter, setActiveFilter] = useState('all')
	const [showFilterModal, setShowFilterModal] = useState(false)
	const [showScrollButton, setShowScrollButton] = useState(false)
	const scrollButtonAnim = useRef(new Animated.Value(0)).current

	// RAG search state
	const [isRagMode, setIsRagMode] = useState(params.isAiMode === 'true')
	const [ragAnswer, setRagAnswer] = useState('')
	const [ragProducts, setRagProducts] = useState<RAGProductData['data'][]>([])
	const [isStreaming, setIsStreaming] = useState(false)
	// New state for thinking stream
	const [thinkingText, setThinkingText] = useState('')
	// Track if we're in the thinking phase
	const [isThinking, setIsThinking] = useState(false)
	const [showProducts, setShowProducts] = useState(false)
	const [animatingProducts, setAnimatingProducts] = useState(false)
	const productAnimRefs = useRef<Animated.Value[]>([])
	// Add the missing reference
	const hasCompletedAnswering = useRef(false)

	// Filter states
	const [selectedCategory, setSelectedCategory] = useState('')
	const [selectedPriceRange, setSelectedPriceRange] = useState('')
	const [activeFilters, setActiveFilters] = useState<
		{
			id: string
			type: 'category' | 'price'
			name: string
		}[]
	>([])

	// Auth context
	const { authState } = useAuth()

	// Search initial results on page load
	useEffect(() => {
		performSearch(params.isAiMode === 'true', currentQuery)
	}, [])

	// Clean up EventSource on unmount
	useEffect(() => {
		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close()
			}
		}
	}, [])

	const performSearch = async (isAiMode: boolean, query: string) => {
		if (isAiMode) {
			performRagSearch(query)
		} else {
			performNormalSearch(query)
		}
	}

	// Most important function: perform RAG search
	const performRagSearch = async (query: string) => {
		setIsLoading(true)
		setIsStreaming(true)
		setRagAnswer('')
		setRagProducts([])
		setThinkingText('')
		setIsThinking(true)
		setShowProducts(false)
		setAnimatingProducts(false)
		productAnimRefs.current = []
		hasCompletedAnswering.current = false

		try {
			// Close any existing connection
			if (eventSourceRef.current) {
				eventSourceRef.current.close()
				eventSourceRef.current = null
			}

			// Create a new EventSource connection to the server
			const endpoint = productAPI.getSearchRagEndpoint(query)

			const eventSource = new EventSource(endpoint, {
				headers: {
					Authorization: authState.authToken,
					Accept: 'text/event-stream',
					'Cache-Control': 'no-cache',
				},
			})
			eventSourceRef.current = eventSource

			// Set up event listeners
			eventSource.addEventListener('open', () => {
				console.log('SSE connection opened')
				setIsLoading(false)
			})

			eventSource.addEventListener('message', (event) => {
				try {
					console.log('Received SSE message:', event.data)

					if (event.data === '[DONE]') {
						// End of stream, close connection
						eventSource.close()
						eventSourceRef.current = null
						setIsStreaming(false)
						setIsThinking(false)

						// Start product card animations after the text animation is done
						setTimeout(() => {
							// Initialize animation values for each product
							if (ragProducts.length > 0) {
								console.log('Preparing to show products, count:', ragProducts.length)
								productAnimRefs.current = ragProducts.map(() => new Animated.Value(0))
								hasCompletedAnswering.current = true
								setShowProducts(true)
								setAnimatingProducts(true)
							}
						}, 1000)
						return
					}

					const data: RAGChunk = JSON.parse(event.data || '{}')

					if (data.type === 'thinking') {
						// Accumulate thinking text for display in the thinking card
						console.log('Thinking chunk received:', data.chunk)
						setThinkingText((prev) => prev + (data.chunk || '') + '\n')
					} else if (data.type === 'answer') {
						// Add the answer chunk to the displayed answer
						setRagAnswer((prev) => prev + (data.chunk || ''))
					} else if (data.type === 'product') {
						// Store product data but don't show it yet
						setRagProducts((prev) => [...prev, data.data])
					}
				} catch (error) {
					console.error('Error parsing SSE message:', error)
				}
			})

			eventSource.addEventListener('error', (error) => {
				console.error('SSE error:', error)

				if (error) {
					showError(t('errorRetry'))
				}

				// Close the connection on error
				eventSource.close()
				eventSourceRef.current = null
				setIsStreaming(false)
				setIsLoading(false)
				setIsThinking(false)
			})

			// The server will handle the response through SSE events
		} catch (error) {
			console.error('Error setting up RAG search:', error)
			showError(t('errorRetry'))
			setIsStreaming(false)
			setIsLoading(false)
			setIsThinking(false)

			// Close any existing connection on error
			if (eventSourceRef.current) {
				eventSourceRef.current.close()
				eventSourceRef.current = null
			}
		}
	}

	const performNormalSearch = async (query: string) => {
		setIsLoading(true)

		try {
			// Simulate network request
			await new Promise((resolve) => setTimeout(resolve, 600))

			// Filter products based on query (case insensitive)
			const filtered = MOCK_PRODUCTS.filter((product) =>
				product.name.toLowerCase().includes(query.toLowerCase())
			)

			setResults(filtered)
		} catch (error) {
			showError(t('errorRetry'))
			console.error('Search error:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const toggleFavorite = (productId: number) => {
		setResults((prev) =>
			prev.map((product) =>
				product.productId === productId
					? { ...product, isFavorite: !product.isFavorite }
					: product
			)
		)
	}

	const handleFilterPress = (filterId: string) => {
		setActiveFilter(filterId)
	}

	// Toggle between RAG mode and normal search mode
	// const toggleRagMode = () => {
	// 	setIsRagMode(!isRagMode)
	// 	if (searchQuery.trim()) {
	// 		if (!isRagMode) {
	// 			performRagSearch(searchQuery)
	// 		} else {
	// 			performNormalSearch(searchQuery)
	// 		}
	// 	}
	// }

	// Modal animation control
	const openFilterModal = () => {
		setShowFilterModal(true)
		Animated.timing(modalAnimation, {
			toValue: 0,
			duration: 300,
			useNativeDriver: true,
		}).start()
	}

	const closeFilterModal = () => {
		Animated.timing(modalAnimation, {
			toValue: height,
			duration: 300,
			useNativeDriver: true,
		}).start(() => {
			setShowFilterModal(false)
		})
	}

	// Apply selected filters
	const applyFilters = () => {
		const newActiveFilters = []

		// Add category filter if selected
		if (selectedCategory && selectedCategory !== 'all') {
			const category = FILTER_CATEGORIES.find((c) => c.id === selectedCategory)
			if (category) {
				newActiveFilters.push({
					id: category.id,
					type: 'category' as const,
					name: t(category.name),
				})
			}
		}

		// Add price range filter if selected
		if (selectedPriceRange) {
			const priceRange = PRICE_RANGES.find((p) => p.id === selectedPriceRange)
			if (priceRange) {
				newActiveFilters.push({
					id: priceRange.id,
					type: 'price' as const,
					name: priceRange.name,
				})
			}
		}

		// Set active filters
		setActiveFilters(newActiveFilters)

		// Close modal
		closeFilterModal()

		// In a real app, you would filter search results here
		filterResults()
	}

	// Filter results based on active filters
	const filterResults = () => {
		// if (activeFilters.length === 0) {
		// 	// Reset to original search results if no active filters
		// 	performNormalSearch(searchQuery)
		// 	return
		// }
		// setIsLoading(true)
		// Simulate filtering with delay
		// setTimeout(() => {
		// 	let filtered = [...MOCK_PRODUCTS]
		// 	// Filter by search query
		// 	if (searchQuery.trim()) {
		// 		filtered = filtered.filter((product) =>
		// 			product.name.toLowerCase().includes(searchQuery.toLowerCase())
		// 		)
		// 	}
		// 	// Apply category filter
		// 	const categoryFilter = activeFilters.find((f) => f.type === 'category')
		// 	if (categoryFilter) {
		// 		// In a real app, filter by category here
		// 		// This is just a simulation
		// 	}
		// 	// Apply price filter
		// 	const priceFilter = activeFilters.find((f) => f.type === 'price')
		// 	if (priceFilter) {
		// 		const priceRange = PRICE_RANGES.find((p) => p.id === priceFilter.id)
		// 		if (priceRange) {
		// 			filtered = filtered.filter(
		// 				(product) =>
		// 					product.price >= priceRange.min && product.price <= priceRange.max
		// 			)
		// 		}
		// 	}
		// 	setResults(filtered)
		// 	setIsLoading(false)
		// }, 500)
	}

	// Remove a specific filter
	const removeFilter = (filterId: string) => {
		setActiveFilters((prev) => prev.filter((filter) => filter.id !== filterId))

		// Reset the corresponding filter state
		if (filterId === selectedCategory) {
			setSelectedCategory('')
		} else if (filterId === selectedPriceRange) {
			setSelectedPriceRange('')
		}

		// Re-filter results
		filterResults()
	}

	// Clear all filters
	// const clearAllFilters = () => {
	// 	setActiveFilters([])
	// 	setSelectedCategory('')
	// 	setSelectedPriceRange('')

	// 	// Reset to original search results
	// 	performSearch(searchQuery)
	// }

	const refreshResults = async () => {
		// Apply current filters to refresh results
		setIsLoading(true)

		// Wait for search to complete
		try {
			if (isRagMode) {
				await performRagSearch(currentQuery)
			} else {
				await performNormalSearch(currentQuery)
				filterResults()
			}
		} catch (error) {
			console.error('Error refreshing results:', error)
			showError(t('errorRetry'))
		} finally {
			// Use a shorter timeout for better UX
			setIsLoading(false)
		}
	}

	const renderItem = ({
		item,
		index,
	}: {
		item: (typeof MOCK_PRODUCTS)[0]
		index: number
	}) => {
		// Calculate grid positioning
		const isEven = index % 2 === 0
		return (
			<View
				style={[
					styles.productCardContainer,
					isEven ? styles.leftItem : styles.rightItem,
				]}
			>
				<GradientProductCard
					product={item}
					onToggleFavorite={toggleFavorite}
					style={styles.productCard}
				/>
			</View>
		)
	}

	const renderEmptyState = () => {
		if (isLoading) {
			return (
				<View style={styles.emptyStateContainer}>
					<ActivityIndicator size="large" color="#C67C4E" />
				</View>
			)
		}

		return (
			<View style={styles.emptyStateContainer}>
				<Ionicons name="search-outline" size={64} color="#CCCCCC" />
				<Text style={styles.noResultsText}>{t('noSearchResults')}</Text>
				<Text style={styles.tryAgainText}>{t('tryDifferentKeywords')}</Text>
			</View>
		)
	}

	// Add debounce mechanism
	const isCheckingScroll = useRef(false)
	const scrollTimer = useRef<NodeJS.Timeout | null>(null)
	const buttonAnimInProgress = useRef(false);

	// Function to show scroll-to-bottom button with animation
	const showScrollToBottomButton = () => {
		// Prevent animation interruption if already showing
		if (showScrollButton || buttonAnimInProgress.current) return;
		
		console.log('Showing scroll button')
		buttonAnimInProgress.current = true;
		setShowScrollButton(true)
		
		// Reset animation value before animating
		scrollButtonAnim.setValue(0)
		Animated.timing(scrollButtonAnim, {
			toValue: 1,
			duration: 300,
			useNativeDriver: true,
		}).start(() => {
			buttonAnimInProgress.current = false;
		})
	}

	// Function to hide scroll-to-bottom button with animation
	const hideScrollToBottomButton = () => {
		// Prevent animation interruption if already hiding
		if (!showScrollButton || buttonAnimInProgress.current) return;
		
		buttonAnimInProgress.current = true;
		Animated.timing(scrollButtonAnim, {
			toValue: 0,
			duration: 300,
			useNativeDriver: true,
		}).start(() => {
			setShowScrollButton(false)
			buttonAnimInProgress.current = false;
		})
	}

	// Add this function to debounce scroll position checks with improved stability
	const debouncedScrollCheck = (nativeEvent) => {
		// If a check is already scheduled, do nothing
		if (isCheckingScroll.current) return

		isCheckingScroll.current = true

		// Clear any existing timer to prevent multiple checks
		if (scrollTimer.current) {
			clearTimeout(scrollTimer.current)
		}

		// Set a new debounced timer
		scrollTimer.current = setTimeout(() => {
			const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
			const paddingToBottom = 200

			// Make visibility decision more stable by using a higher threshold
			const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
			
			if (
				distanceFromBottom > paddingToBottom &&
				showProducts &&
				ragProducts.length > 0
			) {
				showScrollToBottomButton()
			} else if (distanceFromBottom <= paddingToBottom) {
				hideScrollToBottomButton()
			}

			// Reset the flag after a complete check cycle
			isCheckingScroll.current = false
		}, 300) // 300ms debounce delay
	}

	// Use the improved scroll position checker
	const checkScrollPosition = ({ nativeEvent }) => {
		debouncedScrollCheck(nativeEvent)
	}
	
	// Function to scroll to bottom smoothly
	const scrollToBottom = () => {
		if (scrollViewRef.current) {
			// Get the ScrollView instance and scroll to end with animation
			scrollViewRef.current.scrollToEnd({ animated: true })
			
			// Hide the button after scrolling starts, with a delay to let animation begin
			setTimeout(() => {
				hideScrollToBottomButton()
			}, 100)
		}
	}

	// Cleanup timers and animation refs on component unmount
	useEffect(() => {
		return () => {
			if (scrollTimer.current) {
				clearTimeout(scrollTimer.current)
			}
			buttonAnimInProgress.current = false;
		}
	}, [])

	// Modify the useEffect that tracks when products should be shown
	useEffect(() => {
		// Only check when we have text and streaming has completed
		if (ragAnswer && !isStreaming && !isThinking && ragProducts.length > 0) {
			console.log('Checking if we should show products now')

			// Show products after a short delay
			setTimeout(() => {
				productAnimRefs.current = ragProducts.map(() => new Animated.Value(0))
				setShowProducts(true)
				setAnimatingProducts(true)

				// Show the scroll button once products are ready to appear
				showScrollToBottomButton()
			}, 800)
		}
	}, [ragAnswer, isStreaming, isThinking, ragProducts.length])

	// Manage product card animations
	useEffect(() => {
		if (animatingProducts && showProducts && ragProducts.length > 0) {
			console.log('Starting product animations')
			// Create animation sequence for products to appear one after another
			const animations = ragProducts.map((_, index) => {
				return Animated.timing(productAnimRefs.current[index], {
					toValue: 1,
					duration: 500,
					delay: index * 250, // Stagger the animations
					useNativeDriver: true,
					easing: Easing.bezier(0.16, 1, 0.3, 1), // Nice spring-like curve
				})
			})

			// Run animations in sequence with staggered timing
			Animated.stagger(200, animations).start(() => {
				console.log('Product animations completed')
				setAnimatingProducts(false)
			})
		}
	}, [animatingProducts, showProducts, ragProducts])

	// Function to get animation style for a product card
	const getProductAnimatedStyle = (index: number) => {
		if (!productAnimRefs.current[index]) return {}

		return {
			opacity: productAnimRefs.current[index],
			transform: [
				{
					translateY: productAnimRefs.current[index].interpolate({
						inputRange: [0, 1],
						outputRange: [50, 0], // Slide up from below
					}),
				},
				{
					scale: productAnimRefs.current[index].interpolate({
						inputRange: [0, 1],
						outputRange: [0.92, 1], // Grow slightly
					}),
				},
			],
		}
	}

	return (
		<LinearGradient
			colors={['#FFFFFF', '#EDC8C9']}
			style={{ flex: 1 }}
			locations={[0.9, 1.0]}
		>
			<SafeAreaView style={styles.container}>
				<StatusBar backgroundColor={'#FFFFFF'} />
				{AlertComponent}

				{/* Header */}
				<View style={styles.header}>
					<NavButton
						direction="back"
						onPress={() => router.back()}
						backgroundColor="#F9F9F9"
						iconColor="#3D3D3D"
						size={40}
						style={styles.backButton}
					/>
					<Text style={styles.headerTitle}>{t('searchResults')}</Text>
				</View>

				<SearchBar
					handleInputChange={setCurrentQuery}
					handleSearchSubmit={performSearch}
					showAiButton={true}
					// handleAiButtonPress={toggleRagMode}
					handleFilterPress={openFilterModal}
					showFiltersButton={!isRagMode} // Hide filters button in RAG mode
					isInitiallyAiMode={isRagMode}
					initialSearchQuery={currentQuery}
				/>

				{/* Active Filters Display - Only shown in normal search mode */}
				{!isRagMode && (
					<View style={styles.filterRow}>
						<TouchableOpacity
							style={styles.refreshButton}
							onPress={refreshResults}
						>
							<Svg width="24" height="24" viewBox="0 0 24 24">
								<G id="refresh_2_fill" fill="none">
									<Path d="M24 0v24H0V0zM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z" />
									<Path
										fill="#385541"
										d="M1.498 12.082c-.01-1.267 1.347-1.987 2.379-1.406l.113.07 2.678 1.804c1.424.96.538 3.146-1.1 2.915l-.137-.025-.109-.024a7.504 7.504 0 0 0 13.175.335 1.5 1.5 0 1 1 2.6 1.498c-2.317 4.02-7.119 6.152-11.815 4.893a10.503 10.503 0 0 1-7.784-10.06m1.406-5.33C5.22 2.731 10.022.6 14.718 1.857a10.503 10.503 0 0 1 7.784 10.06c.01 1.267-1.347 1.987-2.379 1.407l-.113-.07-2.678-1.805c-1.424-.959-.538-3.145 1.099-2.914l.138.025.108.023A7.504 7.504 0 0 0 5.502 8.25a1.5 1.5 0 1 1-2.598-1.498"
									/>
								</G>
							</Svg>
						</TouchableOpacity>
						{activeFilters.length > 0 && (
							<View style={styles.activeFiltersContainer}>
								<View style={styles.filtersScrollWrapper}>
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										contentContainerStyle={styles.activeFiltersScrollContent}
									>
										{activeFilters.map((filter) => (
											<TouchableOpacity
												key={filter.id}
												style={[
													styles.activeFilterChip,
													filter.type === 'category'
														? styles.categoryFilterChip
														: styles.priceFilterChip,
												]}
												onPress={() => removeFilter(filter.id)}
											>
												<Text style={styles.activeFilterChipText}>
													{filter.name}
												</Text>
												<Ionicons name="close" size={16} color="#383838" />
											</TouchableOpacity>
										))}
									</ScrollView>
								</View>
							</View>
						)}
					</View>
				)}

				{/* Show RAG results if in RAG mode */}
				{isRagMode ? (
					<View style={styles.ragContainer}>
						<ScrollView
							style={styles.ragScrollView}
							contentContainerStyle={styles.ragContentContainer}
							ref={scrollViewRef}
							onScroll={checkScrollPosition}
							scrollEventThrottle={500} // Increase throttle value to reduce event frequency
						>
							{/* Thinking card - displayed during the thinking phase */}
							<ThinkingCard
								title={t('isThinking')}
								streamingText={thinkingText}
								isLoading={isThinking}
							/>

							{/* Display the streamed text response */}
							{!isThinking && (ragAnswer || isStreaming) && (
								<RAGResponseBubble
									text={ragAnswer || t('thinking')}
									isLoading={isStreaming && ragAnswer === ''}
								/>
							)}

							{/* Display product cards with animation */}
							{ragProducts.length > 0 &&
								ragProducts.map((product, index) => (
									<Animated.View
										key={`${product.product_code}-${index}`}
										style={[
											{ marginBottom: 12 },
											showProducts
												? getProductAnimatedStyle(index)
												: { opacity: 0, transform: [{ translateY: 50 }, { scale: 0.92 }] },
										]}
									>
										<RAGProductCard product={product} />
									</Animated.View>
								))}

							{/* Always render products but with zero opacity if not showing yet */}
							{ragProducts.length > 0 && !showProducts && (
								<View style={styles.productsComingSoonContainer}>
									<Text style={styles.productsComingSoonText}>
										{t('productsWillAppearSoon')}
									</Text>
								</View>
							)}

							{/* Loading indicator while waiting for initial response */}
							{isLoading &&
								!ragAnswer &&
								!ragProducts.length &&
								!isThinking && (
									<ActivityIndicator
										size="large"
										color="#C67C4E"
										style={styles.ragLoader}
									/>
								)}
						</ScrollView>

						{/* Improved button visibility - always render it, but conditionally show/hide */}
						<Animated.View
							style={[
								styles.scrollToBottomButton,
								{
									opacity: scrollButtonAnim,
									transform: [
										{
											translateY: scrollButtonAnim.interpolate({
												inputRange: [0, 1],
												outputRange: [20, 0],
											}),
										},
									],
									// Use opacity for animation but don't use display:none to prevent unmounting
								},
							]}
							pointerEvents={showScrollButton ? 'auto' : 'none'}
						>
							<TouchableOpacity
								style={styles.scrollToBottomButtonTouchable}
								onPress={scrollToBottom}
								activeOpacity={0.8}
							>
								<LinearGradient
									colors={['#C67C4E', '#B17F59']}
									style={styles.scrollToBottomButtonGradient}
								>
									<Text style={styles.scrollToBottomButtonText}>
										{t('viewAllProducts')}
									</Text>
									<Ionicons name="chevron-down" size={18} color="#FFFFFF" />
								</LinearGradient>
							</TouchableOpacity>
						</Animated.View>
					</View>
				) : // Normal search results
				results.length > 0 ? (
					<FlatList
						data={results}
						renderItem={renderItem}
						keyExtractor={(item) => item.productId.toString()}
						numColumns={2}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.resultsContainer}
						columnWrapperStyle={styles.row}
					/>
				) : (
					renderEmptyState()
				)}

				{/* Filter Modal */}
				<Modal
					visible={showFilterModal}
					transparent={true}
					animationType="none"
					onRequestClose={closeFilterModal}
				>
					<TouchableWithoutFeedback onPress={closeFilterModal}>
						<View style={styles.modalOverlay}>
							<TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
								<Animated.View
									style={[
										styles.modalContainer,
										{ transform: [{ translateY: modalAnimation }] },
									]}
								>
									<View style={styles.modalHeader}>
										<Text style={styles.modalTitle}>{t('filter')}</Text>
										<TouchableOpacity
											onPress={closeFilterModal}
											style={styles.closeButton}
										>
											<Ionicons name="close" size={24} color="#474747" />
										</TouchableOpacity>
									</View>

									<ScrollView style={styles.modalContent}>
										{/* Food Category Section */}
										<Text style={styles.filterSectionTitle}>
											{t('productCategories').toUpperCase()}
										</Text>
										<View style={styles.filterOptionsContainer}>
											{FILTER_CATEGORIES.filter((cat) => cat.id !== 'all').map(
												(category) => (
													<TouchableOpacity
														key={category.id}
														style={[
															styles.checkboxContainer,
															selectedCategory === category.id &&
																styles.selectedCheckbox,
														]}
														onPress={() =>
															setSelectedCategory(
																selectedCategory === category.id
																	? ''
																	: category.id
															)
														}
													>
														<View
															style={[
																styles.checkbox,
																selectedCategory === category.id &&
																	styles.checkboxChecked,
															]}
														>
															{selectedCategory === category.id && (
																<Ionicons
																	name="checkmark"
																	size={16}
																	color="#FFFFFF"
																/>
															)}
														</View>
														<Text style={styles.checkboxLabel}>
															{t(category.name)}
														</Text>
													</TouchableOpacity>
												)
											)}
										</View>

										{/* Price Range Section */}
										<Text style={styles.filterSectionTitle}>
											{t('priceRange').toUpperCase()}
										</Text>
										<View style={styles.filterOptionsContainer}>
											{PRICE_RANGES.map((price) => (
												<TouchableOpacity
													key={price.id}
													style={[
														styles.checkboxContainer,
														selectedPriceRange === price.id &&
															styles.selectedCheckbox,
													]}
													onPress={() =>
														setSelectedPriceRange(
															selectedPriceRange === price.id ? '' : price.id
														)
													}
												>
													<View
														style={[
															styles.checkbox,
															selectedPriceRange === price.id &&
																styles.checkboxChecked,
														]}
													>
														{selectedPriceRange === price.id && (
															<Ionicons
																name="checkmark"
																size={16}
																color="#FFFFFF"
															/>
														)}
													</View>
													<Text style={styles.checkboxLabel}>{price.name}</Text>
												</TouchableOpacity>
											))}
										</View>
									</ScrollView>

									<View style={styles.modalFooter}>
										<Button
											text={t('apply')}
											onPress={applyFilters}
											backgroundColor="#C67C4E"
											style={styles.applyButton}
										/>
									</View>
								</Animated.View>
							</TouchableWithoutFeedback>
						</View>
					</TouchableWithoutFeedback>
				</Modal>
			</SafeAreaView>
		</LinearGradient>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		// backgroundColor: '#FFFFFF',
		paddingHorizontal: 'auto',
	},
	filterRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#F5F5F5',
		marginBottom: 16,
	},
	backButton: {
		position: 'absolute',
		left: 16,
		zIndex: 10,
	},
	headerTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#3D3D3D',
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: '#F5F5F5',
	},
	searchInputWrapper: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF8EF',
		borderRadius: 100,
		borderWidth: 1,
		borderColor: '#A0998E',
		paddingHorizontal: 12,
		height: 44,
	},
	searchIcon: {
		marginRight: 8,
	},
	searchInput: {
		flex: 1,
		fontSize: 14,
		color: '#3D3D3D',
		fontFamily: 'Inter-Regular',
		paddingVertical: 8,
	},
	filterButton: {
		width: 44,
		height: 44,
		borderRadius: 10,
		backgroundColor: '#FFF8EF',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 12,
	},
	filtersContainer: {
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#F5F5F5',
	},
	filtersScrollContent: {
		paddingHorizontal: 16,
	},
	filterItem: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: '#F5F5F5',
		borderRadius: 100,
		marginRight: 8,
	},
	activeFilterItem: {
		backgroundColor: '#C67C4E',
	},
	filterText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#6A6A6A',
	},
	activeFilterText: {
		color: '#FFFFFF',
	},
	resultsContainer: {
		paddingBottom: 100, // Extra space for bottom bar
	},
	row: {
		justifyContent: 'space-between',
		width: '100%',
	},
	productCardContainer: {
		width: (width - 30) / 2, // Adjust width to account for container padding
		marginBottom: 16,
	},
	productCard: {
		width: '100%',
	},
	leftItem: {
		paddingRight: 0,
		paddingLeft: 4,
	},
	rightItem: {
		marginRight: 18,
	},
	emptyStateContainer: {
		flex: 1,
		justifyContent: 'flex-start',
		alignItems: 'center',
		alignSelf: 'center',
		paddingHorizontal: 40,
		marginTop: 80,
	},
	noResultsText: {
		fontSize: 18,
		fontFamily: 'Inter-Medium',
		color: '#3D3D3D',
		marginTop: 16,
		marginBottom: 8,
		textAlign: 'center',
	},
	tryAgainText: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#6A6A6A',
		textAlign: 'center',
		lineHeight: 20,
	},
	activeFiltersContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 40,
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderWidth: 1,
		borderColor: '#B17F59',
		borderStyle: 'dashed',
		marginHorizontal: 'auto',
		alignSelf: 'center',
		width: '80%',
		height: 'auto',
		justifyContent: 'space-between',
	},
	filtersScrollWrapper: {
		flex: 1,
	},
	activeFiltersScrollContent: {
		paddingRight: 8,
	},
	activeFilterChip: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 6,
		marginRight: 10,
	},
	categoryFilterChip: {
		backgroundColor: '#DEB3F8', // Purple color for category chips
	},
	priceFilterChip: {
		backgroundColor: '#DBDBDB', // Gray color for price chips
	},
	activeFilterChipText: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#474747',
		marginRight: 8,
	},
	refreshButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 8,
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 1,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalContainer: {
		backgroundColor: '#FAF9F6',
		borderTopLeftRadius: 34,
		borderTopRightRadius: 34,
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 30,
		minHeight: height * 0.6,
		maxHeight: height * 0.8,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
		position: 'relative',
	},
	modalTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#383838',
	},
	closeButton: {
		position: 'absolute',
		right: 0,
		padding: 8,
	},
	modalContent: {
		marginBottom: 20,
	},
	filterSectionTitle: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#000000',
		marginTop: 16,
		marginBottom: 12,
	},
	filterOptionsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 16,
	},
	checkboxContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 16,
		marginBottom: 16,
		paddingVertical: 5,
	},
	selectedCheckbox: {
		backgroundColor: 'transparent',
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#B17F59',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
	},
	checkboxChecked: {
		backgroundColor: '#B17F59',
		borderColor: '#B17F59',
	},
	checkboxLabel: {
		fontSize: 16,
		fontFamily: 'Inter-Regular',
		color: '#191D21',
	},
	modalFooter: {
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: '#E8E8E8',
	},
	applyButton: {
		width: '100%',
		backgroundColor: '#C67C4E',
		borderRadius: 19,
	},
	ragContainer: {
		flex: 1,
		position: 'relative',
	},
	ragScrollView: {
		flex: 1,
	},
	ragContentContainer: {
		paddingTop: 16,
		paddingBottom: 100, // Extra padding at bottom
	},
	ragLoader: {
		marginTop: 40,
	},
	scrollToBottomButton: {
		position: 'absolute',
		bottom: 80,
		alignSelf: 'center',
		zIndex: 9999, // Ensure very high z-index
		width: 180, // Made wider to be more noticeable
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 3,
	},
	scrollToBottomButtonTouchable: {
		borderRadius: 24,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 3,
		},
		shadowOpacity: 0.27,
		shadowRadius: 4.65,
		elevation: 6,
	},
	scrollToBottomButtonGradient: {
		flexDirection: 'row',
		paddingVertical: 12, // Make button taller
		paddingHorizontal: 20, // Add more horizontal padding
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 24,
	},
	scrollToBottomButtonText: {
		fontFamily: 'Inter-Medium',
		fontSize: 14,
		color: '#FFFFFF',
		marginRight: 8,
	},
	productsComingSoonContainer: {
		padding: 16,
		alignItems: 'center',
	},
	productsComingSoonText: {
		fontFamily: 'Inter-Regular',
		fontSize: 14,
		color: '#999',
		fontStyle: 'italic',
	},
})
