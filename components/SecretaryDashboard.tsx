import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, EnrollmentStatus, User } from '../types';
import { Search, UserPlus, XCircle, List, UserCheck, FileSpreadsheet, LayoutGrid, Users, CheckCircle, ArrowLeft, Calendar, MapPin, Clock, Plus, X, Smartphone, Phone, Mail, FileText, Home, AlertTriangle, AlertOctagon, PhoneCall, Trash2, Edit, CheckSquare, XSquare, AlertCircle } from 'lucide-react';

type SecretaryView = 'MENU' | 'STUDENTS' | 'CLASSES' | 'VACANCIES' | 'WAITLIST' | 'CLASS_DETAILS';

const SecretaryDashboard: React.FC = () => {
  const { users, classes, enrollments, enrollStudent, cancelEnrollment, addUser, updateUser, deleteUser } = useApp();
  
  // Persist Current View in Local Storage
  const [currentView, setCurrentView] = useState<SecretaryView>(() => {
    return (localStorage.getItem('sec_dashboard_view') as SecretaryView) || 'MENU';
  });

  useEffect(() => {
    localStorage.setItem('sec_dashboard_view', currentView);
  }, [currentView]);

  // State for Student Management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [selectedReportAnalystId, setSelectedReportAnalystId] = useState<string>('');

  // State for Class Details Management
  const [viewingClassManagementId, setViewingClassManagementId] = useState<string | null>(null);
  const [studentSearchForClass, setStudentSearchForClass] = useState('');

  // State for Waitlist Alert
  const [waitlistAlert, setWaitlistAlert] = useState<{ student: User, className: string } | null>(null);
  const [viewingWaitlistClassId, setViewingWaitlistClassId] = useState<string | null>(null);

  // State for Adding/Editing Student
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isMinor, setIsMinor] = useState(false);
  
  // State for Class Filtering
  const [classFilter, setClassFilter] = useState('');
  
  const [newStudentData, setNewStudentData] = useState<Partial<User>>({
    name: '',
    email: '',
    cpf: '',
    birthDate: '',
    phone: '',
    cellphone: '',
    address: '',
    neighborhood: '',
    guardianName: '',
    guardianCpf: '',
    guardianEmail: '',
    guardianPhone: ''
  });
  
  const analysts = users.filter(u => u.role === UserRole.ANALYST);
  const students = users.filter(u => u.role === UserRole.STUDENT && 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.cpf?.includes(searchTerm))
  );

  const studentsForClassSearch = users.filter(u => u.role === UserRole.STUDENT && 
    studentSearchForClass.length > 0 &&
    (u.name.toLowerCase().includes(studentSearchForClass.toLowerCase()) || u.cpf?.includes(studentSearchForClass))
  );

  const selectedStudent = users.find(u => u.id === selectedStudentId);

  // Stats for Dashboard
  const totalStudents = users.filter(u => u.role === UserRole.STUDENT).length;
  const totalSpots = classes.reduce((acc, c) => acc + c.capacity, 0);
  const totalEnrolled = enrollments.filter(e => e.status === EnrollmentStatus.CONFIRMED).length;
  const totalVacancies = Math.max(0, totalSpots - totalEnrolled);
  const activeClassesCount = classes.length;
  const totalWaitlist = classes.reduce((acc, c) => acc + c.waitingListCount, 0);

  // --- CPF MASK HELPER ---
  const applyCPFMask = (value: string) => {
    let v = value.replace(/\D/g, ""); // Remove non-digits
    v = v.slice(0, 11); // Limit to 11 digits
    
    // Apply formatting
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    
    return v;
  };

  const applyDateMask = (value: string) => {
    let v = value.replace(/\D/g, ""); // Remove non-digits
    v = v.slice(0, 8); // Limit to 8 digits
    
    // Apply formatting DD/MM/AAAA
    v = v.replace(/(\d{2})(\d)/, "$1/$2");
    v = v.replace(/(\d{2})(\d)/, "$1/$2");
    
    return v;
  };

  const handleEnroll = () => {
    if (selectedStudentId && selectedClassId) {
      const result = enrollStudent(selectedStudentId, selectedClassId);
      setFeedback({ type: result.success ? 'success' : 'error', msg: result.message });
      if (result.success) {
        setSelectedClassId(null);
        setTimeout(() => setFeedback(null), 3000);
      }
    }
  };

  // Enroll logic for Class Details View
  const handleEnrollInClass = (studentId: string) => {
      if (viewingClassManagementId) {
          const result = enrollStudent(studentId, viewingClassManagementId);
          setFeedback({ type: result.success ? 'success' : 'error', msg: result.message });
          if (result.success) {
              setStudentSearchForClass(''); // Clear search after adding
          }
          setTimeout(() => setFeedback(null), 3000);
      }
  };

  const handleCancelEnrollment = (enrollmentId: string) => {
      if(window.confirm("Tem certeza que deseja cancelar esta matrícula?")) {
        const result = cancelEnrollment(enrollmentId);
        
        if (result.nextStudent) {
            setWaitlistAlert({
                student: result.nextStudent,
                className: result.className
            });
        }
        setFeedback({ type: 'success', msg: 'Matrícula cancelada com sucesso.' });
        setTimeout(() => setFeedback(null), 3000);
      }
  };

  const openClassManagement = (classId: string) => {
      setViewingClassManagementId(classId);
      setCurrentView('CLASS_DETAILS');
      setStudentSearchForClass('');
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

  const calculateAgeFromBrDate = (dateStr: string) => {
      if (dateStr.length !== 10) return 0;
      const [day, month, year] = dateStr.split('/').map(Number);
      const today = new Date();
      const birth = new Date(year, month - 1, day);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
      }
      return age;
  }

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateVal = applyDateMask(e.target.value);
      setNewStudentData({...newStudentData, birthDate: dateVal});
      
      if (dateVal.length === 10) {
          const age = calculateAgeFromBrDate(dateVal);
          setIsMinor(age < 18);
      } else {
          setIsMinor(false);
      }
  };

  const openAddStudentModal = () => {
    setIsEditing(false);
    setEditingStudentId(null);
    setNewStudentData({ name: '', email: '', cpf: '', birthDate: '', phone: '', cellphone: '', address: '', neighborhood: '', guardianName: '', guardianCpf: '', guardianEmail: '', guardianPhone: '' });
    setIsMinor(false);
    setIsAddStudentModalOpen(true);
  };

  const openEditStudentModal = (student: User) => {
    setIsEditing(true);
    setEditingStudentId(student.id);
    
    // Convert ISO to BR Date
    let brDate = '';
    if (student.birthDate) {
        const [year, month, day] = student.birthDate.split('-');
        brDate = `${day}/${month}/${year}`;
    }

    setNewStudentData({
        name: student.name,
        email: student.email,
        cpf: student.cpf,
        birthDate: brDate,
        phone: student.phone,
        cellphone: student.cellphone,
        address: student.address,
        neighborhood: student.neighborhood,
        guardianName: student.guardianName,
        guardianCpf: student.guardianCpf,
        guardianEmail: student.guardianEmail,
        guardianPhone: student.guardianPhone
    });

    if (brDate.length === 10) {
        const age = calculateAgeFromBrDate(brDate);
        setIsMinor(age < 18);
    }
    
    setIsAddStudentModalOpen(true);
  };

  const handleStudentFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.name || !newStudentData.cpf || !newStudentData.birthDate) {
        alert("Nome, CPF e Data de Nascimento são obrigatórios.");
        return;
    }

    if (newStudentData.cpf.length !== 14) {
        alert("O CPF deve conter 11 dígitos no formato 000.000.000-00.");
        return;
    }

    if (newStudentData.birthDate.length !== 10) {
        alert("Data de nascimento inválida. Use o formato DD/MM/AAAA.");
        return;
    }

    if (isMinor) {
        if (!newStudentData.guardianName || !newStudentData.guardianCpf || !newStudentData.guardianPhone || !newStudentData.guardianEmail) {
            alert("Para menores de 18 anos, todos os dados do responsável são obrigatórios.");
            return;
        }
        if (newStudentData.guardianCpf.length !== 14) {
            alert("O CPF do responsável deve conter 11 dígitos no formato 000.000.000-00.");
            return;
        }
    }

    // Convert BR Date (dd/mm/yyyy) to ISO (yyyy-mm-dd) for storage
    const [day, month, year] = newStudentData.birthDate.split('/');
    const isoBirthDate = `${year}-${month}-${day}`;

    if (isEditing && editingStudentId) {
        const originalUser = users.find(u => u.id === editingStudentId);
        if (originalUser) {
            const updatedUser: User = {
                ...originalUser,
                name: newStudentData.name!,
                email: newStudentData.email!,
                cpf: newStudentData.cpf,
                birthDate: isoBirthDate,
                phone: newStudentData.phone,
                cellphone: newStudentData.cellphone,
                address: newStudentData.address,
                neighborhood: newStudentData.neighborhood,
                guardianName: isMinor ? newStudentData.guardianName : undefined,
                guardianCpf: isMinor ? newStudentData.guardianCpf : undefined,
                guardianEmail: isMinor ? newStudentData.guardianEmail : undefined,
                guardianPhone: isMinor ? newStudentData.guardianPhone : undefined,
            };
            updateUser(updatedUser);
            setFeedback({ type: 'success', msg: 'Dados do aluno atualizados com sucesso!' });
        }
    } else {
        const newUser: User = {
            id: `u_${Date.now()}`,
            role: UserRole.STUDENT,
            name: newStudentData.name!,
            email: newStudentData.email || `aluno.${Date.now()}@sememail.com`,
            cpf: newStudentData.cpf,
            birthDate: isoBirthDate,
            phone: newStudentData.phone,
            cellphone: newStudentData.cellphone,
            password: '123456', // Senha padrão
            address: newStudentData.address,
            neighborhood: newStudentData.neighborhood,
            guardianName: isMinor ? newStudentData.guardianName : undefined,
            guardianCpf: isMinor ? newStudentData.guardianCpf : undefined,
            guardianEmail: isMinor ? newStudentData.guardianEmail : undefined,
            guardianPhone: isMinor ? newStudentData.guardianPhone : undefined,
        };
        addUser(newUser);
        setFeedback({ type: 'success', msg: 'Aluno cadastrado com sucesso! Agora você pode matriculá-lo.' });
        setSearchTerm(newUser.name); 
    }

    setNewStudentData({ name: '', email: '', cpf: '', birthDate: '', phone: '', cellphone: '', address: '', neighborhood: '', guardianName: '', guardianCpf: '', guardianEmail: '', guardianPhone: '' });
    setIsAddStudentModalOpen(false);
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleDeleteStudent = (studentId: string) => {
      if (window.confirm("Tem certeza que deseja excluir este aluno? Todas as matrículas serão canceladas.")) {
          deleteUser(studentId);
          if (selectedStudentId === studentId) setSelectedStudentId(null);
          setFeedback({ type: 'success', msg: 'Aluno excluído com sucesso.' });
          setTimeout(() => setFeedback(null), 3000);
      }
  };

  const exportToCSV = () => {
    const headers = [
      "ID Turma", "Turma", "Modalidade", "Analista Responsável", "Dias da Semana", 
      "Horário", "Local", "Nome do Aluno", "CPF do Aluno", "Data de Nascimento", "Idade",
      "Status da Matrícula", "Data da Matrícula"
    ];

    const rows: string[] = [];
    const classesToExport = selectedReportAnalystId 
      ? classes.filter(c => c.analystId === selectedReportAnalystId)
      : classes;

    if (classesToExport.length === 0) {
        alert("Nenhuma turma encontrada para o filtro selecionado.");
        return;
    }

    classesToExport.forEach(cls => {
      const classEnrollments = enrollments.filter(e => e.classId === cls.id);
      classEnrollments.forEach(enr => {
        const student = users.find(u => u.id === enr.studentId);
        const sanitize = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;
        
        let age = '-';
        if (student?.birthDate) {
            age = calculateAge(student.birthDate).toString();
        }

        const rowData = [
          sanitize(cls.id), sanitize(cls.title), sanitize(cls.modality), sanitize(cls.analystName),
          sanitize(cls.days.join('/')), sanitize(cls.time), sanitize(cls.location),
          sanitize(student?.name || 'Desconhecido'), sanitize(student?.cpf || '-'),
          sanitize(student?.birthDate ? new Date(student.birthDate).toLocaleDateString('pt-BR') : '-'),
          sanitize(age),
          sanitize(enr.status === EnrollmentStatus.CONFIRMED ? 'Matriculado' : 'Lista de Espera'),
          sanitize(new Date(enr.date).toLocaleDateString('pt-BR'))
        ];
        rows.push(rowData.join(','));
      });
    });

    const csvContent = "\uFEFF" + headers.join(',') + "\n" + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const analystName = analysts.find(a => a.id === selectedReportAnalystId)?.name.replace(/\s+/g, '_') || 'Geral';
    link.download = `Relatorio_${analystName}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDER FUNCTIONS ---

  const renderMenu = () => (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Central da Secretaria</h2>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-gray-900 text-sm font-bold">Banco de Alunos</p>
          <h3 className="text-3xl font-extrabold text-black">{totalStudents}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <p className="text-gray-900 text-sm font-bold">Turmas Ativas</p>
          <h3 className="text-3xl font-extrabold text-black">{activeClassesCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-gray-900 text-sm font-bold">Vagas Disponíveis</p>
          <h3 className="text-3xl font-extrabold text-black">{totalVacancies}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
          <p className="text-gray-900 text-sm font-bold">Fila de Espera</p>
          <h3 className="text-3xl font-extrabold text-black">{totalWaitlist}</h3>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        
        {/* Fila de Espera */}
        <button 
          onClick={() => setCurrentView('WAITLIST')}
          className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-300 transition-all text-left group"
        >
          <div className="bg-orange-50 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
            <AlertTriangle className="text-orange-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Fila de Espera</h3>
          <p className="text-gray-800 text-sm">Gerenciar alunos aguardando vagas.</p>
        </button>

        {/* Gestão de Alunos */}
        <button 
          onClick={() => setCurrentView('STUDENTS')}
          className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all text-left group"
        >
          <div className="bg-blue-50 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <UserPlus className="text-blue-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Gestão de Alunos</h3>
          <p className="text-gray-800 text-sm">Buscar alunos, cadastrar novos, realizar matrículas.</p>
        </button>

        {/* Grade de Turmas */}
        <button 
          onClick={() => setCurrentView('CLASSES')}
          className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all text-left group"
        >
          <div className="bg-purple-50 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
            <LayoutGrid className="text-purple-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Grade de Turmas</h3>
          <p className="text-gray-800 text-sm">Visualizar todas as turmas e horários.</p>
        </button>

        {/* Quadro de Vagas */}
        <button 
          onClick={() => setCurrentView('VACANCIES')}
          className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all text-left group"
        >
          <div className="bg-green-50 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
            <CheckCircle className="text-green-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Quadro de Vagas</h3>
          <p className="text-gray-800 text-sm">Turmas com vagas abertas para matrícula imediata.</p>
        </button>

      </div>
    </div>
  );

  const renderClassDetails = () => {
      const targetClass = classes.find(c => c.id === viewingClassManagementId);
      if (!targetClass) return <div>Turma não encontrada</div>;

      const enrolledStudents = enrollments
          .filter(e => e.classId === viewingClassManagementId)
          .map(e => ({ ...e, student: users.find(u => u.id === e.studentId) }))
          .sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || ''));

      const isFull = targetClass.enrolledCount >= targetClass.capacity;

      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button onClick={() => setCurrentView('CLASSES')} className="mr-4 text-gray-600 hover:text-blue-600">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{targetClass.title}</h2>
                        <p className="text-gray-600 font-medium">Gestão de Matrículas da Turma</p>
                    </div>
                  </div>
              </div>

              {feedback && (
                  <div className={`p-4 rounded-lg flex items-center font-bold ${feedback.type === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
                    {feedback.type === 'success' ? <UserCheck className="mr-2" /> : <XCircle className="mr-2" />}
                    {feedback.msg}
                  </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Add Student */}
                  <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                      <h3 className="font-bold text-lg mb-4 flex items-center text-gray-900">
                          <UserPlus className="mr-2 text-blue-600" /> Adicionar Aluno
                      </h3>
                      
                      <div className="mb-4">
                           <div className="flex justify-between text-sm mb-1 font-medium">
                                <span className="text-gray-700">Ocupação</span>
                                <span className={`${isFull ? 'text-red-600' : 'text-green-600'}`}>
                                    {targetClass.enrolledCount} / {targetClass.capacity}
                                </span>
                           </div>
                           <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} 
                                    style={{ width: `${Math.min(100, (targetClass.enrolledCount / targetClass.capacity) * 100)}%` }}
                                ></div>
                           </div>
                           {isFull && <p className="text-xs text-orange-600 mt-1 font-bold">Turma cheia! Novos alunos entrarão na Fila de Espera.</p>}
                      </div>

                      <div className="relative mb-4">
                          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          <input
                            type="text"
                            placeholder="Buscar aluno para matricular..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
                            value={studentSearchForClass}
                            onChange={e => setStudentSearchForClass(e.target.value)}
                          />
                      </div>

                      <div className="max-h-[300px] overflow-y-auto space-y-2">
                          {studentSearchForClass.length > 0 && studentsForClassSearch.map(student => {
                              const isAlreadyEnrolled = enrolledStudents.some(e => e.studentId === student.id);
                              return (
                                  <div key={student.id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center">
                                      <div className="overflow-hidden mr-2">
                                          <p className="font-bold text-gray-900 text-sm truncate">{student.name}</p>
                                          <p className="text-xs text-gray-600">{student.cpf}</p>
                                      </div>
                                      {isAlreadyEnrolled ? (
                                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">Inscrito</span>
                                      ) : (
                                          <button 
                                            onClick={() => handleEnrollInClass(student.id)}
                                            className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition-colors"
                                            title="Matricular"
                                          >
                                              <Plus size={16} />
                                          </button>
                                      )}
                                  </div>
                              );
                          })}
                          {studentSearchForClass.length > 0 && studentsForClassSearch.length === 0 && (
                              <p className="text-center text-sm text-gray-500">Nenhum aluno encontrado.</p>
                          )}
                      </div>
                  </div>

                  {/* Right Column: Student List */}
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                          <h3 className="font-bold text-gray-900 flex items-center">
                              <Users className="mr-2" size={18} /> Alunos Matriculados ({enrolledStudents.length})
                          </h3>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left text-black">
                              <thead className="bg-white text-gray-900 font-bold border-b">
                                  <tr>
                                      <th className="px-6 py-3">Nome</th>
                                      <th className="px-6 py-3">CPF</th>
                                      <th className="px-6 py-3">Status</th>
                                      <th className="px-6 py-3 text-center">Ações</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {enrolledStudents.map((item) => (
                                      <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                                          <td className="px-6 py-4 font-bold text-gray-900">{item.student?.name}</td>
                                          <td className="px-6 py-4 font-medium text-gray-700">{item.student?.cpf}</td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                  item.status === EnrollmentStatus.CONFIRMED 
                                                  ? 'bg-green-100 text-green-900' 
                                                  : 'bg-yellow-100 text-yellow-900'
                                              }`}>
                                                  {item.status === EnrollmentStatus.CONFIRMED ? 'Ativo' : 'Fila de Espera'}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                              <button 
                                                onClick={() => handleCancelEnrollment(item.id)}
                                                type="button"
                                                className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                                                title="Cancelar Matrícula"
                                              >
                                                  <Trash2 size={18} />
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                                  {enrolledStudents.length === 0 && (
                                      <tr><td colSpan={4} className="p-8 text-center text-gray-500 font-medium">Nenhum aluno matriculado nesta turma.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderStudents = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-300 pb-4 gap-4">
        <div className="flex items-center">
            <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-700 hover:text-blue-600">
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Gestão de Alunos & Matrículas</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
            {/* Report Filters */}
            <div className="flex gap-2 mr-4 border-r border-gray-300 pr-4">
              <select
                  value={selectedReportAnalystId}
                  onChange={(e) => setSelectedReportAnalystId(e.target.value)}
                  className="p-2 border border-gray-400 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium"
              >
                  <option value="">Todos os Analistas (Geral)</option>
                  {analysts.map(analyst => (
                      <option key={analyst.id} value={analyst.id}>{analyst.name}</option>
                  ))}
              </select>
              
              <button 
                onClick={exportToCSV}
                className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-2 rounded-lg font-bold shadow-sm transition-colors whitespace-nowrap text-sm border border-gray-300"
                title="Baixar Relatório em Excel/CSV"
              >
                <FileSpreadsheet className="mr-2" size={18} />
                Relatório
              </button>
            </div>

            {/* NEW STUDENT BUTTON */}
            <button 
                onClick={openAddStudentModal}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors whitespace-nowrap"
            >
                <Plus className="mr-2" size={20} />
                Novo Aluno
            </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-lg flex items-center font-bold ${feedback.type === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
           {feedback.type === 'success' ? <UserCheck className="mr-2" /> : <XCircle className="mr-2" />}
           {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Student Search */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm h-fit border border-gray-200">
          <h3 className="font-bold text-lg mb-4 flex items-center text-gray-900">
            <Search className="mr-2 text-blue-600" size={20} /> Banco de Alunos
          </h3>
          <input
            type="text"
            placeholder="Nome ou CPF..."
            className="w-full p-2 border border-gray-400 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 font-medium placeholder-gray-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
            {students.map(student => (
              <div 
                key={student.id} 
                className={`p-3 rounded-lg flex justify-between items-center transition-colors border ${
                  selectedStudentId === student.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedStudentId(student.id)}
                >
                    <div className="font-bold text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-700 font-medium">CPF: {student.cpf || 'Não informado'}</div>
                </div>
                <div className="flex gap-1">
                    <button 
                        onClick={() => openEditStudentModal(student)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" 
                        title="Editar"
                    >
                        <Edit size={16} />
                    </button>
                    <button 
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded" 
                        title="Excluir"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
              </div>
            ))}
            {students.length === 0 && <p className="text-gray-900 font-medium text-center text-sm py-4">Nenhum aluno encontrado.</p>}
          </div>
        </div>

        {/* Right Col: Actions & History */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStudentId && selectedStudent ? (
            <>
              {/* Student Details Card */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <h3 className="font-bold text-lg mb-4 flex items-center text-gray-900">
                    <UserCheck className="mr-2 text-blue-600" size={20} /> Dados Cadastrais
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-900 font-bold">Nome:</span> <span className="font-medium text-black">{selectedStudent.name}</span></div>
                    <div><span className="text-gray-900 font-bold">CPF:</span> <span className="font-medium text-black">{selectedStudent.cpf}</span></div>
                    <div><span className="text-gray-900 font-bold">Email:</span> <span className="font-medium text-black">{selectedStudent.email}</span></div>
                    <div><span className="text-gray-900 font-bold">Nascimento:</span> <span className="font-medium text-black">{selectedStudent.birthDate ? new Date(selectedStudent.birthDate).toLocaleDateString('pt-BR') : '-'}</span></div>
                    <div><span className="text-gray-900 font-bold">Telefone:</span> <span className="font-medium text-black">{selectedStudent.phone || '-'}</span></div>
                    <div><span className="text-gray-900 font-bold">Celular:</span> <span className="font-medium text-black">{selectedStudent.cellphone || '-'}</span></div>
                    <div className="col-span-1 md:col-span-2"><span className="text-gray-900 font-bold">Endereço:</span> <span className="font-medium text-black">{selectedStudent.address || '-'} - {selectedStudent.neighborhood || '-'}</span></div>
                    
                    {selectedStudent.guardianName && (
                        <div className="col-span-1 md:col-span-2 mt-2 pt-2 border-t border-gray-300 bg-gray-50 p-2 rounded">
                            <p className="font-bold text-gray-900 mb-2 text-xs uppercase">Responsável (Menor de Idade)</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div><span className="text-gray-900 font-bold">Nome:</span> <span className="font-medium text-black">{selectedStudent.guardianName}</span></div>
                                <div><span className="text-gray-900 font-bold">CPF:</span> <span className="font-medium text-black">{selectedStudent.guardianCpf}</span></div>
                                <div><span className="text-gray-900 font-bold">Tel:</span> <span className="font-medium text-black">{selectedStudent.guardianPhone}</span></div>
                                <div><span className="text-gray-900 font-bold">Email:</span> <span className="font-medium text-black">{selectedStudent.guardianEmail}</span></div>
                            </div>
                        </div>
                    )}
                 </div>
              </div>

              {/* Enrollment Action */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center text-gray-900">
                  <UserPlus className="mr-2 text-green-600" size={20} /> Nova Matrícula
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <select 
                    className="flex-1 p-2 border border-gray-400 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    value={selectedClassId || ''}
                    onChange={e => setSelectedClassId(e.target.value)}
                  >
                    <option value="">Selecione uma turma...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.days.join('/')} - {c.time}) - {c.enrolledCount}/{c.capacity} vagas
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={handleEnroll}
                    disabled={!selectedClassId}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold whitespace-nowrap"
                  >
                    Matricular
                  </button>
                </div>
              </div>

              {/* Student History */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center text-gray-900">
                  <List className="mr-2 text-gray-900" size={20} /> Histórico e Matrículas Atuais
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-900 uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3">Turma</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-black">
                      {enrollments.filter(e => e.studentId === selectedStudentId).map(enrollment => {
                        const classInfo = classes.find(c => c.id === enrollment.classId);
                        return (
                          <tr key={enrollment.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                            <td className="px-4 py-3 font-bold">{classInfo?.title}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                enrollment.status === EnrollmentStatus.CONFIRMED ? 'bg-green-100 text-green-900' : 
                                'bg-yellow-100 text-yellow-900'
                              }`}>
                                {enrollment.status === EnrollmentStatus.CONFIRMED ? 'Matriculado' : 'Lista de Espera'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium">{new Date(enrollment.date).toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => handleCancelEnrollment(enrollment.id)}
                                className="text-red-700 hover:text-red-900 text-xs font-bold border border-red-300 px-3 py-1 rounded hover:bg-red-50"
                              >
                                Cancelar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {enrollments.filter(e => e.studentId === selectedStudentId).length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-gray-900 font-medium">Nenhuma matrícula encontrada.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg p-12 bg-gray-50">
              <Users size={48} className="mb-4 opacity-50" />
              <p className="font-bold text-gray-900 text-lg">Selecione um aluno na lista ao lado</p>
              <p className="text-sm text-gray-700">para gerenciar matrículas e visualizar histórico.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Student Modal */}
      {isAddStudentModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 animate-fade-in overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}</h3>
                    <button onClick={() => setIsAddStudentModalOpen(false)} className="text-gray-600 hover:text-gray-900">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleStudentFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-900 mb-1">Nome Completo <span className="text-red-600">*</span></label>
                            <input 
                                type="text" 
                                required
                                className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                value={newStudentData.name}
                                onChange={e => setNewStudentData({...newStudentData, name: e.target.value})}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">CPF <span className="text-red-600">*</span></label>
                            <div className="relative">
                                <FileText size={16} className="absolute left-3 top-2.5 text-gray-500" />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="000.000.000-00"
                                    className="w-full pl-9 pr-3 py-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    value={newStudentData.cpf}
                                    onChange={e => setNewStudentData({...newStudentData, cpf: applyCPFMask(e.target.value)})}
                                    maxLength={14}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Data de Nascimento <span className="text-red-600">*</span></label>
                            <div className="grid grid-cols-3 gap-2">
                                <input 
                                    type="text" 
                                    required
                                    placeholder="DD/MM/AAAA"
                                    className="col-span-2 w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    value={newStudentData.birthDate}
                                    onChange={handleBirthDateChange}
                                    maxLength={10}
                                />
                                <div className="col-span-1">
                                    <input 
                                        type="text" 
                                        readOnly
                                        disabled
                                        placeholder="Idade"
                                        className="w-full p-2 border border-gray-300 bg-gray-100 text-gray-900 rounded-lg text-center font-bold"
                                        value={newStudentData.birthDate && newStudentData.birthDate.length === 10 ? `${calculateAgeFromBrDate(newStudentData.birthDate)} anos` : ''}
                                    />
                                </div>
                            </div>
                            {isMinor && <p className="text-xs text-orange-700 mt-1 font-bold">Aluno menor de idade. Responsável obrigatório.</p>}
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-900 mb-1">E-mail</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-2.5 text-gray-500" />
                                <input 
                                    type="email" 
                                    className="w-full pl-9 pr-3 py-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    value={newStudentData.email}
                                    onChange={e => setNewStudentData({...newStudentData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Telefone Fixo</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-2.5 text-gray-500" />
                                <input 
                                    type="text" 
                                    className="w-full pl-9 pr-3 py-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    placeholder="(11) 3333-0000"
                                    value={newStudentData.phone}
                                    onChange={e => setNewStudentData({...newStudentData, phone: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Celular</label>
                            <div className="relative">
                                <Smartphone size={16} className="absolute left-3 top-2.5 text-gray-500" />
                                <input 
                                    type="text" 
                                    className="w-full pl-9 pr-3 py-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    placeholder="(11) 99999-0000"
                                    value={newStudentData.cellphone}
                                    onChange={e => setNewStudentData({...newStudentData, cellphone: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                             <label className="block text-sm font-bold text-gray-900 mb-1">Endereço (Rua e Número)</label>
                             <div className="relative">
                                <Home size={16} className="absolute left-3 top-2.5 text-gray-500" />
                                <input 
                                    type="text" 
                                    className="w-full pl-9 pr-3 py-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    placeholder="Ex: Av. Corifeu de Azevedo Marques, 1000"
                                    value={newStudentData.address}
                                    onChange={e => setNewStudentData({...newStudentData, address: e.target.value})}
                                />
                             </div>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-bold text-gray-900 mb-1">Bairro</label>
                             <input 
                                type="text" 
                                className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                placeholder="Ex: Butantã"
                                value={newStudentData.neighborhood}
                                onChange={e => setNewStudentData({...newStudentData, neighborhood: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* GUARDIAN SECTION (CONDITIONAL) */}
                    {isMinor && (
                        <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mt-4">
                            <h4 className="font-bold text-orange-900 mb-3 flex items-center">
                                <Users size={18} className="mr-2"/> Dados do Responsável (Obrigatório)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-900 mb-1">Nome Completo do Responsável <span className="text-red-600">*</span></label>
                                    <input 
                                        type="text" required={isMinor}
                                        className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 font-medium"
                                        value={newStudentData.guardianName}
                                        onChange={e => setNewStudentData({...newStudentData, guardianName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-1">CPF do Responsável <span className="text-red-600">*</span></label>
                                    <input 
                                        type="text" required={isMinor}
                                        className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 font-medium"
                                        value={newStudentData.guardianCpf}
                                        onChange={e => setNewStudentData({...newStudentData, guardianCpf: applyCPFMask(e.target.value)})}
                                        maxLength={14}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-1">Celular do Responsável <span className="text-red-600">*</span></label>
                                    <input 
                                        type="text" required={isMinor}
                                        className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 font-medium"
                                        value={newStudentData.guardianPhone}
                                        onChange={e => setNewStudentData({...newStudentData, guardianPhone: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-900 mb-1">E-mail do Responsável <span className="text-red-600">*</span></label>
                                    <input 
                                        type="email" required={isMinor}
                                        className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 font-medium"
                                        value={newStudentData.guardianEmail}
                                        onChange={e => setNewStudentData({...newStudentData, guardianEmail: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsAddStudentModalOpen(false)}
                            className="px-4 py-2 border border-gray-400 rounded-lg text-gray-900 font-medium hover:bg-gray-100"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-sm font-bold"
                        >
                            <UserPlus size={18} className="mr-2" /> {isEditing ? 'Salvar Alterações' : 'Salvar Cadastro'}
                        </button>
                    </div>
                </form>
            </div>
         </div>
      )}

      {/* WAITLIST ALERT MODAL */}
      {waitlistAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-0 overflow-hidden animate-fade-in border-l-8 border-orange-500">
                  <div className="bg-orange-500 p-4 text-white flex justify-between items-center">
                      <h3 className="text-xl font-bold flex items-center">
                          <AlertOctagon size={24} className="mr-2" /> VAGA LIBERADA!
                      </h3>
                      <button onClick={() => setWaitlistAlert(null)} className="text-orange-100 hover:text-white">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-6">
                      <p className="text-gray-900 font-bold text-lg mb-4">
                          Uma vaga surgiu na turma <span className="text-blue-600">{waitlistAlert.className}</span>.
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                          <p className="text-sm text-gray-600 font-bold uppercase mb-2">Próximo da Lista:</p>
                          <p className="text-2xl font-bold text-gray-900 mb-1">{waitlistAlert.student.name}</p>
                          <div className="space-y-1 text-sm text-gray-800">
                              <p className="flex items-center"><Phone size={14} className="mr-2 text-gray-500"/> {waitlistAlert.student.phone || waitlistAlert.student.cellphone}</p>
                              <p className="flex items-center"><Mail size={14} className="mr-2 text-gray-500"/> {waitlistAlert.student.email}</p>
                              {waitlistAlert.student.guardianPhone && (
                                <p className="text-xs text-orange-800 font-bold mt-2">Responsável: {waitlistAlert.student.guardianPhone}</p>
                              )}
                          </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-4 font-medium">
                          Entre em contato imediatamente com o aluno para confirmar o interesse na vaga.
                      </p>
                      <button 
                          onClick={() => setWaitlistAlert(null)}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors flex items-center justify-center"
                      >
                          <PhoneCall size={18} className="mr-2" /> Entendido, vou contatar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );

  const renderClasses = () => {
      // Filter and Sort Classes
      const sortedAndFilteredClasses = classes
        .filter(c => 
            c.title.toLowerCase().includes(classFilter.toLowerCase()) || 
            c.modality.toLowerCase().includes(classFilter.toLowerCase())
        )
        .sort((a, b) => a.title.localeCompare(b.title));

      return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center">
                    <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-600 hover:text-blue-600">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Grade Completa de Turmas</h2>
                </div>
                
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Filtrar por Atividade ou Modalidade..." 
                        className="pl-10 pr-4 py-2 border border-gray-400 rounded-full focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-sm bg-white text-gray-900 placeholder-gray-500 font-medium"
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-black">
                        <thead className="text-xs text-gray-900 uppercase bg-gray-100 font-bold">
                            <tr>
                                <th className="px-6 py-4">Turma / Atividade</th>
                                <th className="px-6 py-4">Analista</th>
                                <th className="px-6 py-4">Horário</th>
                                <th className="px-6 py-4">Faixa Etária</th>
                                <th className="px-6 py-4 text-center">Ocupação</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredClasses.map((cls) => {
                                const percent = Math.round((cls.enrolledCount / cls.capacity) * 100);
                                return (
                                    <tr key={cls.id} className="bg-white border-b hover:bg-gray-50 border-gray-200">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{cls.title}</div>
                                            <div className="text-xs text-blue-800 font-semibold">{cls.modality}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{cls.analystName}</td>
                                        <td className="px-6 py-4 font-medium">
                                            <div className="flex items-center"><Calendar size={14} className="mr-1 text-gray-600"/> {cls.days.join('/')}</div>
                                            <div className="flex items-center mt-1"><Clock size={14} className="mr-1 text-gray-600"/> {cls.time}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{cls.minAge} a {cls.maxAge} anos</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center">
                                                <div className="w-24 bg-gray-300 rounded-full h-2.5 mr-2">
                                                    <div 
                                                        className={`h-2.5 rounded-full ${percent >= 100 ? 'bg-red-600' : 'bg-green-600'}`} 
                                                        style={{ width: `${Math.min(100, percent)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-900">{cls.enrolledCount}/{cls.capacity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => openClassManagement(cls.id)}
                                                className="text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 px-3 py-1 rounded text-xs font-bold transition-colors"
                                            >
                                                Gerenciar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {sortedAndFilteredClasses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">Nenhuma turma encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  };

  const renderVacancies = () => {
    // Filter only classes with available spots
    const availableClasses = classes.filter(c => c.enrolledCount < c.capacity);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center">
                <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-600 hover:text-blue-600">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <CheckCircle className="mr-3 text-green-600" /> Quadro de Vagas Disponíveis
                </h2>
            </div>

            {availableClasses.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-lg border border-dashed text-gray-600 border-gray-300">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-bold text-gray-900">Todas as turmas estão cheias no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableClasses.map(cls => {
                        const spotsLeft = cls.capacity - cls.enrolledCount;
                        return (
                            <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    {spotsLeft} VAGAS
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{cls.title}</h3>
                                <p className="text-blue-800 text-sm font-bold mb-4">{cls.modality}</p>
                                
                                <div className="space-y-2 text-sm text-gray-800 font-medium mb-6">
                                    <div className="flex items-center">
                                        <Calendar size={16} className="mr-2 text-gray-600" /> {cls.days.join('/')}
                                    </div>
                                    <div className="flex items-center">
                                        <Clock size={16} className="mr-2 text-gray-600" /> {cls.time}
                                    </div>
                                    <div className="flex items-center">
                                        <Users size={16} className="mr-2 text-gray-600" /> {cls.minAge} a {cls.maxAge} anos
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin size={16} className="mr-2 text-gray-600" /> {cls.location}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => openClassManagement(cls.id)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <UserPlus size={18} className="mr-2" /> Matricular
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
  };

  const renderWaitlistPanel = () => {
    // Show details for a specific class
    if (viewingWaitlistClassId) {
        const activeClass = classes.find(c => c.id === viewingWaitlistClassId);
        if (!activeClass) return <div>Turma não encontrada</div>;

        const waitlist = enrollments
            .filter(e => e.classId === viewingWaitlistClassId && e.status === EnrollmentStatus.WAITING_LIST)
            .map(enr => users.find(u => u.id === enr.studentId))
            .filter(u => u !== undefined) as User[];

        return (
             <div className="space-y-6 animate-fade-in">
                <div className="flex items-center">
                    <button onClick={() => setViewingWaitlistClassId(null)} className="mr-4 text-gray-600 hover:text-orange-600">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Fila de Espera: {activeClass.title}</h2>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
                    <div className="p-4 bg-orange-50 border-b border-orange-200">
                        <p className="text-orange-800 font-bold text-sm">Ordem de Prioridade (Contato)</p>
                    </div>
                    <div className="overflow-x-auto">
                         <table className="w-full text-sm text-left text-black">
                            <thead className="text-xs text-gray-900 uppercase bg-gray-50 font-bold">
                                <tr>
                                    <th className="px-6 py-4">Posição</th>
                                    <th className="px-6 py-4">Nome do Aluno</th>
                                    <th className="px-6 py-4">Telefones</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4 text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {waitlist.map((student, index) => (
                                    <tr key={student.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-6 py-4 font-bold text-orange-600 text-lg">#{index + 1}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{student.name}</td>
                                        <td className="px-6 py-4 text-gray-800 font-medium">
                                            {student.cellphone} {student.phone && `/ ${student.phone}`}
                                            {student.guardianPhone && <div className="text-xs text-gray-500 mt-1">Resp: {student.guardianPhone}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 font-medium">{student.email}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="text-blue-600 hover:text-blue-800 font-bold text-xs border border-blue-200 px-3 py-1 rounded bg-blue-50">
                                                Contatar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {waitlist.length === 0 && (
                                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">Ninguém na fila.</td></tr>
                                )}
                            </tbody>
                         </table>
                    </div>
                </div>
             </div>
        );
    }

    // List all classes with waitlist
    const classesWithWaitlist = classes.filter(c => c.waitingListCount > 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center">
                <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-600 hover:text-blue-600">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <AlertTriangle className="mr-3 text-orange-600" /> Gestão de Fila de Espera
                </h2>
            </div>

            {classesWithWaitlist.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-lg border border-dashed text-gray-600 border-gray-300">
                    <CheckCircle size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                    <p className="text-lg font-bold text-gray-900">Ótimo! Nenhuma turma com fila de espera no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classesWithWaitlist.map(cls => (
                        <div 
                            key={cls.id} 
                            onClick={() => setViewingWaitlistClassId(cls.id)}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center cursor-pointer hover:shadow-md hover:border-orange-300 transition-all"
                        >
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{cls.title}</h3>
                                <p className="text-sm text-gray-600 font-medium">{cls.days.join('/')} • {cls.time}</p>
                                <p className="text-xs text-blue-600 font-bold mt-1 uppercase">{cls.modality}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-center bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                                    <span className="block text-xl font-bold text-orange-600">{cls.waitingListCount}</span>
                                    <span className="text-xs text-orange-800 font-bold uppercase">Na Fila</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div>
      {currentView === 'MENU' && renderMenu()}
      {currentView === 'STUDENTS' && renderStudents()}
      {currentView === 'CLASSES' && renderClasses()}
      {currentView === 'VACANCIES' && renderVacancies()}
      {currentView === 'WAITLIST' && renderWaitlistPanel()}
      {currentView === 'CLASS_DETAILS' && renderClassDetails()}
    </div>
  );
};

export default SecretaryDashboard;