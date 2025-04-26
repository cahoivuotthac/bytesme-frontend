import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Config from "../constants/Config";

// Get API URL from Config
export const API_URL = Config.apiUrl;

export const APIClient = axios.create({
	withCredentials: true, // Important
	baseURL: Config.serverAddress,
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
		await fetch(`${Config.serverAddress}/sanctum/csrf-cookie`, {
			method: "GET",
			credentials: "include",
		});
	} catch (error) {
		console.error("Error fetching CSRF token:", error);
	}
};
