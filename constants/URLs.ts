// import Config from './Config';

export default {
	/** Application server configuration */

	// Local
	// serverBaseUrl: "http://192.168.2.9:8000",
	// serverHost: "http://192.168.2.9",

	// EC2
	serverBaseUrl: "http://18.139.224.28:8000",
	serverHost: "http://18.139.224.28",

	/** Websocket server configuration */

	// Local
	// wsHost: "192.168.2.9",
	// wsPort: 8080,
	// wsHttpFallbackPort: 8000, // fallback HTTP port for Reverb server (not important)

	// EC2
	wsHost: "18.139.224.28",
	wsPort: 8080,
	wsHttpFallbackPort: 8000, // fallback HTTP port for Reverb server (not important)
};
