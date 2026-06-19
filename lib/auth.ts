import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { findUserByEmail, type AppUser } from '@/config/users';

const COOKIE_NAME = 'torneo_session';
const ALG = 'HS256';

function getSecret(): Uint8Array {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  email: string;
  role: string;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload['email'] !== 'string' || typeof payload['role'] !== 'string') return null;
    return { email: payload['email'], role: payload['role'] };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const user = findUserByEmail(email);
  if (!user) return { success: false, error: 'Credenziali non valide' };

  const envPassword = process.env[user.passwordEnvVar];
  if (!envPassword) return { success: false, error: 'Configurazione mancante' };

  const match = await bcrypt.compare(password, envPassword).catch(() => false) ||
    password === envPassword;

  if (!match) return { success: false, error: 'Credenziali non valide' };

  const token = await signToken({ email: user.email, role: user.role });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return { success: true };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAdmin(): Promise<AppUser> {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');
  const user = findUserByEmail(session.email);
  if (!user) redirect('/login');
  return user as AppUser;
}
