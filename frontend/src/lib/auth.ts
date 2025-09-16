// frontend/src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import EmailProvider from "next-auth/providers/email";
import { createTransport } from "nodemailer";
import { db } from "./db";

// adjust path if your schema file is located elsewhere
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "./schema";

interface Session {
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
}

export const authOptions: NextAuthOptions = {
  // Adapter is REQUIRED for email provider
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens as any,
  }),

  providers: [
    // Email provider with proper configuration
    EmailProvider({
      server: process.env.EMAIL_SERVER_HOST ? {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        secure: process.env.EMAIL_SERVER_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      } : {
        host: "localhost",
        port: 587,
      },
      from: process.env.EMAIL_FROM || "noreply@localhost",
      maxAge: 24 * 60 * 60, // 24 hours
      sendVerificationRequest: async (params) => {
        const { identifier, url, provider } = params;
        const { host } = new URL(url);
        
        // Always log the magic link for development
        console.log('\n🔗 MAGIC LINK FOR DEVELOPMENT:');
        console.log(`📧 Email: ${identifier}`);
        console.log(`🔗 Link: ${url}`);
        console.log('⏰ Valid for: 24 hours');
        console.log('Copy this link to your browser to sign in.\n');
        
        // If no email server configured, just return after logging
        if (!process.env.EMAIL_SERVER_HOST) {
          return;
        }
        
        const transport = createTransport(provider.server);
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `Sign in to ${host}`,
          text: `Sign in to ${host}\n\nClick the link below to sign in:\n${url}\n\nNote: This link can only be used once and expires in 24 hours.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Sign in to ${host}</h1>
              <p>Click the button below to sign in to your account.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Sign In Now
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                <strong>Important:</strong> This link can only be used once and expires in 24 hours.
                If you didn't request this, you can safely ignore this email.
              </p>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">
                If the button doesn't work, copy and paste this URL into your browser:<br>
                <span style="word-break: break-all;">${url}</span>
              </p>
            </div>
          `,
        });
        
        if (result.rejected?.length) {
          throw new Error(`Email(s) (${result.rejected.join(', ')}) could not be sent`);
        }
      },
    }),
  ],

  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },

  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('NextAuth signIn callback:', { 
        user: user?.email, 
        account: account?.provider,
        profile: profile?.email 
      });
      
      // Ensure we have a valid email for email provider
      if (account?.provider === 'email') {
        return !!user?.email;
      }
      
      return true;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      console.log('NextAuth redirect callback:', { url, baseUrl });
      
      // Don't redirect if we're already on the signin page with a callbackUrl
      if (url.includes('/auth/signin?callbackUrl=')) {
        console.log('Already on signin with callback, breaking redirect loop');
        return `${baseUrl}/buyers`;
      }
      
      // Parse the URL to check for callbackUrl parameter
      try {
        const urlObj = new URL(url, baseUrl);
        const callbackUrl = urlObj.searchParams.get('callbackUrl');
        
        // If there's a callbackUrl parameter, use it
        if (callbackUrl && !callbackUrl.includes('/auth/signin')) {
          console.log('Redirecting to callbackUrl:', callbackUrl);
          return `${baseUrl}${callbackUrl}`;
        }
      } catch (e) {
        console.log('URL parsing error:', e);
      }
      
      // If it's a callback URL from magic link verification, redirect to buyers
      if (url.includes('/api/auth/callback/email')) {
        console.log('Magic link callback, redirecting to buyers');
        return `${baseUrl}/buyers`;
      }
      
      // If URL is relative and starts with baseUrl, use it (but not signin)
      if (url.startsWith(baseUrl) && !url.includes('/auth/signin')) {
        return url;
      }
      
      // If URL is just a path and not signin, prepend baseUrl
      if (url.startsWith('/') && !url.includes('/auth/signin')) {
        return `${baseUrl}${url}`;
      }
      
      // Default fallback
      console.log('Default redirect to buyers');
      return `${baseUrl}/buyers`;
    },
    async session({ session, user, token }) {
      // When using JWT strategy with adapter, user might be undefined
      // Use token data to populate session
      if (token) {
        (session.user as any).id = token.sub;
        session.user.email = token.email as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
        };
      }
      
      // Subsequent requests - token already has the data
      return token;
    },
  },

  session: {
    strategy: "jwt", // Use JWT for middleware compatibility
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // Match session maxAge
  },

  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-here-change-this-in-production",
  debug: process.env.NODE_ENV === "development",
  
  // Add these settings to fix token reuse issues
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production"
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production"
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production"
      }
    }
  }
};
