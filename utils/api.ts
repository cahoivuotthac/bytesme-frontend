import * as SecureStore from "expo-secure-store";
import axios from "axios";

export const API_URL = "https://your-laravel-api.com/api";

// Generic API request function with authentication
// export const apiRequest = async (
// 	endpoint: string,
// 	method: string = "GET",
// 	data?: any,
// 	useAuth: boolean = true
// ) => {
// 	const url = `${API_URL}${endpoint}`;

// 	// Configure headers
// 	const headers: HeadersInit = {
// 		"Content-Type": "application/json",
// 		Accept: "application/json",
// 		"X-Requested-With": "XMLHttpRequest",
// 	};

// 	// Configure request options
// 	const options: RequestInit = {
// 		method,
// 		headers,
// 		credentials: useAuth ? "include" : "same-origin", // Include cookies when useAuth is true
// 	};

// 	// Add body if data is provided
// 	if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
// 		options.body = JSON.stringify(data);
// 	}

// 	try {
// 		const response = await fetch(url, options);

// 		// Parse response
// 		if (response.status !== 204) {
// 			// No content
// 			const responseData = await response.json();
// 			return {
// 				ok: response.ok,
// 				status: response.status,
// 				data: responseData,
// 			};
// 		}

// 		return { ok: response.ok, status: response.status };
// 	} catch (error) {
// 		console.error(`API request error to ${endpoint}:`, error);
// 		return { ok: false, error };
// 	}
// };

export const APIClient = axios.create({
	baseURL: "http://127.0.0.1:8000",
	timeout: 1000,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
		"X-Requested-With": "XMLHttpRequest",
		// 'X-CSRF-Token': 'dont care',
	},
});

// Get CSRF token - needed for server-side CSRF protection
export const getCsrfToken = async () => {
	try {
		await fetch(`${API_URL.replace("/api", "")}/sanctum/csrf-cookie`, {
			method: "GET",
			credentials: "include",
		});
	} catch (error) {
		console.error("Error fetching CSRF token:", error);
	}
};

// Auth-specific API functions
// export const authAPI = {
// 	login: async (email: string, password: string) => {
// 		await getCsrfToken(); // Get CSRF token before login
// 		return apiRequest("/auth/login", "POST", { email, password }, true);
// 	},

// 	register: async (userData: any) => {
// 		await getCsrfToken(); // Get CSRF token before registration
// 		return apiRequest("/auth/register", "POST", userData, true);
// 	},

// 	logout: () => apiRequest("/auth/logout", "POST"),

// getUser: () => apiRequest("/auth/user"),

// 	updateProfile: (userData: any) =>
// 		apiRequest("/auth/profile", "PUT", userData),
// };
