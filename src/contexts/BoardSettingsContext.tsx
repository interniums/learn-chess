'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type BoardSettings = {
  pieceSpeed: number // in milliseconds (200, 300, 500, 800)
  showLegalMoves: boolean
  showConfetti: boolean
  playSounds: boolean
}

const DEFAULT_SETTINGS: BoardSettings = {
  pieceSpeed: 500,
  showLegalMoves: true,
  showConfetti: true,
  playSounds: true,
}

type BoardSettingsContextType = {
  settings: BoardSettings
  updateSettings: (newSettings: Partial<BoardSettings>) => void
  resetSettings: () => void
}

const BoardSettingsContext = createContext<BoardSettingsContextType | undefined>(undefined)

export function BoardSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BoardSettings>(DEFAULT_SETTINGS)

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('boardSettings')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      } catch (e) {
        console.error('Failed to parse board settings:', e)
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('boardSettings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (newSettings: Partial<BoardSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <BoardSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </BoardSettingsContext.Provider>
  )
}

export function useBoardSettings() {
  const context = useContext(BoardSettingsContext)
  if (!context) {
    throw new Error('useBoardSettings must be used within BoardSettingsProvider')
  }
  return context
}
