import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { UserRole } from '@locumtruerate/database';
import { addDays } from 'date-fns';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  contactName: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.EMPLOYER)
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string()
});

// Helper functions
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, role, type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, password, contactName, companyName, phoneNumber, role } = input;

      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      try {
        // Create user
        const user = await ctx.db.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash,
            contactName,
            companyName,
            phoneNumber,
            role,
            legacyId: nanoid(10) // For backward compatibility
          }
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id, user.role);

        // Create session
        await ctx.db.session.create({
          data: {
            userId: user.id,
            token: refreshToken,
            expiresAt: addDays(new Date(), 7),
            ipAddress: ctx.request.ipAddress,
            userAgent: ctx.request.userAgent
          }
        });

        ctx.logger.info('User registered successfully', {
          userId: user.id,
          email: user.email,
          role: user.role
        });

        return {
          user: {
            id: user.id,
            email: user.email,
            contactName: user.contactName,
            companyName: user.companyName,
            role: user.role,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt
          },
          accessToken,
          refreshToken
        };
      } catch (error) {
        ctx.logger.error('Registration failed', { 
          email, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user account'
        });
      }
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      // Find user
      const user = await ctx.db.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password'
        });
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Account is temporarily locked due to failed login attempts'
        });
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        // Increment failed attempts
        const failedAttempts = user.failedLoginAttempts + 1;
        const updateData: any = {
          failedLoginAttempts: failedAttempts
        };

        // Lock account after 5 failed attempts
        if (failedAttempts >= 5) {
          updateData.lockedUntil = addDays(new Date(), 1); // Lock for 24 hours
        }

        await ctx.db.user.update({
          where: { id: user.id },
          data: updateData
        });

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password'
        });
      }

      // Reset failed attempts on successful login
      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date()
        }
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id, user.role);

      // Create or update session
      await ctx.db.session.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          token: refreshToken,
          expiresAt: addDays(new Date(), 7),
          ipAddress: ctx.request.ipAddress,
          userAgent: ctx.request.userAgent
        },
        update: {
          token: refreshToken,
          expiresAt: addDays(new Date(), 7),
          ipAddress: ctx.request.ipAddress,
          userAgent: ctx.request.userAgent
        }
      });

      ctx.logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          contactName: user.contactName,
          companyName: user.companyName,
          role: user.role,
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt
        },
        accessToken,
        refreshToken
      };
    }),

  refreshToken: publicProcedure
    .input(refreshTokenSchema)
    .mutation(async ({ input, ctx }) => {
      const { refreshToken } = input;

      try {
        const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

        if (payload.type !== 'refresh') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid token type'
          });
        }

        // Verify session exists
        const session = await ctx.db.session.findFirst({
          where: {
            userId: payload.userId,
            token: refreshToken,
            expiresAt: { gt: new Date() }
          },
          include: { user: true }
        });

        if (!session) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired refresh token'
          });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(
          session.user.id,
          session.user.role
        );

        // Update session with new refresh token
        await ctx.db.session.update({
          where: { id: session.id },
          data: {
            token: newRefreshToken,
            expiresAt: addDays(new Date(), 7)
          }
        });

        return {
          accessToken,
          refreshToken: newRefreshToken
        };
      } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid refresh token'
          });
        }
        throw error;
      }
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        });
      }

      // Delete all sessions for the user
      await ctx.db.session.deleteMany({
        where: { userId: ctx.user.id }
      });

      ctx.logger.info('User logged out', { userId: ctx.user.id });

      return { success: true };
    }),

  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const { email } = input;

      const user = await ctx.db.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Don't reveal whether the email exists - always return success
        return { success: true };
      }

      // Generate password reset token
      const resetToken = nanoid(32);
      const resetTokenExpiry = addDays(new Date(), 1); // 24 hours

      // In a real implementation, you'd store this token securely
      // For now, we'll just log it (in production, send via email)
      ctx.logger.info('Password reset requested', {
        userId: user.id,
        email: user.email,
        resetToken, // In production, don't log this!
        expiresAt: resetTokenExpiry
      });

      // TODO: Send email with reset link
      // await sendPasswordResetEmail(user.email, resetToken);

      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const { token, password } = input;

      // In a real implementation, you'd validate the token from a secure store
      // For now, this is a placeholder
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Password reset not yet implemented'
      });
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Email verification implementation
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Email verification not yet implemented'
      });
    }),

  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          id: true,
          email: true,
          contactName: true,
          companyName: true,
          phoneNumber: true,
          avatarUrl: true,
          bio: true,
          role: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      return user;
    })
});