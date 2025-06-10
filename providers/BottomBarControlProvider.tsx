import React, { createContext, useContext, useState, ReactNode } from 'react'

interface BottomBarControlContextType {
	isVisible: boolean
	unreadNotificationCount: number
	cartItemCount: number
	setVisible: (visible: boolean) => void
	show: () => void
	hide: () => void
	setUnreadNotificationCount: (count: number) => void
	setCartItemCount: (count: number) => void
	incrementNotificationCount: () => void
	decrementNotificationCount: () => void
	incrementCartItemCount: () => void
	decrementCartItemCount: () => void
}

const BottomBarControlContext = createContext<
	BottomBarControlContextType | undefined
>(undefined)

export const BottomBarControlProvider = ({
	children,
}: {
	children: ReactNode
}) => {
	const [isVisible, setIsVisible] = useState(true)
	const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
	const [cartItemCount, setCartItemCount] = useState(0)

	const setVisible = (visible: boolean) => setIsVisible(visible)
	const show = () => setIsVisible(true)
	const hide = () => setIsVisible(false)

	return (
		<BottomBarControlContext.Provider
			value={{
				isVisible,
				setVisible,
				setUnreadNotificationCount,
				setCartItemCount,
				show,
				hide,
				unreadNotificationCount,
				cartItemCount,
				incrementNotificationCount: () =>
					setUnreadNotificationCount((prev) => prev + 1),
				decrementNotificationCount: () =>
					setUnreadNotificationCount((prev) => Math.max(0, prev - 1)),
				incrementCartItemCount: () => setCartItemCount((prev) => prev + 1),
				decrementCartItemCount: () =>
					setCartItemCount((prev) => Math.max(0, prev - 1)),
			}}
		>
			{children}
		</BottomBarControlContext.Provider>
	)
}

export const useBottomBarControl = () => {
	const context = useContext(BottomBarControlContext)
	if (!context) {
		throw new Error(
			'useBottomBarVisibility must be used within a BottomBarVisibilityProvider'
		)
	}
	return context
}
