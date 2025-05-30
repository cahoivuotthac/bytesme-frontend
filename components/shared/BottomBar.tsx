import React, { useEffect, useRef, useState } from 'react'
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Platform,
	Dimensions,
	Image,
	Animated,
} from 'react-native'
import { router, usePathname } from 'expo-router'
import { useTranslation } from '@/providers/locale'
import { useBottomBarVisibility } from '@/providers/BottomBarVisibilityProvider'

const { width } = Dimensions.get('window')

// Tab routes
const TABS = [
	{
		name: 'home',
		label: 'home',
		icon: require('@/assets/icons/bottom-bar/home.png'),
		activeIcon: require('@/assets/icons/bottom-bar/home.png'),
		path: '/(home)/product',
	},
	{
		name: 'cart',
		activeIcon: require('@/assets/icons/bottom-bar/cart-fill.png'),
		icon: require('@/assets/icons/bottom-bar/cart-line.png'),
		label: 'cart',
		path: '/(home)/cart',
	},
	{
		name: 'notifications',
		activeIcon: require('@/assets/icons/bottom-bar/notification-fill.png'),
		icon: require('@/assets/icons/bottom-bar/notification-line.png'),
		label: 'notifications',
		path: '/(home)/(profile)/notifications',
	},
	{
		name: 'profile',
		activeIcon: require('@/assets/icons/bottom-bar/profile-fill.png'),
		icon: require('@/assets/icons/bottom-bar/profile-line.png'),
		label: 'profile',
		path: '/(home)/profile',
	},
]

interface BottomBarProps {
	/**
	 * Optional additional styles for the bottom bar
	 */
	style?: object
}

/**
 * Bottom navigation bar component with tabs for main app navigation
 */
const BottomBar: React.FC<BottomBarProps> = ({ style }) => {
	const [pulseAnimation] = useState(new Animated.Value(1))
	const [activeTabIndex, setActiveTabIndex] = useState(0)
	const { t } = useTranslation()
	const { isVisible } = useBottomBarVisibility()
	const fadeAnim = useRef(new Animated.Value(1)).current

	// Start the pulse animation when component mounts
	React.useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnimation, {
					toValue: 1.1,
					duration: 800,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnimation, {
					toValue: 1,
					duration: 800,
					useNativeDriver: true,
				}),
			])
		).start()
	}, [])

	// Animate bottom bar fade in/out based on visibility
	useEffect(() => {
		Animated.timing(fadeAnim, {
			toValue: isVisible ? 1 : 0,
			duration: 200,
			useNativeDriver: true,
		}).start()
	}, [isVisible])

	// Function to navigate to a tab
	const handleTabPressed = (tabIndex: number) => {
		if (tabIndex !== activeTabIndex) {
			setActiveTabIndex(tabIndex)
			router.push(TABS[tabIndex].path as any)
		}
	}

	// Handle featured deals/promotions button press
	const handleCentralButtonPress = () => {
		// Navigate to daily deals or promotions page
		router.push('/(home)/product/promotions')
	}

	return (
		<Animated.View
			style={[
				styles.container,
				{
					opacity: fadeAnim,
					pointerEvents: isVisible ? 'auto' : 'none',
					height: isVisible ? null : 0,
					display: isVisible ? 'flex' : 'none',
				},
			]}
			pointerEvents={isVisible ? 'auto' : 'none'}
		>
			{/* <View style={[styles.outerContainer, style]}> */}
			<View style={[styles.innerClippingContainer, style]}>
				{/* Container for shadow effect */}
				{/* <View style={styles.shadowContainer} /> */}

				{/* Container for the actual content */}
				<View style={styles.mainContainer}>
					{TABS.map((tab, tabIndex) => {
						const isActive = tabIndex === activeTabIndex

						return (
							<TouchableOpacity
								key={tab.name}
								style={[
									styles.tabButton,
									tabIndex === 1 ? { marginRight: 40 } : {},
									tabIndex === 2 ? { marginLeft: 40 } : {},
								]}
								onPress={() => handleTabPressed(tabIndex)}
								activeOpacity={1.0}
							>
								<Image
									source={isActive ? tab.activeIcon : tab.icon}
									style={{
										width: 24,
										height: 24,
										tintColor: '#DF7A82',
										opacity: isActive ? 1.0 : 0.4,
									}}
								/>

								<Text
									style={[
										styles.tabLabel,
										isActive ? styles.activeTabLabel : styles.inactiveTabLabel,
									]}
									numberOfLines={1}
								>
									{t(tab.label)}
								</Text>
							</TouchableOpacity>
						)
					})}

					{/* Central featured button */}
					<View style={styles.centralButtonContainer}>
						<TouchableOpacity
							style={styles.centralButton}
							onPress={handleCentralButtonPress}
							activeOpacity={0.7}
						>
							<Image
								source={require('@/assets/images/logo-transparent.png')}
								style={styles.centralButtonImage}
								resizeMode="contain"
							/>
						</TouchableOpacity>
					</View>
				</View>

				{/* iOS safe area padding */}
				{Platform.OS === 'ios' && <View style={styles.iosSafeArea} />}
			</View>
			{/* </View> */}
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 100,
		backgroundColor: '#fff',
	},
	outerContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		zIndex: 100,
		backgroundColor: '#FFFFFF',
	},
	innerClippingContainer: {
		borderTopLeftRadius: 35,
		borderTopRightRadius: 35,
		overflow: 'hidden',
		backgroundColor: '#FFFFFF',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: -4,
		},
		shadowOpacity: 0.2,
		shadowRadius: 16,
		elevation: 10,
	},
	mainContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		paddingTop: 8,
		paddingHorizontal: 10,
		paddingBottom: 8,
		backgroundColor: '#FFFFFF',
	},
	tabButton: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 8,
		paddingHorizontal: 5,
	},
	tabLabel: {
		marginTop: 4,
		fontSize: 12,
		fontFamily: 'Roboto Condensed',
		fontWeight: '900',
		textAlign: 'center',
	},
	activeTabLabel: {
		color: '#DF7A82',
	},
	inactiveTabLabel: {
		color: 'rgba(223, 122, 130, 0.4)',
	},
	centralButtonContainer: {
		position: 'absolute',
		top: 3,
		left: width / 2 - 30,
		zIndex: 101,
	},
	centralButton: {
		width: 60,
		height: 60,
		borderRadius: 35,
		backgroundColor: '#C67C4E',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#C67C4E',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.5,
		shadowRadius: 10,
		elevation: 8,
	},
	centralButtonImage: {
		width: '80%',
		height: '80%',
		marginBottom: 2,
	},
	iosSafeArea: {
		height: 20,
		backgroundColor: '#FFFFFF',
	},
})

export default BottomBar
