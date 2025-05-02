// // Environment configuration for different environments
// import Constants from "expo-constants";

// // Get the release channel from Expo Constants
// const releaseChannel = Constants.expoConfig?.releaseChannel || "development";

// // Define environment-specific variables
// interface EnvironmentConfig {
// 	serverAddress: string;
// 	apiUrl: string;
// }

// // Define config for each environment
// const ENV: { [key: string]: EnvironmentConfig } = {
// 	development: {
// 		serverAddress: "https://dev-api.bytesme.com",
// 		apiUrl: "https://dev-api.bytesme.com/api",
// 	},
// 	staging: {
// 		serverAddress: "https://staging-api.bytesme.com",
// 		apiUrl: "https://staging-api.bytesme.com/api",
// 	},
// 	production: {
// 		serverAddress: "https://api.bytesme.com",
// 		apiUrl: "https://api.bytesme.com/api",
// 	},
// };

// // Determine which environment to use
// const getEnvVars = (channel: string): EnvironmentConfig => {
// 	// If the channel starts with "prod", use the prod env
// 	if (channel.indexOf("prod") !== -1) {
// 		return ENV.production;
// 	}

// 	// If the channel starts with "staging", use the staging env
// 	if (channel.indexOf("staging") !== -1) {
// 		return ENV.staging;
// 	}

// 	// Otherwise, use the development env
// 	return ENV.development;
// };

// // Export the configuration for the current environment
// export default getEnvVars(releaseChannel);
