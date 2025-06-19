'use client'

import { createContext, useContext, ReactNode } from 'react'

const ToastContext = createContext({})

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <ToastContext.Provider value={{}}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}