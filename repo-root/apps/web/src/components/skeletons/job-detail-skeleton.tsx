'use client'

import React from 'react'
import { 
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonButton,
  SkeletonCard
} from '@locumtruerate/ui'

export function JobDetailPageSkeleton() {
  return (
    <>
      {/* Back Navigation Skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <Skeleton width="16px" height="16px" />
            <SkeletonText width="120px" />
          </div>
        </div>
      </div>

      {/* Job Header Skeleton */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex items-center gap-3 mb-4">
                <Skeleton width="80px" height="24px" className="rounded-full" />
                <Skeleton width="100px" height="24px" className="rounded-full" />
                <Skeleton width="60px" height="24px" className="rounded-full" />
              </div>
              
              {/* Title */}
              <SkeletonTitle width="85%" className="mb-4" />
              
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Skeleton width="20px" height="20px" />
                  <SkeletonText width="150px" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton width="20px" height="20px" />
                  <SkeletonText width="120px" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton width="20px" height="20px" />
                  <SkeletonText width="100px" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton width="20px" height="20px" />
                  <SkeletonText width="90px" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex gap-2">
                <SkeletonButton width="80px" height="36px" />
                <SkeletonButton width="80px" height="36px" />
              </div>
              <SkeletonButton width="140px" height="44px" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Job Details Column */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Job Description */}
            <SkeletonCard className="p-6">
              <SkeletonTitle level={2} width="200px" className="mb-4" />
              <div className="space-y-3">
                <SkeletonText width="100%" />
                <SkeletonText width="95%" />
                <SkeletonText width="90%" />
                <SkeletonText width="85%" />
                <SkeletonText width="92%" />
                <SkeletonText width="88%" />
              </div>
            </SkeletonCard>

            {/* Requirements */}
            <SkeletonCard className="p-6">
              <SkeletonTitle level={2} width="150px" className="mb-4" />
              <div className="space-y-3">
                <SkeletonText width="100%" />
                <SkeletonText width="90%" />
                <SkeletonText width="95%" />
                <SkeletonText width="85%" />
              </div>
            </SkeletonCard>

            {/* Benefits */}
            <SkeletonCard className="p-6">
              <SkeletonTitle level={2} width="180px" className="mb-4" />
              <div className="space-y-3">
                <SkeletonText width="100%" />
                <SkeletonText width="88%" />
                <SkeletonText width="92%" />
              </div>
            </SkeletonCard>

            {/* Company Info */}
            <SkeletonCard className="p-6">
              <SkeletonTitle level={2} width="200px" className="mb-4" />
              <div className="flex items-start gap-4">
                <Skeleton width="64px" height="64px" className="rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonText width="100%" />
                  <SkeletonText width="85%" />
                  <SkeletonText width="90%" />
                  <div className="flex items-center gap-2 mt-3">
                    <SkeletonText width="100px" />
                    <Skeleton width="16px" height="16px" />
                  </div>
                </div>
              </div>
            </SkeletonCard>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6 order-first lg:order-last">
            {/* Job Summary */}
            <SkeletonCard className="p-4 sm:p-6">
              <SkeletonTitle level={3} width="120px" className="mb-4" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SkeletonText width="100px" />
                  <SkeletonText width="120px" />
                </div>
                <div className="flex items-center justify-between">
                  <SkeletonText width="80px" />
                  <SkeletonText width="100px" />
                </div>
                <div className="flex items-center justify-between">
                  <SkeletonText width="90px" />
                  <SkeletonText width="110px" />
                </div>
                <div className="flex items-center justify-between">
                  <SkeletonText width="85px" />
                  <SkeletonText width="80px" />
                </div>
                <div className="flex items-center justify-between">
                  <SkeletonText width="75px" />
                  <SkeletonText width="90px" />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <SkeletonButton width="100%" height="44px" />
                  <SkeletonButton width="100%" height="36px" variant="outline" />
                </div>
              </div>
            </SkeletonCard>
          </div>
        </div>
      </div>

      {/* Similar Jobs Section Skeleton */}
      <section className="bg-white dark:bg-gray-800 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <SkeletonTitle level={2} width="200px" className="mb-2" />
            <SkeletonText width="400px" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={index} className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Skeleton width="48px" height="48px" className="rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <SkeletonText width="100%" className="mb-1" />
                    <SkeletonText width="70%" />
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <SkeletonText width="90%" />
                  <SkeletonText width="85%" />
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Skeleton width="60px" height="20px" className="rounded-full" />
                  <Skeleton width="80px" height="20px" className="rounded-full" />
                  <Skeleton width="70px" height="20px" className="rounded-full" />
                </div>
                
                <SkeletonButton width="100%" height="36px" />
              </SkeletonCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default JobDetailPageSkeleton