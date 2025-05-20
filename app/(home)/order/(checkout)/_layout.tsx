import React, { createContext, useState, useEffect, useMemo } from 'react'
import { Stack } from 'expo-router'
import { CartItem } from '@/app/(home)/(profile)/cart'
import { useAlert } from '@/hooks/useAlert'
import { voucherAPI } from '@/utils/api'
import { configureEcho } from '@laravel/echo-react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import URLs from '@/constants/URLs'

// Interface for product information from API
export interface ProductInfo {
	product_id: number
	product_name: string
	product_image: string
	size: string
	quantity: number
}

// Interface for voucher rule
export interface VoucherRule {
	voucher_rule_id: number
	voucher_rule_type: string
	voucher_rule_value: string
	is_fulfilled?: boolean // Whether the rule is fulfilled by the current order (set by backend)
	message?: string // Human-readable message about the rule (set by backend)
}

// Interface for voucher data with additional fields for UI state
export interface Voucher {
	voucher_id: number
	voucher_code: string
	voucher_name: string
	voucher_description: string
	voucher_fields: string // e.g. 'freeship', 'birthday_gift', etc.
	voucher_start_date: string
	voucher_end_date: string
	voucher_type: string // 'cash', 'percentage', 'gift_product', etc.
	voucher_value: string
	voucher_rules?: VoucherRule[]
	isSelected?: boolean
	isAvailable?: boolean
	is_applicable: boolean // Whether all rules are fulfilled (set by backend)
	discount_value: number // Calculated discount value (set by backend)
}

// Create the context with proper typing
interface CheckoutContextType {
	checkoutItems: CartItem[]
	setCheckoutItems: React.Dispatch<React.SetStateAction<CartItem[]>>
	subtotal: number
	deliveryFee: number
	setDeliveryFee: React.Dispatch<React.SetStateAction<number>>
	discount: number
	setDiscount: React.Dispatch<React.SetStateAction<number>>
	total: number
	setTotal: React.Dispatch<React.SetStateAction<number>>
	selectedVoucher: Voucher | null
	setSelectedVoucher: React.Dispatch<React.SetStateAction<Voucher | null>>
	appliedVoucher: Voucher | null
	setAppliedVoucher: React.Dispatch<React.SetStateAction<Voucher | null>>
	vouchers: Voucher[]
	setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>
	isLoadingVouchers: boolean
	setIsLoadingVouchers: React.Dispatch<React.SetStateAction<boolean>>
	giftProducts: ProductInfo[]
	setGiftProducts: React.Dispatch<React.SetStateAction<ProductInfo[]>>
	isLoadingGiftProducts: boolean
	setIsLoadingGiftProducts: React.Dispatch<React.SetStateAction<boolean>>
	orderId?: number
	setOrderId: React.Dispatch<React.SetStateAction<number | undefined>>
}

export const CheckoutContext = createContext<CheckoutContextType>({
	checkoutItems: [],
	setCheckoutItems: () => {},
	subtotal: 0,
	deliveryFee: 20000,
	setDeliveryFee: () => {},
	discount: 0,
	setDiscount: () => {},
	total: 0,
	setTotal: () => {},
	selectedVoucher: null,
	setSelectedVoucher: () => {},
	appliedVoucher: null,
	setAppliedVoucher: () => {},
	vouchers: [],
	setVouchers: () => {},
	isLoadingVouchers: false,
	setIsLoadingVouchers: () => {},
	giftProducts: [],
	setGiftProducts: () => {},
	isLoadingGiftProducts: false,
	setIsLoadingGiftProducts: () => {},
	orderId: undefined,
	setOrderId: () => {},
})

export default function CheckoutLayout() {
	const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([])
	const [deliveryFee, setDeliveryFee] = useState(20000)
	const [discount, setDiscount] = useState(0)
	const [total, setTotal] = useState(0)
	const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
	const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null)
	const [vouchers, setVouchers] = useState<Voucher[]>([])
	const [isLoadingVouchers, setIsLoadingVouchers] = useState(false)
	const [giftProducts, setGiftProducts] = useState<ProductInfo[]>([])
	const [isLoadingGiftProducts, setIsLoadingGiftProducts] = useState(false)
	const [orderId, setOrderId] = useState<number | undefined>(undefined)
	const { showError } = useAlert()

	useEffect(() => {
		return () => {} // Cleanup
	}, [])

	// Calculate subtotal from checkout items
	const subtotal = useMemo(() => {
		if (!checkoutItems || checkoutItems.length === 0) return 0

		return checkoutItems.reduce((total, item) => {
			const unitPrice = Math.round(
				(item.prices[item.selectedSizeIndex] *
					(100 - item.discountPercentage)) /
					100
			)
			const quantity = item.quantity
			return total + unitPrice * quantity
		}, 0)
	}, [checkoutItems])

	// Update total when dependencies change
	useEffect(() => {
		const newTotal = subtotal + deliveryFee - discount
		setTotal(newTotal)
	}, [subtotal, deliveryFee, discount])

	// Fetch checkout items from AsyncStorage
	useEffect(() => {
		const fetchCheckoutItems = async () => {
			try {
				const data = await AsyncStorage.getItem('checkoutItems')
				if (data) {
					const items = JSON.parse(data)
					if (items && items.length > 0) {
						setCheckoutItems(items)
					}
				}
			} catch (error) {
				console.error('Error fetching checkout items:', error)
				showError('Could not load checkout items')
			}
		}

		fetchCheckoutItems()
	}, [])

	// Handle applied voucher changes
	useEffect(() => {
		const update = async (appliedVoucher: Voucher | null) => {
			if (!appliedVoucher) {
				setDiscount(0)
				setGiftProducts([])
				return
			}

			console.log('Applied voucher changed:', appliedVoucher)

			// Use discount value calculated by the backend
			if (appliedVoucher.discount_value) {
				setDiscount(appliedVoucher.discount_value)
			}

			// Handle gift products if this is a gift_product voucher
			if (appliedVoucher.voucher_type === 'gift_product') {
				const giftProducts = (
					await voucherAPI.getGiftProducts(appliedVoucher.voucher_code)
				).data as ProductInfo[]
				console.log('Gift products:', giftProducts)

				setGiftProducts(giftProducts)
			} else {
				// Clear gift products if voucher is not gift_product type
				setGiftProducts([])
			}
		}

		update(appliedVoucher)
	}, [appliedVoucher])

	const contextValue = {
		checkoutItems,
		setCheckoutItems,
		subtotal,
		deliveryFee,
		setDeliveryFee,
		discount,
		setDiscount,
		total,
		setTotal,
		selectedVoucher,
		setSelectedVoucher,
		appliedVoucher,
		setAppliedVoucher,
		vouchers,
		setVouchers,
		isLoadingVouchers,
		setIsLoadingVouchers,
		giftProducts,
		setGiftProducts,
		isLoadingGiftProducts,
		setIsLoadingGiftProducts,
		orderId,
		setOrderId,
	}

	return (
		<CheckoutContext.Provider value={contextValue}>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="/order/(checkout)/checkout" />
				<Stack.Screen name="/order/(checkout)/voucher" />
				<Stack.Screen name="/input-address" />
				<Stack.Screen name="/order/(checkout)/order-placed" />
				<Stack.Screen name="/order/(checkout)/tracking" />
			</Stack>
		</CheckoutContext.Provider>
	)
}
