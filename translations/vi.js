import { ForeignObject } from "react-native-svg";

export default {
	// General
	skip: "Bỏ qua",
	next: "Tiếp theo",
	errorRetry: "Có lỗi xảy ra, vui lòng thử lại",
	processing: "Đang xử lý...",
	phone: "Số điện thoại",
	apply: "Áp dụng",

	// Product Cards
	discount: "Giảm giá",
	favorite: "Yêu thích",
	notFavorite: "Thêm vào yêu thích",
	addToFavorites: "Thêm vào yêu thích",
	removeFromFavorites: "Xóa khỏi yêu thích",

	// Search
	searchProductPlaceholder: "Tìm kiếm món ngon với Bytesme AI...",
	viewAll: "Xem tất cả",

	// Product Categories
	all: "Tất cả",
	coffee: "Cà phê",
	pastry: "Bánh ngọt",
	tea: "Trà",
	coldDrinks: "Đồ uống lạnh",
	cake: "Bánh",

	// Product Sections
	bestSellers: "Bán chạy nhất",
	highestRated: "Đánh giá cao nhất",
	discounted: "Đang giảm giá",
	explore: "Khám phá",

	// Address Input Screen
	deliveryLocation: "Địa điểm giao hàng",
	deliveryLocationSubtitle:
		"Hãy giúp chúng tôi giao hàng đến bạn một cách chính xác nhất",
	useCurrentLocation: "Sử dụng vị trí hiện tại",
	gettingLocation: "Đang lấy vị trí...",
	province: "Tỉnh/thành phố",
	district: "Quận/huyện/thị xã",
	suburb: "Thành phố/huyện/thị xã",
	quarter: "Phường/xã",
	address: "Địa chỉ",
	addressPlaceholder: "123 đường ABC...",
	addressName: "Tên địa chỉ",
	addressNamePlaceholder: "Nhà, Công ty, ...",
	setAsDefault: "Đặt làm địa chỉ mặc định",
	selectProvince: "Chọn tỉnh/thành phố",
	selectDistrict: "Chọn quận/huyện",
	selectWard: "Chọn phường/xã",
	selectProvinceFirst: "Vui lòng chọn tỉnh/thành phố trước",
	selectDistrictFirst: "Vui lòng chọn quận/huyện trước",
	addressDetailPlaceholder: "Tên đường, số nhà...",
	searchPlaceholder: "Tìm kiếm...",
	gpsCoordinates: "Tọa độ GPS:",
	nearLocation: "Gần vị trí hiện tại",
	locationWithCoordinates: "Vị trí với tọa độ",
	locationFound:
		"Đã tìm thấy vị trí! Vui lòng kiểm tra lại thông tin địa chỉ.",
	pleaseCompleteAddress: "Vui lòng điền đầy đủ địa chỉ",
	saveAddress: "Lưu địa chỉ",
	requiredFields: "Thông tin bắt buộc",

	// Form validation
	pleaseEnterAddress: "Vui lòng nhập đầy đủ thông tin địa chỉ",
	addressSaved: "Lưu địa chỉ thành công!",
	addressSaveError: "Có lỗi xảy ra khi lưu địa chỉ. Vui lòng thử lại sau.",
	locationPermissionDenied: "Quyền truy cập vị trí bị từ chối",
	locationError:
		"Không thể lấy vị trí hiện tại. Vui lòng nhập địa chỉ thủ công.",
	errorLoadingProvinces: "Lỗi khi tải danh sách tỉnh/thành phố",
	errorLoadingDistricts: "Lỗi khi tải danh sách quận/huyện",
	errorLoadingWards: "Lỗi khi tải danh sách phường/xã",

	// Signin
	signIn: "Đăng nhập",
	forgetPassword: "Quên mật khẩu?",
	loginWithPassword: "Đăng nhập bằng mật khẩu",
	emailPlaceholder: "example@email.com",
	passwordPlaceholder: "••••••••",
	accountInfo: "Nhập thông tin tài khoản của bạn",
	login: "Đăng nhập",
	noAccount: "Chưa có tài khoản?",
	signUp: "Đăng ký",

	// Password Reset Flow
	passwordReset: "Đặt lại mật khẩu",
	enterPhoneForOTP: "Nhập số điện thoại để nhận mã xác thực",
	sendOTP: "Gửi mã xác thực",
	rememberPassword: "Nhớ mật khẩu?",
	otpVerification: "Xác thực OTP",
	enterOTPSentTo: "Vui lòng nhập mã OTP được gửi đến",
	didntReceiveCode: "Không nhận được mã?",
	resend: "Gửi lại",
	resendAfter: "Gửi lại sau {seconds}s",
	verify: "Xác nhận",
	otpSuccess: "Xác thực thành công",
	createNewPassword: "Tạo mật khẩu mới cho tài khoản của bạn",
	newPassword: "Mật khẩu mới",
	confirmPassword: "Xác nhận mật khẩu",
	resetPassword: "Đặt lại mật khẩu",
	passwordRequirements:
		"Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ và số",
	resetSuccess: "Đặt lại mật khẩu thành công",
	invalidEmail: "Email không hợp lệ",
	invalidPhone: "Vui lòng nhập số điện thoại hợp lệ",
	enterAllInfo: "Vui lòng điền đầy đủ thông tin",
	passwordsDontMatch: "Mật khẩu không khớp",
	invalidPassword: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số",
	enterOTP: "Vui lòng nhập đủ 4 chữ số OTP",
	invalidOTP: "Mã OTP không đúng",
	otpSent: "Mã OTP đã được gửi tới số điện thoại của bạn",
	newOTPSent: "Mã OTP mới đã được gửi",

	// BottomBar
	home: "Trang chủ",
	cart: "Giỏ hàng",
	profile: "Hồ sơ",
	orders: "Đơn hàng",
	notifications: "Thông báo",

	// Product Detail Page
	description: "Giới thiệu",
	reviews: "Nhận xét",
	similarProducts: "Sản phẩm tương tự",
	addToCart: "Thêm vào giỏ hàng",
	size: "Kích cỡ",
	quantity: "Số lượng",
	selectSize: "Chọn kích cỡ",
	productDetails: "Chi tiết sản phẩm",
	ingredients: "Thành phần",
	nutritionalInfo: "Thông tin dinh dưỡng",
	customerReviews: "Đánh giá từ khách hàng",
	writeReview: "Viết đánh giá",
	viewMoreReviews: "Xem thêm đánh giá",
	relatedProducts: "Có thể bạn cũng thích",
	outOfStock: "Hết hàng",
	inStock: "Còn hàng",
	ratings: "đánh giá",
	readMore: "Xem thêm",
	seeAllReviews: "Xem tất cả đánh giá",
	errorAddingToCart: "Không thể thêm vào giỏ hàng",

	// Profile layout
	profile: "Hồ sơ",
	cart: "Giỏ hàng",
	favorites: "Yêu thích",

	// Wishlist
	noFavorites: "Chưa có sản phẩm yêu thích nào",
	browseProducts: "Xem sản phẩm",
	addAllToCart: "Thêm tất cả vào giỏ hàng",
	removingFromFavorites: "Đang xóa khỏi yêu thích...",
	errorFetchingWishlist: "Có lỗi xảy ra khi tải danh sách yêu thích",
	errorAddingToWishlist: "Không thể thêm sản phẩm vào danh sách yêu thích",
	errorRemovingFromWishlist:
		"Không thể xóa sản phẩm khỏi danh sách yêu thích",

	// Cart page
	checkout: "Mua hàng",
	subtotal: "Tạm tính",
	deliveryFee: "Phí giao hàng",
	total: "Tổng cộng",
	emptyCart: "Giỏ hàng của bạn đang trống",
	selectAll: "Chọn tất cả",
	noItemsSelected: "Chưa có sản phẩm nào được chọn để thanh toán",
	errorFetchingCart: "Có lỗi xảy ra khi tải giỏ hàng",
	removingFromCart: "Đang xóa khỏi giỏ hàng...",
	errorUpdatingQuantity: "Không thể cập nhật số lượng sản phẩm",
	errorRemovingFromCart: "Không thể xóa sản phẩm khỏi giỏ hàng",
	errorFetchingCartItems:
		"Có lỗi xảy ra khi tải danh sách sản phẩm trong giỏ hàng",
};
