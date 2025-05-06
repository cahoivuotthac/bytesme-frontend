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
} from 'react-native'
import { router, useLocalSearchParams, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@/providers/locale'
import NavButton from '@/components/shared/NavButton'
import Button from '@/components/ui/Button'
import GradientProductCard from '@/components/product/GradientProductCard'
import { useAlert } from '@/hooks/useAlert'
import { SearchBar } from '@/components/shared/SearchBar'

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

export default function SearchResultsScreen() {
	const params = useLocalSearchParams()
	const { t } = useTranslation()
	const { AlertComponent, showError } = useAlert()
	const modalAnimation = useRef(new Animated.Value(height)).current

	const [searchQuery, setSearchQuery] = useState((params.query as string) || '')
	const [isLoading, setIsLoading] = useState(false)
	const [results, setResults] = useState<typeof MOCK_PRODUCTS>([])
	const [activeFilter, setActiveFilter] = useState('all')
	const [showFilters, setShowFilters] = useState(false)
	const [showFilterModal, setShowFilterModal] = useState(false)

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

	// Simulate API call to fetch search results
	useEffect(() => {
		if (searchQuery.trim()) {
			performSearch(searchQuery)
		}
	}, [searchQuery])

	const performSearch = async (query: string) => {
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

	const handleSearch = () => {
		if (searchQuery.trim()) {
			performSearch(searchQuery)
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
		// In a real app, you would filter the results based on the selected category
	}

	const toggleFilters = () => {
		setShowFilters(!showFilters)
	}

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
					type: 'category',
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
					type: 'price',
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
		if (activeFilters.length === 0) {
			// Reset to original search results if no active filters
			performSearch(searchQuery)
			return
		}

		setIsLoading(true)

		// Simulate filtering with delay
		setTimeout(() => {
			let filtered = [...MOCK_PRODUCTS]

			// Filter by search query
			if (searchQuery.trim()) {
				filtered = filtered.filter((product) =>
					product.name.toLowerCase().includes(searchQuery.toLowerCase())
				)
			}

			// Apply category filter
			const categoryFilter = activeFilters.find((f) => f.type === 'category')
			if (categoryFilter) {
				// In a real app, filter by category here
				// This is just a simulation
			}

			// Apply price filter
			const priceFilter = activeFilters.find((f) => f.type === 'price')
			if (priceFilter) {
				const priceRange = PRICE_RANGES.find((p) => p.id === priceFilter.id)
				if (priceRange) {
					filtered = filtered.filter(
						(product) =>
							product.price >= priceRange.min && product.price <= priceRange.max
					)
				}
			}

			setResults(filtered)
			setIsLoading(false)
		}, 500)
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
			await performSearch(searchQuery)
			filterResults()
		} catch (error) {
			console.error('Error refreshing results:', error)
			showError(t('errorRetry'))
		} finally {
			// Use a shorter timeout for better UX
			setIsLoading(false)
		}
	}

	const renderItem = ({ item, index }) => {
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

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}
			<StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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

			{/* Search Bar */}
			{/* <View style={styles.searchContainer}>
				<View style={styles.searchInputWrapper}>
					<Ionicons
						name="search"
						size={20}
						color="#A48B7B"
						style={styles.searchIcon}
					/>
					<TextInput
						style={styles.searchInput}
						placeholder={t('searchProductPlaceholder')}
						placeholderTextColor="#A48B7B"
						value={searchQuery}
						onChangeText={setSearchQuery}
						onSubmitEditing={handleSearch}
						returnKeyType="search"
						autoFocus={!params.query}
					/>
					{searchQuery.length > 0 && (
						<TouchableOpacity
							onPress={() => setSearchQuery('')}
							hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
						>
							<Ionicons name="close-circle" size={20} color="#A48B7B" />
						</TouchableOpacity>
					)}
				</View>
				<TouchableOpacity style={styles.filterButton} onPress={openFilterModal}>
					<Ionicons name="options" size={20} color="#3D3D3D" />
				</TouchableOpacity>
			</View> */}

			<SearchBar
				searchQuery={searchQuery}
				handleInputChange={setSearchQuery}
				handleSearchSubmit={handleSearch}
				showAiButton={true}
				handleAiButtonPress={() => {}}
				handleFilterPress={openFilterModal}
				showFiltersButton={true}
				// style={styles.searchContainer}
			/>

			{/* Active Filters Display */}
			<View style={styles.filterRow}>
				<TouchableOpacity style={styles.refreshButton} onPress={refreshResults}>
					{/* <Ionicons name="refresh" size={20} color="#385541" /> */}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
					>
						<title>refresh_2_fill</title>
						<g id="refresh_2_fill" fill="none">
							<path d="M24 0v24H0V0zM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z" />
							<path
								fill="#385541"
								d="M1.498 12.082c-.01-1.267 1.347-1.987 2.379-1.406l.113.07 2.678 1.804c1.424.96.538 3.146-1.1 2.915l-.137-.025-.109-.024a7.504 7.504 0 0 0 13.175.335 1.5 1.5 0 1 1 2.6 1.498c-2.317 4.02-7.119 6.152-11.815 4.893a10.503 10.503 0 0 1-7.784-10.06m1.406-5.33C5.22 2.731 10.022.6 14.718 1.857a10.503 10.503 0 0 1 7.784 10.06c.01 1.267-1.347 1.987-2.379 1.407l-.113-.07-2.678-1.805c-1.424-.959-.538-3.145 1.099-2.914l.138.025.108.023A7.504 7.504 0 0 0 5.502 8.25a1.5 1.5 0 1 1-2.598-1.498"
							/>
						</g>
					</svg>
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

			{/* Results */}
			{results.length > 0 ? (
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
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
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
		// padding: 12,
		// paddingHorizontal: 10,
		paddingBottom: 100, // Extra space for bottom bar
	},
	row: {
		justifyContent: 'space-between',
		width: '100%',
	},
	productCardContainer: {
		width: (width - 30) / 2, // Adjust width to account for container padding (20px * 2 + 10px gap)
		marginBottom: 16,
	},
	productCard: {
		width: '100%',
	},
	leftItem: {
		paddingRight: 0,
		paddingLeft: 4,
		// marginHorizontal: 'auto',
	},
	rightItem: {
		// paddingLeft: 0,
		// paddingRight: 4,
		marginRight: 18,
		// marginHorizontal: 'auto',
	},
	emptyStateContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
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
		backgroundColor: '#DEB3F8', // Purple color for category chips as shown in the image
	},
	priceFilterChip: {
		backgroundColor: '#DBDBDB', // Gray color for price chips as shown in the image
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
})
