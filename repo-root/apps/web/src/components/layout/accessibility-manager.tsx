'use client'

import React, { useState } from 'react'
import { AccessibilityButton, AccessibilitySettingsPanel } from '@/components/accessibility'

export function AccessibilityManager() {
  const [showPanel, setShowPanel] = useState(false)

  return (
    <>
      <AccessibilityButton onClick={() => setShowPanel(true)} />
      <AccessibilitySettingsPanel 
        isOpen={showPanel} 
        onClose={() => setShowPanel(false)} 
      />
    </>
  )
}