import * as SecureStore from "expo-secure-store";
import axios from "axios";
import URLs from "@/constants/URLs";
// import Config from "@/constants/Config";

export const APIClient = axios.create({
	withCredentials: true, // Important
	baseURL: URLs.serverAddress,
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

// Auth-specific API functions
// export const authAPI = {
// 	signin: async (email: string, password: string) => {
// 		// await getCsrfToken(); // Get CSRF token before login
// 		return APIClient.post("/auth/signin", { email, password });
// 	},

// 	signup: async (userData: any) => {
// 		// await getCsrfToken(); // Get CSRF token before registration
// 		return APIClient.post("/auth/signup", userData);
// 	},

// 	logout: () => APIClient.post("/auth/logout"),

// 	getUser: () => APIClient.get("/auth/user"),

// 	updateProfile: (userData: any) => APIClient.put("/auth/profile", userData),
// };

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
		suburbName,
		quarterName,
		fullAddress,
		isDefaultAddress,
	}: {
		urbanName: string;
		suburbName: string;
		quarterName: string | null;
		fullAddress: string;
		isDefaultAddress: boolean;
	}) => {
		return APIClient.post("/user/addresses/add", {
			urban_name: urbanName,
			suburb_name: suburbName,
			quarter_name: quarterName,
			full_address: fullAddress,
			is_default_address: isDefaultAddress,
		});
	},
};
