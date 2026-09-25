import { createContext, useContext } from 'react'

export const LayoutContext = createContext({ openMenu: () => {} })
export const useLayout = () => useContext(LayoutContext)
