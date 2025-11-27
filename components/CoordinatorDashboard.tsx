
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, AlertTriangle, ClipboardCheck, Calendar, Search, ArrowRight, CheckCircle, XCircle, Clock, PlusSquare, Eye, ArrowLeft, Mail, Phone, FileText, LayoutGrid, ListOrdered, ChevronRight, BarChart2, Bell, GraduationCap, Briefcase, UserCog, Save, X, Plus, Smartphone, Home, ShieldCheck, Activity, LayoutTemplate, AlertOctagon, Trash2, MapPin } from 'lucide-react';
import { RequestStatus, RequestType, EnrollmentStatus, UserRole, User, SportClass } from '../types';
import { LOCATIONS } from '../constants';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

type DashboardView = 'MENU' | 'OVERVIEW' | 'WAITLIST' | 'MODALITIES' | 'AUDIT' | 'REQUESTS' | 'MANAGE_STUDENTS' | 'MANAGE_STAFF' | 'USER_AUDIT' | 'SPACE_MANAGEMENT';

const CoordinatorDashboard: React.FC = () => {
  const { classes, enrollments, attendance, users, updateRequests, resolveUpdateRequest, updateUser, addUser, deleteUser, auditLogs, notifications, markNotificationAsRead, currentUser } = useApp();
  
  // Persist Current View in Local Storage
  const [currentView, setCurrentView] = useState<DashboardView>(() => {
    return (localStorage.getItem('coord_dashboard_view') as DashboardView) || 'MENU';
  });

  useEffect(() => {
    localStorage.setItem('coord_dashboard_view', currentView);
  }, [currentView]);
  
  // State for Class Detail View (Shared across views)
  const [viewingClassId, setViewingClassId] = useState<string | null>(null);
  const [viewingWaitlistClassId, setViewingWaitlistClassId] = useState<string | null>(null);
  
  // State for Modality View
  const [selectedModality, setSelectedModality] = useState<string | null>(null);

  // State for Space Management
  const [selectedDayForSpaces, setSelectedDayForSpaces] = useState<string>('Seg');

  // State for User Management
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.STUDENT);
  const [isMinor, setIsMinor] = useState(false);
  
  // State for Audit Logs
  const [auditSearch, setAuditSearch] = useState('');
  
  // State for Notifications
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [newUserData, setNewUserData] = useState<Partial<User>>({
      name: '',
      email: '',
      cpf: '',
      birthDate: '',
      ref: '',
      phone: '',
      cellphone: '',
      address: '',
      neighborhood: '',
      guardianName: '',
      guardianCpf: '',
      guardianEmail: '',
      guardianPhone: ''
  });

  // Stats Logic
  const totalSpots = classes.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalEnrolled = enrollments.filter(e => e.status === EnrollmentStatus.CONFIRMED).length; 
  const occupancyRate = totalSpots > 0 ? Math.round((totalEnrolled / totalSpots) * 100) : 0;
  
  const waitlistTotal = classes.reduce((acc, curr) => acc + curr.waitingListCount, 0);
  const pendingRequests = updateRequests.filter(r => r.status === RequestStatus.PENDING);
  const totalStaff = users.filter(u => u.role !== UserRole.STUDENT).length;

  // Notification Logic
  const myNotifications = notifications.filter(n => n.recipientId === currentUser?.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = myNotifications.filter(n => !n.read).length;

  // Data for Charts
  const modalityData = classes.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.modality);
    if (existing) {
      existing.students += curr.enrolledCount;
    } else {
      acc.push({ name: curr.modality, students: curr.enrolledCount });
    }
    return acc;
  }, [] as {name: string, students: number}[]);

  const occupancyData = classes.map(c => ({
    name: c.title.split(' ')[0], // Short name
    Vagas: c.capacity,
    Matriculados: c.enrolledCount
  })).slice(0, 10); // Limit for chart readability

  // --- Attendance Audit Logic ---
  const [selectedAnalystId, setSelectedAnalystId] = useState<string>('');
  
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

  // --- REF MASK HELPER ---
  const applyRefMask = (value: string) => {
    let v = value.replace(/\D/g, ""); // Remove invalid chars
    v = v.slice(0, 8); // Limit length
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{1})(\d{1})$/, "$1/$2");
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
      setNewUserData({...newUserData, birthDate: dateVal});
      
      if (dateVal.length === 10) {
          const age = calculateAgeFromBrDate(dateVal);
          setIsMinor(age < 18);
      } else {
          setIsMinor(false);
      }
  };

  // Open modal for editing a user
  const openEditUserModal = (user: User) => {
      setEditingUser(user);
      setNewUserRole(user.role);
      
      // Convert stored ISO date (yyyy-mm-dd) to BR date (dd/mm/yyyy) for the input
      let brBirthDate = '';
      if (user.birthDate) {
          const [year, month, day] = user.birthDate.split('-');
          brBirthDate = `${day}/${month}/${year}`;
      }

      setNewUserData({
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          ref: user.ref,
          birthDate: brBirthDate,
          phone: user.phone,
          cellphone: user.cellphone,
          address: user.address,
          neighborhood: user.neighborhood,
          guardianName: user.guardianName,
          guardianCpf: user.guardianCpf,
          guardianPhone: user.guardianPhone,
          guardianEmail: user.guardianEmail
      });

      if (user.birthDate) {
          const age = calculateAge(user.birthDate);
          setIsMinor(age < 18);
      } else {
          setIsMinor(false);
      }

      setIsAddUserModalOpen(true);
  };

  // Open modal for creating a new user
  const openCreateUserModal = (role: UserRole) => {
      setEditingUser(null);
      setNewUserRole(role);
      setNewUserData({
          name: '', email: '', cpf: '', birthDate: '', ref: '', 
          phone: '', cellphone: '', address: '', neighborhood: '', 
          guardianName: '', guardianCpf: '', guardianEmail: '', guardianPhone: ''
      });
      setIsMinor(false);
      setIsAddUserModalOpen(true);
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validação Específica por Cargo
      if (newUserRole === UserRole.STUDENT) {
        if (!newUserData.cpf || !newUserData.birthDate) {
            alert('CPF e Data de Nascimento são obrigatórios para alunos.');
            return;
        }
        if (newUserData.birthDate.length !== 10) {
            alert('Data de nascimento inválida. Use o formato DD/MM/AAAA.');
            return;
        }
        if (isMinor) {
            if (!newUserData.guardianName || !newUserData.guardianCpf) {
                alert('Dados do responsável são obrigatórios para menores.');
                return;
            }
        }
      } else {
        // Validação REF para não-alunos
        if (!newUserData.ref) {
            alert('REF é obrigatório para cargos administrativos.');
            return;
        }
        if (newUserData.ref.length < 11) {
            alert('REF inválido. O formato deve ser 000.000.0/0');
            return;
        }
      }

      // Prepare date conversion if present (BR -> ISO)
      let isoBirthDate = newUserData.birthDate;
      if (newUserData.birthDate && newUserData.birthDate.includes('/')) {
         const [day, month, year] = newUserData.birthDate.split('/');
         isoBirthDate = `${year}-${month}-${day}`;
      }

      if (editingUser) {
          // UPDATE EXISTING USER
          const updatedUser: User = {
              ...editingUser,
              name: newUserData.name!,
              email: newUserData.email!,
              // Password is NOT updated here to avoid reset, handled in profile
              cpf: newUserData.cpf,
              ref: newUserData.ref,
              birthDate: isoBirthDate,
              phone: newUserData.phone,
              cellphone: newUserData.cellphone,
              address: newUserData.address,
              neighborhood: newUserData.neighborhood,
              role: newUserRole, // Allow role change if needed
              guardianName: isMinor ? newUserData.guardianName : undefined,
              guardianCpf: isMinor ? newUserData.guardianCpf : undefined,
              guardianPhone: isMinor ? newUserData.guardianPhone : undefined,
              guardianEmail: isMinor ? newUserData.guardianEmail : undefined
          };
          updateUser(updatedUser);
          alert('Dados do usuário atualizados com sucesso!');
      } else {
          // CREATE NEW USER
          const newUser: User = {
              id: `u_${Date.now()}`,
              role: newUserRole,
              name: newUserData.name!,
              email: newUserData.email || `user.${Date.now()}@ceusistema.com.br`,
              password: '123456', // Default password
              cpf: newUserData.cpf,
              ref: newUserData.ref,
              birthDate: isoBirthDate,
              phone: newUserData.phone,
              cellphone: newUserData.cellphone,
              address: newUserData.address,
              neighborhood: newUserData.neighborhood,
              guardianName: isMinor ? newUserData.guardianName : undefined,
              guardianCpf: isMinor ? newUserData.guardianCpf : undefined,
              guardianPhone: isMinor ? newUserData.guardianPhone : undefined,
              guardianEmail: isMinor ? newUserData.guardianEmail : undefined
          };
          addUser(newUser);
          alert('Usuário cadastrado com sucesso!');
      }
      
      setIsAddUserModalOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
        deleteUser(userId);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center">
            <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-600 hover:text-blue-600">
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Visão Geral Detalhada</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Alunos por Modalidade</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={modalityData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="students"
                                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {modalityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Ocupação por Turma (Top 10)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={occupancyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Matriculados" fill="#8884d8" />
                            <Bar dataKey="Vagas" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center">
            <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-600 hover:text-blue-600">
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Solicitações Pendentes</h2>
        </div>

        {pendingRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-lg border border-dashed border-gray-300">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-lg font-bold text-gray-900">Tudo em dia! Nenhuma solicitação pendente.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {pendingRequests.map(req => (
                    <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-400">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">
                                    {req.requestType === RequestType.CREATE && 'Solicitação de Criação de Turma'}
                                    {req.requestType === RequestType.UPDATE && 'Solicitação de Alteração de Turma'}
                                    {req.requestType === RequestType.ENROLLMENT_OVERRIDE && 'Solicitação de Vaga Extra (4ª Atividade)'}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">Solicitado por: <strong>{req.analystName}</strong> em {new Date(req.createdAt).toLocaleDateString()}</p>
                                
                                <div className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-200">
                                    <p><strong>Turma:</strong> {req.classTitle}</p>
                                    {req.requestType === RequestType.ENROLLMENT_OVERRIDE ? (
                                        <p className="mt-1">
                                            <strong>Aluno:</strong> {req.studentName} <br/>
                                            <span className="text-orange-600 font-bold">Motivo: Excedeu limite de 3 atividades.</span>
                                        </p>
                                    ) : (
                                        <div className="mt-2">
                                            <strong>Alterações propostas:</strong>
                                            <ul className="list-disc list-inside mt-1">
                                                {Object.entries(req.requestedChanges).map(([key, value]) => (
                                                    <li key={key}>
                                                        <span className="capitalize">{key}:</span> {Array.isArray(value) ? value.join(', ') : value ? value.toString() : '-'}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => resolveUpdateRequest(req.id, true)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center"
                                >
                                    <CheckCircle size={16} className="mr-2" /> Aprovar
                                </button>
                                <button 
                                    onClick={() => resolveUpdateRequest(req.id, false)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center"
                                >
                                    <XCircle size={16} className="mr-2" /> Rejeitar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  const renderAudit = () => {
    const filteredLogs = auditLogs.filter(log => 
        log.details.toLowerCase().includes(auditSearch.toLowerCase()) || 
        log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearch.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-600 hover:text-blue-600">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Gestão de Registros (Auditoria)</h2>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar logs..." 
                        className="pl-10 pr-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm bg-white text-gray-900"
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                    />
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-900 font-bold uppercase">
                        <tr>
                            <th className="px-6 py-3">Data/Hora</th>
                            <th className="px-6 py-3">Usuário</th>
                            <th className="px-6 py-3">Ação</th>
                            <th className="px-6 py-3">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-3 font-medium text-gray-900">
                                    {log.userName} <br/>
                                    <span className="text-xs text-gray-500">{log.userRole}</span>
                                </td>
                                <td className="px-6 py-3 font-bold text-blue-600">{log.action}</td>
                                <td className="px-6 py-3 text-gray-700">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredLogs.length === 0 && <p className="text-center p-8 text-gray-500">Nenhum registro encontrado.</p>}
             </div>
        </div>
    );
  };

  const renderManageStaff = () => {
    const staffMembers = users.filter(u => u.role !== UserRole.STUDENT && (
        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    ));

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-600 hover:text-blue-600">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Gestão de Equipe</h2>
                </div>
                <div className="flex gap-4">
                     <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome, email..." 
                            className="pl-10 pr-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm bg-white text-gray-900"
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => openCreateUserModal(UserRole.ANALYST)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center shadow-sm"
                    >
                        <Plus size={18} className="mr-2" /> Adicionar Novo
                    </button>
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-900 font-bold uppercase">
                        <tr>
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Telefone</th>
                            <th className="px-6 py-3">REF</th>
                            <th className="px-6 py-3">Cargo</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {staffMembers.map(staff => (
                            <tr key={staff.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-900">{staff.name}</td>
                                <td className="px-6 py-4 text-gray-700">{staff.email}</td>
                                <td className="px-6 py-4 text-gray-700">{staff.phone || staff.cellphone || '-'}</td>
                                <td className="px-6 py-4 text-gray-700">{staff.ref || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        staff.role === UserRole.COORDINATOR ? 'bg-purple-100 text-purple-800' :
                                        staff.role === UserRole.ANALYST ? 'bg-green-100 text-green-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                        {staff.role === UserRole.ANALYST ? 'Analista' : staff.role === UserRole.COORDINATOR ? 'Coordenação' : 'Secretaria'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button 
                                        onClick={() => openEditUserModal(staff)}
                                        className="text-blue-600 hover:bg-blue-50 p-2 rounded" 
                                        title="Editar"
                                    >
                                        <UserCog size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(staff.id)}
                                        className="text-red-600 hover:bg-red-50 p-2 rounded" 
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    );
  };

  const renderManageStudents = () => {
    const studentList = users.filter(u => u.role === UserRole.STUDENT && (
        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        u.cpf?.includes(userSearchTerm)
    ));

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-600 hover:text-blue-600">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Gestão de Alunos</h2>
                </div>
                <div className="flex gap-4">
                     <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome, CPF..." 
                            className="pl-10 pr-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm bg-white text-gray-900 font-medium"
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => openCreateUserModal(UserRole.STUDENT)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center shadow-sm"
                    >
                        <Plus size={18} className="mr-2" /> Novo Aluno
                    </button>
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left text-black">
                    <thead className="bg-gray-50 text-gray-900 font-bold uppercase">
                        <tr>
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">CPF</th>
                            <th className="px-6 py-3">Contato</th>
                            <th className="px-6 py-3">Responsável</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {studentList.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-900">{student.name}</td>
                                <td className="px-6 py-4 text-gray-700 font-medium">{student.cpf}</td>
                                <td className="px-6 py-4 text-gray-700">
                                    <div className="flex flex-col">
                                        <span>{student.cellphone}</span>
                                        <span className="text-xs text-gray-500">{student.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                    {student.guardianName ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{student.guardianName}</span>
                                            <span className="text-xs">{student.guardianPhone}</span>
                                        </div>
                                    ) : <span className="text-gray-400">-</span>}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button 
                                        onClick={() => openEditUserModal(student)}
                                        className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors" 
                                        title="Editar Aluno"
                                    >
                                        <UserCog size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(student.id)}
                                        className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors" 
                                        title="Excluir Aluno"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {studentList.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum aluno encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    );
  };

  const renderWaitlist = () => {
    // 1. DETAIL VIEW: If a specific class is selected, show its waitlist table
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
                                                Ver Perfil
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

    // 2. OVERVIEW: List all classes with waiting list
    const classesWithWaitlist = classes.filter(c => c.waitingListCount > 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center">
                <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-600 hover:text-blue-600">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <AlertTriangle className="mr-3 text-orange-600" /> Fila de Espera Geral
                </h2>
            </div>

            {classesWithWaitlist.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-lg border border-dashed border-gray-300">
                    <CheckCircle size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                    <p className="text-lg font-bold text-gray-900">Nenhuma fila de espera ativa.</p>
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
                            <div className="text-center bg-orange-50 px-4 py-2 rounded-lg border border-orange-100">
                                <span className="block text-2xl font-bold text-orange-600">{cls.waitingListCount}</span>
                                <span className="text-xs text-orange-800 font-bold uppercase">Na Fila</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  const renderSpaceManagement = () => {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    // Helper to sort classes by time
    const sortClassesByTime = (a: SportClass, b: SportClass) => {
        return parseInt(a.time.split(':')[0]) - parseInt(b.time.split(':')[0]);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-600 hover:text-blue-600">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Gestão de Espaços</h2>
                </div>
            </div>

            {/* Day Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map(day => (
                    <button
                        key={day}
                        onClick={() => setSelectedDayForSpaces(day)}
                        className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
                            selectedDayForSpaces === day 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Locations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {LOCATIONS.map(location => {
                    const locationClasses = classes
                        .filter(c => c.location === location && c.days.includes(selectedDayForSpaces))
                        .sort(sortClassesByTime);

                    return (
                        <div key={location} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
                            <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-center text-gray-800">
                                {location}
                            </div>
                            <div className="p-3 space-y-3 flex-1">
                                {locationClasses.length > 0 ? (
                                    locationClasses.map(cls => (
                                        <div key={cls.id} className="bg-blue-50 border border-blue-100 p-2 rounded-lg text-xs">
                                            <div className="font-bold text-blue-900">{cls.time}</div>
                                            <div className="font-bold text-gray-800 truncate" title={cls.title}>{cls.title}</div>
                                            <div className="text-gray-600 mt-1">{cls.analystName}</div>
                                            <div className="mt-1 flex justify-between items-center">
                                                <span className="bg-white px-1 rounded text-blue-600 border border-blue-100">{cls.modality}</span>
                                                <span className={`${cls.enrolledCount >= cls.capacity ? 'text-red-600' : 'text-green-600'} font-bold`}>
                                                    {cls.enrolledCount}/{cls.capacity}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 text-xs py-4 italic">
                                        Livre
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderMenu = () => (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Painel de Coordenação</h2>
        
        {/* Notifications */}
        <div className="relative">
             <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 bg-white rounded-full text-gray-600 hover:text-blue-600 shadow-sm border border-gray-200 relative"
             >
                 <Bell size={24} />
                 {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                         {unreadCount}
                     </span>
                 )}
             </button>

             {isNotificationsOpen && (
                 <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in">
                     <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                         <h3 className="font-bold text-gray-900">Notificações</h3>
                         <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-500 hover:text-gray-900"><X size={18}/></button>
                     </div>
                     <div className="max-h-[400px] overflow-y-auto">
                         {myNotifications.length === 0 ? (
                             <div className="p-8 text-center text-gray-500 font-medium text-sm">Nenhuma notificação recente.</div>
                         ) : (
                             <div className="divide-y divide-gray-100">
                                 {myNotifications.map(notif => (
                                     <div 
                                        key={notif.id} 
                                        className={`p-4 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}
                                        onClick={() => markNotificationAsRead(notif.id)}
                                     >
                                         <div className="flex justify-between items-start mb-1">
                                             <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-200 text-blue-800">
                                                 {notif.title}
                                             </span>
                                             <span className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                         </div>
                                         <p className="text-sm font-bold text-gray-900 mt-2">{notif.message}</p>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                 </div>
             )}
        </div>
      </div>
      
      {/* Quick Stats Grid - Matching Secretary Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-gray-900 text-sm font-bold">Taxa de Ocupação</p>
          <h3 className="text-3xl font-extrabold text-black">{occupancyRate}%</h3>
        </div>
        <div 
            onClick={() => setCurrentView('REQUESTS')}
            className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 cursor-pointer hover:shadow-md transition-all"
        >
          <p className="text-gray-900 text-sm font-bold">Solicitações Pendentes</p>
          <h3 className="text-3xl font-extrabold text-black">{pendingRequests.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <p className="text-gray-900 text-sm font-bold">Equipe Ativa</p>
          <h3 className="text-3xl font-extrabold text-black">{totalStaff}</h3>
        </div>
        <div 
            onClick={() => setCurrentView('WAITLIST')}
            className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 cursor-pointer hover:shadow-md transition-all"
        >
          <p className="text-gray-900 text-sm font-bold">Fila de Espera</p>
          <h3 className="text-3xl font-extrabold text-black">{waitlistTotal}</h3>
        </div>
      </div>

      {/* Navigation Cards Grid - Matching Secretary Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Auditoria & Logs */}
        <button 
          onClick={() => setCurrentView('AUDIT')}
          className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-400 transition-all text-left group"
        >
          <div className="bg-gray-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
            <ShieldCheck className="text-gray-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Auditoria & Logs</h3>
          <p className="text-gray-800 text-sm">Histórico de ações no sistema.</p>
        </button>

        {/* Fila de Espera */}
        <button 
          onClick={() => setCurrentView('WAITLIST')}
          className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-300 transition-all text-left group"
        >
          <div className="bg-orange-50 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
            <AlertTriangle className="text-orange-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Fila de Espera</h3>
          <p className="text-gray-800 text-sm">Monitorar filas por turma.</p>
        </button>

        {/* Gestão de Alunos */}
        <button 
          onClick={() => setCurrentView('MANAGE_STUDENTS')}
          className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all text-left group"
        >
          <div className="bg-green-50 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
            <GraduationCap className="text-green-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Gestão de Alunos</h3>
          <p className="text-gray-800 text-sm">Cadastrar, editar e excluir alunos.</p>
        </button>

        {/* Gestão de Equipe */}
        <button 
          onClick={() => setCurrentView('MANAGE_STAFF')}
          className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all text-left group"
        >
          <div className="bg-purple-50 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
            <Briefcase className="text-purple-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Gestão de Equipe</h3>
          <p className="text-gray-800 text-sm">Gerenciar Analistas e Secretaria.</p>
        </button>

        {/* Gestão de Espaços */}
        <button 
          onClick={() => setCurrentView('SPACE_MANAGEMENT')}
          className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all text-left group"
        >
          <div className="bg-indigo-50 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
            <LayoutTemplate className="text-indigo-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Gestão de Espaços</h3>
          <p className="text-gray-800 text-sm">Visualizar ocupação de salas e ginásios.</p>
        </button>

        {/* Gestão de Solicitações */}
        <button 
          onClick={() => setCurrentView('REQUESTS')}
          className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-yellow-300 transition-all text-left group"
        >
          <div className="bg-yellow-50 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-100 transition-colors">
            <ClipboardCheck className="text-yellow-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Gestão de Solicitações</h3>
          <p className="text-gray-800 text-sm">Aprovar turmas, vagas e alterações.</p>
        </button>

        {/* Relatórios e Gráficos */}
        <button 
          onClick={() => setCurrentView('OVERVIEW')}
          className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all text-left group"
        >
          <div className="bg-blue-50 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <BarChart2 className="text-blue-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Relatórios e Gráficos</h3>
          <p className="text-gray-800 text-sm">Estatísticas detalhadas.</p>
        </button>

      </div>
    </div>
  );

  return (
    <div>
      {currentView === 'MENU' && renderMenu()}
      {currentView === 'OVERVIEW' && renderOverview()}
      {currentView === 'AUDIT' && renderAudit()}
      {currentView === 'REQUESTS' && renderRequests()}
      {currentView === 'MANAGE_STAFF' && renderManageStaff()}
      {currentView === 'MANAGE_STUDENTS' && renderManageStudents()}
      {currentView === 'SPACE_MANAGEMENT' && renderSpaceManagement()}
      {currentView === 'WAITLIST' && renderWaitlist()}
      
      {/* Fallback */}
      {(currentView !== 'MENU' && currentView !== 'OVERVIEW' && currentView !== 'AUDIT' && 
        currentView !== 'REQUESTS' && currentView !== 'MANAGE_STAFF' && 
        currentView !== 'MANAGE_STUDENTS' && currentView !== 'SPACE_MANAGEMENT' && 
        currentView !== 'WAITLIST') && (
         <div className="text-center p-12">
            <button onClick={() => setCurrentView('MENU')} className="mb-4 text-blue-600 flex items-center justify-center mx-auto font-bold"><ArrowLeft className="mr-2"/> Voltar</button>
            <h2 className="text-xl text-gray-500">Módulo em desenvolvimento...</h2>
         </div>
      )}

      {/* GLOBAL ADD/EDIT USER MODAL */}
      {isAddUserModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-fade-in overflow-y-auto max-h-[90vh]">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-gray-900">
                         {editingUser ? 'Editar Usuário' : (newUserRole === UserRole.STUDENT ? 'Cadastrar Novo Aluno' : 'Adicionar Membro da Equipe')}
                     </h3>
                     <button onClick={() => setIsAddUserModalOpen(false)}><X size={24} className="text-gray-500"/></button>
                 </div>
                 <form onSubmit={handleUserFormSubmit} className="space-y-4">
                     {/* Role Selector (only if not student flow, or allow switching) */}
                     {newUserRole !== UserRole.STUDENT && (
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">Cargo</label>
                             <select 
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                value={newUserRole}
                                onChange={e => setNewUserRole(e.target.value as UserRole)}
                             >
                                 <option value={UserRole.ANALYST}>Analista de Esportes</option>
                                 <option value={UserRole.SECRETARY}>Secretaria</option>
                                 <option value={UserRole.COORDINATOR}>Coordenador</option>
                             </select>
                         </div>
                     )}

                     {/* Common Fields */}
                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                         <input 
                            required 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                            value={newUserData.name || ''}
                            onChange={e => setNewUserData({...newUserData, name: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
                         <input 
                            required={newUserRole !== UserRole.STUDENT} // Email optional for students in this simplified admin flow? No, usually required.
                            type="email" 
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                            value={newUserData.email || ''}
                            onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                            placeholder={newUserRole === UserRole.STUDENT ? "Opcional ou gerado auto" : "Obrigatório"}
                         />
                     </div>

                     {/* STAFF SPECIFIC */}
                     {newUserRole !== UserRole.STUDENT && (
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">REF (Registro Funcional) <span className="text-red-500">*</span></label>
                             <input 
                                required 
                                type="text" 
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                placeholder="000.000.0/0"
                                maxLength={11}
                                value={newUserData.ref || ''}
                                onChange={e => setNewUserData({...newUserData, ref: applyRefMask(e.target.value)})}
                             />
                             <p className="text-xs text-gray-500 mt-1">Formato obrigatório: 000.000.0/0</p>
                         </div>
                     )}

                     {/* STUDENT SPECIFIC */}
                     {newUserRole === UserRole.STUDENT && (
                         <>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">CPF <span className="text-red-500">*</span></label>
                                 <input 
                                     required 
                                     type="text" 
                                     className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                     placeholder="000.000.000-00"
                                     value={newUserData.cpf || ''}
                                     onChange={e => setNewUserData({...newUserData, cpf: applyCPFMask(e.target.value)})}
                                     maxLength={14}
                                 />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Data de Nascimento <span className="text-red-500">*</span></label>
                                    <input 
                                        required 
                                        type="text" 
                                        placeholder="DD/MM/AAAA"
                                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                        value={newUserData.birthDate || ''}
                                        onChange={handleBirthDateChange}
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Idade</label>
                                    <input 
                                        disabled readOnly
                                        type="text" 
                                        className="w-full p-2 border border-gray-300 bg-gray-100 rounded-lg text-gray-600 text-center"
                                        value={newUserData.birthDate && newUserData.birthDate.length === 10 ? `${calculateAgeFromBrDate(newUserData.birthDate)} anos` : ''}
                                    />
                                </div>
                             </div>
                         </>
                     )}

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Telefone</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                value={newUserData.phone || ''}
                                onChange={e => setNewUserData({...newUserData, phone: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Celular</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                value={newUserData.cellphone || ''}
                                onChange={e => setNewUserData({...newUserData, cellphone: e.target.value})}
                            />
                        </div>
                     </div>

                     {/* STUDENT ADDRESS */}
                     {newUserRole === UserRole.STUDENT && (
                        <div className="grid grid-cols-1 gap-4">
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Endereço</label>
                                 <div className="relative">
                                    <Home size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                        placeholder="Logradouro, Número"
                                        value={newUserData.address || ''}
                                        onChange={e => setNewUserData({...newUserData, address: e.target.value})}
                                    />
                                 </div>
                             </div>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Bairro</label>
                                 <div className="relative">
                                    <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                        placeholder="Bairro"
                                        value={newUserData.neighborhood || ''}
                                        onChange={e => setNewUserData({...newUserData, neighborhood: e.target.value})}
                                    />
                                 </div>
                             </div>
                        </div>
                     )}

                     {/* GUARDIAN INFO FOR MINORS */}
                     {newUserRole === UserRole.STUDENT && isMinor && (
                         <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-2">
                             <h4 className="font-bold text-orange-800 mb-2 text-sm flex items-center">
                                 <Users size={16} className="mr-2"/> Dados do Responsável (Menor de 18)
                             </h4>
                             <div className="space-y-3">
                                 <div>
                                     <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Responsável <span className="text-red-500">*</span></label>
                                     <input 
                                        required 
                                        type="text" 
                                        className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 text-sm"
                                        value={newUserData.guardianName || ''}
                                        onChange={e => setNewUserData({...newUserData, guardianName: e.target.value})}
                                     />
                                 </div>
                                 <div className="grid grid-cols-2 gap-2">
                                     <div>
                                         <label className="block text-xs font-bold text-gray-700 mb-1">CPF Resp. <span className="text-red-500">*</span></label>
                                         <input 
                                            required 
                                            type="text" 
                                            className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 text-sm"
                                            value={newUserData.guardianCpf || ''}
                                            onChange={e => setNewUserData({...newUserData, guardianCpf: applyCPFMask(e.target.value)})}
                                            maxLength={14}
                                         />
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-gray-700 mb-1">Tel. Resp. <span className="text-red-500">*</span></label>
                                         <input 
                                            required 
                                            type="text" 
                                            className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 text-sm"
                                            value={newUserData.guardianPhone || ''}
                                            onChange={e => setNewUserData({...newUserData, guardianPhone: e.target.value})}
                                         />
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}

                     <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 mt-4 shadow-md">
                         {editingUser ? 'Salvar Alterações' : (newUserRole === UserRole.STUDENT ? 'Cadastrar Aluno' : 'Cadastrar Membro')}
                     </button>
                 </form>
             </div>
         </div>
      )}
    </div>
  );
};

export default CoordinatorDashboard;
