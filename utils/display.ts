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
