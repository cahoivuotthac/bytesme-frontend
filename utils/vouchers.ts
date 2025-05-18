import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { Voucher, VoucherRule } from "@/app/(home)/order/(checkout)/_layout";
import { useTranslation } from "@/providers/locale";

// Voucher types

// Storage key for applied vouchers
const APPLIED_VOUCHER_KEY = "APPLIED_VOUCHER";

/**
 * Calculate discount amount based on voucher and order total
 */
// export const calculateVoucherDiscount = (
// 	voucher: Voucher,
// 	orderTotal: number,
// 	isFirstOrder: boolean = false
// ): { discountAmount: number; isApplicable: boolean; message: string } => {
// 	// Check if voucher is valid
// 	if (!voucher.isApplicable) {
// 		return {
// 			discountAmount: 0,
// 			isApplicable: false,
// 			message: "notAvailable",
// 		};
// 	}

// 	// Check if first order only
// 	if (voucher.isFirstOrderOnly && !isFirstOrder) {
// 		return {
// 			discountAmount: 0,
// 			isApplicable: false,
// 			message: "firstOrderOnly",
// 		};
// 	}

// 	// Check minimum order value
// 	if (voucher.minOrderValue && orderTotal < voucher.minOrderValue) {
// 		return {
// 			discountAmount: 0,
// 			isApplicable: false,
// 			message: "minimumOrderValue",
// 		};
// 	}

// 	// Calculate discount based on voucher type
// 	let discountAmount = 0;

// 	if (voucher.type === "percentage") {
// 		discountAmount = (orderTotal * voucher.value) / 100;
// 		// Apply max discount if applicable
// 		if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
// 			discountAmount = voucher.maxDiscount;
// 		}
// 	} else if (voucher.type === "fixed") {
// 		discountAmount = voucher.value;
// 	} else if (voucher.type === "shipping") {
// 		// Shipping vouchers are handled separately in checkout
// 		discountAmount = 0;
// 	}

// 	return {
// 		discountAmount,
// 		isApplicable: true,
// 		message: "",
// 	};
// };

/**
 * Apply a voucher and save to local storage
 */
export const applyVoucher = async (voucher: Voucher): Promise<boolean> => {
	try {
		await AsyncStorage.setItem(
			APPLIED_VOUCHER_KEY,
			JSON.stringify(voucher)
		);
		return true;
	} catch (error) {
		console.error("Error saving voucher:", error);
		return false;
	}
};

/**
 * Remove applied voucher from storage
 */
export const removeVoucher = async (): Promise<boolean> => {
	try {
		await AsyncStorage.removeItem(APPLIED_VOUCHER_KEY);
		return true;
	} catch (error) {
		console.error("Error removing voucher:", error);
		return false;
	}
};

/**
 * Get the currently applied voucher
 */
export const getAppliedVoucher = async (): Promise<Voucher | null> => {
	try {
		const voucherString = await AsyncStorage.getItem(APPLIED_VOUCHER_KEY);
		return voucherString ? JSON.parse(voucherString) : null;
	} catch (error) {
		console.error("Error getting voucher:", error);
		return null;
	}
};

/**
 * Check if voucher code is valid
 * This would typically make an API call to validate
 */
// export const validateVoucherCode = async (
// 	code: string,
// 	orderTotal: number
// ): Promise<{ success: boolean; voucher?: Voucher; message?: string }> => {
// 	try {
// 		// This is where you would make an API call to validate the code
// 		// For now, we'll simulate a response

// 		// Mock API call
// 		// return await fetch(`/api/vouchers/validate?code=${code}&total=${orderTotal}`)
// 		//  .then(res => res.json());

// 		// Mock response for testing
// 		if (code === "INVALID") {
// 			return {
// 				success: false,
// 				message: "invalidVoucher",
// 			};
// 		}

// 		// Mock valid voucher
// 		return {
// 			success: true,
// 			voucher: {
// 				voucher_id: "123",
// 				code: code,
// 				type: "percentage",
// 				value: 10,
// 				minOrderValue: 100000,
// 				maxDiscount: 50000,
// 				expiryDate: "2025-12-31",
// 				isValid: true,
// 			},
// 		};
// 	} catch (error) {
// 		console.error("Error validating voucher:", error);
// 		return {
// 			success: false,
// 			message: "voucherError",
// 		};
// 	}
// };

/**
 * Format voucher value for display
 */
// export const formatVoucherValue = (voucher: Voucher): string => {
// 	if (voucher.type === "percentage") {
// 		return `${voucher.value}%`;
// 	} else if (voucher.type === "fixed") {
// 		return `${voucher.value.toLocaleString("vi-VN")}đ`;
// 	} else if (voucher.type === "shipping") {
// 		return "Free Shipping";
// 	}
// 	return "";
// };

/**
 * Check if a voucher is expired
 */
// export const isVoucherExpired = (expiryDate: string): boolean => {
// 	const expiry = new Date(expiryDate);
// 	const now = new Date();
// 	return expiry < now;
// };

/**
 * Format expiry date for display
 */
// export const formatExpiryDate = (expiryDate: string): string => {
// 	const date = new Date(expiryDate);
// 	return date.toLocaleDateString("vi-VN");
// };

export const formatVoucherValue = (voucher: Voucher) => {
	const { t } = useTranslation();

	const formattedValue = parseInt(voucher.voucher_value).toLocaleString(
		"vi-VN"
	);
	switch (voucher.voucher_type) {
		case "percentage":
			return `${t("percentageOff").replace("{percent}", formattedValue)}`;
		case "cash":
			return `${t("percentageOff").replace(
				"{percent}%",
				formattedValue
			)}đ`;
		case "gift_product":
			return voucher.voucher_description;
	}
	return "";
};
