export interface User {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isVerified?: boolean;
  favorites?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RegisterResponse {
  _id: string;
  username: string;
  email: string;
  requiresVerification: boolean;
}
