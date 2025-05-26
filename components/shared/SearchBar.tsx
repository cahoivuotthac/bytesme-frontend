import {
	View,
	StyleSheet,
	Animated,
	Dimensions,
	LayoutAnimation,
	Platform,
	UIManager,
	Keyboard,
	TouchableWithoutFeedback,
} from 'react-native'
import { TextInput, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@/providers/locale'
import { useState, useRef, useEffect } from 'react'
import { Svg, G, Path, Defs, Rect, ClipPath } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'

if (
	Platform.OS === 'android' &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface SearchbarProps {
	handleSearchSubmit: (isAiMode: boolean, query: string) => void
	showAiButton?: boolean
	handleAiButtonPress?: () => void
	handleInputChange?: (query: string) => void
	showFiltersButton?: boolean
	handleFilterPress?: () => void
	isInitiallyAiMode?: boolean // Optional prop to control AI mode externally on load
	initialSearchQuery?: string // Initial search query to set the input value
}

export function SearchBar({
	handleInputChange,
	handleSearchSubmit,
	showAiButton = false,
	handleAiButtonPress = () => {},
	showFiltersButton = false,
	handleFilterPress = () => {},
	isInitiallyAiMode = false, // Default to false if not provided
	initialSearchQuery = '',
}: SearchbarProps) {
	const { t } = useTranslation()
	const [isFocused, setIsFocused] = useState(false)
	const [isAiMode, setIsAiMode] = useState(isInitiallyAiMode)
	const [isAiButtonVisible, setIsAiButtonVisible] = useState(showAiButton)
	const [isFilterButtonVisible, setIsFilterButtonVisible] =
		useState(showFiltersButton)
	const [isShimmerActive, setIsShimmerActive] = useState(false)
	const [query, setQuery] = useState(initialSearchQuery)
	// Reference to the TextInput component
	const inputRef = useRef<TextInput>(null)

	// Calculate the width directly based on screen size and buttons
	const screenWidth = Dimensions.get('window').width
	const paddingHorizontal = 20 // From styles.searchContainer
	const filterButtonWidth = 44 + 12 // width + marginRight
	const aiButtonWidth = 40 + 10 // width + marginLeft
	const spacingBetween = 5 // gap between elements

	// Calculate input width based on visible buttons
	let searchInputWidth = screenWidth - paddingHorizontal * 2
	if (isFilterButtonVisible)
		searchInputWidth -= filterButtonWidth + spacingBetween
	if (isAiButtonVisible) searchInputWidth -= aiButtonWidth + spacingBetween

	// Animations
	const buttonsOpacityAnim = useRef(new Animated.Value(1)).current
	const aiButtonRotateAnim = useRef(new Animated.Value(0)).current
	const shimmerAnim = useRef(new Animated.Value(0)).current
	const glowIntensityAnim = useRef(new Animated.Value(0)).current

	// useEffect(() => {
	// 	const showSub = Keyboard.addListener('keyboardDidShow', () => handleFocus())
	// 	const hideSub = Keyboard.addListener('keyboardDidHide', () => handleBlur())
	// 	return () => {
	// 		showSub.remove()
	// 		hideSub.remove()
	// 	}
	// }, [])

	// Start shimmer animation when AI mode is activated
	useEffect(() => {
		if (isAiMode) {
			// Activate shimmer effect
			setIsShimmerActive(true)

			// Animate the shimmer movement
			Animated.loop(
				Animated.timing(shimmerAnim, {
					toValue: 1,
					duration: 2000,
					useNativeDriver: true,
				})
			).start()

			// Animate glow intensity with a pulsating effect
			Animated.loop(
				Animated.sequence([
					Animated.timing(glowIntensityAnim, {
						toValue: 1,
						duration: 1000,
						useNativeDriver: true,
					}),
					Animated.timing(glowIntensityAnim, {
						toValue: 0.5,
						duration: 1000,
						useNativeDriver: true,
					}),
				])
			).start()

			// Stop shimmer effect after 5 seconds, but keep AI mode active
			const shimmerTimer = setTimeout(() => {
				setIsShimmerActive(false)
				shimmerAnim.setValue(0)
				glowIntensityAnim.setValue(0)
			}, 5000)

			return () => {
				clearTimeout(shimmerTimer)
				shimmerAnim.setValue(0)
				glowIntensityAnim.setValue(0)
			}
		}
	}, [isAiMode])

	// Handle AI button press
	const handleAiPress = () => {
		setQuery('') // Clear input when toggling AI mode
		handleInputChange?.('') // Also notify parent of cleared input
		setIsAiMode((prev) => !prev)
		handleAiButtonPress()
	}

	// Configure the layout animation
	const configureLayoutAnimation = () => {
		LayoutAnimation.configureNext({
			duration: 300,
			create: {
				type: LayoutAnimation.Types.easeInEaseOut,
				property: LayoutAnimation.Properties.opacity,
			},
			update: {
				type: LayoutAnimation.Types.easeInEaseOut,
				property: LayoutAnimation.Properties.opacity,
			},
			delete: {
				type: LayoutAnimation.Types.easeInEaseOut,
				property: LayoutAnimation.Properties.opacity,
			},
		})
	}

	// Handle input focus and blur
	const handleFocus = () => {
		setIsFocused(true)

		// Fade out buttons first and rotate AI button
		Animated.parallel([
			Animated.timing(buttonsOpacityAnim, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.timing(aiButtonRotateAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start(() => {
			// Then apply layout changes after opacity animation
			configureLayoutAnimation()
			setIsAiButtonVisible(false)
			setIsFilterButtonVisible(false)
		})
	}

	const handleBlur = () => {
		setIsFocused(false)

		// Apply layout changes first
		configureLayoutAnimation()
		setIsAiButtonVisible(showAiButton)
		setIsFilterButtonVisible(showFiltersButton)

		// Then fade buttons back in and rotate AI button back
		setTimeout(() => {
			Animated.parallel([
				Animated.timing(buttonsOpacityAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.timing(aiButtonRotateAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start()
		}, 50) // Small delay to ensure layout is updated
	}

	// Handle tapping on the input wrapper to force focus on the input field
	const handleInputWrapperPress = () => {
		if (inputRef.current) {
			inputRef.current.focus()
		}
	}

	// AI button rotation interpolation
	const aiButtonRotation = aiButtonRotateAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '180deg'],
	})

	// Shimmer translation
	const translateX = shimmerAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [-300, 300],
	})

	// Glow opacity effect
	const glowOpacity = glowIntensityAnim.interpolate({
		inputRange: [0.5, 1],
		outputRange: [0.6, 1],
	})

	return (
		<View style={styles.searchContainer}>
			{/* Filter button */}
			{isFilterButtonVisible && (
				<Animated.View
					style={[styles.buttonContainer, { opacity: buttonsOpacityAnim }]}
				>
					<TouchableOpacity
						style={styles.filterButton}
						onPress={handleFilterPress}
						disabled={isFocused}
					>
						<Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
							<G clip-path="url(#clip0_544_2215)">
								<Path
									fillRule="evenodd"
									clipRule="evenodd"
									d="M18 4C18 3.73478 17.8946 3.48043 17.7071 3.29289C17.5196 3.10536 17.2652 3 17 3C16.7348 3 16.4804 3.10536 16.2929 3.29289C16.1054 3.48043 16 3.73478 16 4V5H4C3.73478 5 3.48043 5.10536 3.29289 5.29289C3.10536 5.48043 3 5.73478 3 6C3 6.26522 3.10536 6.51957 3.29289 6.70711C3.48043 6.89464 3.73478 7 4 7H16V8C16 8.26522 16.1054 8.51957 16.2929 8.70711C16.4804 8.89464 16.7348 9 17 9C17.2652 9 17.5196 8.89464 17.7071 8.70711C17.8946 8.51957 18 8.26522 18 8V7H20C20.2652 7 20.5196 6.89464 20.7071 6.70711C20.8946 6.51957 21 6.26522 21 6C21 5.73478 20.8946 5.48043 20.7071 5.29289C20.5196 5.10536 20.2652 5 20 5H18V4ZM4 11C3.73478 11 3.48043 11.1054 3.29289 11.2929C3.10536 11.4804 3 11.7348 3 12C3 12.2652 3.10536 12.5196 3.29289 12.7071C3.48043 12.8946 3.73478 13 4 13H6V14C6 14.2652 6.10536 14.5196 6.29289 14.7071C6.48043 14.8946 6.73478 15 7 15C7.26522 15 7.51957 14.8946 7.70711 14.7071C7.89464 14.5196 8 14.2652 8 14V13H20C20.2652 13 20.5196 12.8946 20.7071 12.7071C20.8946 12.5196 21 12.2652 21 12C21 11.7348 20.8946 11.4804 20.7071 11.2929C20.5196 11.1054 20.2652 11 20 11H8V10C8 9.73478 7.89464 9.48043 7.70711 9.29289C7.51957 9.10536 7.26522 9 7 9C6.73478 9 6.48043 9.10536 6.29289 9.29289C6.10536 9.48043 6 9.73478 6 10V11H4ZM3 18C3 17.7348 3.10536 17.4804 3.29289 17.2929C3.48043 17.1054 3.73478 17 4 17H16V16C16 15.7348 16.1054 15.4804 16.2929 15.2929C16.4804 15.1054 16.7348 15 17 15C17.2652 15 17.5196 15.1054 17.7071 15.2929C17.8946 15.4804 18 15.7348 18 16V17H20C20.2652 17 20.5196 17.1054 20.7071 17.2929C20.8946 17.4804 21 17.7348 21 18C21 18.2652 20.8946 18.5196 20.7071 18.7071C20.5196 18.8946 20.2652 19 20 19H18V20C18 20.2652 17.8946 20.5196 17.7071 20.7071C17.5196 20.8946 17.2652 21 17 21C16.7348 21 16.4804 20.8946 16.2929 20.7071C16.1054 20.5196 16 20.2652 16 20V19H4C3.73478 19 3.48043 18.8946 3.29289 18.7071C3.10536 18.5196 3 18.2652 3 18Z"
									fill="#968B7B"
								/>
							</G>
							<Defs>
								<ClipPath id="clip0_544_2215">
									<Rect width="24" height="24" fill="white" />
								</ClipPath>
							</Defs>
						</Svg>
					</TouchableOpacity>
				</Animated.View>
			)}

			{/* Search input with explicit width */}
			<View style={[styles.searchInputContainer, { width: searchInputWidth }]}>
				{isAiMode && (
					<View style={styles.gradientBorderContainer}>
						{/* Static gradient background */}
						<LinearGradient
							colors={['#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#3B82F6']}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={styles.gradientBorder}
						/>

						{/* Blurry glow effect */}
						{isShimmerActive && (
							<Animated.View
								style={[
									styles.glowEffect,
									{
										opacity: glowOpacity,
									},
								]}
							/>
						)}

						{/* Moving shimmer effect overlay */}
						{isShimmerActive && (
							<Animated.View
								style={[
									styles.shimmerOverlay,
									{
										transform: [{ translateX }],
									},
								]}
							>
								<LinearGradient
									colors={[
										'rgba(255,255,255,0)',
										'rgba(255,255,255,0.8)',
										'rgba(255,255,255,0)',
									]}
									start={{ x: 0, y: 0.5 }}
									end={{ x: 1, y: 0.5 }}
									style={styles.shimmerGradient}
								/>
							</Animated.View>
						)}
					</View>
				)}

				{/* Make the input wrapper clickable to force focus */}
				<TouchableWithoutFeedback onPress={handleInputWrapperPress}>
					<View
						style={[
							styles.searchInputWrapper,
							isAiMode && styles.searchInputWrapperAiMode,
						]}
					>
						{isAiMode ? (
							<Ionicons
								name="sparkles"
								size={20}
								color="#6366F1"
								style={styles.searchIcon}
							></Ionicons>
						) : (
							<Ionicons
								name="search"
								size={20}
								color="#A48B7B"
								style={styles.searchIcon}
							/>
						)}
						<TextInput
							ref={inputRef}
							key={`search-input-${isAiMode ? 'ai' : 'normal'}`}
							style={[styles.searchInput, isAiMode && styles.searchInputAiMode]}
							placeholder={
								isAiMode
									? t('aiSearchPlaceholder')
									: t('searchProductPlaceholder')
							}
							placeholderTextColor={isAiMode ? '#8B5CF6' : '#A48B7B'}
							value={query}
							onChangeText={(newQuery) => {
								setQuery(newQuery)
								handleInputChange?.(newQuery)
							}}
							onSubmitEditing={() => handleSearchSubmit(isAiMode, query)}
							returnKeyType="search"
							onFocus={handleFocus}
							onBlur={handleBlur}
						/>
						{query.length > 0 && (
							<TouchableOpacity
								onPress={() => {
									setQuery('') // Clear input
									handleInputChange?.('')
								}}
								hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
								style={[
									styles.crossButton,
									isAiButtonVisible && styles.crossButtonWhenAIVisible,
								]}
							>
								<Ionicons name="close-circle" size={20} color="#A48B7B" />
							</TouchableOpacity>
						)}
					</View>
				</TouchableWithoutFeedback>
			</View>

			{/* AI button with rotation anim */}
			{isAiButtonVisible && (
				<Animated.View
					style={[
						styles.buttonContainer,
						{
							opacity: buttonsOpacityAnim,
							transform: [{ rotate: aiButtonRotation }],
						},
					]}
				>
					<TouchableOpacity
						style={[
							styles.aiSearchButton,
							isAiMode && styles.aiSearchButtonActive,
						]}
						onPress={handleAiPress}
						disabled={isFocused}
					>
						<Ionicons name="sparkles" size={18} color="#FFFFFF" />
					</TouchableOpacity>
				</Animated.View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	filterButton: {
		width: 44,
		height: 44,
		borderRadius: 50,
		backgroundColor: '#FFF8EF',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
		elevation: 2,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 20,
		marginBottom: 5,
		justifyContent: 'space-between', // Ensure space distribution
	},
	searchInputContainer: {
		position: 'relative',
	},
	searchInputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 40,
		borderWidth: 1,
		borderColor: '#F0E4D7',
		paddingHorizontal: 16,
		height: 48,
		shadowColor: '#C67C4E',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
		overflow: 'hidden',
		position: 'relative',
		zIndex: 1,
	},
	searchInputWrapperAiMode: {
		borderWidth: 0,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		backdropFilter: 'blur(8px)',
		margin: 2,
	},
	gradientBorderContainer: {
		position: 'absolute',
		top: -3,
		left: -3,
		right: -3,
		bottom: -3,
		borderRadius: 40,
		padding: 2,
		zIndex: 0,
		shadowColor: '#8B5CF6',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.4,
		shadowRadius: 8,
		elevation: 8,
	},
	gradientBorder: {
		flex: 1,
		borderRadius: 40,
		height: '100%',
		width: '100%',
	},
	shimmerOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		overflow: 'hidden',
		borderRadius: 40,
	},
	shimmerGradient: {
		flex: 1,
		borderRadius: 40,
		height: '100%',
		width: '100%',
	},
	glowEffect: {
		position: 'absolute',
		top: -5,
		left: -5,
		right: -5,
		bottom: -5,
		borderRadius: 45,
		backgroundColor: 'transparent',
		shadowColor: '#8B5CF6',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.8,
		shadowRadius: 12,
		elevation: 10,
	},
	searchIcon: {
		marginRight: 8,
		zIndex: 2,
	},
	searchInput: {
		flex: 1,
		fontSize: 14,
		color: '#3D3D3D',
		fontFamily: 'Inter-Regular',
		zIndex: 2,
	},
	searchInputAiMode: {
		color: '#6366F1',
		fontFamily: 'Inter-Medium',
	},
	aiSearchButton: {
		backgroundColor: '#C67C4E',
		borderRadius: 20,
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 10,
		shadowColor: '#C67C4E',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 3,
	},
	aiSearchButtonActive: {
		backgroundColor: '#8B5CF6',
		shadowColor: '#6366F1',
	},
	crossButton: {
		userSelect: 'none',
		position: 'absolute',
		right: 16,
		top: '50%',
		transform: [{ translateY: -10 }],
	},
	crossButtonWhenAIVisible: {
		right: 16,
	},
	buttonContainer: {
		alignItems: 'center',
		justifyContent: 'center',
	},
})
