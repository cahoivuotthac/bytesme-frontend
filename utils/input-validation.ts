export function isEmailFormatValid(email: string) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export function isPasswordFormatValid(password: string) {
	// Minimum 8 characters, at least 1 letter and 1 number
	const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
	return regex.test(password);
}

export function isPhoneNumberFormatValid(phoneNumber: string) {
	// Vietnamese phone number format
	const phoneRegex = /^0\d{9}$/;
	return phoneRegex.test(phoneNumber);
}
