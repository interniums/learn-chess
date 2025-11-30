'use client'

import { useBoardSettings } from '@/contexts/BoardSettingsContext'
import { Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export const BoardSettingsPanel = () => {
  const { settings, updateSettings, resetSettings } = useBoardSettings()
  const [isOpen, setIsOpen] = useState(false)

  // Block scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.documentElement.style.overflow = 'hidden'
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.documentElement.style.overflow = ''
      document.documentElement.style.paddingRight = ''
    }

    return () => {
      document.documentElement.style.overflow = ''
      document.documentElement.style.paddingRight = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Settings Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="border-slate-300 hover:bg-slate-100 text-slate-700 p-2"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </Button>

      {/* Modal Overlay - Rendered via Portal */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop - Click to close (no animation) */}
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setIsOpen(false)} />

            {/* Settings Modal (with animation) */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-lg shadow-2xl border border-slate-200 p-4 z-[51] animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Board Settings</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Show Legal Moves */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-700">Show Legal Moves</label>
                  <button
                    onClick={() => updateSettings({ showLegalMoves: !settings.showLegalMoves })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showLegalMoves ? 'bg-(--brown-bg)' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showLegalMoves ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Show Confetti */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-700">Show Confetti</label>
                  <button
                    onClick={() => updateSettings({ showConfetti: !settings.showConfetti })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showConfetti ? 'bg-(--brown-bg)' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showConfetti ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Play Sounds */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-700">Play Sounds</label>
                  <button
                    onClick={() => updateSettings({ playSounds: !settings.playSounds })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.playSounds ? 'bg-(--brown-bg)' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.playSounds ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Piece Speed */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-700">Animation Speed</label>
                  <div className="flex gap-2 mt-2">
                    {[
                      { label: 'Fast', value: 200 },
                      { label: 'Normal', value: 500 },
                      { label: 'Slow', value: 800 },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSettings({ pieceSpeed: option.value })}
                        className={`flex-1 py-2 px-3 text-xs rounded-md transition-all duration-200 ${
                          settings.pieceSpeed === option.value
                            ? 'bg-(--brown-bg) text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Button */}
                <div className="pt-3 mt-3 border-t border-slate-200">
                  <button
                    onClick={() => {
                      resetSettings()
                      setIsOpen(false)
                    }}
                    className="w-full py-2 px-3 text-xs text-(--brown-bg) hover:text-white hover:bg-(--brown-bg) border border-(--brown-bg) rounded-md transition-colors font-medium"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  )
}
