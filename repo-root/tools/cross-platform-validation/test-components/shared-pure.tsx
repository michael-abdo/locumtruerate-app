/**
 * Shared-Pure Test Component
 * 
 * This component is designed to test the analyzer's detection of purely shared, cross-platform code.
 * Expected Pattern Counts:
 * - React import patterns: 1 occurrence
 * - useState patterns: 4 occurrences
 * - useEffect patterns: 2 occurrences
 * - useCallback patterns: 3 occurrences
 * - useMemo patterns: 2 occurrences
 * - useContext patterns: 1 occurrence
 * - Interface patterns: 4 occurrences
 * - Type patterns: 2 occurrences
 * - Export patterns: 6 occurrences
 * - Const patterns: 8+ occurrences
 * - Function patterns: 5 occurrences
 * - Arrow function patterns: 10+ occurrences
 * - Array method patterns: 15+ occurrences (.map, .filter, .reduce, .find)
 * - Try/catch patterns: 2 occurrences
 * 
 * Total Expected Shared Patterns: 65+ patterns
 * Expected Web Patterns: 0 patterns
 * Expected Native Patterns: 0 patterns
 * Expected Reusability: 100% (purely cross-platform code)
 */

import React, { useState, useEffect, useCallback, useMemo, useContext, createContext } from 'react'; // React import pattern 1

// Type definitions (shared patterns)
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled'; // Type pattern 1

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'; // Type pattern 2

export interface Task { // Interface pattern 1
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  tags: string[];
}

export interface TaskFilter { // Interface pattern 2
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  searchTerm?: string;
}

export interface TaskStats { // Interface pattern 3
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionRate: number;
}

export interface TaskManagerProps { // Interface pattern 4
  initialTasks?: Task[];
  onTaskUpdate?: (task: Task) => void;
  onStatsChange?: (stats: TaskStats) => void;
}

// Context for shared state management
const TaskContext = createContext<{
  tasks: Task[];
  filter: TaskFilter;
  updateTask: (task: Task) => void;
  setFilter: (filter: TaskFilter) => void;
} | null>(null);

export function TaskManager({ initialTasks = [], onTaskUpdate, onStatsChange }: TaskManagerProps) {
  // State management with React hooks
  const [tasks, setTasks] = useState<Task[]>(initialTasks); // useState pattern 1
  const [filter, setFilter] = useState<TaskFilter>({}); // useState pattern 2
  const [searchTerm, setSearchTerm] = useState<string>(''); // useState pattern 3
  const [sortBy, setSortBy] = useState<keyof Task>('createdAt'); // useState pattern 4

  // Effect for initialization and cleanup
  useEffect(() => { // useEffect pattern 1
    if (initialTasks.length > 0) {
      setTasks(initialTasks);
    }
  }, [initialTasks]);

  // Effect for stats calculation and notification
  useEffect(() => { // useEffect pattern 2
    const stats = calculateTaskStats(tasks);
    if (onStatsChange) {
      onStatsChange(stats);
    }
  }, [tasks, onStatsChange]);

  // Memoized filtered and sorted tasks
  const filteredTasks = useMemo(() => { // useMemo pattern 1
    return tasks
      .filter(task => applyTaskFilter(task, filter)) // .filter pattern 1
      .filter(task => { // .filter pattern 2
        if (!searchTerm) return true;
        return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               task.description.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => compareTasks(a, b, sortBy)); // .sort method usage
  }, [tasks, filter, searchTerm, sortBy]);

  // Memoized task statistics
  const taskStats = useMemo(() => { // useMemo pattern 2
    return calculateTaskStats(filteredTasks);
  }, [filteredTasks]);

  // Callback functions for task operations
  const updateTask = useCallback((updatedTask: Task) => { // useCallback pattern 1
    setTasks(prevTasks => 
      prevTasks.map(task => // .map pattern 1
        task.id === updatedTask.id ? { ...task, ...updatedTask, updatedAt: new Date() } : task
      )
    );
    if (onTaskUpdate) {
      onTaskUpdate(updatedTask);
    }
  }, [onTaskUpdate]);

  const addTask = useCallback((newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => { // useCallback pattern 2
    const task: Task = {
      ...newTask,
      id: generateTaskId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTasks(prevTasks => [...prevTasks, task]);
  }, []);

  const deleteTask = useCallback((taskId: string) => { // useCallback pattern 3
    setTasks(prevTasks => 
      prevTasks.filter(task => task.id !== taskId) // .filter pattern 3
    );
  }, []);

  // Context value
  const contextValue = useMemo(() => ({ // Additional useMemo for context
    tasks: filteredTasks,
    filter,
    updateTask,
    setFilter
  }), [filteredTasks, filter, updateTask]);

  return {
    tasks: filteredTasks,
    stats: taskStats,
    updateTask,
    addTask,
    deleteTask,
    setFilter,
    setSearchTerm,
    setSortBy,
    contextValue
  };
}

// Utility functions (all shared, cross-platform)
export const generateTaskId = (): string => { // Export + const pattern 1
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateTaskStats = (tasks: Task[]): TaskStats => { // Export + function pattern 1
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === 'completed').length; // .filter pattern 4
  const inProgress = tasks.filter(task => task.status === 'in-progress').length; // .filter pattern 5
  const pending = tasks.filter(task => task.status === 'pending').length; // .filter pattern 6
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  return {
    total,
    completed,
    inProgress,
    pending,
    completionRate
  };
};

export const applyTaskFilter = (task: Task, filter: TaskFilter): boolean => { // Export + function pattern 2
  if (filter.status && task.status !== filter.status) return false;
  if (filter.priority && task.priority !== filter.priority) return false;
  if (filter.assignedTo && task.assignedTo !== filter.assignedTo) return false;
  return true;
};

export const compareTasks = (a: Task, b: Task, sortBy: keyof Task): number => { // Export + function pattern 3
  const aValue = a[sortBy];
  const bValue = b[sortBy];
  
  if (aValue instanceof Date && bValue instanceof Date) {
    return bValue.getTime() - aValue.getTime();
  }
  
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return aValue.localeCompare(bValue);
  }
  
  return 0;
};

export const getTasksByStatus = (tasks: Task[], status: TaskStatus): Task[] => { // Export + function pattern 4
  return tasks.filter(task => task.status === status); // .filter pattern 7
};

export const getTasksByPriority = (tasks: Task[], priority: TaskPriority): Task[] => { // Export + function pattern 5
  return tasks.filter(task => task.priority === priority); // .filter pattern 8
};

export const getHighPriorityTasks = (tasks: Task[]): Task[] => { // Export + const pattern 2
  return tasks
    .filter(task => task.priority === 'high' || task.priority === 'urgent') // .filter pattern 9
    .sort((a, b) => { // Arrow function pattern 1
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
};

export const getOverdueTasks = (tasks: Task[], daysThreshold: number = 7): Task[] => { // Export + const pattern 3
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysThreshold);
  
  return tasks.filter(task => { // .filter pattern 10, Arrow function pattern 2
    return task.status !== 'completed' && task.createdAt < threshold;
  });
};

export const groupTasksByStatus = (tasks: Task[]): Record<TaskStatus, Task[]> => { // Export + const pattern 4
  return tasks.reduce((groups, task) => { // .reduce pattern 1, Arrow function pattern 3
    const status = task.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(task);
    return groups;
  }, {} as Record<TaskStatus, Task[]>);
};

export const getTaskCompletionTrend = (tasks: Task[], days: number = 30): number[] => { // Export + const pattern 5
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  const dailyCompletions = Array.from({ length: days }, (_, index) => { // Arrow function pattern 4
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    
    return tasks.filter(task => { // .filter pattern 11, Arrow function pattern 5
      if (task.status !== 'completed') return false;
      const taskDate = new Date(task.updatedAt);
      return taskDate.toDateString() === date.toDateString();
    }).length;
  });
  
  return dailyCompletions;
};

export const searchTasks = (tasks: Task[], searchTerm: string): Task[] => { // Export + const pattern 6
  if (!searchTerm.trim()) return tasks;
  
  const term = searchTerm.toLowerCase();
  return tasks.filter(task => { // .filter pattern 12, Arrow function pattern 6
    return task.title.toLowerCase().includes(term) ||
           task.description.toLowerCase().includes(term) ||
           task.tags.some(tag => tag.toLowerCase().includes(term)); // .some method usage, Arrow function pattern 7
  });
};

export const validateTask = (task: Partial<Task>): string[] => { // Export + const pattern 7
  const errors: string[] = [];
  
  try { // try pattern 1
    if (!task.title || task.title.trim().length === 0) {
      errors.push('Title is required');
    }
    
    if (!task.description || task.description.trim().length === 0) {
      errors.push('Description is required');
    }
    
    if (task.title && task.title.length > 100) {
      errors.push('Title must be less than 100 characters');
    }
    
    const validStatuses: TaskStatus[] = ['pending', 'in-progress', 'completed', 'cancelled'];
    if (task.status && !validStatuses.includes(task.status)) {
      errors.push('Invalid status');
    }
    
    const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
    if (task.priority && !validPriorities.includes(task.priority)) {
      errors.push('Invalid priority');
    }
  } catch (error) { // catch pattern 1
    errors.push('Validation error occurred');
  }
  
  return errors;
};

export const exportTasksToJson = (tasks: Task[]): string => { // Export + const pattern 8
  try { // try pattern 2
    const exportData = {
      exportDate: new Date().toISOString(),
      taskCount: tasks.length,
      tasks: tasks.map(task => ({ // .map pattern 2, Arrow function pattern 8
        ...task,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString()
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) { // catch pattern 2
    throw new Error('Failed to export tasks to JSON');
  }
};

// Custom hook for using task context
export const useTaskContext = () => { // Export + const pattern 9
  const context = useContext(TaskContext); // useContext pattern 1
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

// Higher-order function for task operations
export const createTaskProcessor = (processor: (task: Task) => Task) => { // Export + const pattern 10, Arrow function pattern 9
  return (tasks: Task[]): Task[] => { // Arrow function pattern 10
    return tasks.map(processor); // .map pattern 3
  };
};

// Utility for task batch operations
export const batchUpdateTasks = (tasks: Task[], updates: Partial<Task>): Task[] => { // Export + const pattern 11
  return tasks.map(task => ({ // .map pattern 4, Arrow function pattern 11
    ...task,
    ...updates,
    updatedAt: new Date()
  }));
};

export default TaskManager;