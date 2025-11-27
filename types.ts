
export enum UserRole {
  STUDENT = 'STUDENT',
  SECRETARY = 'SECRETARY',
  ANALYST = 'ANALYST',
  COORDINATOR = 'COORDINATOR'
}

export enum ClassStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  FINISHED = 'FINISHED'
}

export enum EnrollmentStatus {
  CONFIRMED = 'CONFIRMED',
  WAITING_LIST = 'WAITING_LIST',
  CANCELED = 'CANCELED',
  RESERVED = 'RESERVED' // New status for 2h reservation
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum RequestType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  ENROLLMENT_OVERRIDE = 'ENROLLMENT_OVERRIDE' // Nova solicitação para limite de vagas
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Added for authentication
  role: UserRole;
  avatar?: string;
  cpf?: string; // For students
  ref?: string; // Registro Funcional (Required for Staff)
  birthDate?: string; // For age validation
  phone?: string; // Telefone Fixo
  cellphone?: string; // Celular
  
  // Address Fields
  address?: string; // Logradouro + Número
  neighborhood?: string; // Bairro

  // Guardian Fields (Required for minors)
  guardianName?: string;
  guardianCpf?: string;
  guardianEmail?: string;
  guardianPhone?: string; // Celular do responsável
}

export interface SportClass {
  id: string;
  title: string;
  description?: string; // Added description field
  modality: string;
  analystId: string;
  analystName: string;
  days: string[]; // e.g., ['Seg', 'Qua']
  time: string; // e.g., '10:00 - 11:00'
  location: string;
  capacity: number;
  minAge: number;
  maxAge: number;
  status: ClassStatus;
  enrolledCount: number;
  waitingListCount: number;
  createdAt?: string;
}

export interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  status: EnrollmentStatus;
  date: string;
  expiresAt?: string; // ISO String for reservation expiration
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string;
  studentId: string;
  present: boolean;
  justification?: string;
}

export interface ClassUpdateRequest {
  id: string;
  requestType: RequestType; // New field to distinguish Create vs Update vs Enrollment Override
  classId: string;
  classTitle: string;
  analystId: string; // Quem solicitou (pode ser secretaria neste caso)
  analystName: string;
  requestedChanges: Partial<SportClass>; // Pode estar vazio no caso de Enrollment Override
  studentId?: string; // Opcional: Apenas para Enrollment Override
  studentName?: string; // Opcional: Apenas para Enrollment Override
  status: RequestStatus;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  details?: { // Structured details for the analyst
    secretaryName: string;
    studentName: string;
    studentBirthDate: string;
    studentAge: number;
    studentPhone: string;
  };
  read: boolean;
  createdAt: string;
}

// Navigation state
export type ViewState = 
  | 'LOGIN'
  | 'DASHBOARD'
  | 'CLASSES'
  | 'MY_CLASSES' // Analyst specific
  | 'STUDENTS' // Secretary specific
  | 'REPORTS'; // Coordinator specific
