
import { User, UserRole, SportClass, ClassStatus, Enrollment, EnrollmentStatus, AttendanceRecord, ClassUpdateRequest, AuditLog, Notification } from './types';

// --- 0. Standard Locations ---
export const LOCATIONS = ['Ginásio', 'Tatame', 'Academia', 'Piscina', 'Sala de Dança'];

// --- 1. Base Users (Roles Fixos) ---

const ANALYSTS_DATA = [
  { name: 'Alexandre Greco Morgado Batista', email: 'alexandre.batista@sme.prefeitura.sp.gov.br', ref: '755.729.9/1', phone: '(11) 3732-4556', cellphone: '(11) 98218-1986' },
  { name: 'Andrezza Pires de Alcantara', email: 'andrezza@sme.prefeitura.sp.gov.br', ref: '754.931.8/1', phone: '(11) 3732-4556', cellphone: '(11) 98202-5005' },
  { name: 'Fabiana Amaral Ferreira', email: 'fabiana.analista@ceu.sp.gov.br', ref: '000.000.0/0', phone: '(11) 3732-4556', cellphone: '(11) 99999-0000' }, // Dados parciais mantidos/placeholder
  { name: 'Marcela Massigli Simões', email: 'marcela.simoes@sme.prefeitura.sp.gov.br', ref: '744.137.1/1', phone: '(11) 3732-4556', cellphone: '(11) 98274-2008' },
  { name: 'Sheila Silva Cantoni', email: 'sheilasil@sme.prefeitura.sp.gov.br', ref: '778.581.0/1', phone: '(11) 3732-4556', cellphone: '(11) 95028-6400' },
  { name: 'Vanessa Burkhardt', email: 'vanessabu@sme.prefeitura.sp.gov.br', ref: '809.905.7/1', phone: '(11) 3732-4556', cellphone: '(11) 98572-7878' },
  { name: 'Wagner Queiroz Amendola', email: 'wagnerq@sme.prefeitura.sp.gov.br', ref: '778.319.1/1', phone: '(11) 3732-4556', cellphone: '(11) 97773-5495' }
];

const generateCPF = () => {
  const n = () => Math.floor(Math.random() * 10);
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
};

const ANALYSTS_USERS: User[] = ANALYSTS_DATA.map((a, i) => ({
  id: `u_an${i + 1}`,
  name: a.name,
  email: a.email,
  password: '123456',
  role: UserRole.ANALYST,
  ref: a.ref,
  cpf: generateCPF(), // Gerando CPF pois não foi fornecido nos dados
  phone: a.phone,
  cellphone: a.cellphone
}));

const BASE_USERS: User[] = [
  { id: 'u1', name: 'João Silva', email: 'joao.student@ceu.sp.gov.br', password: '123456', role: UserRole.STUDENT, cpf: '123.456.789-00', birthDate: '2010-05-15', phone: '(11) 3333-1111', cellphone: '(11) 99999-1111', address: 'Av. Eng. Heitor Antônio Eiras Garcia, 1700', neighborhood: 'Jardim Esmeralda' },
  { id: 'u2', name: 'Maria Souza', email: 'maria.student@ceu.sp.gov.br', password: '123456', role: UserRole.STUDENT, cpf: '234.567.890-11', birthDate: '2008-08-20', phone: '(11) 3333-2222', cellphone: '(11) 99999-2222', address: 'Rua do CEU, 50', neighborhood: 'Butantã' },
  { id: 'u3', name: 'Ana Pereira', email: 'ana.sec@ceu.sp.gov.br', password: '123456', role: UserRole.SECRETARY, ref: 'RF-SEC-01', phone: '(11) 3333-0000', cellphone: '(11) 97777-0000' },
  { id: 'u_coord1', name: 'Roberto Chefe', email: 'roberto.coord@ceu.sp.gov.br', password: '123456', role: UserRole.COORDINATOR, ref: 'RF-ADM-01', phone: '(11) 3333-1111', cellphone: '(11) 91111-2222' },
  { id: 'u_coord2', name: 'Lucas da Silva Ribeiro', email: 'lucas.ribeiro@sme.prefeitura.sp.gov.br', password: '123456', role: UserRole.COORDINATOR, ref: 'RF-ADM-99', phone: '(11) 3333-2222', cellphone: '(11) 99988-7766' },
  ...ANALYSTS_USERS
];

// --- 2. Generate Realistic Students ---

const FIRST_NAMES = ['Miguel', 'Arthur', 'Gael', 'Heitor', 'Helena', 'Alice', 'Laura', 'Maria', 'Pedro', 'Gabriel', 'Bernardo', 'Samuel', 'Enzo', 'Valentina', 'Sophia', 'Julia', 'Livia', 'Isabella', 'Dav', 'Lucas', 'Matheus', 'Nicolas', 'Guilherme', 'Rafael', 'Felipe', 'Gustavo', 'Beatriz', 'Larissa', 'Camila', 'Leticia', 'Amanda', 'Bruna', 'Luana', 'Bianca'];
const LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques'];
const STREETS = ['Rua da Paz', 'Av. Vital Brasil', 'Rua Alvarenga', 'Av. Corifeu de Azevedo Marques', 'Rua Camargo', 'Rua Sapetuba', 'Av. Eliseu de Almeida'];
const NEIGHBORHOODS = ['Butantã', 'Jardim Bonfiglioli', 'Vila Indiana', 'Rio Pequeno', 'Jardim Esmeralda'];

const generatePhone = () => {
    return `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
}

const generateBirthDate = (minAge: number, maxAge: number) => {
  const year = new Date().getFullYear() - Math.floor(Math.random() * (maxAge - minAge + 1) + minAge);
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const calculateAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
  }
  return age;
};

// REDUZIDO DE 250 PARA 50 PARA EVITAR ESTOURO DO LOCALSTORAGE
const EXTRA_STUDENTS: User[] = Array.from({ length: 50 }, (_, i) => {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const secondLastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const fullName = `${firstName} ${lastName} ${secondLastName}`;
  
  const birthDate = generateBirthDate(6, 60);
  const age = calculateAge(birthDate);
  const isMinor = age < 18;

  const address = `${STREETS[Math.floor(Math.random() * STREETS.length)]}, ${Math.floor(Math.random() * 1000)}`;
  const neighborhood = NEIGHBORHOODS[Math.floor(Math.random() * NEIGHBORHOODS.length)];

  let guardianData = {};
  if (isMinor) {
      guardianData = {
          guardianName: `Responsável de ${firstName}`,
          guardianCpf: generateCPF(),
          guardianEmail: `responsavel.${i}@teste.com`,
          guardianPhone: generatePhone()
      };
  }
  
  return {
    id: `std_real_${i}`,
    name: fullName,
    email: `aluno.${firstName.toLowerCase()}.${i}@teste.com`,
    password: '123456',
    role: UserRole.STUDENT,
    cpf: generateCPF(),
    birthDate: birthDate,
    cellphone: generatePhone(),
    phone: '',
    address,
    neighborhood,
    ...guardianData
  };
});

export const MOCK_USERS: User[] = [...BASE_USERS, ...EXTRA_STUDENTS];

// --- 3. Define Classes (Redistribuição de Espaços e Horários) ---
// Espaços: 'Tatame', 'Sala de Dança', 'Piscina', 'Academia', 'Ginásio'

// Helper to find analyst case-insensitively
const getAnalyst = (nameStart: string) => {
  const analyst = ANALYSTS_USERS.find(a => a.name.toLowerCase().startsWith(nameStart.toLowerCase()));
  return analyst || ANALYSTS_USERS[0]; // Fallback to first analyst if not found
};

const RAW_CLASSES: SportClass[] = [
  // Alexandre (Lutas) - Espaço: Tatame
  {
    id: 'c_karate_1',
    title: 'Karatê Infantil',
    description: 'Iniciação ao Karatê Shotokan, focando em disciplina, coordenação motora e fundamentos básicos.',
    modality: 'Karatê',
    analystId: getAnalyst('Alexandre').id,
    analystName: getAnalyst('Alexandre').name,
    days: ['Seg', 'Qua'],
    time: '09:00 - 10:00',
    location: 'Tatame',
    capacity: 25,
    minAge: 6,
    maxAge: 12,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-01-10T09:00:00Z'
  },
  {
    id: 'c_jiu_1',
    title: 'Jiu Jitsu Adulto',
    description: 'Treinamento técnico de Jiu Jitsu brasileiro. Defesa pessoal e combate no solo.',
    modality: 'Jiu Jitsu',
    analystId: getAnalyst('Alexandre').id,
    analystName: getAnalyst('Alexandre').name,
    days: ['Ter', 'Qui'],
    time: '19:00 - 20:30',
    location: 'Tatame',
    capacity: 20,
    minAge: 16,
    maxAge: 50,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-01-12T10:00:00Z'
  },

  // Andrezza (Ginástica e Dança) - Espaço: Sala de Dança
  {
    id: 'c_ginast_1',
    title: 'Ginástica Localizada',
    description: 'Exercícios focados no fortalecimento muscular utilizando o peso do corpo e acessórios leves.',
    modality: 'Ginástica',
    analystId: getAnalyst('Andrezza').id,
    analystName: getAnalyst('Andrezza').name,
    days: ['Seg', 'Qua', 'Sex'],
    time: '08:00 - 09:00',
    location: 'Sala de Dança',
    capacity: 30,
    minAge: 16,
    maxAge: 65,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-02-01T08:00:00Z'
  },
  {
    id: 'c_zumba_1',
    title: 'Zumba Fitness',
    description: 'Aula de dança aeróbica com ritmos latinos. Alta queima calórica e diversão.',
    modality: 'Ginástica',
    analystId: getAnalyst('Andrezza').id,
    analystName: getAnalyst('Andrezza').name,
    days: ['Ter', 'Qui'],
    time: '18:00 - 19:00',
    location: 'Sala de Dança',
    capacity: 40,
    minAge: 14,
    maxAge: 60,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-02-05T14:00:00Z'
  },

  // Fabiana (Hidroginástica) - Espaço: Piscina
  {
    id: 'c_hidro_1',
    title: 'Hidroginástica Melhor Idade',
    description: 'Atividade na piscina com baixo impacto, ideal para fortalecimento e mobilidade articular.',
    modality: 'Hidroginástica',
    analystId: getAnalyst('Fabiana').id,
    analystName: getAnalyst('Fabiana').name,
    days: ['Ter', 'Qui'],
    time: '08:00 - 09:00',
    location: 'Piscina',
    capacity: 25,
    minAge: 50,
    maxAge: 90,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-01-20T09:00:00Z'
  },
  {
    id: 'c_hidro_2',
    title: 'Hidroginástica Manhã',
    description: 'Aula aeróbica na água para condicionamento físico geral.',
    modality: 'Hidroginástica',
    analystId: getAnalyst('Fabiana').id,
    analystName: getAnalyst('Fabiana').name,
    days: ['Qua', 'Sex'],
    time: '09:00 - 10:00',
    location: 'Piscina',
    capacity: 25,
    minAge: 18,
    maxAge: 60,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-01-20T09:30:00Z'
  },

  // Marcela (Natação e Hidro) - Espaço: Piscina
  {
    id: 'c_nat_1',
    title: 'Natação Iniciante',
    description: 'Adaptação ao meio líquido e aprendizado dos nados Crawl e Costas.',
    modality: 'Natação',
    analystId: getAnalyst('Marcela').id,
    analystName: getAnalyst('Marcela').name,
    days: ['Seg', 'Qua'],
    time: '14:00 - 15:00',
    location: 'Piscina',
    capacity: 15,
    minAge: 7,
    maxAge: 14,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-02-10T10:00:00Z'
  },
  {
    id: 'c_hidro_3',
    title: 'Hidroginástica Noturna',
    description: 'Treino intenso na água para quem trabalha durante o dia.',
    modality: 'Hidroginástica',
    analystId: getAnalyst('Marcela').id,
    analystName: getAnalyst('Marcela').name,
    days: ['Ter', 'Qui'],
    time: '19:00 - 20:00',
    location: 'Piscina',
    capacity: 25,
    minAge: 18,
    maxAge: 60,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-02-12T11:00:00Z'
  },

  // Sheila (Musculação e Pilates) - Espaços: Academia, Sala de Dança
  {
    id: 'c_musc_1',
    title: 'Musculação Manhã A',
    description: 'Acesso à sala de musculação com supervisão para treino de força e hipertrofia.',
    modality: 'Musculação',
    analystId: getAnalyst('Sheila').id,
    analystName: getAnalyst('Sheila').name,
    days: ['Seg', 'Qua', 'Sex'],
    time: '07:00 - 08:30',
    location: 'Academia',
    capacity: 40,
    minAge: 16,
    maxAge: 70,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-01-05T08:00:00Z'
  },
  {
    id: 'c_pilates_1',
    title: 'Pilates Solo',
    description: 'Fortalecimento do core, postura e respiração.',
    modality: 'Pilates',
    analystId: getAnalyst('Sheila').id,
    analystName: getAnalyst('Sheila').name,
    days: ['Ter', 'Qui'],
    time: '10:00 - 11:00',
    location: 'Sala de Dança',
    capacity: 20,
    minAge: 18,
    maxAge: 70,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-01-06T09:00:00Z'
  },

  // Vanessa (Esportes Coletivos) - Espaço: Ginásio
  {
    id: 'c_futsal_1',
    title: 'Futsal Sub-13',
    description: 'Treinamento tático e técnico de futebol de salão.',
    modality: 'Futsal',
    analystId: getAnalyst('Vanessa').id,
    analystName: getAnalyst('Vanessa').name,
    days: ['Seg', 'Qua'],
    time: '09:00 - 10:30',
    location: 'Ginásio',
    capacity: 20,
    minAge: 10,
    maxAge: 13,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-03-01T10:00:00Z'
  },
  {
    id: 'c_volei_1',
    title: 'Voleibol Misto',
    description: 'Aprendizado e prática de voleibol para iniciantes e intermediários.',
    modality: 'Vôlei',
    analystId: getAnalyst('Vanessa').id,
    analystName: getAnalyst('Vanessa').name,
    days: ['Qua', 'Sex'],
    time: '15:00 - 17:00',
    location: 'Ginásio',
    capacity: 24,
    minAge: 12,
    maxAge: 17,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-03-02T11:00:00Z'
  },

  // Wagner (Musculação e Esportes) - Espaços: Academia, Ginásio
  {
    id: 'c_musc_2',
    title: 'Musculação Noite',
    description: 'Treinamento de força no período noturno.',
    modality: 'Musculação',
    analystId: getAnalyst('Wagner').id,
    analystName: getAnalyst('Wagner').name,
    days: ['Seg', 'Qua', 'Sex'],
    time: '18:00 - 20:00',
    location: 'Academia',
    capacity: 40,
    minAge: 16,
    maxAge: 60,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-01-08T18:00:00Z'
  },
  {
    id: 'c_basq_1',
    title: 'Basquete Iniciação',
    description: 'Fundamentos do basquetebol: drible, passe e arremesso.',
    modality: 'Basquete',
    analystId: getAnalyst('Wagner').id,
    analystName: getAnalyst('Wagner').name,
    days: ['Ter', 'Qui'],
    time: '14:00 - 15:30',
    location: 'Ginásio',
    capacity: 25,
    minAge: 10,
    maxAge: 15,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-02-20T14:00:00Z'
  },
  {
    id: 'c_hand_1',
    title: 'Handebol Escolar',
    description: 'Prática de handebol voltada para adolescentes.',
    modality: 'Handebol',
    analystId: getAnalyst('Wagner').id,
    analystName: getAnalyst('Wagner').name,
    // Alterado horário para não bater com Futsal (Seg/Qua) no Ginásio
    days: ['Qua', 'Sex'],
    time: '10:30 - 12:00',
    location: 'Ginásio',
    capacity: 20,
    minAge: 12,
    maxAge: 16,
    status: ClassStatus.ACTIVE,
    enrolledCount: 0, waitingListCount: 0, createdAt: '2023-02-25T09:00:00Z'
  }
];

// --- 4. Enrollments & Lists ---

const GENERATED_ENROLLMENTS: Enrollment[] = [];
const CLASSES_WITH_COUNTS: SportClass[] = [];
let studentPointer = 0;

const getNextStudent = () => {
  const student = EXTRA_STUDENTS[studentPointer % EXTRA_STUDENTS.length];
  studentPointer++;
  return student;
};

// Fill classes with VARIED adhesion for testing
RAW_CLASSES.forEach(cls => {
  const newClass = { ...cls };
  let targetCount = 0;
  let waitlistTarget = 0;

  // Logic to vary adhesion (Red/Yellow/Green)
  if (cls.title.includes('Karatê') || cls.title.includes('Zumba') || cls.title.includes('Pilates')) {
    // 100% Full + Waitlist (HIGH ADHESION - GREEN)
    targetCount = cls.capacity;
    waitlistTarget = Math.floor(Math.random() * 5) + 3; // 3 to 7 waiting
  } else if (cls.title.includes('Musculação Manhã') || cls.title.includes('Hidroginástica Melhor Idade')) {
    // ~90% Full (HIGH ADHESION - GREEN)
    targetCount = Math.floor(cls.capacity * 0.9);
    waitlistTarget = 0;
  } else if (cls.title.includes('Jiu Jitsu') || cls.title.includes('Futsal') || cls.title.includes('Ginástica') || cls.title.includes('Natação')) {
     // ~65-75% Full (MEDIUM ADHESION - YELLOW)
     targetCount = Math.floor(cls.capacity * 0.7);
     waitlistTarget = 0;
  } else {
     // Remaining: Handebol, Basquete, Volei, Hidro Night/Morning
     // < 40% Full (LOW ADHESION - RED)
     targetCount = Math.floor(cls.capacity * 0.35); // Low adhesion
     waitlistTarget = 0;
  }
  
  // Create Enrollments
  for (let i = 0; i < targetCount; i++) {
    const student = getNextStudent();
    GENERATED_ENROLLMENTS.push({
      id: `enr_${cls.id}_${i}`,
      classId: cls.id,
      studentId: student.id,
      studentName: student.name,
      status: EnrollmentStatus.CONFIRMED,
      date: '2023-10-01'
    });
  }
  newClass.enrolledCount = targetCount;

  // Create Waiting List (only if targetCount reached capacity)
  for (let i = 0; i < waitlistTarget; i++) {
    const student = getNextStudent();
    GENERATED_ENROLLMENTS.push({
      id: `wait_${cls.id}_${i}`,
      classId: cls.id,
      studentId: student.id,
      studentName: student.name,
      status: EnrollmentStatus.WAITING_LIST,
      date: '2023-10-05'
    });
  }
  newClass.waitingListCount = waitlistTarget;
  
  CLASSES_WITH_COUNTS.push(newClass);
});

export const MOCK_CLASSES = CLASSES_WITH_COUNTS;
export const MOCK_ENROLLMENTS = GENERATED_ENROLLMENTS;

// --- 5. Generate Attendance ---

const DATES_TO_GENERATE = ['2023-10-10', '2023-10-12', '2023-10-14', '2023-10-16']; // Added more dates
const GENERATED_ATTENDANCE: AttendanceRecord[] = [];

CLASSES_WITH_COUNTS.forEach(cls => {
  const classEnrollments = GENERATED_ENROLLMENTS.filter(e => e.classId === cls.id && e.status === EnrollmentStatus.CONFIRMED);
  
  DATES_TO_GENERATE.forEach(date => {
    classEnrollments.forEach((enr) => {
      const isPresent = Math.random() > 0.15; // 85% attendance rate
      
      GENERATED_ATTENDANCE.push({
        id: `att_${cls.id}_${date}_${enr.studentId}`,
        classId: cls.id,
        date: date,
        studentId: enr.studentId,
        present: isPresent,
        justification: isPresent ? undefined : (Math.random() > 0.5 ? 'Atestado' : 'Falta injustificada')
      });
    });
  });
});

export const MOCK_ATTENDANCE = GENERATED_ATTENDANCE;
export const MOCK_REQUESTS: ClassUpdateRequest[] = [];
export const MOCK_AUDIT_LOGS: AuditLog[] = [];
export const MOCK_NOTIFICATIONS: Notification[] = [];
