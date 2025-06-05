import React, { useState, useEffect, useRef, useCallback } from 'react'
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
	KeyboardAvoidingView,
	Platform,
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
import BottomSpacer from '@/components/shared/BottomSpacer'

const { width, height } = Dimensions.get('window')

const FILTER_CATEGORIES: { id: number; name: string }[] = [
	{ id: 0, name: 'all' },
	{ id: 1, name: 'bingsu' },
	{ id: 3, name: 'cakesPastries' },
	{ id: 4, name: 'layeredCakesCrispyBread' },
	{ id: 5, name: 'bread' },
	{ id: 6, name: 'coldCreamCakes' },
	{ id: 7, name: 'cookies' },
	{ id: 8, name: 'seasonalSpecial' },
	{ id: 9, name: 'productSets' },
	{ id: 10, name: 'icedDrinks' },
	{ id: 11, name: 'tea' },
	{ id: 12, name: 'chocolateCacao' },
	{ id: 13, name: 'coffee' },
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
		category_id: number
		description: string
		product_id: number
		total_ratings: number
		overall_stars: number
		total_orders: number
		image_url: string
		sizes_prices: Record<string, any> // JSON of sizes and prices
		discount_percentage: number
	}
}

// New type for "thinking" data stream
interface RAGThinkingChunk {
	type: 'thinking'
	chunk: string
}

// Type for session_id response
interface RAGSessionIdChunk {
	type: 'session_id'
	session_id: string
}

type RAGChunk =
	| RAGTextChunk
	| RAGProductData
	| RAGThinkingChunk
	| RAGSessionIdChunk

// Type definitions for semantic search results
interface SemanticProductData {
	product_code: string
	product_name: string
	category_id: number
	category_name: string
	product_id: number
	total_ratings: number
	overall_stars: number
	total_orders: number
	discount_percentage: number
	image_url: string
	price: string
	is_favorited: boolean
}

// Add conversation message type
interface ConversationMessage {
	id: string
	type: 'user' | 'assistant'
	content: string
	timestamp: Date
	products?: RAGProductData['data'][]
}

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
	const [activeFilter, setActiveFilter] = useState('all')
	const [showFilterModal, setShowFilterModal] = useState(false)
	const [showScrollButton, setShowScrollButton] = useState(false)
	const scrollButtonAnim = useRef(new Animated.Value(0)).current

	// Add session and conversation state
	const [sessionId, setSessionId] = useState<string | null>(null)
	const [conversationHistory, setConversationHistory] = useState<
		ConversationMessage[]
	>([])
	const [chatInput, setChatInput] = useState('')
	const [isSendingMessage, setIsSendingMessage] = useState(false)

	// RAG search state
	const [isRagMode, setIsRagMode] = useState(params.isAiMode === 'true')
	const [ragAnswer, setRagAnswer] = useState('')
	const [ragProducts, setRagProducts] = useState<RAGProductData['data'][]>([])
	const [isStreaming, setIsStreaming] = useState(false)
	const [thinkingText, setThinkingText] = useState('')
	const [isThinking, setIsThinking] = useState(false)
	const [showProducts, setShowProducts] = useState(false)
	const [animatingProducts, setAnimatingProducts] = useState(false)
	const productAnimRefs = useRef<Animated.Value[]>([])
	const hasCompletedAnswering = useRef(false)

	// Filter states
	const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
		null
	)
	const [selectedPriceRange, setSelectedPriceRange] = useState('')
	const [activeFilters, setActiveFilters] = useState<
		{
			id: string | number
			type: 'category' | 'price'
			name: string
		}[]
	>([])

	// Auth context
	const { authState } = useAuth()

	// Simplified state for semantic search results
	const [semanticResults, setSemanticResults] = useState<SemanticProductData[]>(
		[]
	)
	const [filteredResults, setFilteredResults] = useState<SemanticProductData[]>(
		[]
	)

	// Add pagination state for semantic search
	const [hasMore, setHasMore] = useState(false)
	const [currentOffset, setCurrentOffset] = useState(0)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const ITEMS_PER_PAGE = 10

	// Add state to track which messages should be animated
	const [animatedMessageIds, setAnimatedMessageIds] = useState<Set<string>>(
		new Set()
	)
	const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<
		string | null
	>(null)

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
		console.log('Performing search:', { isAiMode, query })
		// Reset pagination state when performing a new search
		setCurrentOffset(0)
		setHasMore(false)
		setSemanticResults([])
		setFilteredResults([])

		if (!query) {
			console.log('Empty query, skipping search')
			return
		}

		if (isAiMode) {
			performRagSearch(query)
		} else {
			performNormalSearch(query, 0, true)
		}
	}

	// Most important function: perform RAG search
	const performRagSearch = async (
		query: string,
		isFollowUp: boolean = false
	) => {
		const messageId = Date.now().toString()

		// Add user message to conversation history
		const userMessage: ConversationMessage = {
			id: `user-${messageId}`,
			type: 'user',
			content: query,
			timestamp: new Date(),
		}

		if (isFollowUp) {
			setConversationHistory((prev) => [...prev, userMessage])
			setIsSendingMessage(true)
		} else {
			setIsLoading(true)
			setIsStreaming(true)
			setConversationHistory([userMessage])
		}

		// Set current streaming message ID for animation tracking
		setCurrentStreamingMessageId(`assistant-${messageId}`)

		// Reset current streaming state (keep conversation history intact)
		setRagAnswer('')
		setRagProducts([])
		setThinkingText('')
		setIsThinking(true)
		// setShowProducts(false)
		setAnimatingProducts(false)
		productAnimRefs.current = []
		hasCompletedAnswering.current = false

		try {
			// Close any existing connection
			if (eventSourceRef.current) {
				eventSourceRef.current.close()
				eventSourceRef.current = null
			}

			// Create endpoint with session ID if available
			let endpoint = productAPI.getSearchRagEndpoint(query)
			if (sessionId && isFollowUp) {
				endpoint += `&session_id=${sessionId}`
			}

			const headers: Record<string, string> = {
				Authorization: authState.authToken ?? '',
				Accept: 'text/event-stream',
				'Cache-Control': 'no-cache',
			}

			// Add session ID to headers if available
			if (sessionId && isFollowUp) {
				headers['X-Session-ID'] = sessionId
			}

			const eventSource = new EventSource(endpoint, { headers })
			eventSourceRef.current = eventSource

			// Track assistant message content
			let assistantContent = ''
			let assistantProducts: RAGProductData['data'][] = []

			// Set up event listeners
			eventSource.addEventListener('open', (event) => {
				console.log('SSE connection opened')

				if (!isFollowUp) {
					setIsLoading(false)
				}
			})

			eventSource.addEventListener('message', (event) => {
				try {
					console.log('Received SSE message:', event.data)

					if (event.data === '[DONE]') {
						// Create assistant message for conversation history
						const assistantMessage: ConversationMessage = {
							id: `assistant-${messageId}`,
							type: 'assistant',
							content: assistantContent,
							timestamp: new Date(),
							products:
								assistantProducts.length > 0 ? assistantProducts : undefined,
						}

						// Add to conversation history
						setConversationHistory((prev) => [...prev, assistantMessage])

						// Mark this message for animation
						setAnimatedMessageIds(
							(prev) => new Set([...prev, assistantMessage.id])
						)

						// End of stream, close connection
						eventSource.close()
						eventSourceRef.current = null
						setIsStreaming(false)
						setIsThinking(false)
						setIsSendingMessage(false)

						// Clear current streaming state since it's now in conversation history
						setRagProducts([])
						setRagAnswer('')
						setCurrentStreamingMessageId(null)

						// Trigger animations for the new assistant message IMMEDIATELY
						if (assistantProducts.length > 0) {
							console.log(
								'Setting up animations for new message products, count:',
								assistantProducts.length
							)

							// Set up animation refs for the products
							productAnimRefs.current = assistantProducts.map(
								() => new Animated.Value(0)
							)

							// Start animation immediately
							setAnimatingProducts(true)

							// Create animation sequence
							const productShowDelay = 5000
							setTimeout(() => {
								const animations = assistantProducts.map((_, index) => {
									return Animated.timing(productAnimRefs.current[index], {
										toValue: 1,
										duration: 500,
										delay: index * 250,
										useNativeDriver: true,
										easing: Easing.bezier(0.16, 1, 0.3, 1),
									})
								})

								// Run animations
								Animated.stagger(500, animations).start(() => {
									console.log('Product animations completed')
									setAnimatingProducts(false)
								})
							}, productShowDelay)
						}
						return
					}

					const data: RAGChunk = JSON.parse(event.data || '{}')

					if (data.type === 'thinking') {
						console.log('Thinking chunk received:', data.chunk)
						setThinkingText((prev) => prev + (data.chunk || '') + '\n')
					} else if (data.type === 'answer') {
						const chunk = data.chunk || ''
						assistantContent += chunk
						setRagAnswer((prev) => prev + chunk)
					} else if (data.type === 'product') {
						assistantProducts.push(data.data)
						setRagProducts((prev) => [...prev, data.data])
					} else if (data.type === 'session_id') {
						setSessionId(data.session_id)
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
				setIsSendingMessage(false)
			})
		} catch (error) {
			console.error('Error setting up RAG search:', error)
			showError(t('errorRetry'))
			setIsStreaming(false)
			setIsLoading(false)
			setIsThinking(false)
			setIsSendingMessage(false)

			// Close any existing connection on error
			if (eventSourceRef.current) {
				eventSourceRef.current.close()
				eventSourceRef.current = null
			}
		}
	}

	// Add function to handle sending follow-up messages
	const handleSendMessage = () => {
		const trimmedInput = chatInput.trim()
		if (!trimmedInput || isSendingMessage || isStreaming) return

		setChatInput('')
		performRagSearch(trimmedInput, true)
	}

	const performNormalSearch = async (
		query: string,
		offset: number = 0,
		shouldReplace: boolean = true
	) => {
		if (offset === 0) {
			setIsLoading(true)
		} else {
			setIsLoadingMore(true)
		}

		try {
			console.log(
				'API Call - Query:',
				query,
				'Offset:',
				offset,
				'Limit:',
				ITEMS_PER_PAGE
			)

			const response = await productAPI.searchSemantics(
				query,
				offset,
				ITEMS_PER_PAGE
			)

			if (response.data?.products && Array.isArray(response.data.products)) {
				const searchResults = response.data.products as SemanticProductData[]
				const hasMoreFromAPI = response.data.has_more || false

				console.log(
					'API Response - Products count:',
					searchResults.length,
					'Has more:',
					hasMoreFromAPI
				)
				console.log(
					'API Response - Product IDs:',
					searchResults.map((p) => p.product_id)
				)

				let allSemanticResults: SemanticProductData[]

				if (shouldReplace) {
					allSemanticResults = searchResults
					setSemanticResults(searchResults)
					setCurrentOffset(searchResults.length)
				} else {
					// Check for duplicates before appending
					const existingIds = new Set(semanticResults.map((p) => p.product_id))
					const newUniqueResults = searchResults.filter(
						(p) => !existingIds.has(p.product_id)
					)

					console.log('Existing IDs:', Array.from(existingIds))
					console.log('New unique results count:', newUniqueResults.length)

					allSemanticResults = [...semanticResults, ...newUniqueResults]
					setSemanticResults(allSemanticResults)
					setCurrentOffset(allSemanticResults.length)
				}

				setHasMore(hasMoreFromAPI)

				// Apply any active filters to all results
				const filtered = applyActiveFilters(allSemanticResults)
				setFilteredResults(filtered)
			} else {
				// Handle empty or invalid response
				if (shouldReplace) {
					setSemanticResults([])
					setFilteredResults([])
					setHasMore(false)
					setCurrentOffset(0)
				}
			}
		} catch (error) {
			console.error('Semantic search error:', error)
			showError(t('errorRetry'))

			// Reset results on error only if it's the first load
			if (shouldReplace) {
				setSemanticResults([])
				setFilteredResults([])
				setHasMore(false)
				setCurrentOffset(0)
			}
		} finally {
			if (offset === 0) {
				setIsLoading(false)
			} else {
				setIsLoadingMore(false)
			}
		}
	}

	// Function to load more results
	const loadMoreResults = async () => {
		if (!hasMore || isLoadingMore || isLoading) {
			console.log('Load more blocked:', { hasMore, isLoadingMore, isLoading })
			return
		}

		console.log('Loading more results with offset:', currentOffset)
		await performNormalSearch(currentQuery, currentOffset, false)
	}

	// Update applyActiveFilters to work with category IDs
	const applyActiveFilters = (
		products: SemanticProductData[]
	): SemanticProductData[] => {
		if (activeFilters.length === 0) {
			return products
		}

		let filtered = [...products]

		// Apply category filter using category_id
		const categoryFilter = activeFilters.find((f) => f.type === 'category')
		if (categoryFilter) {
			filtered = filtered.filter((product) => {
				// Use category_id for filtering instead of category_name
				return product.category_id === categoryFilter.id
			})
		}

		// Apply price filter
		const priceFilter = activeFilters.find((f) => f.type === 'price')
		if (priceFilter) {
			const priceRange = PRICE_RANGES.find((p) => p.id === priceFilter.id)
			if (priceRange) {
				filtered = filtered.filter((product) => {
					const productPrice = parseInt(product.price)
					return (
						productPrice >= priceRange.min && productPrice <= priceRange.max
					)
				})
			}
		}

		return filtered
	}

	// Toggle favorite status of a product - now works with semanticResults
	const toggleFavorite = (productId: number) => {
		// Update the semantic results
		setSemanticResults((prev) =>
			prev.map((product) =>
				product.product_id === productId
					? { ...product }
					: { ...product, is_favorited: !product.is_favorited }
			)
		)

		// Update filtered results if they exist
		setFilteredResults((prev) =>
			prev.map((product) =>
				product.product_id === productId
					? { ...product, isFavorite: !product.is_favorited }
					: { ...product, isFavorite: product.is_favorited || false }
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
		if (selectedCategoryId && selectedCategoryId !== 0) {
			const category = FILTER_CATEGORIES.find(
				(c) => c.id === selectedCategoryId
			)
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

		// Apply filters to current semantic results using the NEW filters (not the state)
		if (!isRagMode && semanticResults.length > 0) {
			console.log(
				'Actually applying filters to semantic results with new filters:',
				newActiveFilters
			)
			const filtered = applyActiveFiltersWithProvidedFilters(
				semanticResults,
				newActiveFilters
			)
			setFilteredResults(filtered)
		}
	}

	// Create a version of applyActiveFilters that accepts filters as parameter
	const applyActiveFiltersWithProvidedFilters = (
		products: SemanticProductData[],
		filters: typeof activeFilters
	): SemanticProductData[] => {
		if (filters.length === 0) {
			return products
		}

		let filtered = [...products]

		// Apply category filter using category_id
		const categoryFilter = filters.find((f) => f.type === 'category')
		if (categoryFilter) {
			filtered = filtered.filter((product) => {
				// Use category_id for filtering instead of category_name
				return product.category_id === categoryFilter.id
			})
		}

		// Apply price filter
		const priceFilter = filters.find((f) => f.type === 'price')
		if (priceFilter) {
			const priceRange = PRICE_RANGES.find((p) => p.id === priceFilter.id)
			if (priceRange) {
				filtered = filtered.filter((product) => {
					const productPrice = parseInt(product.price)
					return (
						productPrice >= priceRange.min && productPrice <= priceRange.max
					)
				})
			}
		}

		return filtered
	}

	// Remove a specific filter
	const removeFilter = (filterId: string | number) => {
		const newActiveFilters = activeFilters.filter(
			(filter) => filter.id !== filterId
		)
		setActiveFilters(newActiveFilters)

		// Reset the corresponding filter state
		if (filterId === selectedCategoryId) {
			setSelectedCategoryId(null)
		} else if (filterId === selectedPriceRange) {
			setSelectedPriceRange('')
		}

		// Re-apply remaining filters to semantic results using the NEW filters
		if (!isRagMode && semanticResults.length > 0) {
			const filtered = applyActiveFiltersWithProvidedFilters(
				semanticResults,
				newActiveFilters
			)
			setFilteredResults(filtered)
		}
	}

	// Add function to clear all filters
	const clearAllFilters = () => {
		setActiveFilters([])
		setSelectedCategoryId(null)
		setSelectedPriceRange('')

		// Reset to original search results without filters
		if (!isRagMode && semanticResults.length > 0) {
			setFilteredResults([]) // Clear filtered results to show all semantic results
		}
	}

	// Update the refreshResults function to reset offset properly
	const refreshResults = async () => {
		if (!currentQuery) {
			console.log('No query to refresh results for')
			return
		}
		console.log('Refreshing results')
		setCurrentOffset(0)
		setHasMore(false)
		setSemanticResults([])
		setFilteredResults([])
		setIsLoading(true)

		try {
			performSearch(isRagMode, currentQuery)
		} catch (error) {
			console.error('Error refreshing results:', error)
			showError(t('errorRetry'))
		} finally {
			setIsLoading(false)
		}
	}

	// Convert semantic product to UI format for rendering
	const convertToUIFormat = (product: SemanticProductData) => ({
		productId: product.product_id,
		name: product.product_name,
		price: parseInt(product.price),
		imageUrl: product.image_url,
		isFavorite: product.is_favorited || false,
		gradientColors: undefined,
	})

	const renderItem = ({
		item,
		index,
	}: {
		item: SemanticProductData
		index: number
	}) => {
		// Calculate grid positioning
		const isEven = index % 2 === 0
		const uiProduct = convertToUIFormat(item)

		return (
			<View
				style={[
					styles.productCardContainer,
					isEven ? styles.leftItem : styles.rightItem,
				]}
			>
				<GradientProductCard
					product={uiProduct}
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
	const buttonAnimInProgress = useRef(false)

	// Function to show scroll-to-bottom button with animation
	const showScrollToBottomButton = () => {
		// Prevent animation interruption if already showing
		if (showScrollButton || buttonAnimInProgress.current) return

		console.log('Showing scroll button')
		buttonAnimInProgress.current = true
		setShowScrollButton(true)

		// Reset animation value before animating
		scrollButtonAnim.setValue(0)
		Animated.timing(scrollButtonAnim, {
			toValue: 1,
			duration: 300,
			useNativeDriver: true,
		}).start(() => {
			buttonAnimInProgress.current = false
		})
	}

	// Function to hide scroll-to-bottom button with animation
	const hideScrollToBottomButton = () => {
		// Prevent animation interruption if already hiding
		if (!showScrollButton || buttonAnimInProgress.current) return

		buttonAnimInProgress.current = true
		Animated.timing(scrollButtonAnim, {
			toValue: 0,
			duration: 300,
			useNativeDriver: true,
		}).start(() => {
			setShowScrollButton(false)
			buttonAnimInProgress.current = false
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
			const distanceFromBottom =
				contentSize.height - layoutMeasurement.height - contentOffset.y

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
			buttonAnimInProgress.current = false
		}
	}, [])

	// Handle end reached for FlatList
	const handleEndReached = () => {
		if (!isRagMode && hasMore && !isLoadingMore && !isLoading) {
			console.log('Loading more results...', {
				hasMore,
				isLoadingMore,
				isLoading,
			})
			loadMoreResults()
		}
	}

	// Add render footer component for loading more indicator
	const renderFooter = () => {
		if (!isLoadingMore) return null

		return (
			<View style={styles.loadingMoreContainer}>
				<ActivityIndicator size="small" color="#C67C4E" />
				<Text style={styles.loadingMoreText}>{t('loadingMore')}</Text>
			</View>
		)
	}

	// Determine which results to display
	const displayResults = (() => {
		// If there are active filters, always show filtered results (even if empty)
		if (activeFilters.length > 0) {
			return filteredResults
		}
		// If no active filters, show all semantic results
		return semanticResults
	})()

	// Enhanced renderConversationMessage function - handles ALL conversation display
	const renderConversationMessage = (
		message: ConversationMessage,
		index: number
	) => {
		const shouldAnimate = animatedMessageIds.has(message.id)
		const isCurrentStreaming = currentStreamingMessageId === message.id

		if (message.type === 'user') {
			return (
				<View key={message.id} style={styles.userMessageContainer}>
					<View style={styles.userMessageBubble}>
						<Text style={styles.userMessageText}>{message.content}</Text>
					</View>
				</View>
			)
		} else {
			// For assistant messages, show the content and products if any
			return (
				<View key={message.id} style={styles.assistantMessageContainer}>
					{message.content && (
						<RAGResponseBubble
							text={message.content}
							isLoading={false}
							shouldAnimate={shouldAnimate && !isCurrentStreaming}
							messageId={message.id}
						/>
					)}
					{message.products &&
						message.products.map((product, productIndex) => (
							<View
								key={`${message.id}-product-${productIndex}`}
								style={{ marginBottom: 12 }}
							>
								<RAGProductCard product={product} />
							</View>
						))}
				</View>
			)
		}
	}

	// Clean up animation tracking after animations complete - use useCallback to prevent re-renders
	const cleanupAnimationTracking = useCallback(() => {
		if (!animatingProducts && animatedMessageIds.size > 0) {
			setTimeout(() => {
				setAnimatedMessageIds(new Set())
			}, 2000)
		}
	}, [animatingProducts, animatedMessageIds.size])

	useEffect(() => {
		cleanupAnimationTracking()
	}, [cleanupAnimationTracking])

	// Remove the problematic product animation effects that were causing re-renders
	// Keep only essential animation logic

	// SIMPLIFIED ScrollView content - ONLY conversation history, NO duplicates
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
					handleAiButtonPress={() => setIsRagMode(!isRagMode)}
					showAiButton={true}
					handleFilterPress={openFilterModal}
					showFiltersButton={!isRagMode} // Hide filters button in RAG mode
					isInitiallyAiMode={isRagMode}
					initialSearchQuery={currentQuery}
					// disabled={isRagMode && (isStreaming || isSendingMessage)} // Disable during streaming
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
					<KeyboardAvoidingView
						style={styles.ragContainer}
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
					>
						<ScrollView
							style={styles.ragScrollView}
							contentContainerStyle={styles.ragContentContainer}
							ref={scrollViewRef}
							onScroll={checkScrollPosition}
							scrollEventThrottle={500}
							removeClippedSubviews={true}
							maxToRenderPerBatch={5}
							windowSize={10}
						>
							{/* ONLY conversation history - renderConversationMessage handles ALL display logic */}
							{conversationHistory.map((message, index) =>
								renderConversationMessage(message, index)
							)}

							{/* Show current streaming content ONLY while streaming (before it's added to conversation) */}
							{currentStreamingMessageId && (
								<>
									{/* Current thinking */}
									{isThinking && (
										<ThinkingCard
											title={t('isThinking')}
											streamingText={thinkingText}
											isLoading={isThinking}
										/>
									)}

									{/* Current streaming response */}
									{(ragAnswer || isStreaming) && !isThinking && (
										<RAGResponseBubble
											text={ragAnswer || t('thinking')}
											isLoading={isStreaming && ragAnswer === ''}
											shouldAnimate={true}
											messageId={currentStreamingMessageId}
										/>
									)}

									{/* Current streaming products - temporary display only */}
									{ragProducts.length > 0 &&
										ragProducts.map((product, index) => (
											<View
												key={`streaming-${product.product_code}-${index}`}
												style={{ marginBottom: 12, opacity: 0.7 }}
											>
												<RAGProductCard product={product} />
											</View>
										))}
								</>
							)}

							{/* Loading indicator for initial response */}
							{isLoading && conversationHistory.length === 0 && (
								<ActivityIndicator
									size="large"
									color="#C67C4E"
									style={styles.ragLoader}
								/>
							)}
						</ScrollView>

						{/* Chat Input - only show after first response */}
						{sessionId && (
							<View style={styles.chatInputContainer}>
								<View style={styles.chatInputWrapper}>
									<TextInput
										style={styles.chatInput}
										value={chatInput}
										onChangeText={setChatInput}
										placeholder={t('askFollowUpQuestion')}
										placeholderTextColor="#999"
										multiline
										maxLength={500}
										editable={!isSendingMessage && !isStreaming}
									/>
									<TouchableOpacity
										style={[
											styles.sendButton,
											(!chatInput.trim() || isSendingMessage || isStreaming) &&
												styles.sendButtonDisabled,
										]}
										onPress={handleSendMessage}
										disabled={
											!chatInput.trim() || isSendingMessage || isStreaming
										}
									>
										{isSendingMessage ? (
											<ActivityIndicator size="small" color="#FFFFFF" />
										) : (
											<Ionicons name="send" size={20} color="#FFFFFF" />
										)}
									</TouchableOpacity>
								</View>
							</View>
						)}

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
					</KeyboardAvoidingView>
				) : // Normal search results with infinite scrolling
				displayResults.length > 0 ? (
					<FlatList
						data={displayResults}
						renderItem={renderItem}
						keyExtractor={(item, index) =>
							`product-${item.product_id}-${index}`
						}
						numColumns={2}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.resultsContainer}
						columnWrapperStyle={styles.row}
						onEndReached={handleEndReached}
						onEndReachedThreshold={0.1}
						ListFooterComponent={renderFooter}
						removeClippedSubviews={false}
						initialNumToRender={10}
						maxToRenderPerBatch={10}
						updateCellsBatchingPeriod={50}
						windowSize={10}
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
											{FILTER_CATEGORIES.filter((cat) => cat.id !== null).map(
												(category) => (
													<TouchableOpacity
														key={category.id}
														style={[
															styles.checkboxContainer,
															selectedCategoryId === category.id
																? styles.selectedCheckbox
																: null,
														]}
														onPress={() =>
															setSelectedCategoryId(
																selectedCategoryId === category.id
																	? null
																	: category.id
															)
														}
													>
														<View
															style={[
																styles.checkbox,
																selectedCategoryId === category.id
																	? styles.checkboxChecked
																	: null,
															]}
														>
															{selectedCategoryId === category.id && (
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
														selectedPriceRange === price.id
															? styles.selectedCheckbox
															: null,
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
															selectedPriceRange === price.id
																? styles.checkboxChecked
																: null,
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
			<BottomSpacer height={80} />
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
		paddingBottom: 60, // Extra space for bottom bar
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
		marginBottom: 8,
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
		marginLeft: 10,
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
		fontSize: 13,
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
	loadingMoreContainer: {
		paddingVertical: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingMoreText: {
		marginTop: 8,
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#6A6A6A',
	},
	chatInputContainer: {
		backgroundColor: '#FFFFFF',
		borderTopWidth: 1,
		borderTopColor: '#E8E8E8',
		paddingHorizontal: 16,
		paddingVertical: 12,
		paddingBottom: Platform.OS === 'ios' ? 34 : 12,
	},
	chatInputWrapper: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		backgroundColor: '#F8F8F8',
		borderRadius: 24,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		paddingHorizontal: 16,
		paddingVertical: 8,
		minHeight: 48,
	},
	chatInput: {
		flex: 1,
		fontSize: 16,
		fontFamily: 'Inter-Regular',
		color: '#3D3D3D',
		maxHeight: 100,
		paddingVertical: 8,
		textAlignVertical: 'top',
	},
	sendButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#C67C4E',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 8,
	},
	sendButtonDisabled: {
		backgroundColor: '#CCCCCC',
	},
	userMessageContainer: {
		alignItems: 'flex-end',
		marginBottom: 16,
		paddingHorizontal: 16,
	},
	userMessageBubble: {
		backgroundColor: '#C67C4E',
		borderRadius: 20,
		borderBottomRightRadius: 4,
		paddingHorizontal: 16,
		paddingVertical: 12,
		maxWidth: '80%',
	},
	userMessageText: {
		fontSize: 16,
		fontFamily: 'Inter-Regular',
		color: '#FFFFFF',
		lineHeight: 20,
	},
	assistantMessageContainer: {
		marginBottom: 16,
	},
})
