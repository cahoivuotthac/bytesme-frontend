import React, { useState, useCallback } from 'react'
import AlertDialog from '@/components/shared/AlertDialog'
import { useTranslation } from '@/providers/locale'

interface AlertOptions {
	title?: string
	message: string
	confirmText?: string
	cancelText?: string
	onConfirm?: () => void
	onCancel?: () => void
	type?: 'default' | 'success' | 'error' | 'warning' | 'info'
}

export function useAlert() {
	const [visible, setVisible] = useState(false)
	const [options, setOptions] = useState<AlertOptions>({
		message: '',
		type: 'default',
	})

	const { t } = useTranslation()

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
				title: t('error'),
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
				title: t('success'),
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

	const showInfo = useCallback(
		(message: string, onConfirm?: () => void) => {
			showAlert({
				title: t('info'),
				message,
				type: 'info',
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
				title: t('confirm'),
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
		showInfo,
		showConfirm,
		hideAlert,
	}
}
