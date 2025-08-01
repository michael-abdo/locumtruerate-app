'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { 
  Card,
  Button,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@locumtruerate/ui'
import { toast } from 'sonner'
// TODO: Install Stripe dependencies
// import { loadStripe } from '@stripe/stripe-js'
// import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { z } from 'zod'
import { safeTextSchema } from '@/lib/validation/schemas'

// TODO: Enable when Stripe dependencies are installed
// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Types
interface LeadPreview {
  industry: string
  location: string
  experience: string
  source: string
  score: number
  hasCalcData: boolean
  hasPhone: boolean
  hasCompany: boolean
  createdAt: Date
  emailPreview: string
}

interface LeadListing {
  id: string
  leadId: string
  price: number
  priceCategory: 'standard' | 'premium' | 'hot_lead'
  leadScore: number
  engagementLevel: string
  maxPurchases: number
  currentPurchases: number
  listedAt: Date
  expiresAt: Date | null
  preview: LeadPreview
}

interface PurchasedLead {
  id: string
  price: number
  purchaseDate: Date
  leadSource: string
  leadScore: number
  lead: {
    id: string
    email: string
    name: string | null
    company: string | null
    phone: string | null
    message: string | null
    source: string
    score: number
    metadata: any
    createdAt: Date
  }
}

// Validation schema for lead filters
const leadFilterSchema = z.object({
  industry: safeTextSchema(0, 100).optional(),
  location: safeTextSchema(0, 100).optional(),
  priceCategory: z.enum(['all', 'standard', 'premium', 'hot_lead']).default('all'),
  minScore: z.number().min(0).max(100).optional()
})

type LeadFilterData = z.infer<typeof leadFilterSchema>

// Filters component
const LeadFilters = ({ filters, onFiltersChange }: { filters: LeadFilterData; onFiltersChange: (filters: LeadFilterData) => void }) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (field: keyof LeadFilterData, value: any) => {
    const newFilters = { ...filters, [field]: value }
    
    // Validate the specific field
    try {
      const fieldSchema = leadFilterSchema.shape[field]
      fieldSchema.parse(value)
      
      // Clear error for this field
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
      
      onFiltersChange(newFilters)
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: error.errors[0].message
        }))
      }
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div>
        <Input
          placeholder="Search industry..."
          value={filters.industry || ''}
          onChange={(e) => handleFieldChange('industry', e.target.value)}
          className={validationErrors.industry ? 'border-red-500' : ''}
          aria-invalid={!!validationErrors.industry}
        />
        {validationErrors.industry && (
          <p className="mt-1 text-xs text-red-600">{validationErrors.industry}</p>
        )}
      </div>
      <div>
        <Input
          placeholder="Search location..."
          value={filters.location || ''}
          onChange={(e) => handleFieldChange('location', e.target.value)}
          className={validationErrors.location ? 'border-red-500' : ''}
          aria-invalid={!!validationErrors.location}
        />
        {validationErrors.location && (
          <p className="mt-1 text-xs text-red-600">{validationErrors.location}</p>
        )}
      </div>
      <Select 
        value={filters.priceCategory} 
        onValueChange={(value) => handleFieldChange('priceCategory', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Price Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="standard">Standard ($10-$35)</SelectItem>
          <SelectItem value="premium">Premium ($35-$65)</SelectItem>
          <SelectItem value="hot_lead">Hot Lead ($65-$100)</SelectItem>
        </SelectContent>
      </Select>
      <div>
        <Input
          type="number"
          placeholder="Min Score"
          value={filters.minScore || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined
            handleFieldChange('minScore', value)
          }}
          min="0"
          max="100"
          className={validationErrors.minScore ? 'border-red-500' : ''}
          aria-invalid={!!validationErrors.minScore}
        />
        {validationErrors.minScore && (
          <p className="mt-1 text-xs text-red-600">{validationErrors.minScore}</p>
        )}
      </div>
    </div>
  )
}

// Lead card component
const LeadCard = ({ listing, onPurchase }: { listing: LeadListing; onPurchase: (listing: LeadListing) => void }) => {
  const getPriceColor = (category: string) => {
    switch (category) {
      case 'hot_lead': return 'bg-red-100 text-red-800'
      case 'premium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          <Badge className={getPriceColor(listing.priceCategory)}>
            {listing.priceCategory.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge className={getScoreColor(listing.leadScore)}>
            Score: {listing.leadScore}
          </Badge>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            ${(listing.price / 100).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
            {listing.currentPurchases}/{listing.maxPurchases} sold
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Industry:</span>
          <span className="text-sm">{listing.preview.industry}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium">Location:</span>
          <span className="text-sm">{listing.preview.location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium">Experience:</span>
          <span className="text-sm">{listing.preview.experience}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium">Email:</span>
          <span className="text-sm font-mono">{listing.preview.emailPreview}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium">Source:</span>
          <span className="text-sm capitalize">{listing.preview.source}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {listing.preview.hasPhone && <Badge variant="outline">📞 Phone</Badge>}
        {listing.preview.hasCompany && <Badge variant="outline">🏢 Company</Badge>}
        {listing.preview.hasCalcData && <Badge variant="outline">🧮 Calculator Data</Badge>}
      </div>

      <div className="text-xs text-gray-500 mb-4">
        Listed: {new Date(listing.listedAt).toLocaleDateString()}
        {listing.expiresAt && (
          <> • Expires: {new Date(listing.expiresAt).toLocaleDateString()}</>
        )}
      </div>

      <Button 
        onClick={() => onPurchase(listing)}
        className="w-full"
        disabled={listing.currentPurchases >= listing.maxPurchases}
      >
        {listing.currentPurchases >= listing.maxPurchases ? 'Sold Out' : 'Purchase Lead'}
      </Button>
    </Card>
  )
}

// Payment form component - TEMPORARILY DISABLED (Stripe dependencies needed)
const PaymentForm = ({ clientSecret, amount, onSuccess, onError }: any) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="text-2xl font-bold">
          ${(amount / 100).toFixed(2)}
        </div>
        <div className="text-sm text-gray-500">
          Lead Purchase
        </div>
      </div>
      
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800 text-sm">
          Stripe payment integration temporarily disabled. Please install @stripe/stripe-js and @stripe/react-stripe-js dependencies.
        </p>
      </div>
      
      <Button 
        type="button" 
        className="w-full" 
        onClick={() => onSuccess()}
      >
        Simulate Payment Success (Development)
      </Button>
    </div>
  )
}

// Purchased leads component
const PurchasedLeads = () => {
  const [page, setPage] = useState(1)
  const { data, isLoading } = trpc.leadMarketplace.getPurchasedLeads.useQuery({
    limit: 10,
    offset: (page - 1) * 10,
  })

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading purchased leads...</div>
  }

  return (
    <div className="space-y-4">
      {data?.purchases?.map((purchase: PurchasedLead) => (
        <Card key={purchase.id} className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{purchase.lead.name || 'Anonymous Lead'}</h3>
              <p className="text-gray-600">{purchase.lead.email}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                ${(purchase.price / 100).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(purchase.purchaseDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {purchase.lead.company && (
              <div>
                <span className="text-sm font-medium">Company:</span>
                <div>{purchase.lead.company}</div>
              </div>
            )}
            {purchase.lead.phone && (
              <div>
                <span className="text-sm font-medium">Phone:</span>
                <div>{purchase.lead.phone}</div>
              </div>
            )}
            <div>
              <span className="text-sm font-medium">Source:</span>
              <div className="capitalize">{purchase.lead.source}</div>
            </div>
            <div>
              <span className="text-sm font-medium">Score:</span>
              <div>{purchase.leadScore}/100</div>
            </div>
          </div>

          {purchase.lead.message && (
            <div className="mb-4">
              <span className="text-sm font-medium">Message:</span>
              <div className="mt-1 p-3 bg-gray-50 rounded">{purchase.lead.message}</div>
            </div>
          )}

          <div className="flex gap-2">
            <Badge variant="outline">Source: {purchase.leadSource}</Badge>
            <Badge variant="outline">Score: {purchase.leadScore}</Badge>
          </div>
        </Card>
      ))}

      {data?.pagination && data.pagination.hasMore && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => setPage(page + 1)}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}

// Main component
export default function LeadMarketplacePage() {
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [selectedLead, setSelectedLead] = useState<LeadListing | null>(null)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(0)

  // API calls
  const { data: browseData, isLoading } = trpc.leadMarketplace.browseLeads.useQuery({
    limit: 12,
    offset: (page - 1) * 12,
    ...filters,
  })

  const purchaseLeadMutation = trpc.leadMarketplace.purchaseLead.useMutation({
    onSuccess: (data) => {
      setClientSecret(data.clientSecret)
      setPaymentAmount(data.amount)
      setPaymentDialog(true)
    },
    onError: (error) => {
      toast.error('Purchase Failed', {
        description: error.message,
      })
    },
  })

  const handlePurchaseLead = (listing: LeadListing) => {
    setSelectedLead(listing)
    purchaseLeadMutation.mutate({
      leadId: listing.leadId,
      expectedPrice: listing.price,
    })
  }

  const handlePaymentSuccess = () => {
    setPaymentDialog(false)
    setSelectedLead(null)
    setClientSecret(null)
    toast.success('Payment Successful', {
      description: 'Lead purchased successfully! Check your purchased leads tab.',
    })
    // Refresh the data
    window.location.reload()
  }

  const handlePaymentError = (error: string) => {
    toast.error('Payment Failed', {
      description: error,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lead Marketplace</h1>
        <p className="text-gray-600">Purchase high-quality leads for your recruitment needs</p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Leads</TabsTrigger>
          <TabsTrigger value="purchased">Purchased Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <LeadFilters filters={filters} onFiltersChange={setFilters} />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-lg">Loading leads...</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {browseData?.listings?.map((listing: LeadListing) => (
                  <LeadCard
                    key={listing.id}
                    listing={listing}
                    onPurchase={handlePurchaseLead}
                  />
                ))}
              </div>

              {browseData?.listings?.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-500">No leads match your filters</div>
                </div>
              )}

              {browseData?.pagination?.hasMore && (
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setPage(page + 1)}
                  >
                    Load More Leads
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="purchased">
          <PurchasedLeads />
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
          </DialogHeader>
          {clientSecret && (
            <PaymentForm
              clientSecret={clientSecret}
              amount={paymentAmount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}