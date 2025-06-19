import * as React from 'react'
import { cn } from '../../utils'
import { Skeleton, SkeletonProps, SkeletonText, SkeletonButton, SkeletonAvatar } from './skeleton'

interface TableSkeletonProps extends Omit<SkeletonProps, 'height' | 'width'> {
  rows?: number
  columns?: number
  showHeader?: boolean
  showActions?: boolean
  showAvatar?: boolean
  showCheckbox?: boolean
  showPagination?: boolean
  size?: 'sm' | 'md' | 'lg'
  columnWidths?: string[]
}

const TableSkeleton = React.forwardRef<HTMLDivElement, TableSkeletonProps>(
  ({
    className,
    rows = 5,
    columns = 4,
    showHeader = true,
    showActions = true,
    showAvatar = false,
    showCheckbox = false,
    showPagination = true,
    size = 'md',
    columnWidths = [],
    variant = 'default',
    animation = 'pulse',
    ...props
  }, ref) => {
    const sizeMap = {
      sm: {
        rowHeight: '40px',
        headerHeight: '36px',
        padding: 'px-3 py-2',
        textHeight: '0.875rem',
      },
      md: {
        rowHeight: '48px',
        headerHeight: '44px',
        padding: 'px-4 py-3',
        textHeight: '1rem',
      },
      lg: {
        rowHeight: '56px',
        headerHeight: '52px',
        padding: 'px-6 py-4',
        textHeight: '1.125rem',
      },
    }

    const currentSize = sizeMap[size]
    const actualColumns = columns + (showCheckbox ? 1 : 0) + (showActions ? 1 : 0)
    const totalColumns = showAvatar ? actualColumns + 1 : actualColumns

    const getColumnWidth = (index: number): string => {
      if (columnWidths[index]) return columnWidths[index]
      
      // Default widths for common columns
      if (showCheckbox && index === 0) return '40px'
      if (showAvatar && ((showCheckbox && index === 1) || (!showCheckbox && index === 0))) return '56px'
      if (showActions && index === totalColumns - 1) return '100px'
      
      return 'auto'
    }

    return (
      <div
        ref={ref}
        className={cn('w-full space-y-4', className)}
        role="status"
        aria-label="Loading table data"
        {...props}
      >
        {/* Table */}
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              {/* Header */}
              {showHeader && (
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    {Array.from({ length: totalColumns }).map((_, colIndex) => (
                      <th
                        key={colIndex}
                        className={cn(
                          'h-12 text-left align-middle font-medium text-muted-foreground',
                          currentSize.padding
                        )}
                        style={{ width: getColumnWidth(colIndex) }}
                      >
                        {showCheckbox && colIndex === 0 ? (
                          <Skeleton
                            width="16px"
                            height="16px"
                            borderRadius="0.25rem"
                            variant={variant}
                            animation={animation}
                          />
                        ) : showAvatar && ((showCheckbox && colIndex === 1) || (!showCheckbox && colIndex === 0)) ? (
                          <span></span> // Empty cell for avatar column
                        ) : showActions && colIndex === totalColumns - 1 ? (
                          <SkeletonText
                            width="60px"
                            height={currentSize.textHeight}
                            variant={variant}
                            animation={animation}
                          />
                        ) : (
                          <SkeletonText
                            width="80px"
                            height={currentSize.textHeight}
                            variant={variant}
                            animation={animation}
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}

              {/* Body */}
              <tbody className="[&_tr:last-child]:border-0">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {Array.from({ length: totalColumns }).map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className={cn(
                          'align-middle',
                          currentSize.padding
                        )}
                        style={{ 
                          height: currentSize.rowHeight,
                          width: getColumnWidth(colIndex) 
                        }}
                      >
                        {showCheckbox && colIndex === 0 ? (
                          <Skeleton
                            width="16px"
                            height="16px"
                            borderRadius="0.25rem"
                            variant={variant}
                            animation={animation}
                          />
                        ) : showAvatar && ((showCheckbox && colIndex === 1) || (!showCheckbox && colIndex === 0)) ? (
                          <SkeletonAvatar
                            size="sm"
                            variant={variant}
                            animation={animation}
                          />
                        ) : showActions && colIndex === totalColumns - 1 ? (
                          <div className="flex items-center space-x-2">
                            <SkeletonButton
                              size="sm"
                              width="24px"
                              variant={variant}
                              animation={animation}
                            />
                            <SkeletonButton
                              size="sm"
                              width="24px"
                              variant={variant}
                              animation={animation}
                            />
                          </div>
                        ) : (
                          <SkeletonText
                            width={`${60 + (colIndex * 10)}%`}
                            height={currentSize.textHeight}
                            variant={variant}
                            animation={animation}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {showPagination && (
          <div className="flex items-center justify-between px-2">
            <SkeletonText
              width="120px"
              variant={variant}
              animation={animation}
            />
            <div className="flex items-center space-x-2">
              <SkeletonButton
                size="sm"
                width="80px"
                variant={variant}
                animation={animation}
              />
              <div className="flex items-center space-x-1">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonButton
                    key={index}
                    size="sm"
                    width="32px"
                    variant={variant}
                    animation={animation}
                  />
                ))}
              </div>
              <SkeletonButton
                size="sm"
                width="80px"
                variant={variant}
                animation={animation}
              />
            </div>
          </div>
        )}
      </div>
    )
  }
)
TableSkeleton.displayName = 'TableSkeleton'

// Specialized table skeleton variants
const UserTableSkeleton = React.forwardRef<HTMLDivElement, Omit<TableSkeletonProps, 'showAvatar' | 'columns'>>((props, ref) => (
  <TableSkeleton 
    ref={ref} 
    showAvatar={true}
    columns={4}
    columnWidths={['40px', '56px', '200px', '150px', '120px', '100px']}
    {...props} 
  />
))
UserTableSkeleton.displayName = 'UserTableSkeleton'

const JobTableSkeleton = React.forwardRef<HTMLDivElement, Omit<TableSkeletonProps, 'columns'>>((props, ref) => (
  <TableSkeleton 
    ref={ref} 
    columns={5}
    columnWidths={['40px', '250px', '150px', '120px', '100px', '80px', '100px']}
    {...props} 
  />
))
JobTableSkeleton.displayName = 'JobTableSkeleton'

const AnalyticsTableSkeleton = React.forwardRef<HTMLDivElement, Omit<TableSkeletonProps, 'showActions' | 'showCheckbox' | 'columns'>>((props, ref) => (
  <TableSkeleton 
    ref={ref} 
    showActions={false}
    showCheckbox={false}
    columns={6}
    {...props} 
  />
))
AnalyticsTableSkeleton.displayName = 'AnalyticsTableSkeleton'

const SimpleTableSkeleton = React.forwardRef<HTMLDivElement, Omit<TableSkeletonProps, 'showActions' | 'showCheckbox' | 'showAvatar' | 'showPagination'>>((props, ref) => (
  <TableSkeleton 
    ref={ref} 
    showActions={false}
    showCheckbox={false}
    showAvatar={false}
    showPagination={false}
    {...props} 
  />
))
SimpleTableSkeleton.displayName = 'SimpleTableSkeleton'

export {
  TableSkeleton,
  UserTableSkeleton,
  JobTableSkeleton,
  AnalyticsTableSkeleton,
  SimpleTableSkeleton,
}