/**
 * NextAuth API Route Handler
 * Handles all authentication requests
 *
 * Note: Handlers are created inline to prevent Turbopack from analyzing vendored Next.js modules
 * during the "Collecting page data" phase
 */

// Force dynamic rendering - must be before any imports
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const runtime = 'nodejs';
export const revalidate = 0;

// Import NextAuth and config dynamically to avoid static analysis issues
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';

// Create NextAuth instance and handlers inline to prevent Turbopack from analyzing vendored modules
const nextAuth = NextAuth(authConfig);
export const { GET, POST } = nextAuth.handlers;
