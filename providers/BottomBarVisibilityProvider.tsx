import React, { createContext, useContext, useState, ReactNode } from 'react'

interface BottomBarVisibilityContextType {
  isVisible: boolean
  setVisible: (visible: boolean) => void
  show: () => void
  hide: () => void
}

const BottomBarVisibilityContext = createContext<BottomBarVisibilityContextType | undefined>(undefined)

export const BottomBarVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(true)

  const setVisible = (visible: boolean) => setIsVisible(visible)
  const show = () => setIsVisible(true)
  const hide = () => setIsVisible(false)

  return (
    <BottomBarVisibilityContext.Provider value={{ isVisible, setVisible, show, hide }}>
      {children}
    </BottomBarVisibilityContext.Provider>
  )
}

export const useBottomBarVisibility = () => {
  const context = useContext(BottomBarVisibilityContext)
  if (!context) {
    throw new Error('useBottomBarVisibility must be used within a BottomBarVisibilityProvider')
  }
  return context
}
