export type Role = 'ADMINISTRADOR' | 'ALMACENERO' | 'SUPERVISOR';

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  loginAt: string;
}
