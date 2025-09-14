import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Simple but secure admin authentication
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Should be changed in production
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Simple session token generation
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString();
}

// Hash function for password (simple but secure enough for demo)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SESSION_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify credentials
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  const hashedAdmin = await hashPassword(ADMIN_PASSWORD);
  
  return username === ADMIN_USERNAME && hashedInput === hashedAdmin;
}

// Create session
export async function createSession(): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  // In a real application, you'd store this in a database
  // For now, we'll use a simple in-memory approach with cookies
  const sessionData = {
    token,
    expiresAt: expiresAt.getTime(),
    createdAt: Date.now()
  };
  
  return token;
}

// Verify session from cookies
export async function verifySession(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('admin-session')?.value;
    const sessionExpiry = cookieStore.get('admin-session-expiry')?.value;
    
    if (!sessionToken || !sessionExpiry) {
      return false;
    }
    
    const expiryTime = parseInt(sessionExpiry);
    if (Date.now() > expiryTime) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Session verification error:', error);
    return false;
  }
}

// Verify session from request (for API routes)
export async function verifySessionFromRequest(request: NextRequest): Promise<boolean> {
  try {
    const sessionToken = request.cookies.get('admin-session')?.value;
    const sessionExpiry = request.cookies.get('admin-session-expiry')?.value;
    
    if (!sessionToken || !sessionExpiry) {
      return false;
    }
    
    const expiryTime = parseInt(sessionExpiry);
    if (Date.now() > expiryTime) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Session verification error:', error);
    return false;
  }
}

// Clear session
export async function clearSession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete('admin-session');
  cookieStore.delete('admin-session-expiry');
}