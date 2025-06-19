/**
 * Type declarations for external modules without TypeScript support
 */

declare module 'bad-words' {
  export default class Filter {
    constructor(options?: { list?: string[]; placeHolder?: string; regex?: RegExp; replaceRegex?: RegExp; splitRegex?: RegExp });
    isProfane(string: string): boolean;
    clean(string: string): string;
    addWords(...words: string[]): void;
    removeWords(...words: string[]): void;
  }
}

declare module 'sentiment' {
  export interface SentimentResult {
    score: number;
    comparative: number;
    calculation: Array<{ [key: string]: number }>;
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }

  export default function analyze(phrase: string, options?: any, callback?: (err: any, result: SentimentResult) => void): SentimentResult;
}