import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	ScrollView,
	SafeAreaView,
	Alert,
	Switch,
	Platform,
} from 'react-native'
import { Ionicons, MaterialIcons, Feather, AntDesign } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from '@/providers/locale'
import { useAuth } from '@/providers/auth'
import { LinearGradient } from 'expo-linear-gradient'
import DishDecoration from '@/components/shared/DishDecoration'
import { useAlert } from '@/hooks/useAlert'

// Default profile image if user has no profile photo
const DEFAULT_AVATAR =
	'https://ui-avatars.com/api/?name=Bytesme+User&background=C67C4E&color=fff'

export default function ProfileMainScreen() {
	const { t, locale, setLocale } = useTranslation()
	const { authState, logout } = useAuth()
	const { AlertComponent, showConfirm, showSuccess, showError } = useAlert()

	// States
	const [isEnglish, setIsEnglish] = useState(locale === 'en')

	// User info
	const userFullName = authState?.user?.fullName || 'Bytesme User'
	const userEmail = authState?.user?.email || 'customer@bytesme.vn'
	const avatar = authState?.user?.avatar || DEFAULT_AVATAR

	// Handle language toggle
	const toggleLanguage = () => {
		const newLocale = isEnglish ? 'vi' : 'en'
		setIsEnglish(!isEnglish)
		setLocale(newLocale)
	}

	// Handle logout
	const handleLogout = async () => {
		showConfirm(t('logoutConfirmation'), async () => {
			try {
				await logout()
				showSuccess(t('logoutSuccess'), () =>
					router.replace('/(auth)/input-email')
				)
			} catch (err) {
				console.error('Logout error:', err)
				showError(t('logoutError'))
			}
		})
	}

	// Navigate to other screens
	const navigateToEditProfile = () => {
		router.push('/(home)/(profile)/edit-profile')
	}

	const navigateToCart = () => {
		router.push('/(home)/(profile)/cart')
	}

	const navigateToWishlist = () => {
		router.push('/(home)/(profile)/wishlist')
	}

	const navigateToNotifications = () => {
		router.push('/notifications')
	}

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}

			{/* Header with gradient background */}
			<LinearGradient
				colors={['#FFE9D0', '#F9F5F0']}
				style={styles.headerGradient}
			>
				<Text style={styles.headerTitle}>{t('profile')}</Text>
			</LinearGradient>

			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
			>
				{/* Profile Card */}
				<View style={styles.profileCard}>
					<View style={styles.profilePhotoContainer}>
						<DishDecoration
							imageSource={avatar || DEFAULT_AVATAR}
							size={100}
							containerStyle={styles.profilePhoto}
						/>
					</View>

					<View style={styles.profileInfo}>
						<Text style={styles.userName}>{userFullName}</Text>
						<Text style={styles.userEmail}>{userEmail}</Text>

						<TouchableOpacity
							style={styles.editButton}
							onPress={navigateToEditProfile}
						>
							<Text style={styles.editButtonText}>{t('editProfile')}</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Menu Options */}
				<View style={styles.menuSection}>
					<Text style={styles.sectionTitle}>{t('general')}</Text>

					{/* Cart */}
					<TouchableOpacity style={styles.menuItem} onPress={navigateToCart}>
						<View
							style={[styles.menuIconContainer, { backgroundColor: '#FFF2E5' }]}
						>
							<Ionicons name="cart-outline" size={22} color="#C67C4E" />
						</View>
						<Text style={styles.menuItemText}>{t('cart')}</Text>
						<Ionicons name="chevron-forward" size={22} color="#9B9B9B" />
					</TouchableOpacity>

					{/* Wishlist */}
					<TouchableOpacity
						style={styles.menuItem}
						onPress={navigateToWishlist}
					>
						<View
							style={[styles.menuIconContainer, { backgroundColor: '#FFEEF0' }]}
						>
							<Ionicons name="heart-outline" size={22} color="#FF5E5E" />
						</View>
						<Text style={styles.menuItemText}>{t('favorites')}</Text>
						<Ionicons name="chevron-forward" size={22} color="#9B9B9B" />
					</TouchableOpacity>

					{/* Notifications */}
					<TouchableOpacity
						style={styles.menuItem}
						onPress={navigateToNotifications}
					>
						<View
							style={[styles.menuIconContainer, { backgroundColor: '#F0F5FF' }]}
						>
							<Ionicons
								name="notifications-outline"
								size={22}
								color="#5282FF"
							/>
						</View>
						<Text style={styles.menuItemText}>{t('notifications')}</Text>
						<Ionicons name="chevron-forward" size={22} color="#9B9B9B" />
					</TouchableOpacity>
				</View>

				{/* Preferences Section */}
				<View style={styles.menuSection}>
					<Text style={styles.sectionTitle}>{t('preferences')}</Text>

					{/* Language Option */}
					<View style={styles.menuItem}>
						<View
							style={[styles.menuIconContainer, { backgroundColor: '#F0FFEF' }]}
						>
							<Ionicons name="language" size={22} color="#54B175" />
						</View>
						<Text style={styles.menuItemText}>{t('language')}</Text>
						<View style={styles.languageToggle}>
							<Text
								style={[
									styles.languageOption,
									!isEnglish && styles.languageActive,
								]}
							>
								VI
							</Text>
							<Switch
								value={isEnglish}
								onValueChange={toggleLanguage}
								trackColor={{ false: '#F0E4D7', true: '#F0E4D7' }}
								thumbColor={isEnglish ? '#C67C4E' : '#C67C4E'}
								ios_backgroundColor="#F0E4D7"
								style={styles.switch}
							/>
							<Text
								style={[
									styles.languageOption,
									isEnglish && styles.languageActive,
								]}
							>
								EN
							</Text>
						</View>
					</View>

					{/* App Theme - Disabled for now */}
					<View style={[styles.menuItem, styles.disabledMenuItem]}>
						<View
							style={[styles.menuIconContainer, { backgroundColor: '#FFF8E5' }]}
						>
							<Ionicons
								name="color-palette-outline"
								size={22}
								color="#FFC250"
							/>
						</View>
						<Text style={styles.menuItemText}>{t('theme')}</Text>
						<Text style={styles.comingSoonBadge}>{t('comingSoon')}</Text>
					</View>
				</View>

				{/* Log Out Section */}
				<View style={[styles.menuSection, styles.logoutSection]}>
					<TouchableOpacity
						style={[styles.menuItem, styles.logoutButton]}
						onPress={handleLogout}
					>
						<View
							style={[styles.menuIconContainer, { backgroundColor: '#FFECEC' }]}
						>
							<Ionicons name="log-out-outline" size={22} color="#FF5C5C" />
						</View>
						<Text style={[styles.menuItemText, styles.logoutText]}>
							{t('logout')}
						</Text>
					</TouchableOpacity>
				</View>

				{/* App Version */}
				<View style={styles.versionContainer}>
					<Text style={styles.versionText}>Bytesme v1.0.0</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FAF9F6',
	},
	headerGradient: {
		paddingTop: Platform.OS === 'ios' ? 8 : 16,
		paddingBottom: 16,
		paddingHorizontal: 20,
		position: 'relative',
		borderBottomLeftRadius: 15,
		borderBottomRightRadius: 15,
	},
	headerTitle: {
		fontSize: 20,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E',
		letterSpacing: 0.5,
		textAlign: 'center',
	},
	scrollView: {
		flex: 1,
		paddingHorizontal: 20,
	},
	profileCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 20,
		marginTop: 20,
		marginBottom: 25,
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	profilePhotoContainer: {
		marginRight: 16,
	},
	profilePhoto: {
		backgroundColor: '#EDE9E0',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
	},
	profileInfo: {
		flex: 1,
	},
	userName: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#3C3C3C',
		marginBottom: 4,
	},
	userEmail: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#9B9B9B',
		marginBottom: 12,
	},
	editButton: {
		backgroundColor: '#FFF2E5',
		borderRadius: 20,
		paddingVertical: 6,
		paddingHorizontal: 14,
		alignSelf: 'flex-start',
	},
	editButtonText: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
	},
	menuSection: {
		marginBottom: 25,
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#3C3C3C',
		marginBottom: 15,
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
	},
	menuIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	menuItemText: {
		flex: 1,
		fontSize: 16,
		fontFamily: 'Inter-Medium',
		color: '#3C3C3C',
	},
	disabledMenuItem: {
		opacity: 0.8,
	},
	comingSoonBadge: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#9B9B9B',
		backgroundColor: '#F5F5F5',
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 10,
	},
	languageToggle: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	languageOption: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#9B9B9B',
		marginHorizontal: 8,
	},
	languageActive: {
		color: '#C67C4E',
		fontFamily: 'Inter-SemiBold',
	},
	switch: {
		transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
	},
	logoutSection: {
		marginBottom: 16,
	},
	logoutButton: {
		borderWidth: 1,
		borderColor: '#FFECEC',
	},
	logoutText: {
		color: '#FF5C5C',
	},
	versionContainer: {
		alignItems: 'center',
		marginBottom: 40,
	},
	versionText: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#9B9B9B',
	},
})
