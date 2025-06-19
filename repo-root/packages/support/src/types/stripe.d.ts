// Stripe type stubs for support package
// In production, install @types/stripe

declare module 'stripe' {
  export default class Stripe {
    constructor(apiKey: string, config?: any);
    
    customers: {
      retrieve(id: string): Promise<any>;
      create(params: any): Promise<any>;
      update(id: string, params: any): Promise<any>;
    };
    
    subscriptions: {
      list(params: any): Promise<{ data: any[] }>;
      create(params: any): Promise<any>;
      update(id: string, params: any): Promise<any>;
      cancel(id: string): Promise<any>;
    };
    
    paymentMethods: {
      list(params: any): Promise<{ data: any[] }>;
      attach(id: string, params: any): Promise<any>;
      detach(id: string): Promise<any>;
    };
    
    charges: {
      list(params: any): Promise<{ data: any[] }>;
      create(params: any): Promise<any>;
    };
    
    refunds: {
      create(params: any): Promise<any>;
    };
    
    disputes: {
      retrieve(id: string): Promise<any>;
      update(id: string, params: any): Promise<any>;
      close(id: string): Promise<any>;
    };
    
    paymentIntents: {
      retrieve(id: string): Promise<any>;
      update(id: string, params: any): Promise<any>;
      confirm(id: string): Promise<any>;
      cancel(id: string): Promise<any>;
    };
  }
}