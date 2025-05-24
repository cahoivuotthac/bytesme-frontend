import axios from "axios";

export const APIClient = axios.create({
	withCredentials: true, // Important
	// baseURL: URLs.serverBaseUrl,
	baseURL: "http://192.168.33.253:8000",
	timeout: 30 * 1000, // 30 seconds for prod environment
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

export const userAPI = {
	updatePhoneNumber: async (phoneNumber: string) => {
		return APIClient.post("/user/update-phone-number", {
			phone_number: phoneNumber,
		});
	},
};
