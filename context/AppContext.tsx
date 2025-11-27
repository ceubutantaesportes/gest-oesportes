
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, SportClass, Enrollment, AttendanceRecord, EnrollmentStatus, ClassUpdateRequest, RequestStatus, RequestType, AuditLog, Notification, UserRole } from '../types';
import { MOCK_USERS, MOCK_CLASSES, MOCK_ENROLLMENTS, MOCK_ATTENDANCE, MOCK_REQUESTS, MOCK_AUDIT_LOGS, MOCK_NOTIFICATIONS } from '../constants';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  classes: SportClass[];
  enrollments: Enrollment[];
  attendance: AttendanceRecord[];
  updateRequests: ClassUpdateRequest[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  
  login: (email: string, password: string) => boolean;
  logout: () => void;
  
  // User Methods
  updateUser: (updatedUser: User) => void;
  updateCurrentUserProfile: (data: Partial<User>) => void;
  addUser: (newUser: User) => void;
  deleteUser: (userId: string) => void; // New method

  // Class Methods
  addClass: (newClass: SportClass) => void;
  updateClass: (updatedClass: SportClass) => void;
  deleteClass: (id: string) => void;
  
  // Update Request Methods
  requestClassUpdate: (classId: string, changes: Partial<SportClass>) => void;
  requestClassCreation: (newClass: SportClass) => void;
  resolveUpdateRequest: (requestId: string, approved: boolean) => void;
  
  // Enrollment Methods
  enrollStudent: (studentId: string, classId: string) => { success: boolean; message: string };
  requestEnrollment: (studentId: string, classId: string) => { success: boolean; message: string }; // Student Action
  confirmReservation: (enrollmentId: string) => void; // Secretary Action
  cancelEnrollment: (enrollmentId: string) => { success: boolean; nextStudent: User | null; className: string };
  
  // Attendance Methods
  submitAttendance: (classId: string, date: string, records: { studentId: string; present: boolean }[]) => void;
  
  // Report Methods
  generateAttendanceReport: (analystId: string) => void;
  printAttendanceReport: (analystId: string) => void;
  
  // Notification Methods
  markNotificationAsRead: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state with localStorage or Mock Data
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('app_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('app_users');
      return saved ? JSON.parse(saved) : MOCK_USERS;
    } catch (e) { return MOCK_USERS; }
  });

  const [classes, setClasses] = useState<SportClass[]>(() => {
    try {
      const saved = localStorage.getItem('app_classes');
      return saved ? JSON.parse(saved) : MOCK_CLASSES;
    } catch (e) { return MOCK_CLASSES; }
  });

  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => {
    try {
      const saved = localStorage.getItem('app_enrollments');
      return saved ? JSON.parse(saved) : MOCK_ENROLLMENTS;
    } catch (e) { return MOCK_ENROLLMENTS; }
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('app_attendance');
      return saved ? JSON.parse(saved) : MOCK_ATTENDANCE;
    } catch (e) { return MOCK_ATTENDANCE; }
  });

  const [updateRequests, setUpdateRequests] = useState<ClassUpdateRequest[]>(() => {
    try {
      const saved = localStorage.getItem('app_requests');
      return saved ? JSON.parse(saved) : MOCK_REQUESTS;
    } catch (e) { return MOCK_REQUESTS; }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('app_audit');
      return saved ? JSON.parse(saved) : MOCK_AUDIT_LOGS;
    } catch (e) { return MOCK_AUDIT_LOGS; }
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('app_notifications');
      return saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS;
    } catch (e) { return MOCK_NOTIFICATIONS; }
  });

  // --- AUTOMATIC PERSISTENCE (useEffect) ---
  // This ensures that ANY change to state is immediately saved to localStorage
  // solving the issue of data disappearing on refresh.
  useEffect(() => { localStorage.setItem('app_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('app_classes', JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem('app_enrollments', JSON.stringify(enrollments)); }, [enrollments]);
  useEffect(() => { localStorage.setItem('app_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('app_requests', JSON.stringify(updateRequests)); }, [updateRequests]);
  useEffect(() => { localStorage.setItem('app_audit', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('app_notifications', JSON.stringify(notifications)); }, [notifications]);

  // Persist Current User Session
  useEffect(() => {
    if (currentUser) {
        localStorage.setItem('app_currentUser', JSON.stringify(currentUser));
    } else {
        localStorage.removeItem('app_currentUser');
    }
  }, [currentUser]);

  const logAction = (action: string, details: string) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action,
        details,
        timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const login = (email: string, password: string) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    logAction('UPDATE_USER', `Alterou dados do usuário: ${updatedUser.name} (${updatedUser.role})`);
    
    // If Admin updates the logged-in user, keep session in sync
    if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  };

  const updateCurrentUserProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...data };
    
    // Update session
    setCurrentUser(updatedUser);
    
    // Update Database
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    
    logAction('PROFILE_UPDATE', 'Usuário atualizou o próprio perfil');
  };

  const addUser = (newUser: User) => {
    setUsers(prev => [newUser, ...prev]);
    logAction('ADD_USER', `Cadastrou novo usuário: ${newUser.name} (${newUser.role})`);
  };

  const deleteUser = (userId: string) => {
    const userToRemove = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    logAction('DELETE_USER', `Excluiu usuário: ${userToRemove?.name || userId} (${userToRemove?.role})`);
  };

  const addClass = (newClass: SportClass) => {
    setClasses(prev => [newClass, ...prev]);
    logAction('ADD_CLASS', `Criou a turma: ${newClass.title}`);
  };

  const updateClass = (updatedClass: SportClass) => {
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
    logAction('UPDATE_CLASS', `Atualizou a turma: ${updatedClass.title}`);
  };

  const deleteClass = (id: string) => {
    const cls = classes.find(c => c.id === id);
    setClasses(prev => prev.filter(c => c.id !== id));
    logAction('DELETE_CLASS', `Removeu a turma: ${cls?.title || id}`);
  };

  // --- Update/Create Request Logic ---
  const requestClassUpdate = (classId: string, changes: Partial<SportClass>) => {
    if (!currentUser) return;
    const targetClass = classes.find(c => c.id === classId);
    if (!targetClass) return;

    const newRequest: ClassUpdateRequest = {
      id: Math.random().toString(36).substr(2, 9),
      requestType: RequestType.UPDATE,
      classId,
      classTitle: targetClass.title,
      analystId: currentUser.id,
      analystName: currentUser.name,
      requestedChanges: changes,
      status: RequestStatus.PENDING,
      createdAt: new Date().toISOString()
    };
    
    setUpdateRequests(prev => [newRequest, ...prev]);
    logAction('REQUEST_UPDATE', `Solicitou alteração na turma: ${targetClass.title}`);
  };

  const requestClassCreation = (newClass: SportClass) => {
    if (!currentUser) return;

    const newRequest: ClassUpdateRequest = {
      id: Math.random().toString(36).substr(2, 9),
      requestType: RequestType.CREATE,
      classId: newClass.id, 
      classTitle: newClass.title,
      analystId: currentUser.id,
      analystName: currentUser.name,
      requestedChanges: newClass,
      status: RequestStatus.PENDING,
      createdAt: new Date().toISOString()
    };
    
    setUpdateRequests(prev => [newRequest, ...prev]);
    logAction('REQUEST_CREATE', `Solicitou criação da turma: ${newClass.title}`);
  };

  const resolveUpdateRequest = (requestId: string, approved: boolean) => {
    const request = updateRequests.find(r => r.id === requestId);
    if (!request) return;

    if (approved) {
      if (request.requestType === RequestType.UPDATE) {
        setClasses(prev => {
            const targetClass = prev.find(c => c.id === request.classId);
            if (!targetClass) return prev;
            const updatedClass = { ...targetClass, ...request.requestedChanges };
            return prev.map(c => c.id === updatedClass.id ? updatedClass as SportClass : c);
        });
      } else if (request.requestType === RequestType.CREATE) {
        setClasses(prev => [request.requestedChanges as SportClass, ...prev]);
      } else if (request.requestType === RequestType.ENROLLMENT_OVERRIDE && request.studentId) {
        // --- HANDLE ENROLLMENT OVERRIDE APPROVAL ---
        // Creates the enrollment bypassing the check
        const targetClass = classes.find(c => c.id === request.classId);
        if (targetClass) {
            const isFull = targetClass.enrolledCount >= targetClass.capacity;
            const status = isFull ? EnrollmentStatus.WAITING_LIST : EnrollmentStatus.CONFIRMED;

            const newEnrollment: Enrollment = {
                id: Math.random().toString(36).substr(2, 9),
                classId: targetClass.id,
                studentId: request.studentId,
                studentName: request.studentName || 'Aluno',
                status,
                date: new Date().toISOString().split('T')[0]
            };

            setEnrollments(prev => [...prev, newEnrollment]);

            // Update class counts
            const updatedClass = { ...targetClass };
            if (status === EnrollmentStatus.CONFIRMED) updatedClass.enrolledCount++;
            else updatedClass.waitingListCount++;
            
            setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
            logAction('RESOLVE_REQUEST', `Aprovou vaga extra para ${request.studentName} em ${targetClass.title}`);
        }
      }
    }

    setUpdateRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { ...r, status: approved ? RequestStatus.APPROVED : RequestStatus.REJECTED }
        : r
    ));
    
    if (request.requestType !== RequestType.ENROLLMENT_OVERRIDE) {
        logAction('RESOLVE_REQUEST', `${approved ? 'Aprovou' : 'Rejeitou'} solicitação para: ${request.classTitle}`);
    }
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

  // --- Enrollment Logic ---
  const enrollStudent = (studentId: string, classId: string) => {
    const targetClass = classes.find(c => c.id === classId);
    const student = users.find(u => u.id === studentId);

    if (!targetClass || !student) return { success: false, message: 'Turma ou aluno não encontrado.' };

    const exists = enrollments.find(e => e.studentId === studentId && e.classId === classId);
    if (exists) return { success: false, message: 'Aluno já cadastrado nesta turma.' };

    // --- CHECK ACTIVE ENROLLMENTS LIMIT (MAX 3) ---
    const activeEnrollmentsCount = enrollments.filter(e => e.studentId === studentId && e.status === EnrollmentStatus.CONFIRMED).length;
    
    if (activeEnrollmentsCount >= 3) {
        // Limit Exceeded: Create Request for Coordinator
        if (!currentUser) return { success: false, message: 'Usuário não logado.' };

        const newRequest: ClassUpdateRequest = {
            id: Math.random().toString(36).substr(2, 9),
            requestType: RequestType.ENROLLMENT_OVERRIDE,
            classId: targetClass.id,
            classTitle: targetClass.title,
            analystId: currentUser.id,
            analystName: currentUser.name,
            studentId: student.id,
            studentName: student.name,
            requestedChanges: {}, // No class structure changes
            status: RequestStatus.PENDING,
            createdAt: new Date().toISOString()
        };

        setUpdateRequests(prev => [newRequest, ...prev]);
        
        // Notify Coordinators
        const coordinators = users.filter(u => u.role === UserRole.COORDINATOR);
        const newNotifications = coordinators.map(coord => ({
            id: Math.random().toString(36).substr(2, 9),
            recipientId: coord.id,
            title: 'Solicitação de Vaga Extra',
            message: `${currentUser.name} solicitou inclusão de ${student.name} na 4ª atividade: ${targetClass.title}.`,
            read: false,
            createdAt: new Date().toISOString()
        }));
        setNotifications(prev => [...newNotifications, ...prev]);

        return { 
            success: false, 
            message: 'Limite de 3 atividades atingido. Solicitação enviada à Coordenação para aprovação.' 
        };
    }

    const isFull = targetClass.enrolledCount >= targetClass.capacity;
    const status = isFull ? EnrollmentStatus.WAITING_LIST : EnrollmentStatus.CONFIRMED;

    const newEnrollment: Enrollment = {
      id: Math.random().toString(36).substr(2, 9),
      classId,
      studentId,
      studentName: student.name,
      status,
      date: new Date().toISOString().split('T')[0]
    };

    setEnrollments(prev => [...prev, newEnrollment]);

    // Update class counts
    const updatedClass = { ...targetClass };
    if (status === EnrollmentStatus.CONFIRMED) updatedClass.enrolledCount++;
    else updatedClass.waitingListCount++;
    
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));

    logAction('ENROLL_STUDENT', `Matriculou ${student.name} em ${targetClass.title} (${status === EnrollmentStatus.CONFIRMED ? 'Confirmado' : 'Fila'})`);

    // --- SEND NOTIFICATION TO ANALYST ---
    if (currentUser && targetClass.analystId) {
        const age = student.birthDate ? calculateAge(student.birthDate) : 0;
        const newNotification: Notification = {
            id: Math.random().toString(36).substr(2, 9),
            recipientId: targetClass.analystId,
            title: status === EnrollmentStatus.CONFIRMED ? 'Nova Matrícula' : 'Novo Aluno na Fila',
            message: `${currentUser.name} matriculou ${student.name} na turma ${targetClass.title}.`,
            details: {
                secretaryName: currentUser.name,
                studentName: student.name,
                studentBirthDate: student.birthDate ? new Date(student.birthDate).toLocaleDateString('pt-BR') : 'Não informado',
                studentAge: age,
                studentPhone: student.cellphone || student.phone || 'Sem contato'
            },
            read: false,
            createdAt: new Date().toISOString()
        };
        setNotifications(prev => [newNotification, ...prev]);
    }

    return { 
      success: true, 
      message: isFull ? 'Turma cheia. Aluno adicionado à Lista de Espera.' : 'Matrícula realizada com sucesso.' 
    };
  };

  const requestEnrollment = (studentId: string, classId: string) => {
      // Stub kept for compatibility, but logic moved to secretary/in-person only
      return { success: false, message: 'Solicitações online desativadas. Compareça à secretaria.' };
  };

  const confirmReservation = (enrollmentId: string) => {
      // Stub kept for compatibility
  };

  const cancelEnrollment = (enrollmentId: string) => {
    const enrollment = enrollments.find(e => e.id === enrollmentId);
    if (!enrollment) return { success: false, nextStudent: null, className: '' };

    const targetClass = classes.find(c => c.id === enrollment.classId);
    if (!targetClass) return { success: false, nextStudent: null, className: '' };

    setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));

    const updatedClass = { ...targetClass };
    if (enrollment.status === EnrollmentStatus.CONFIRMED || enrollment.status === EnrollmentStatus.RESERVED) {
      updatedClass.enrolledCount = Math.max(0, updatedClass.enrolledCount - 1);
    } else if (enrollment.status === EnrollmentStatus.WAITING_LIST) {
      updatedClass.waitingListCount = Math.max(0, updatedClass.waitingListCount - 1);
    }
    
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
    logAction('CANCEL_ENROLLMENT', `Cancelou matrícula de ${enrollment.studentName} em ${targetClass.title}`);

    // Waitlist Promotion Logic
    let nextStudent = null;
    if (enrollment.status === EnrollmentStatus.CONFIRMED) {
        // Find students on waitlist
        const waitlist = enrollments
            .filter(e => e.classId === targetClass.id && e.status === EnrollmentStatus.WAITING_LIST && e.id !== enrollmentId);
            
        if (waitlist.length > 0) {
            const nextEnrollment = waitlist[0]; // First in line
            const user = users.find(u => u.id === nextEnrollment.studentId);
            if (user) {
                nextStudent = user;
            }
        }
    }

    return { success: true, nextStudent, className: targetClass.title };
  };

  const submitAttendance = (classId: string, date: string, records: { studentId: string; present: boolean }[]) => {
    const newRecords = records.map(r => ({
      id: Math.random().toString(36).substr(2, 9),
      classId,
      date,
      studentId: r.studentId,
      present: r.present
    }));
    setAttendance(prev => [...prev, ...newRecords]);
    
    const cls = classes.find(c => c.id === classId);
    logAction('SUBMIT_ATTENDANCE', `Lançou frequência para ${cls?.title} na data ${date}`);
  };

  const markNotificationAsRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // --- Reports ---
  const generateAttendanceReport = (analystId: string) => {
    const targetClasses = analystId 
      ? classes.filter(c => c.analystId === analystId)
      : classes;

    if (targetClasses.length === 0) {
      alert("Nenhuma turma encontrada.");
      return;
    }

    let csvContent = "\uFEFF";
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    csvContent += `RELATÓRIO DE PRESENÇA - ${now.toLocaleString('default', { month: 'long' }).toUpperCase()}/${now.getFullYear()}\n\n`;

    targetClasses.forEach(cls => {
      csvContent += `TURMA: ${cls.title},MODALIDADE: ${cls.modality},DIAS: ${cls.days.join('/')},HORÁRIO: ${cls.time}\n`;
      let header = "Nome do Aluno";
      for (let i = 1; i <= daysInMonth; i++) {
        header += `,${i}`;
      }
      csvContent += header + "\n";

      const classEnrollments = enrollments
        .filter(e => e.classId === cls.id && e.status === EnrollmentStatus.CONFIRMED)
        .sort((a, b) => a.studentName.localeCompare(b.studentName));
        
      classEnrollments.forEach(enr => {
        let row = `"${enr.studentName}"`;
        for (let i = 1; i <= daysInMonth; i++) {
           const date = new Date(now.getFullYear(), now.getMonth(), i);
           const dayMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
           const dayName = dayMap[date.getDay()];
           const hasClass = cls.days.includes(dayName);
           row += `,${hasClass ? '[ ]' : '---'}`;
        }
        csvContent += row + "\n";
      });
      csvContent += "\n"; 
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lista_Presenca_${analystId || 'Geral'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAction('EXPORT_REPORT', 'Baixou relatório de presença CSV');
  };

  const printAttendanceReport = (analystId: string) => {
    const targetClasses = analystId 
      ? classes.filter(c => c.analystId === analystId)
      : classes;

    if (targetClasses.length === 0) {
      alert("Nenhuma turma encontrada para impressão.");
      return;
    }

    const now = new Date();
    const currentMonth = now.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    let printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let html = `
      <html>
      <head>
        <title>Lista de Chamada - ${currentMonth}/${currentYear}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: 'Arial', sans-serif; -webkit-print-color-adjust: exact; }
          .page-break { page-break-after: always; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header h1 { font-size: 18px; margin: 0; }
          .header h2 { font-size: 14px; margin: 5px 0 0; font-weight: normal; }
          
          .class-info { margin-bottom: 15px; border: 1px solid #ccc; padding: 10px; background-color: #f9f9f9; border-radius: 4px; }
          .class-info p { margin: 2px 0; font-size: 12px; }
          .class-info strong { font-weight: bold; }

          table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; }
          th, td { border: 1px solid #333; padding: 4px 2px; text-align: center; overflow: hidden; white-space: nowrap; }
          
          /* Column Widths */
          th.col-name { width: 220px; text-align: left; padding-left: 5px; }
          th.col-birth { width: 70px; }
          th.col-contact { width: 100px; }
          th.col-day { width: 18px; }
          
          td.col-name { text-align: left; padding-left: 5px; white-space: normal; }
          
          .gray-bg { background-color: #e0e0e0 !important; }
          
          .footer { margin-top: 20px; font-size: 12px; display: flex; justify-content: space-between; }
          .signature { border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
    `;

    targetClasses.forEach((cls, index) => {
      const dayMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      let tableHeaderDays = '';
      for (let i = 1; i <= daysInMonth; i++) {
        tableHeaderDays += `<th class="col-day">${i}</th>`;
      }

      const students = enrollments
        .filter(e => e.classId === cls.id && e.status === EnrollmentStatus.CONFIRMED)
        .map(e => users.find(u => u.id === e.studentId))
        .filter(u => u !== undefined)
        .sort((a, b) => (a?.name || '').localeCompare(b?.name || '')) as User[];

      const rows = students.map(student => {
        let dayCells = '';
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(now.getFullYear(), now.getMonth(), i);
            const dayName = dayMap[date.getDay()];
            const isClassDay = cls.days.includes(dayName);
            dayCells += `<td class="${!isClassDay ? 'gray-bg' : ''}"></td>`;
        }
        
        const birthDate = student.birthDate ? new Date(student.birthDate).toLocaleDateString('pt-BR') : '-';
        
        return `
          <tr>
            <td class="col-name">${student.name}</td>
            <td class="col-birth">${birthDate}</td>
            <td class="col-contact">${student.phone || '-'}</td>
            ${dayCells}
          </tr>
        `;
      }).join('');

      const emptyRowsCount = Math.max(0, 25 - students.length);
      const emptyRows = Array.from({length: emptyRowsCount}).map(() => {
        let dayCells = '';
        for (let i = 1; i <= daysInMonth; i++) {
             const date = new Date(now.getFullYear(), now.getMonth(), i);
             const dayName = dayMap[date.getDay()];
             const isClassDay = cls.days.includes(dayName);
             dayCells += `<td class="${!isClassDay ? 'gray-bg' : ''}"></td>`;
        }
        return `<tr><td class="col-name">&nbsp;</td><td class="col-birth"></td><td class="col-contact"></td>${dayCells}</tr>`;
      }).join('');

      html += `
        <div class="header">
          <h1>CEU BUTANTÃ - CONTROLE DE FREQUÊNCIA</h1>
          <h2>MÊS DE REFERÊNCIA: ${currentMonth} / ${currentYear}</h2>
        </div>

        <div class="class-info">
          <div style="display: flex; justify-content: space-between;">
             <span><strong>TURMA:</strong> ${cls.title}</span>
             <span><strong>MODALIDADE:</strong> ${cls.modality}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 5px;">
             <span><strong>ANALISTA:</strong> ${cls.analystName}</span>
             <span><strong>DIAS:</strong> ${cls.days.join(' / ')}</span>
             <span><strong>HORÁRIO:</strong> ${cls.time}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="col-name">NOME DO ALUNO</th>
              <th class="col-birth">DT. NASC</th>
              <th class="col-contact">CONTATO</th>
              ${tableHeaderDays}
            </tr>
          </thead>
          <tbody>
            ${rows}
            ${emptyRows}
          </tbody>
        </table>

        <div class="footer">
          <div class="signature">Assinatura do Analista</div>
          <div class="signature">Visto da Coordenação</div>
        </div>

        ${index < targetClasses.length - 1 ? '<div class="page-break"></div>' : ''}
      `;
    });

    html += `</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    logAction('PRINT_REPORT', 'Imprimiu relatório de presença');
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, classes, enrollments, attendance, updateRequests, auditLogs, notifications,
      login, logout, addClass, updateClass, deleteClass, updateUser, updateCurrentUserProfile, addUser, deleteUser,
      requestClassUpdate, requestClassCreation, resolveUpdateRequest,
      enrollStudent, requestEnrollment, confirmReservation, cancelEnrollment, submitAttendance,
      generateAttendanceReport, printAttendanceReport, markNotificationAsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
