// import Echo from "laravel-echo/dist/echo";
// import Pusher from "pusher-js/react-native";
// import URLs from "@/constants/URLs";

// // Create a custom Echo factory function
// export function createEchoInstance(authToken: string) {
// 	// Don't reference window directly
// 	// Use the Pusher object from the import
// 	return new Echo({
// 		broadcaster: "reverb",
// 		key: "jv2d8id8cncc3h2xbsm5", // Your REVERB_APP_KEY from Laravel .env
// 		wsHost: URLs.serverAddress, // Replace with your server IP address
// 		wsPort: 8080, // Your REVERB_PORT from Laravel .env
// 		forceTLS: false, // Set to true if using HTTPS
// 		disableStats: true,
// 		enabledTransports: ["ws"],
// 		authEndpoint: `${URLs.serverBaseUrl}/broadcasting/auth`, // Your Laravel API endpoint
// 		client: Pusher, // Use Pusher directly instead of global window.Pusher
// 		auth: {
// 			headers: {
// 				Authorization: authToken || "", // Bearer token
// 				Accept: "application/json",
// 			},
// 		},
// 	});
// }
