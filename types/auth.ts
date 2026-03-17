export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  expiresIn: number;
}

export interface AuthRequest {
  username: string;
  password: string;
}
