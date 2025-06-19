'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/use-toast'

// Types
interface ScoringStats {
  averageScore: number
  scoreDistribution: Record<string, number>
  topSources: Array<{ source: string; avgScore: number; count: number }>
  confidenceStats: { average: number; distribution: Record<string, number> }
}

interface CronJobStats {
  isRunning: boolean
  activeJobs: number
  recentPerformance: any[]
  errorCount: number
}

// Statistics dashboard component
const ScoringStatistics = () => {
  const { data: stats, isLoading, refetch } = trpc.leads.getScoringStatistics.useQuery()

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading statistics...</div>
  }

  if (!stats) {
    return <div className="text-center py-8 text-gray-500">No scoring data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Average Lead Score</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.averageScore}</p>
          <p className="text-sm text-gray-500">Out of 100</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Average Confidence</h3>
          <p className="text-3xl font-bold text-green-600">{stats.confidenceStats.average}%</p>
          <p className="text-sm text-gray-500">Data completeness</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Top Source</h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats.topSources[0]?.source || 'N/A'}
          </p>
          <p className="text-sm text-gray-500">
            Avg: {stats.topSources[0]?.avgScore || 0} points
          </p>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
        <div className="space-y-3">
          {Object.entries(stats.scoreDistribution).map(([range, count]) => {
            const total = Object.values(stats.scoreDistribution).reduce((sum, val) => sum + val, 0)
            const percentage = total > 0 ? (count / total) * 100 : 0
            
            return (
              <div key={range} className="flex items-center space-x-4">
                <div className="w-20 text-sm font-medium">{range}</div>
                <div className="flex-1">
                  <Progress value={percentage} className="h-2" />
                </div>
                <div className="w-16 text-sm text-gray-600">
                  {count} ({percentage.toFixed(1)}%)
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Top Sources */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Lead Sources</h3>
        <div className="space-y-2">
          {stats.topSources.slice(0, 8).map((source, index) => (
            <div key={source.source} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Badge variant={index < 3 ? 'default' : 'secondary'}>
                  #{index + 1}
                </Badge>
                <span className="capitalize font-medium">{source.source.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">{source.count} leads</span>
                <span className="font-semibold text-blue-600">{source.avgScore} pts</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Confidence Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Data Confidence Distribution</h3>
        <div className="space-y-3">
          {Object.entries(stats.confidenceStats.distribution).map(([range, count]) => {
            const total = Object.values(stats.confidenceStats.distribution).reduce((sum, val) => sum + val, 0)
            const percentage = total > 0 ? (count / total) * 100 : 0
            
            return (
              <div key={range} className="flex items-center space-x-4">
                <div className="w-20 text-sm font-medium">{range}%</div>
                <div className="flex-1">
                  <Progress value={percentage} className="h-2" />
                </div>
                <div className="w-16 text-sm text-gray-600">
                  {count} ({percentage.toFixed(1)}%)
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => refetch()} variant="outline">
          Refresh Statistics
        </Button>
      </div>
    </div>
  )
}

// Manual scoring component
const ManualScoring = () => {
  const [isRunning, setIsRunning] = useState(false)

  const runScoringMutation = trpc.leads.runAutomatedScoring.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Scoring Complete',
        description: data.message,
      })
      setIsRunning(false)
    },
    onError: (error) => {
      toast({
        title: 'Scoring Failed',
        description: error.message,
        variant: 'destructive',
      })
      setIsRunning(false)
    },
  })

  const handleRunScoring = () => {
    setIsRunning(true)
    runScoringMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Manual Scoring Trigger</h3>
        <p className="text-gray-600 mb-4">
          Run the automated scoring algorithm on all unprocessed leads. This will update 
          lead scores using the latest ML-enhanced scoring system.
        </p>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Scoring Features:</h4>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Source quality analysis with time decay</li>
              <li>• Profile completeness scoring</li>
              <li>• Message quality analysis with NLP indicators</li>
              <li>• Calculator interaction depth</li>
              <li>• Engagement metrics and behavioral analysis</li>
              <li>• Industry demand multipliers</li>
              <li>• Time-based factors and urgency detection</li>
            </ul>
          </div>

          <Button 
            onClick={handleRunScoring}
            disabled={isRunning || runScoringMutation.isLoading}
            size="lg"
            className="w-full"
          >
            {isRunning ? 'Processing...' : 'Run Automated Scoring'}
          </Button>

          {runScoringMutation.data && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Results:</h4>
              <div className="text-sm text-green-800 mt-2">
                <p>Processed: {runScoringMutation.data.results.processed} leads</p>
                <p>Updated: {runScoringMutation.data.results.updated} scores</p>
                <p>Errors: {runScoringMutation.data.results.errors}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// Automated jobs management
const AutomatedJobs = () => {
  const { data: jobStats, isLoading, refetch } = trpc.leads.getCronJobStatus.useQuery()
  
  const startJobsMutation = trpc.leads.startAutomatedJobs.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Automated jobs started' })
      refetch()
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const stopJobsMutation = trpc.leads.stopAutomatedJobs.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Automated jobs stopped' })
      refetch()
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const triggerJobMutation = trpc.leads.triggerCronJob.useMutation({
    onSuccess: (data) => {
      toast({ title: 'Job Complete', description: data.message })
      refetch()
    },
    onError: (error) => {
      toast({ title: 'Job Failed', description: error.message, variant: 'destructive' })
    },
  })

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading job status...</div>
  }

  return (
    <div className="space-y-6">
      {/* Job Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Automated Jobs Status</h3>
          <Badge variant={jobStats?.isRunning ? 'default' : 'secondary'}>
            {jobStats?.isRunning ? 'Running' : 'Stopped'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{jobStats?.activeJobs || 0}</p>
            <p className="text-sm text-gray-600">Active Jobs</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{jobStats?.recentPerformance?.length || 0}</p>
            <p className="text-sm text-gray-600">Recent Runs</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{jobStats?.errorCount || 0}</p>
            <p className="text-sm text-gray-600">Errors (24h)</p>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button 
            onClick={() => startJobsMutation.mutate()}
            disabled={jobStats?.isRunning || startJobsMutation.isLoading}
            variant="default"
          >
            Start Jobs
          </Button>
          <Button 
            onClick={() => stopJobsMutation.mutate()}
            disabled={!jobStats?.isRunning || stopJobsMutation.isLoading}
            variant="outline"
          >
            Stop Jobs
          </Button>
          <Button onClick={() => refetch()} variant="ghost">
            Refresh
          </Button>
        </div>
      </Card>

      {/* Manual Job Triggers */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Manual Job Triggers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Lead Scoring</h4>
            <p className="text-sm text-gray-600 mb-3">Score all unprocessed leads</p>
            <Button 
              onClick={() => triggerJobMutation.mutate({ jobName: 'lead_scoring' })}
              disabled={triggerJobMutation.isLoading}
              size="sm"
              className="w-full"
            >
              Run Now
            </Button>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Age Scoring Update</h4>
            <p className="text-sm text-gray-600 mb-3">Update scores based on lead age</p>
            <Button 
              onClick={() => triggerJobMutation.mutate({ jobName: 'age_scoring' })}
              disabled={triggerJobMutation.isLoading}
              size="sm"
              className="w-full"
            >
              Run Now
            </Button>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Auto Listing</h4>
            <p className="text-sm text-gray-600 mb-3">Create marketplace listings for high-quality leads</p>
            <Button 
              onClick={() => triggerJobMutation.mutate({ jobName: 'auto_listing' })}
              disabled={triggerJobMutation.isLoading}
              size="sm"
              className="w-full"
            >
              Run Now
            </Button>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Cleanup</h4>
            <p className="text-sm text-gray-600 mb-3">Remove stale leads and expired listings</p>
            <Button 
              onClick={() => triggerJobMutation.mutate({ jobName: 'cleanup' })}
              disabled={triggerJobMutation.isLoading}
              size="sm"
              className="w-full"
            >
              Run Now
            </Button>
          </div>
        </div>
      </Card>

      {/* Recent Performance */}
      {jobStats?.recentPerformance && jobStats.recentPerformance.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Job Performance</h3>
          <div className="space-y-2">
            {jobStats.recentPerformance.slice(0, 10).map((perf: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <span className="font-medium capitalize">{perf.eventName.replace('_', ' ')}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(perf.properties.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">{perf.properties.duration}ms</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// Main component
export default function LeadScoringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lead Scoring & Automation</h1>
        <p className="text-gray-600">
          Manage automated lead scoring with ML-enhanced algorithms and job automation
        </p>
      </div>

      <Tabs defaultValue="statistics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="manual">Manual Scoring</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics">
          <ScoringStatistics />
        </TabsContent>

        <TabsContent value="manual">
          <ManualScoring />
        </TabsContent>

        <TabsContent value="automation">
          <AutomatedJobs />
        </TabsContent>
      </Tabs>
    </div>
  )
}