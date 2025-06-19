// Database type stubs for support package
// This is a temporary workaround until database package builds

declare module '@locumtruerate/database' {
  export class PrismaClient {
    user: any;
    job: any;
    application: any;
    company: any;
    subscription: any;
    payment: any;
    notification: any;
    activityLog: any;
    knowledgeArticle: any;
    supportTicket: any;
    ticketMessage: any;
    supportMessage: any;
    knowledgeSearch: any;
    loginAttempt: any;
    passwordReset: any;
    emailVerification: any;
    profile: any;
    jobView: any;
    accountAction: any;
    $transaction(fn: any): Promise<any>;
  }
  
  export const prisma: PrismaClient;
}