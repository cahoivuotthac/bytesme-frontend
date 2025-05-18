import { I18n } from 'i18n-js'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Children, createContext, useContext, useEffect, useState } from 'react'

// Import all translations
import en from '../translations/en'
import vi from '../translations/vi'

// Create the i18n instance
const i18n = new I18n({
	en,
	vi,
})

// Set the locale to the device's locale by default
// i18n.locale = Localization.getLocales()[0]?.languageCode || 'vi'
i18n.locale = 'vi'
i18n.enableFallback = true
i18n.defaultLocale = 'vi'

// Context for managing language across the app
type SupportedLocale = 'en' | 'vi'
type LocaleContextType = {
	locale: SupportedLocale
	setLocale: (locale: SupportedLocale) => void
	t: (scope: string, options?: Record<string, any>) => string
}

// Storage key for saving the user's language preference
const LOCALE_STORAGE_KEY = 'USER_LANGUAGE_PREFERENCE'

// Create a context to handle locale changes
export const LocaleContext = createContext<LocaleContextType | undefined>(
	undefined
)

// Provider component for language management
export const LocaleProvider = ({ children }: { children: React.ReactNode }) => {
	const [locale, setLocale] = useState<SupportedLocale>(
		(i18n.locale as SupportedLocale) || 'vi'
	)

	// Effect to load saved language preference when app starts
	useEffect(() => {
		const loadSavedLocale = async () => {
			try {
				const savedLocale = (await AsyncStorage.getItem(
					LOCALE_STORAGE_KEY
				)) as SupportedLocale
				if (savedLocale) {
					i18n.locale = savedLocale
					setLocale(savedLocale)
				}
			} catch (error) {
				console.error('Failed to load locale from storage', error)
			}
		}

		loadSavedLocale()
	}, [])

	// Function to change the language
	const handleSetLocale = async (newLocale: SupportedLocale) => {
		try {
			i18n.locale = newLocale
			setLocale(newLocale)
			await AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
		} catch (error) {
			console.error('Failed to save locale to storage', error)
		}
	}

	// Translate function
	const t = (scope: string, options?: Record<string, any>) => {
		return i18n.t(scope, options)
	}

	return (
		<LocaleContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
			{children}
		</LocaleContext.Provider>
	)
}

// Hook for using translations throughout the app
export const useTranslation = () => {
	const context = useContext(LocaleContext)

	if (context === undefined) {
		throw new Error('useTranslation must be used within a LocaleProvider')
	}

	return context
}
