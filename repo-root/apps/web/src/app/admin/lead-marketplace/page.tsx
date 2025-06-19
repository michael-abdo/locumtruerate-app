'use client'

import { useState } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { Card, Button, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Tabs, TabsContent, TabsList, TabsTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Label } from '@locumtruerate/ui'
import { toast } from 'sonner'

// Types
interface Lead {
  id: string
  email: string
  name: string | null
  company: string | null
  phone: string | null
  message: string | null
  source: string
  score: number
  status: string
  metadata: any
  createdAt: Date
}

// Create listing form component
const CreateListingForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    leadId: '',
    basePrice: 2500, // $25.00
    priceCategory: 'standard',
    maxPurchases: 1,
    expiresInDays: 30,
  })

  const createListingMutation = trpc.leadMarketplace.createListing.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lead listing created successfully',
      })
      onSuccess()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createListingMutation.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="leadId">Lead ID</Label>
        <Input
          id="leadId"
          value={formData.leadId}
          onChange={(e) => setFormData(prev => ({ ...prev, leadId: e.target.value }))}
          placeholder="lead-id-here"
          required
        />
      </div>

      <div>
        <Label htmlFor="basePrice">Base Price (cents)</Label>
        <Input
          id="basePrice"
          type="number"
          value={formData.basePrice}
          onChange={(e) => setFormData(prev => ({ ...prev, basePrice: parseInt(e.target.value) }))}
          min="1000"
          max="10000"
          step="100"
          required
        />
        <p className="text-sm text-gray-500">
          ${(formData.basePrice / 100).toFixed(2)} (min $10.00, max $100.00)
        </p>
      </div>

      <div>
        <Label htmlFor="priceCategory">Price Category</Label>
        <Select
          value={formData.priceCategory}
          onValueChange={(value) => setFormData(prev => ({ ...prev, priceCategory: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard ($10-$35)</SelectItem>
            <SelectItem value="premium">Premium ($35-$65)</SelectItem>
            <SelectItem value="hot_lead">Hot Lead ($65-$100)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="maxPurchases">Max Purchases</Label>
        <Input
          id="maxPurchases"
          type="number"
          value={formData.maxPurchases}
          onChange={(e) => setFormData(prev => ({ ...prev, maxPurchases: parseInt(e.target.value) }))}
          min="1"
          max="10"
          required
        />
      </div>

      <div>
        <Label htmlFor="expiresInDays">Expires In (days)</Label>
        <Input
          id="expiresInDays"
          type="number"
          value={formData.expiresInDays}
          onChange={(e) => setFormData(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) }))}
          min="1"
          max="90"
          required
        />
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={createListingMutation.isLoading}
      >
        {createListingMutation.isLoading ? 'Creating...' : 'Create Listing'}
      </Button>
    </form>
  )
}

// Lead selection component
const LeadSelector = ({ onLeadSelect }: { onLeadSelect: (lead: Lead) => void }) => {
  const [filters, setFilters] = useState({
    status: 'new',
    minScore: 50,
  })

  const { data: leadsData, isLoading } = trpc.leads.getLeads.useQuery({
    ...filters,
    page: 1,
    limit: 20,
    sortBy: 'score',
    sortOrder: 'desc',
  })

  if (isLoading) {
    return <div>Loading leads...</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select 
          value={filters.status} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Lead Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Min Score"
          value={filters.minScore}
          onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) || 0 }))}
          min="0"
          max="100"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leadsData?.leads?.map((lead: Lead) => (
            <TableRow key={lead.id}>
              <TableCell>{lead.email}</TableCell>
              <TableCell>
                <Badge variant={lead.score >= 80 ? 'default' : lead.score >= 60 ? 'secondary' : 'outline'}>
                  {lead.score}
                </Badge>
              </TableCell>
              <TableCell className="capitalize">{lead.source}</TableCell>
              <TableCell className="capitalize">{lead.status}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  onClick={() => onLeadSelect(lead)}
                >
                  Select
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Statistics dashboard
const MarketplaceStats = () => {
  const { data: stats, isLoading } = trpc.leadMarketplace.getMarketplaceStats.useQuery()

  if (isLoading) {
    return <div>Loading statistics...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Listings</h3>
        <p className="text-2xl font-bold">{stats?.listings.total || 0}</p>
        <p className="text-sm text-gray-500">
          {stats?.listings.active || 0} active
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Purchases</h3>
        <p className="text-2xl font-bold">{stats?.purchases.total || 0}</p>
        <p className="text-sm text-gray-500">
          {stats?.purchases.completed || 0} completed
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
        <p className="text-2xl font-bold">
          ${((stats?.revenue.total || 0) / 100).toFixed(2)}
        </p>
        <p className="text-sm text-gray-500">
          Avg: ${((stats?.revenue.average || 0) / 100).toFixed(2)}
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
        <p className="text-2xl font-bold">{stats?.purchases.conversionRate || 0}%</p>
        <p className="text-sm text-gray-500">Purchase completion</p>
      </Card>

      {stats?.categories && stats.categories.length > 0 && (
        <Card className="p-4 md:col-span-2 lg:col-span-4">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Categories</h3>
          <div className="grid grid-cols-3 gap-4">
            {stats.categories.map((category: any) => (
              <div key={category.category} className="text-center">
                <p className="text-lg font-semibold">{category.count}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {category.category.replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// Main component
export default function AdminLeadMarketplacePage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead)
    setCreateDialogOpen(true)
  }

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false)
    setSelectedLead(null)
    // Refresh data
    window.location.reload()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lead Marketplace Administration</h1>
        <p className="text-gray-600">Manage lead listings and monitor marketplace performance</p>
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="create">Create Listing</TabsTrigger>
          <TabsTrigger value="leads">Select Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6">
          <MarketplaceStats />
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Listing</h2>
            <CreateListingForm onSuccess={handleCreateSuccess} />
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Select Lead to List</h2>
            <LeadSelector onLeadSelect={handleLeadSelect} />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick create dialog when lead is selected */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Listing</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium">{selectedLead.email}</h3>
                <p className="text-sm text-gray-600">
                  Score: {selectedLead.score} | Source: {selectedLead.source}
                </p>
                {selectedLead.company && (
                  <p className="text-sm text-gray-600">Company: {selectedLead.company}</p>
                )}
              </div>
              <CreateListingForm onSuccess={handleCreateSuccess} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}