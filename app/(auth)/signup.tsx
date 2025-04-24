import React from 'react'
import {
	SafeAreaView,
	View,
	ScrollView,
	Image,
	Text,
	TouchableOpacity,
	StyleSheet,
} from 'react-native'

export default (props) => {
	return (
		<SafeAreaView style={styles.container}>
			<ScrollView style={styles.scrollView}>
				<View style={styles.column}>
					<Image
						source={{
							uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/5CiFLE6MMk/jlkf6qgn_expires_30_days.png',
						}}
						resizeMode={'stretch'}
						style={styles.image}
					/>
					<Text style={styles.text}>{'Đăng ký'}</Text>
				</View>
				<Text style={styles.text2}>{'Nhập thông tin của bạn để tiếp tục'}</Text>
				<View style={styles.column2}>
					<Text style={styles.text3}>{'Email'}</Text>
					<Text style={styles.text4}>{'imshuvo97@gmail.com'}</Text>
				</View>
				<Image
					source={{
						uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/5CiFLE6MMk/7d201iyb_expires_30_days.png',
					}}
					resizeMode={'stretch'}
					style={styles.image2}
				/>
				<View style={styles.row}>
					<View>
						<Text style={styles.text5}>{'Mật khẩu'}</Text>
						<Image
							source={{
								uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/5CiFLE6MMk/0a987hlb_expires_30_days.png',
							}}
							resizeMode={'stretch'}
							style={styles.image3}
						/>
					</View>
					<View style={styles.box}></View>
					<Image
						source={{
							uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/5CiFLE6MMk/u5eurslz_expires_30_days.png',
						}}
						resizeMode={'stretch'}
						style={styles.image4}
					/>
					<Image
						source={{
							uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/5CiFLE6MMk/8r718wmy_expires_30_days.png',
						}}
						resizeMode={'stretch'}
						style={styles.image5}
					/>
				</View>
				<Image
					source={{
						uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/5CiFLE6MMk/7c9h4pcq_expires_30_days.png',
					}}
					resizeMode={'stretch'}
					style={styles.image6}
				/>
				<View style={styles.row}>
					<View style={styles.column3}>
						<Text style={styles.text5}>{'Xác nhận mật khẩu'}</Text>
						<Image
							source={{
								uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/5CiFLE6MMk/oovi03hr_expires_30_days.png',
							}}
							resizeMode={'stretch'}
							style={styles.image7}
						/>
					</View>
					<View style={styles.box}></View>
					<Image
						source={{
							uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/5CiFLE6MMk/1fdl2fmb_expires_30_days.png',
						}}
						resizeMode={'stretch'}
						style={styles.image4}
					/>
					<Image
						source={{
							uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/5CiFLE6MMk/103dv5lr_expires_30_days.png',
						}}
						resizeMode={'stretch'}
						style={styles.image5}
					/>
				</View>
				<Image
					source={{
						uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/5CiFLE6MMk/bewj1zuc_expires_30_days.png',
					}}
					resizeMode={'stretch'}
					style={styles.image8}
				/>
				<Text style={styles.text6}>
					{
						'By continuing you agree to our Terms of Service\nand Privacy Policy.'
					}
				</Text>
				<TouchableOpacity
					style={styles.button}
					onPress={() => alert('Pressed!')}
				>
					<Text style={styles.text7}>{'Tạo tài khoản'}</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	)
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	box: {
		flex: 1,
	},
	button: {
		alignItems: 'center',
		backgroundColor: '#FB0050CC',
		borderRadius: 100,
		paddingVertical: 24,
		marginBottom: 91,
		marginHorizontal: 25,
	},
	column: {
		marginTop: 35,
		marginBottom: 15,
		marginLeft: 25,
	},
	column2: {
		marginHorizontal: 25,
	},
	column3: {
		alignItems: 'center',
	},
	image: {
		width: 199,
		height: 199,
		marginLeft: 78,
	},
	image2: {
		height: 1,
		marginBottom: 22,
		marginHorizontal: 25,
	},
	image3: {
		width: 114,
		height: 7,
		marginHorizontal: 3,
	},
	image4: {
		width: 62,
		height: 62,
		marginBottom: 16,
	},
	image5: {
		width: 19,
		height: 18,
		marginTop: 44,
	},
	image6: {
		height: 1,
		marginBottom: 18,
		marginHorizontal: 25,
	},
	image7: {
		width: 114,
		height: 7,
	},
	image8: {
		height: 1,
		marginBottom: 60,
		marginHorizontal: 25,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginHorizontal: 25,
	},
	scrollView: {
		flex: 1,
		backgroundColor: '#F8F8F8',
	},
	text: {
		color: '#030303',
		fontSize: 26,
		fontWeight: 'bold',
	},
	text2: {
		color: '#7C7C7C',
		fontSize: 16,
		marginBottom: 50,
		marginLeft: 25,
	},
	text3: {
		color: '#7C7C7C',
		fontSize: 16,
		marginBottom: 10,
	},
	text4: {
		color: '#030303',
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	text5: {},
	text6: {},
	text7: {},
})
