export interface User {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
