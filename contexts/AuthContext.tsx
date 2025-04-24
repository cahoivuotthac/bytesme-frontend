import { createContext, useState, useContext, useEffect } from "react";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the structure of our auth state
type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
};

// Define the shape of the context
type AuthContextType = {
  authState: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<boolean>;
  refreshUser: () => Promise<void>;
};

// Default auth state
const defaultAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
};

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Base URL for API calls
const API_URL = "http://localhost:8000"; // Change to your Laravel API URL

// Provider component that wraps your app and makes auth object available to any child component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  // Function to check if a session exists
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if the user has a valid session by retrieving user data
        const response = await fetch(`${API_URL}/auth/user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-Token": "yap",
          },
          credentials: "include", // Important for cookies to be sent with request
        });

        if (response.ok) {
          const userData = await response.json();
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: userData,
          });
        } else {
          // No valid session
          setAuthState({
            ...defaultAuthState,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setAuthState({
          ...defaultAuthState,
          isLoading: false,
        });
      }
    };

    checkSession();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // First, get the CSRF token if needed
      await getCsrfToken();

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-Token": "yap",
        },
        credentials: "include", // Important for cookies to be saved
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store authentication state in memory
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: data.user,
        });

        // Store a simple flag to indicate the user has logged in before
        // This doesn't store sensitive data, just helps with UX
        await AsyncStorage.setItem("has_session", "true");

        return true;
      } else {
        // Handle error based on Laravel response
        Alert.alert("Login Failed", data.message || "Invalid credentials");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      return false;
    }
  };

  // For Laravel CSRF protection
  const getCsrfToken = async () => {
    return "yap";
    // try {
    //   await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    //     method: "GET",
    //     credentials: "include",
    //   });
    // } catch (error) {
    //   console.error("Error fetching CSRF token:", error);
    // }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call Laravel logout endpoint
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-Token": "yap",
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear flag and reset state
      await AsyncStorage.removeItem("has_session");
      setAuthState({
        ...defaultAuthState,
        isLoading: false,
      });
    }
  };

  // Register function
  const register = async (userData: any): Promise<boolean> => {
    try {
      // First, get the CSRF token if needed
      await getCsrfToken();

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-Token": "yap",
        },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // If registration automatically logs in user
        if (data.user) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: data.user,
          });

          await AsyncStorage.setItem("has_session", "true");
        }
        return true;
      } else {
        // Handle validation errors from Laravel
        const errorMessage = data.message || "Registration failed";
        Alert.alert("Registration Error", errorMessage);
        return false;
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", "An unexpected error occurred during registration.");
      return false;
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    if (!authState.isAuthenticated) return;

    try {
      const response = await fetch(`${API_URL}/auth/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-Token": "yap",
        },
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setAuthState((prev) => ({
          ...prev,
          user: userData,
        }));
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    authState,
    login,
    logout,
    register,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
