'use client'

import React, { useState } from 'react'
import { Button } from '@locum-calc/ui/components/ui/button'
import { Input } from '@locum-calc/ui/components/ui/input'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody } from '@locum-calc/ui/components/ui/modal'
import { Save, X } from 'lucide-react'

interface SaveCalculationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => void
  calculationType: string
}

export function SaveCalculationDialog({
  isOpen,
  onClose,
  onSave,
  calculationType
}: SaveCalculationDialogProps) {
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    
    setIsSaving(true)
    try {
      await onSave(name)
      setName('')
      onClose()
    } catch (error) {
      console.error('Failed to save calculation:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <ModalHeader>
        <div>
          <ModalTitle>Save Calculation</ModalTitle>
          <ModalDescription>
            Save this {calculationType} calculation for future reference
          </ModalDescription>
        </div>
      </ModalHeader>
      
      <ModalBody>
        <div className="space-y-4">
          <Input
            label="Calculation Name"
            id="calculation-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Dallas Emergency Medicine Contract"
            required
            autoFocus
          />
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              loading={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Calculation
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}