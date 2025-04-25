import React, { useState, useCallback } from 'react'
import AlertDialog from '@/components/shared/AlertDialog'

interface AlertOptions {
	title?: string
	message: string
	confirmText?: string
	cancelText?: string
	onConfirm?: () => void
	onCancel?: () => void
	type?: 'default' | 'success' | 'error' | 'warning'
}

export function useAlert() {
	const [visible, setVisible] = useState(false)
	const [options, setOptions] = useState<AlertOptions>({
		message: '',
		type: 'default',
	})

	const showAlert = useCallback((alertOptions: AlertOptions) => {
		setOptions(alertOptions)
		setVisible(true)
	}, [])

	const hideAlert = useCallback(() => {
		setVisible(false)
	}, [])

	// Helper methods for common alert types
	const showError = useCallback(
		(message: string, onConfirm?: () => void) => {
			showAlert({
				title: 'Lỗi',
				message,
				type: 'error',
				onConfirm: () => {
					hideAlert()
					onConfirm?.()
				},
			})
		},
		[showAlert, hideAlert]
	)

	const showSuccess = useCallback(
		(message: string, onConfirm?: () => void) => {
			showAlert({
				title: 'Thành công',
				message,
				type: 'success',
				onConfirm: () => {
					hideAlert()
					onConfirm?.()
				},
			})
		},
		[showAlert, hideAlert]
	)

	const showConfirm = useCallback(
		(message: string, onConfirm: () => void, cancelText = 'Hủy') => {
			showAlert({
				title: 'Xác nhận',
				message,
				confirmText: 'Đồng ý',
				cancelText,
				type: 'warning',
				onConfirm: () => {
					hideAlert()
					onConfirm()
				},
				onCancel: hideAlert,
			})
		},
		[showAlert, hideAlert]
	)

	// The component to render
	const AlertComponent = (
		<AlertDialog
			visible={visible}
			title={options.title}
			message={options.message}
			confirmText={options.confirmText}
			cancelText={options.cancelText}
			onConfirm={() => {
				options.onConfirm?.()
				if (!options.onConfirm) hideAlert()
			}}
			onCancel={() => {
				options.onCancel?.()
				if (!options.onCancel) hideAlert()
			}}
			type={options.type}
		/>
	)

	return {
		AlertComponent,
		showAlert,
		showError,
		showSuccess,
		showConfirm,
		hideAlert,
	}
}
