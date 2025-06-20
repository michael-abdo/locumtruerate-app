'use client'

import React, { useState } from 'react'
import { Button } from '@locumtruerate/ui/components/ui/button'
import { Input } from '@locumtruerate/ui/components/ui/input'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody } from '@locumtruerate/ui/components/ui/modal'
import { Save, X } from 'lucide-react'
import { z } from 'zod'
import { safeTextSchema } from '@/lib/validation/schemas'

// Validation schema for calculation name
const saveCalculationSchema = z.object({
  name: safeTextSchema(1, 100),
  calculationType: z.enum(['contract', 'paycheck', 'hourly', 'comparison', 'general']).default('general')
})

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
  const [errors, setErrors] = useState<{ name?: string }>({})

  const handleInputChange = (value: string) => {
    setName(value)
    
    // Real-time validation
    try {
      saveCalculationSchema.shape.name.parse(value)
      setErrors(prev => ({ ...prev, name: undefined }))
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, name: error.errors[0].message }))
      }
    }
  }

  const handleSave = async () => {
    // Validate form data
    try {
      const validatedData = saveCalculationSchema.parse({
        name: name.trim(),
        calculationType
      })
      
      setIsSaving(true)
      await onSave(validatedData.name)
      setName('')
      setErrors({})
      onClose()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { name?: string } = {}
        error.errors.forEach(err => {
          if (err.path[0] === 'name') {
            fieldErrors.name = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        console.error('Failed to save calculation:', error)
      }
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
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="e.g., Dallas Emergency Medicine Contract"
            error={errors.name}
            required
            autoFocus
            aria-describedby={errors.name ? "calculation-name-error" : undefined}
          />
          {errors.name && (
            <p id="calculation-name-error" className="text-sm text-red-600" role="alert">
              {errors.name}
            </p>
          )}
          
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
              disabled={!name.trim() || !!errors.name || isSaving}
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