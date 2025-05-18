export const formatDate = (dateString: string, locale: string) => {
	const date = new Date(dateString);
	if (locale === "en") {
		return date.toLocaleDateString("en-US", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	}

	return date.toLocaleDateString("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};

export const formatDateTime = (dateTimeString: string, locale: string) => {
	// The new Date constructor automatically converts the input to device's local timezone
	const dateTime = new Date(dateTimeString);

	const dateOptions: Intl.DateTimeFormatOptions = {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	};

	const timeOptions: Intl.DateTimeFormatOptions = {
		hour: "2-digit",
		minute: "2-digit",
	};

	const localeString = locale === "en" ? "en-US" : "vi-VN";

	const formattedDate = dateTime.toLocaleDateString(
		localeString,
		dateOptions
	);
	const formattedTime = dateTime.toLocaleTimeString(
		localeString,
		timeOptions
	);

	return `${formattedDate} ${formattedTime}`;
};

export const formatPrice = (price: number, locale: string) => {
	price = Math.round(price);
	if (locale === "en") {
		return price.toLocaleString("en-US", {
			style: "currency",
			currency: "VND",
		});
	}

	return price.toLocaleString("vi-VN", {
		style: "currency",
		currency: "VND",
	});
};
