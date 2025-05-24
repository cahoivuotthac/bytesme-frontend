import * as SecureStore from "expo-secure-store";
import axios from "axios";
import URLs from "@/constants/URLs";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
// import Config from "@/constants/Config";

export const APIClient = axios.create({
	withCredentials: true, // Important
	// baseURL: URLs.serverBaseUrl,
	// baseURL: 'http://192.168.2.9:8000',
	baseURL: 'http://127.0.0.1:8000',
	timeout: 5000,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
		"X-Requested-With": "XMLHttpRequest",
	},
});

// Get CSRF token - needed for server-side CSRF protection
export const getCsrfToken = async () => {
	try {
		await APIClient.get("/sanctum/csrf-cookie");
	} catch (error) {
		console.error("Error fetching CSRF token:", error);
	}
};

export const notificationAPI = {
	addExpoPushToken: async (token: string) => {
		return await APIClient.post("/user/notification/push-tokens/add", {
			expo_push_token: token,
		});
	},
};

// Wishlist API endpoints
export const addToWishlist = (productId: number) => {
	return APIClient.post("/user/wishlist/add", { product_id: productId });
};

export const removeFromWishlist = (productId: number) => {
	return APIClient.post("/user/wishlist/remove", {
		product_id: productId,
	});
};

export const getWishlist = () => {
	return APIClient.get("/user/wishlist");
};

export const cartAPI = {
	addItemToCart: async (
		productId: number,
		quantity: number,
		selectedSize: string
	) => {
		return await APIClient.post("/user/cart/add", {
			product_id: productId,
			quantity: quantity,
			selected_size: selectedSize,
		});
	},

	getCartItems: async () => {
		return await APIClient.get("/user/cart");
	},

	updateItemQuantity: async (productId: number, quantity: number) => {
		return await APIClient.post("/user/cart/update-item-quantity", {
			product_id: productId,
			quantity: quantity,
		});
	},

	removeFromCart: async (productId: number) => {
		return await APIClient.post("/user/cart/remove", {
			product_id: productId,
		});
	},

	updateItemSize: async (productId: number, size: string) => {
		return await APIClient.post("/user/cart/update-item-size", {
			product_id: productId,
			size: size,
		});
	},
};

export const addressAPI = {
	getUserAddresses: () => {
		return APIClient.get("/user/addresses");
	},

	addAddress: ({
		urbanName,
		urbanCode,
		suburbName,
		suburbCode,
		quarterName,
		quarterCode,
		fullAddress,
		isDefaultAddress,
	}: {
		urbanName: string;
		urbanCode: string;
		suburbName: string;
		suburbCode: string;
		quarterName: string | null;
		quarterCode: string | null;
		fullAddress: string;
		isDefaultAddress: boolean;
	}) => {
		return APIClient.post("/user/addresses/add", {
			urban_name: urbanName,
			urban_code: urbanCode,
			suburb_name: suburbName,
			suburb_code: suburbCode,
			quarter_name: quarterName,
			quarter_code: quarterCode,
			full_address: fullAddress,
			is_default_address: isDefaultAddress,
		});
	},

	updateAddress: async ({
		userAddressId,
		urbanName,
		urbanCode,
		suburbName,
		suburbCode,
		quarterName,
		quarterCode,
		fullAddress,
		isDefaultAddress,
	}: {
		userAddressId: number;
		urbanName: string;
		urbanCode: string;
		suburbName: string;
		suburbCode: string;
		quarterName: string | null;
		quarterCode: string | null;
		fullAddress: string;
		isDefaultAddress: boolean;
	}) => {
		return APIClient.post("/user/addresses/update", {
			user_address_id: userAddressId,
			urban_name: urbanName,
			urban_code: urbanCode,
			suburb_name: suburbName,
			suburb_code: suburbCode,
			quarter_name: quarterName,
			quarter_code: quarterCode,
			full_address: fullAddress,
			is_default_address: isDefaultAddress,
		});
	},

	removeAddress: async (userAddressId: number) => {
		return APIClient.post("/user/addresses/remove", {
			user_address_id: userAddressId,
		});
	},
};

export const productAPI = {
	getProductDetails: (productId: number) => {
		return APIClient.get(
			"/product/details?" +
				new URLSearchParams({
					product_id: productId.toString(),
				}).toString()
		);
	},

	getProductFeedbacks: async (
		productId: number,
		offset: number,
		limit: number
	) => {
		return APIClient.get(
			"/product/feedbacks?" +
				new URLSearchParams({
					product_id: productId.toString(),
					offset: offset.toString(),
					limit: limit.toString(),
				}).toString()
		);
	},

	getSimilarProducts: async (productId: number, limit: number) => {
		return APIClient.get(
			"/product/similar-products?" +
				new URLSearchParams({
					product_id: productId.toString(),
					limit: limit.toString(),
				}).toString()
		);
	},

	getProductsByCategory: (
		categoryId: number,
		offset: number,
		limit: number
	) => {
		return APIClient.get(
			"/product/category?" +
				new URLSearchParams({
					category_id: categoryId.toString(),
					offset: offset.toString(),
					limit: limit.toString(),
				}).toString()
		);
	},
};

export const voucherAPI = {
	getVouchers: (
		selectedItemIds: number[],
		offset: number,
		limit: number,
		voucherCode?: string
	) => {
		let searchParams = new URLSearchParams({
			selected_item_ids: selectedItemIds.join(","),
			offset: offset.toString(),
			limit: limit.toString(),
		});

		if (voucherCode) {
			searchParams.append("voucher_code", voucherCode);
		}

		return APIClient.get("/voucher?" + searchParams.toString());
	},

	isVoucherApplicable: (voucherCode: string, selected_item_ids: string) => {
		return APIClient.get(
			"/voucher/is-applicable?" +
				new URLSearchParams({
					voucher_code: voucherCode,
					selected_item_ids: selected_item_ids,
				}).toString()
		);
	},

	applyVoucher: (voucherCode: string) => {
		return APIClient.post("/user/vouchers/apply", { code: voucherCode });
	},

	getGiftProducts: (voucherCode: string) => {
		return APIClient.get(
			"/voucher/gift-products?" +
				new URLSearchParams({ voucher_code: voucherCode }).toString()
		);
	},

	removeVoucher: () => {
		return APIClient.post("/user/vouchers/remove");
	},
};

export const orderAPI = {
	getOrderHistory: (offset: number, limit: number) => {
		return APIClient.get(
			"/order?" +
				new URLSearchParams({
					offset: offset.toString(),
					limit: limit.toString(),
				}).toString()
		);
	},

	placeOrder: (params: {
		user_address_id: number;
		payment_method_id: string;
		voucher_code: string | null;
		selected_item_ids: number[];
	}) => {
		const payload = params.voucher_code
			? { ...params }
			: Object.fromEntries(
					Object.entries(params).filter(
						([key]) => key !== "voucher_code"
					)
			  );
		const response = APIClient.post("/order/place", {
			...payload,
			selected_item_ids: params.selected_item_ids.join(","),
		});

		return response;
	},

	cancelOrder: async (orderId: number) => {
		return APIClient.post("/order/cancel", {
			order_id: orderId,
		});
	},

	sendFeedback: async (params: {
		order_id: number;
		content: string;
		rating: number;
		images: string[]; // base64 images
	}) => {
		return APIClient.post("/order/feedback", params);
	},

	getOrderDetails: (orderId: number) => {
		return APIClient.get(
			"/order/details?" +
				new URLSearchParams({
					order_id: orderId.toString(),
				}).toString()
		);
	},
};

// Mock API service for category products
export const mockCategoryAPI = {
	// Mock products by category
	getProductsByCategory: async (
		categoryId: string,
		page: number = 1,
		limit: number = 10
	) => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 800));

		// Different products for different categories
		const categoryProducts = {
			bingsu: [
				{
					productId: 101,
					name: "Bingsu Dâu Tây",
					price: 85000,
					imageUrl:
						"https://images.unsplash.com/photo-1551024506-0bccd828d307",
					rating: 4.8,
					categoryId: "bingsu",
				},
				{
					productId: 102,
					name: "Bingsu Xoài",
					price: 90000,
					originalPrice: 100000,
					discountPercentage: 10,
					imageUrl:
						"https://images.unsplash.com/photo-1551024601-bec78aea704b",
					rating: 4.7,
					categoryId: "bingsu",
				},
				{
					productId: 103,
					name: "Bingsu Chocolate",
					price: 95000,
					imageUrl:
						"https://images.unsplash.com/photo-1551024739-7f6baf4e7000",
					rating: 4.9,
					categoryId: "bingsu",
				},
				{
					productId: 104,
					name: "Bingsu Trà Xanh",
					price: 88000,
					imageUrl:
						"https://images.unsplash.com/photo-1551024739-7f6baf4e7000",
					rating: 4.6,
					categoryId: "bingsu",
				},
			],
			coffee: [
				{
					productId: 201,
					name: "Espresso Đậm Đà",
					price: 45000,
					imageUrl:
						"https://images.unsplash.com/photo-1507133750040-4a8f57021571",
					rating: 4.9,
					categoryId: "coffee",
				},
				{
					productId: 202,
					name: "Cappuccino Ý",
					price: 55000,
					originalPrice: 65000,
					discountPercentage: 15,
					imageUrl:
						"https://images.unsplash.com/photo-1572442388796-11668a67e53d",
					rating: 4.7,
					categoryId: "coffee",
				},
				{
					productId: 203,
					name: "Latte Vanilla",
					price: 58000,
					imageUrl:
						"https://images.unsplash.com/photo-1461023058943-07fcbe16d735",
					rating: 4.6,
					categoryId: "coffee",
				},
			],
			"cakes-pastries": [
				{
					productId: 301,
					name: "Bánh Tiramisu",
					price: 120000,
					imageUrl:
						"https://images.unsplash.com/photo-1571877227200-a0d98ea607e9",
					rating: 4.8,
					categoryId: "cakes-pastries",
				},
				{
					productId: 302,
					name: "Bánh Sừng Bò",
					price: 35000,
					imageUrl:
						"https://images.unsplash.com/photo-1555507036-ab1f4038808a",
					rating: 4.5,
					categoryId: "cakes-pastries",
				},
				{
					productId: 303,
					name: "Bánh Cheesecake",
					price: 95000,
					originalPrice: 110000,
					discountPercentage: 14,
					imageUrl:
						"https://images.unsplash.com/photo-1578985545062-69928b1d9587",
					rating: 4.9,
					categoryId: "cakes-pastries",
				},
			],
		};

		// Get products for the category or default products
		const products =
			categoryProducts[categoryId as keyof typeof categoryProducts] ||
			categoryProducts["bingsu"];

		// Simulate pagination
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedProducts = products.slice(startIndex, endIndex);

		return {
			products: paginatedProducts,
			hasMore: endIndex < products.length,
			totalCount: products.length,
			currentPage: page,
		};
	},
};
