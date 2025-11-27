import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, EnrollmentStatus, User } from '../types';
import { Search, UserPlus, XCircle, List, UserCheck, FileSpreadsheet, LayoutGrid, Users, CheckCircle, ArrowLeft, Calendar, MapPin, Clock, Plus, X, Smartphone, Phone, Mail, FileText, Home, AlertTriangle, AlertOctagon, PhoneCall, Trash2, Edit, CheckSquare, XSquare, AlertCircle } from 'lucide-react';

type SecretaryView = 'MENU' | 'STUDENTS' | 'CLASSES' | 'VACANCIES' | 'WAITLIST' | 'CLASS_DETAILS';

const SecretaryDashboard: React.FC = () => {
  const { users, classes, enrollments, enrollStudent, cancelEnrollment, addUser } = useApp();
  
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

  // State for Adding Student
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
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
            // Activate the Popup Alert
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

  const handleAddStudent = (e: React.FormEvent) => {
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

    if (isMinor && (!newStudentData.guardianName || !newStudentData.guardianCpf)) {
         alert("Dados do responsável são obrigatórios para menores.");
         return;
    }

    const [day, month, year] = newStudentData.birthDate.split('/');
    const isoBirthDate = `${year}-${month}-${day}`;

    const newUser: User = {
        id: `u_${Date.now()}`,
        name: newStudentData.name!,
        email: newStudentData.email || `aluno.${Date.now()}@ceusistema.com.br`,
        role: UserRole.STUDENT,
        cpf: newStudentData.cpf,
        birthDate: isoBirthDate,
        phone: newStudentData.phone,
        cellphone: newStudentData.cellphone,
        address: newStudentData.address,
        neighborhood: newStudentData.neighborhood,
        guardianName: isMinor ? newStudentData.guardianName : undefined,
        guardianCpf: isMinor ? newStudentData.guardianCpf : undefined,
        guardianPhone: isMinor ? newStudentData.guardianPhone : undefined,
        guardianEmail: isMinor ? newStudentData.guardianEmail : undefined,
        password: '123456'
    };

    addUser(newUser);
    setIsAddStudentModalOpen(false);
    setNewStudentData({
        name: '', email: '', cpf: '', birthDate: '', phone: '', cellphone: '', 
        address: '', neighborhood: '', guardianName: '', guardianCpf: '', guardianEmail: '', guardianPhone: ''
    });
    setFeedback({ type: 'success', msg: 'Aluno cadastrado com sucesso.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const renderClassManagement = () => {
    if (!viewingClassManagementId) return null;
    const activeClass = classes.find(c => c.id === viewingClassManagementId);
    if (!activeClass) return null;

    const classEnrollments = enrollments.filter(e => e.classId === activeClass.id);
    const confirmedEnrollments = classEnrollments.filter(e => e.status === EnrollmentStatus.CONFIRMED);
    const waitlistEnrollments = classEnrollments.filter(e => e.status === EnrollmentStatus.WAITING_LIST);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <button 
                    onClick={() => setCurrentView('CLASSES')}
                    className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-1" /> Voltar para Turmas
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{activeClass.title}</h2>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                             <span className="flex items-center"><Clock size={16} className="mr-1"/> {activeClass.days.join('/')} • {activeClass.time}</span>
                             <span className="flex items-center"><MapPin size={16} className="mr-1"/> {activeClass.location}</span>
                             <span className="flex items-center"><Users size={16} className="mr-1"/> {confirmedEnrollments.length} / {activeClass.capacity}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">{activeClass.capacity - activeClass.enrolledCount}</div>
                        <div className="text-xs uppercase font-bold text-gray-500">Vagas Restantes</div>
                    </div>
                </div>

                {/* Add Student Section */}
                <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                        <UserPlus size={18} className="mr-2"/> Matrícula Rápida
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar aluno para matricular (Nome ou CPF)..." 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                            value={studentSearchForClass}
                            onChange={(e) => setStudentSearchForClass(e.target.value)}
                        />
                        {studentSearchForClass.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg rounded-lg mt-1 z-10 max-h-60 overflow-y-auto">
                                {studentsForClassSearch.length === 0 ? (
                                    <div className="p-3 text-gray-500 text-sm">Nenhum aluno encontrado.</div>
                                ) : (
                                    studentsForClassSearch.map(student => (
                                        <div key={student.id} className="p-3 hover:bg-gray-50 flex justify-between items-center border-b last:border-0">
                                            <div>
                                                <div className="font-bold text-gray-900">{student.name}</div>
                                                <div className="text-xs text-gray-500">CPF: {student.cpf}</div>
                                            </div>
                                            <button 
                                                onClick={() => handleEnrollInClass(student.id)}
                                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-bold"
                                            >
                                                Matricular
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Lists Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Confirmed List */}
                    <div>
                        <h3 className="font-bold text-green-700 mb-3 flex items-center bg-green-50 p-2 rounded">
                            <CheckCircle size={18} className="mr-2"/> Matriculados ({confirmedEnrollments.length})
                        </h3>
                        <div className="border rounded-lg overflow-hidden">
                            {confirmedEnrollments.length === 0 ? (
                                <div className="p-4 text-gray-500 text-center text-sm">Nenhum aluno matriculado.</div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {confirmedEnrollments.map(enr => (
                                        <li key={enr.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                                            <span className="text-gray-900 font-medium text-sm">{enr.studentName}</span>
                                            <button 
                                                onClick={() => handleCancelEnrollment(enr.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Cancelar Matrícula"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Waitlist */}
                    <div>
                        <h3 className="font-bold text-orange-700 mb-3 flex items-center bg-orange-50 p-2 rounded">
                            <Clock size={18} className="mr-2"/> Fila de Espera ({waitlistEnrollments.length})
                        </h3>
                        <div className="border rounded-lg overflow-hidden">
                            {waitlistEnrollments.length === 0 ? (
                                <div className="p-4 text-gray-500 text-center text-sm">Fila vazia.</div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {waitlistEnrollments.map((enr, idx) => (
                                        <li key={enr.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                                            <div className="flex items-center">
                                                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded mr-2">#{idx + 1}</span>
                                                <span className="text-gray-900 font-medium text-sm">{enr.studentName}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleCancelEnrollment(enr.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Remover da Fila"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-800">Painel da Secretaria</h2>
      </div>

      {feedback && (
         <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl font-bold text-white flex items-center animate-fade-in ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
             {feedback.type === 'success' ? <CheckCircle size={20} className="mr-2"/> : <AlertCircle size={20} className="mr-2"/>}
             {feedback.msg}
         </div>
      )}

      {/* Waitlist Alert Modal */}
      {waitlistAlert && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-l-4 border-green-500 animate-fade-in">
                 <div className="flex items-center mb-4 text-green-600">
                     <AlertOctagon size={32} className="mr-3" />
                     <h3 className="text-xl font-bold text-gray-900">Vaga Liberada!</h3>
                 </div>
                 <p className="text-gray-700 mb-4">
                     Uma vaga surgiu na turma <strong>{waitlistAlert.className}</strong>.
                 </p>
                 <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                     <p className="text-sm font-bold text-gray-500 uppercase mb-2">Próximo da Fila:</p>
                     <p className="text-lg font-bold text-gray-900">{waitlistAlert.student.name}</p>
                     <p className="text-sm text-gray-700 flex items-center mt-1"><Phone size={14} className="mr-1"/> {waitlistAlert.student.cellphone}</p>
                     <p className="text-sm text-gray-700 flex items-center mt-1"><Mail size={14} className="mr-1"/> {waitlistAlert.student.email}</p>
                 </div>
                 <button 
                    onClick={() => setWaitlistAlert(null)}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700"
                 >
                     Entendido (Contatar Aluno)
                 </button>
             </div>
         </div>
      )}

      {currentView === 'MENU' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button onClick={() => setCurrentView('STUDENTS')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left flex items-start group">
                <div className="bg-blue-50 p-3 rounded-lg mr-4 group-hover:bg-blue-100 transition-colors">
                    <Users className="text-blue-600" size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">Alunos</h3>
                    <p className="text-gray-500 text-sm mt-1">Cadastrar, editar e pesquisar alunos.</p>
                </div>
            </button>

            <button onClick={() => setCurrentView('CLASSES')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left flex items-start group">
                <div className="bg-green-50 p-3 rounded-lg mr-4 group-hover:bg-green-100 transition-colors">
                    <List className="text-green-600" size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">Turmas & Matrículas</h3>
                    <p className="text-gray-500 text-sm mt-1">Gerenciar turmas, vagas e frequências.</p>
                </div>
            </button>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Estatísticas Rápidas</h3>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total de Alunos</span>
                        <span className="font-bold text-gray-900">{totalStudents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Turmas Ativas</span>
                        <span className="font-bold text-gray-900">{activeClassesCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Vagas Disponíveis</span>
                        <span className="font-bold text-green-600">{totalVacancies}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fila de Espera</span>
                        <span className="font-bold text-orange-600">{totalWaitlist}</span>
                    </div>
                </div>
            </div>
        </div>
      )}

      {currentView === 'STUDENTS' && (
          <div>
              <div className="flex items-center mb-6">
                  <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-500 hover:text-gray-900"><ArrowLeft size={24}/></button>
                  <h3 className="text-xl font-bold text-gray-900">Gestão de Alunos</h3>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                      <input 
                        type="text" 
                        placeholder="Buscar por nome ou CPF..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <button 
                    onClick={() => setIsAddStudentModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center"
                  >
                      <UserPlus size={20} className="mr-2" /> Novo Aluno
                  </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-700 text-sm uppercase font-bold">
                          <tr>
                              <th className="p-4 border-b">Nome</th>
                              <th className="p-4 border-b">CPF</th>
                              <th className="p-4 border-b">Idade</th>
                              <th className="p-4 border-b">Contato</th>
                              <th className="p-4 border-b text-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {students.map(student => (
                              <tr key={student.id} className="hover:bg-gray-50">
                                  <td className="p-4 font-bold text-gray-900">{student.name}</td>
                                  <td className="p-4 text-gray-600">{student.cpf}</td>
                                  <td className="p-4 text-gray-600">{student.birthDate ? calculateAge(student.birthDate) : '-'} anos</td>
                                  <td className="p-4 text-gray-600 text-sm">
                                      <div>{student.cellphone}</div>
                                      <div className="text-xs text-gray-400">{student.email}</div>
                                  </td>
                                  <td className="p-4 text-right">
                                      <button className="text-blue-600 font-bold text-sm hover:underline">Ver Detalhes</button>
                                  </td>
                              </tr>
                          ))}
                          {students.length === 0 && (
                              <tr>
                                  <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum aluno encontrado.</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {currentView === 'CLASSES' && (
          <div>
              <div className="flex items-center mb-6">
                  <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-500 hover:text-gray-900"><ArrowLeft size={24}/></button>
                  <h3 className="text-xl font-bold text-gray-900">Gestão de Turmas</h3>
              </div>
              
              <div className="mb-6 relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Filtrar turmas..." 
                    className="w-full md:w-96 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                  />
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes
                    .filter(c => c.title.toLowerCase().includes(classFilter.toLowerCase()))
                    .map(cls => (
                      <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all flex flex-col">
                          <div className="p-5 flex-1">
                              <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-bold text-lg text-gray-900">{cls.title}</h4>
                                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">{cls.modality}</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-600 mb-4">
                                  <div className="flex items-center"><Clock size={14} className="mr-2"/> {cls.days.join('/')} • {cls.time}</div>
                                  <div className="flex items-center"><MapPin size={14} className="mr-2"/> {cls.location}</div>
                                  <div className="flex items-center"><UserCheck size={14} className="mr-2"/> {cls.analystName}</div>
                              </div>
                              <div className="flex justify-between items-center text-sm font-medium pt-4 border-t border-gray-100">
                                  <span className={`${cls.enrolledCount >= cls.capacity ? 'text-red-600' : 'text-green-600'}`}>
                                      {cls.enrolledCount} / {cls.capacity} Matriculados
                                  </span>
                                  {cls.waitingListCount > 0 && (
                                      <span className="text-orange-600 flex items-center"><Clock size={14} className="mr-1"/> +{cls.waitingListCount} Fila</span>
                                  )}
                              </div>
                          </div>
                          <button 
                            onClick={() => openClassManagement(cls.id)}
                            className="bg-gray-50 hover:bg-blue-50 text-blue-700 font-bold py-3 w-full border-t border-gray-200 transition-colors"
                          >
                              Gerenciar Turma
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {currentView === 'CLASS_DETAILS' && renderClassManagement()}

      {/* Add Student Modal */}
      {isAddStudentModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh] animate-fade-in">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-gray-900">Novo Cadastro de Aluno</h3>
                     <button onClick={() => setIsAddStudentModalOpen(false)}><X size={24} className="text-gray-500"/></button>
                 </div>
                 <form onSubmit={handleAddStudent} className="space-y-4">
                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                         <input 
                            required 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                            value={newStudentData.name || ''}
                            onChange={e => setNewStudentData({...newStudentData, name: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">CPF</label>
                         <input 
                             required 
                             type="text" 
                             className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                             placeholder="000.000.000-00"
                             value={newStudentData.cpf || ''}
                             onChange={e => setNewStudentData({...newStudentData, cpf: applyCPFMask(e.target.value)})}
                             maxLength={14}
                         />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Data de Nascimento</label>
                            <input 
                                required 
                                type="text" 
                                placeholder="DD/MM/AAAA"
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                value={newStudentData.birthDate || ''}
                                onChange={handleBirthDateChange}
                                maxLength={10}
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">Celular</label>
                             <input 
                                required 
                                type="text" 
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                value={newStudentData.cellphone || ''}
                                onChange={e => setNewStudentData({...newStudentData, cellphone: e.target.value})}
                             />
                        </div>
                     </div>
                     
                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">E-mail (Opcional)</label>
                         <input 
                            type="email" 
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                            value={newStudentData.email || ''}
                            onChange={e => setNewStudentData({...newStudentData, email: e.target.value})}
                         />
                     </div>

                     <div className="grid grid-cols-1 gap-4">
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">Endereço</label>
                             <input 
                                type="text" 
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                placeholder="Logradouro, Número"
                                value={newStudentData.address || ''}
                                onChange={e => setNewStudentData({...newStudentData, address: e.target.value})}
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">Bairro</label>
                             <input 
                                type="text" 
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                placeholder="Bairro"
                                value={newStudentData.neighborhood || ''}
                                onChange={e => setNewStudentData({...newStudentData, neighborhood: e.target.value})}
                             />
                         </div>
                     </div>

                     {isMinor && (
                         <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-2">
                             <h4 className="font-bold text-orange-800 mb-2 text-sm flex items-center">
                                 <AlertCircle size={16} className="mr-2"/> Responsável Obrigatório
                             </h4>
                             <div className="space-y-3">
                                 <div>
                                     <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Responsável</label>
                                     <input 
                                        required 
                                        type="text" 
                                        className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 text-sm"
                                        value={newStudentData.guardianName || ''}
                                        onChange={e => setNewStudentData({...newStudentData, guardianName: e.target.value})}
                                     />
                                 </div>
                                 <div className="grid grid-cols-2 gap-2">
                                     <div>
                                         <label className="block text-xs font-bold text-gray-700 mb-1">CPF Resp.</label>
                                         <input 
                                            required 
                                            type="text" 
                                            className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 text-sm"
                                            value={newStudentData.guardianCpf || ''}
                                            onChange={e => setNewStudentData({...newStudentData, guardianCpf: applyCPFMask(e.target.value)})}
                                            maxLength={14}
                                         />
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-gray-700 mb-1">Tel. Resp.</label>
                                         <input 
                                            required 
                                            type="text" 
                                            className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 text-sm"
                                            value={newStudentData.guardianPhone || ''}
                                            onChange={e => setNewStudentData({...newStudentData, guardianPhone: e.target.value})}
                                         />
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}

                     <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 mt-4 shadow-md">
                         Cadastrar Aluno
                     </button>
                 </form>
             </div>
         </div>
      )}
    </div>
  );
};

export default SecretaryDashboard;