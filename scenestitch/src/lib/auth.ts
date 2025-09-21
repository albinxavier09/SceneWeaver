import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail } from './database';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function registerUser(email: string, password: string, name: string) {
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const userId = await createUser(email, passwordHash, name);
  return userId;
}

export async function authenticateUser(email: string, password: string) {
  // Get user by email
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Return user without password hash
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
