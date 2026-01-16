export interface User {
  id: string;
  roles: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}
