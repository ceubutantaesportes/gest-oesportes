import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, AlertTriangle, ClipboardCheck, Calendar, Search, ArrowRight, CheckCircle, XCircle, Clock, PlusSquare, Eye, ArrowLeft, Mail, Phone, FileText, LayoutGrid, ListOrdered, ChevronRight, BarChart2, Bell, GraduationCap, Briefcase, UserCog, Save, X, Plus, Smartphone, Home, ShieldCheck, Activity, LayoutTemplate } from 'lucide-react';
import { RequestStatus, RequestType, EnrollmentStatus, UserRole, User, SportClass } from '../types';
import { LOCATIONS } from '../constants';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

type DashboardView = 'MENU' | 'OVERVIEW' | 'WAITLIST' | 'MODALITIES' | 'AUDIT' | 'REQUESTS' | 'MANAGE_STUDENTS' | 'MANAGE_STAFF' | 'USER_AUDIT' | 'SPACE_MANAGEMENT';

const CoordinatorDashboard: React.FC = () => {
  const { classes, enrollments, attendance, users, updateRequests, resolveUpdateRequest, updateUser, addUser, auditLogs, notifications, markNotificationAsRead, currentUser } = useApp();
  const [currentView, setCurrentView] = useState<DashboardView>('MENU');
  
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
  const totalEnrolled = enrollments.length; 
  const occupancyRate = totalSpots > 0 ? Math.round((totalEnrolled / totalSpots) * 100) : 0;
  
  const waitlistTotal = classes.reduce((acc, curr) => acc + curr.waitingListCount, 0);
  const pendingRequests = updateRequests.filter(r => r.status === RequestStatus.PENDING);

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
    name: c.title.split(' ')[0],
    Vagas: c.capacity,
    Matriculados: c.enrolledCount
  }));

  // --- Attendance Audit Logic ---
  const [selectedAnalystId, setSelectedAnalystId] = useState<string>('');
  const [selectedAuditClassId, setSelectedAuditClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const analysts = users.filter(u => u.role === 'ANALYST');
  const filteredAuditClasses = classes.filter(c => selectedAnalystId ? c.analystId === selectedAnalystId : true);
  
  const classDates = Array.from(new Set(
    attendance
      .filter(a => a.classId === selectedAuditClassId)
      .map(a => a.date)
  )).sort().reverse();

  const dailyAttendance = attendance.filter(a => a.classId === selectedAuditClassId && a.date === selectedDate);

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

  // --- AGE CALCULATION HELPER ---
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

  const checkMinor = (date: string) => {
      if (date) {
          const age = calculateAge(date);
          return age < 18;
      }
      return false;
  };

  // --- USER MANAGEMENT HELPER ---
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
        // If age changed to minor, validate guardian
        if (editingUser.birthDate && checkMinor(editingUser.birthDate) && editingUser.role === UserRole.STUDENT) {
            if (!editingUser.guardianName || !editingUser.guardianCpf) {
                alert("Para menores de 18 anos, dados do responsável são obrigatórios.");
                return;
            }
        }
        updateUser(editingUser);
        setEditingUser(null);
        alert('Usuário atualizado com sucesso!');
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUserData.name || !newUserData.email) {
          alert('Nome e E-mail são obrigatórios.');
          return;
      }

      // Validate REF for staff
      if (newUserRole !== UserRole.STUDENT && !newUserData.ref) {
          alert('REF é obrigatório para funcionários.');
          return;
      }

      // Validate Guardian for Minors
      if (isMinor && newUserRole === UserRole.STUDENT) {
          if (!newUserData.guardianName || !newUserData.guardianCpf || !newUserData.guardianPhone || !newUserData.guardianEmail) {
             alert('Dados do responsável são obrigatórios para menores de 18 anos.');
             return;
          }
      }

      const newUser: User = {
          id: `u_new_${Date.now()}`,
          role: newUserRole,
          name: newUserData.name,
          email: newUserData.email,
          ref: newUserData.ref,
          phone: newUserData.phone,
          cellphone: newUserData.cellphone,
          password: '123456', // Default password
          cpf: newUserData.cpf,
          birthDate: newUserData.birthDate,
          address: newUserData.address,
          neighborhood: newUserData.neighborhood,
          guardianName: isMinor ? newUserData.guardianName : undefined,
          guardianCpf: isMinor ? newUserData.guardianCpf : undefined,
          guardianEmail: isMinor ? newUserData.guardianEmail : undefined,
          guardianPhone: isMinor ? newUserData.guardianPhone : undefined
      };

      addUser(newUser);
      setIsAddUserModalOpen(false);
      setNewUserData({ name: '', email: '', ref: '', phone: '', cellphone: '', address: '', neighborhood: '', guardianName: '', guardianCpf: '', guardianPhone: '', guardianEmail: '' });
      alert('Usuário cadastrado com sucesso!');
  };

  const openAddUserModal = (defaultRole: UserRole) => {
      setNewUserRole(defaultRole);
      setNewUserData({ name: '', email: '', ref: '', phone: '', cellphone: '', address: '', neighborhood: '', guardianName: '', guardianCpf: '', guardianPhone: '', guardianEmail: '' });
      setIsMinor(false);
      setIsAddUserModalOpen(true);
  };

  // --- SHARED COMPONENT: Student List Table ---
  const StudentListTable = ({ studentList, statusLabel }: { studentList: any[], statusLabel?: string }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-black">
            <thead className="text-xs text-gray-900 uppercase bg-gray-100 font-bold">
                <tr>
                    <th className="px-6 py-4">Nome Completo</th>
                    <th className="px-6 py-4">CPF</th>
                    <th className="px-6 py-4">Telefone</th>
                    <th className="px-6 py-4">E-mail</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                </tr>
            </thead>
            <tbody>
                {studentList.map((student, index) => (
                    <tr key={index} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">
                            <div className="flex items-center">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold mr-2">
                                    {index + 1}
                                </span>
                                {student.name}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            <div className="flex items-center">
                                <FileText size={14} className="mr-2 text-gray-500"/>
                                {student.cpf || '-'}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            <div className="flex items-center">
                                <Phone size={14} className="mr-2 text-gray-500"/>
                                {student.phone || '-'}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            <div className="flex items-center">
                                <Mail size={14} className="mr-2 text-gray-500"/>
                                {student.email}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                            {statusLabel ? (
                                <span className="bg-yellow-100 text-yellow-900 text-xs font-bold px-2 py-1 rounded">{statusLabel}</span>
                            ) : (
                                student.enrollmentStatus === EnrollmentStatus.CONFIRMED ? (
                                    <span className="bg-green-100 text-green-900 text-xs font-bold px-2 py-1 rounded">MATRICULADO</span>
                                ) : (
                                    <span className="bg-yellow-100 text-yellow-900 text-xs font-bold px-2 py-1 rounded">LISTA DE ESPERA</span>
                                )
                            )}
                        </td>
                        <td className="px-6 py-4 text-center">
                             {/* Coordinator can cancel enrollment logic would go here if needed, but context requires student ID + Class ID to cancel */}
                             <button className="text-gray-400 hover:text-red-500 transition-colors" title="Visualizar/Gerenciar">
                                 <Eye size={18} />
                             </button>
                        </td>
                    </tr>
                ))}
                {studentList.length === 0 && (
                    <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-900 font-medium">
                            Nenhum aluno encontrado.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
        <button onClick={() => setCurrentView('MENU')} className="flex items-center text-gray-600 hover:text-blue-600 font-medium">
            <ArrowLeft size={20} className="mr-2" /> Voltar ao Menu
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <p className="text-gray-500 font-bold text-sm">Total de Vagas</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{totalSpots}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                <p className="text-gray-500 font-bold text-sm">Matriculados</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{totalEnrolled}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                <p className="text-gray-500 font-bold text-sm">Taxa de Ocupação</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{occupancyRate}%</h3>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Ocupação por Turma</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Vagas" fill="#e2e8f0" />
                    <Bar dataKey="Matriculados" fill="#3b82f6" />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* --- CONTROLE DE ADESÃO (NOVA TABELA) --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Controle de Adesão</h3>
            <div className="h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-900 uppercase bg-gray-100 font-bold sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3">Turma</th>
                            <th className="px-4 py-3">Analista</th>
                            <th className="px-4 py-3 text-center">Vagas</th>
                            <th className="px-4 py-3 text-center">Matriculados</th>
                            <th className="px-4 py-3 text-center">Ocupação</th>
                            <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="text-black">
                        {classes.map(cls => {
                            const percent = cls.capacity > 0 ? Math.round((cls.enrolledCount / cls.capacity) * 100) : 0;
                            
                            // Define color based on occupancy
                            let badgeColor = 'bg-red-100 text-red-900'; // Low adhesion
                            if (percent >= 80) badgeColor = 'bg-green-100 text-green-900'; // High adhesion
                            else if (percent >= 50) badgeColor = 'bg-yellow-100 text-yellow-900'; // Medium adhesion

                            return (
                                <tr key={cls.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{cls.title}</td>
                                    <td className="px-4 py-3 text-gray-700">{cls.analystName}</td>
                                    <td className="px-4 py-3 text-center text-gray-700">{cls.capacity}</td>
                                    <td className="px-4 py-3 text-center text-gray-700">{cls.enrolledCount}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${badgeColor}`}>
                                            {percent}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button 
                                            onClick={() => setViewingClassId(cls.id)}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors" 
                                            title="Visualizar Detalhes"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  // --- NEW: Class Detail View (Drill down from Overview) ---
  const renderClassDetail = () => {
      const cls = classes.find(c => c.id === viewingClassId);
      if (!cls) return null;

      // Get students for this class
      const classStudents = enrollments
        .filter(e => e.classId === cls.id)
        .map(e => ({
            ...users.find(u => u.id === e.studentId),
            enrollmentStatus: e.status
        }))
        .filter(u => u.id)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      return (
        <div className="space-y-6 animate-fade-in">
            <button onClick={() => setViewingClassId(null)} className="flex items-center text-gray-600 hover:text-blue-600 font-medium">
                <ArrowLeft size={20} className="mr-2" /> Voltar para Visão Geral
            </button>
            
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes da Turma: {cls.title}</h2>
                <div className="text-sm font-bold text-gray-600">
                    Analista: {cls.analystName} | {cls.days.join('/')} às {cls.time}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <StudentListTable studentList={classStudents} />
            </div>
        </div>
      );
  };

  const renderWaitlist = () => {
    // If viewing specific class waitlist
    if (viewingWaitlistClassId) {
         const cls = classes.find(c => c.id === viewingWaitlistClassId);
         const waitlistStudents = enrollments
            .filter(e => e.classId === viewingWaitlistClassId && e.status === EnrollmentStatus.WAITING_LIST)
            .map(e => ({
                ...users.find(u => u.id === e.studentId),
                enrollmentStatus: e.status
            }))
            .filter(u => u.id); // ensure user exists

         return (
             <div className="space-y-6 animate-fade-in">
                 <button onClick={() => setViewingWaitlistClassId(null)} className="flex items-center text-gray-600 hover:text-blue-600 font-medium">
                    <ArrowLeft size={20} className="mr-2" /> Voltar para Lista
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Fila de Espera: {cls?.title}</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <StudentListTable studentList={waitlistStudents} statusLabel="NA FILA" />
                </div>
             </div>
         );
    }

    const classesWithWaitlist = classes.filter(c => c.waitingListCount > 0);
    
    return (
        <div className="space-y-6 animate-fade-in">
            <button onClick={() => setCurrentView('MENU')} className="flex items-center text-gray-600 hover:text-blue-600 font-medium">
                <ArrowLeft size={20} className="mr-2" /> Voltar ao Menu
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Turmas com Fila de Espera</h2>
            
            {classesWithWaitlist.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-lg border border-dashed text-gray-500">
                    <CheckCircle size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                    <p className="text-lg font-bold">Nenhuma fila de espera ativa.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classesWithWaitlist.map(cls => (
                        <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{cls.title}</h3>
                                <p className="text-sm text-gray-600">{cls.days.join('/')} • {cls.time}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-orange-600">{cls.waitingListCount}</span>
                                    <span className="text-xs text-gray-500 uppercase font-bold">Na Fila</span>
                                </div>
                                <button 
                                    onClick={() => setViewingWaitlistClassId(cls.id)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm"
                                >
                                    Ver Detalhes
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  const renderModalities = () => (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => setCurrentView('MENU')} className="flex items-center text-gray-600 hover:text-blue-600 font-medium">
            <ArrowLeft size={20} className="mr-2" /> Voltar ao Menu
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Distribuição por Modalidade</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={modalityData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="students"
                        >
                            {modalityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                    Detalhamento
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-gray-900 font-bold border-b">
                        <tr>
                            <th className="px-6 py-3">Modalidade</th>
                            <th className="px-6 py-3">Alunos</th>
                            <th className="px-6 py-3 text-right">%</th>
                        </tr>
                    </thead>
                    <tbody className="text-black">
                        {modalityData.map((item, idx) => (
                            <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="px-6 py-3 font-medium">{item.name}</td>
                                <td className="px-6 py-3">{item.students}</td>
                                <td className="px-6 py-3 text-right text-gray-600">
                                    {totalEnrolled > 0 ? ((item.students / totalEnrolled) * 100).toFixed(1) : 0}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
  );

  const renderAudit = () => (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => setCurrentView('MENU')} className="flex items-center text-gray-600 hover:text-blue-600 font-medium">
            <ArrowLeft size={20} className="mr-2" /> Voltar ao Menu
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Auditoria de Frequência</h2>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Analista</label>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded-lg text-black font-medium"
                        value={selectedAnalystId}
                        onChange={e => {
                            setSelectedAnalystId(e.target.value);
                            setSelectedAuditClassId('');
                            setSelectedDate('');
                        }}
                    >
                        <option value="">Selecione um analista...</option>
                        {analysts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Turma</label>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded-lg text-black font-medium"
                        value={selectedAuditClassId}
                        onChange={e => {
                            setSelectedAuditClassId(e.target.value);
                            setSelectedDate('');
                        }}
                        disabled={!selectedAnalystId}
                    >
                        <option value="">Selecione uma turma...</option>
                        {filteredAuditClasses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Data da Aula</label>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded-lg text-black font-medium"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        disabled={!selectedAuditClassId}
                    >
                        <option value="">Selecione a data...</option>
                        {classDates.map(date => <option key={date} value={date}>{new Date(date).toLocaleDateString('pt-BR')}</option>)}
                    </select>
                </div>
            </div>

            {selectedDate && (
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 p-3 border-b font-bold flex justify-between items-center text-gray-900">
                        <span>Registro de Presença: {new Date(selectedDate).toLocaleDateString('pt-BR')}</span>
                        <span className="text-sm bg-white px-2 py-1 rounded border">Total: {dailyAttendance.length}</span>
                    </div>
                    <table className="w-full text-sm text-left text-black">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="px-4 py-2">Aluno</th>
                                <th className="px-4 py-2 text-center">Presença</th>
                                <th className="px-4 py-2">Justificativa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyAttendance.map(record => {
                                const student = users.find(u => u.id === record.studentId);
                                return (
                                    <tr key={record.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="px-4 py-2 font-medium text-gray-900">{student?.name || 'Aluno Excluído'}</td>
                                        <td className="px-4 py-2 text-center">
                                            {record.present 
                                                ? <span className="text-green-600 font-bold">Presente</span>
                                                : <span className="text-red-600 font-bold">Ausente</span>
                                            }
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 italic">{record.justification || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            
            {!selectedDate && (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                    Selecione os filtros acima para visualizar a lista de presença.
                </div>
            )}
        </div>
      </div>
  );

  const renderRequests = () => {
    // Translation map for field names
    const fieldLabels: Record<string, string> = {
        id: 'ID',
        title: 'Nome da Turma',
        modality: 'Modalidade',
        days: 'Dias da Semana',
        time: 'Horário',
        location: 'Local',
        capacity: 'Capacidade (Vagas)',
        minAge: 'Idade Mínima',
        maxAge: 'Idade Máxima',
        description: 'Descrição Detalhada',
        enrolledCount: 'Matriculados',
        waitingListCount: 'Fila de Espera',
        createdAt: 'Data de Criação'
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => setCurrentView('MENU')} className="flex items-center text-gray-600 hover:text-blue-600 font-medium">
            <ArrowLeft size={20} className="mr-2" /> Voltar ao Menu
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Solicitações de Alteração</h2>
        
        {pendingRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-lg border border-dashed text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-lg font-bold">Nenhuma solicitação pendente.</p>
            </div>
        ) : (
            <div className="grid gap-6">
                {pendingRequests.map(req => (
                    <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block ${
                                    req.requestType === RequestType.CREATE ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {req.requestType === RequestType.CREATE ? 'Nova Turma' : 'Alteração'}
                                </span>
                                <h3 className="text-xl font-bold text-gray-900">{req.classTitle}</h3>
                                <p className="text-sm text-gray-500">Solicitado por: {req.analystName} em {new Date(req.createdAt).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 text-sm text-gray-700">
                            <h4 className="font-bold mb-2">Detalhes da Solicitação:</h4>
                            <ul className="space-y-1">
                                {Object.entries(req.requestedChanges).map(([key, value]) => {
                                    if (key === 'status' || key === 'analystId' || key === 'analystName') return null;
                                    
                                    const label = fieldLabels[key] || key;
                                    let displayValue = value;
                                    
                                    if (Array.isArray(value)) {
                                        displayValue = value.join(', ');
                                    } else if (key === 'createdAt' && typeof value === 'string') {
                                        // Fix: Cast to string explicitly to satisfy TS overload
                                        displayValue = new Date(value as string).toLocaleString('pt-BR');
                                    }

                                    return (
                                        <li key={key} className="flex">
                                            <span className="font-bold text-gray-900 w-40 shrink-0">{label}:</span>
                                            <span className="flex-1 text-gray-800">{displayValue as React.ReactNode}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => resolveUpdateRequest(req.id, false)}
                                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg font-bold hover:bg-red-50 flex items-center"
                            >
                                <XCircle size={18} className="mr-2" /> Rejeitar
                            </button>
                            <button 
                                onClick={() => resolveUpdateRequest(req.id, true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center shadow-sm"
                            >
                                <CheckCircle size={18} className="mr-2" /> Aprovar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    );
  };

  // --- VIEW: SPACE MANAGEMENT ---
  const renderSpaceManagement = () => {
    // Standard spaces from constants
    const spaces = LOCATIONS;
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 to 21

    const getClassAtSlot = (space: string, hour: number, day: string) => {
        return classes.find(c => {
            // 1. Basic Filters
            if (c.location !== space || !c.days.includes(day)) return false;
            
            // 2. Robust Time Parsing
            try {
                // Split by hyphen, effectively handling "09:00 - 10:00", "09:00-10:00", etc.
                const parts = c.time.split('-').map(p => p.trim());
                if (parts.length !== 2) return false;

                const [startStr, endStr] = parts;

                const [startH, startM] = startStr.split(':').map(Number);
                const [endH, endM] = endStr.split(':').map(Number);

                if (isNaN(startH) || isNaN(endH)) return false;

                // Normalize to minutes
                const classStartTotalMins = startH * 60 + (startM || 0);
                const classEndTotalMins = endH * 60 + (endM || 0);

                const slotStartTotalMins = hour * 60;
                const slotEndTotalMins = (hour + 1) * 60;

                // Overlap logic: Class starts before slot ends AND Class ends after slot starts
                return (classStartTotalMins < slotEndTotalMins) && (classEndTotalMins > slotStartTotalMins);
            } catch (e) {
                console.error("Erro ao processar horário da turma:", c.title, c.time);
                return false;
            }
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <button onClick={() => setCurrentView('MENU')} className="flex items-center text-gray-600 hover:text-blue-600 font-medium">
                <ArrowLeft size={20} className="mr-2" /> Voltar ao Menu
            </button>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <LayoutTemplate className="mr-3 text-pink-600" /> Gestão de Espaços
            </h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                {/* Day Selection Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
                    {days.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDayForSpaces(day)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                                selectedDayForSpaces === day 
                                ? 'bg-pink-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-900 border-b border-gray-300">
                                <th className="px-4 py-3 border-r border-gray-300 w-24 text-center font-bold">Horário</th>
                                {spaces.map(space => (
                                    <th key={space} className="px-4 py-3 border-r border-gray-300 text-center font-bold w-48">
                                        {space}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {hours.map(hour => (
                                <tr key={hour} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-4 py-3 border-r border-gray-200 text-center font-bold text-gray-700 bg-gray-50">
                                        {hour.toString().padStart(2, '0')}:00
                                    </td>
                                    {spaces.map(space => {
                                        const occupiedBy = getClassAtSlot(space, hour, selectedDayForSpaces);
                                        return (
                                            <td key={`${space}-${hour}`} className="px-2 py-2 border-r border-gray-200 text-center align-middle h-16">
                                                {occupiedBy ? (
                                                    <div className="bg-blue-100 border border-blue-300 rounded p-2 text-xs h-full flex flex-col justify-center shadow-sm">
                                                        <span className="font-bold text-blue-900 block truncate" title={occupiedBy.title}>{occupiedBy.title}</span>
                                                        <span className="text-blue-700 block truncate">{occupiedBy.analystName}</span>
                                                        <span className="text-blue-600 font-mono text-[10px] mt-1">{occupiedBy.time}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 text-xs">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  // --- VIEW 1: MENU (HOME) ---
  const renderMenu = () => (
    <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Central de Controle</h2>
            
            {/* NOTIFICATIONS BELL (Copied from AnalystDashboard) */}
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
                                                 <span className={`text-xs font-bold px-2 py-0.5 rounded ${notif.title.includes('Fila') ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                                                     {notif.title}
                                                 </span>
                                                 <span className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                             </div>
                                             <p className="text-sm font-bold text-gray-900 mt-2">{notif.message}</p>
                                             
                                             {notif.details && (
                                                <div className="mt-3 text-xs bg-white border border-gray-200 rounded p-2 text-gray-700 space-y-1">
                                                    <p><strong>Aluno:</strong> {notif.details.studentName} ({notif.details.studentAge} anos)</p>
                                                    <p><strong>Nasc:</strong> {notif.details.studentBirthDate}</p>
                                                    <p><strong>Tel:</strong> {notif.details.studentPhone}</p>
                                                </div>
                                             )}
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     </div>
                 )}
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Overview Card */}
            <button onClick={() => setCurrentView('OVERVIEW')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all text-left group">
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <BarChart2 className="text-blue-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Visão Geral & Adesão</h3>
                <p className="text-sm text-gray-800">Indicadores de ocupação, gráficos e controle de adesão.</p>
            </button>

             {/* Space Management Card */}
             <button onClick={() => setCurrentView('SPACE_MANAGEMENT')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-pink-300 transition-all text-left group">
                <div className="bg-pink-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-100 transition-colors">
                    <LayoutTemplate className="text-pink-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Gestão de Espaços</h3>
                <p className="text-sm text-gray-800">Grade horária de uso do Ginásio, Piscina e Salas.</p>
            </button>

            {/* Waitlist Card */}
            <button onClick={() => setCurrentView('WAITLIST')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-300 transition-all text-left group">
                <div className="bg-orange-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                    <AlertTriangle className="text-orange-600" size={24} />
                </div>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Fila de Espera</h3>
                        <p className="text-sm text-gray-800">Gerencie a demanda reprimida.</p>
                    </div>
                    {waitlistTotal > 0 && (
                        <span className="bg-orange-100 text-orange-900 text-xs font-bold px-2 py-1 rounded-full">{waitlistTotal}</span>
                    )}
                </div>
            </button>

            {/* Modalities Card */}
            <button onClick={() => setCurrentView('MODALITIES')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all text-left group">
                <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                    <Users className="text-green-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Alunos por Modalidade</h3>
                <p className="text-sm text-gray-800">Listas agrupadas por esporte.</p>
            </button>

            {/* Audit Card */}
            <button onClick={() => setCurrentView('AUDIT')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all text-left group">
                <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                    <ClipboardCheck className="text-purple-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Auditoria de Frequência</h3>
                <p className="text-sm text-gray-800">Verifique listas de presença e faltas.</p>
            </button>
            
            {/* User Audit Card */}
            <button onClick={() => setCurrentView('USER_AUDIT')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all text-left group">
                <div className="bg-teal-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                    <Activity className="text-teal-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Auditoria de Usuários</h3>
                <p className="text-sm text-gray-800">Logs de ações do sistema.</p>
            </button>

            {/* Manage Students */}
            <button onClick={() => setCurrentView('MANAGE_STUDENTS')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-cyan-300 transition-all text-left group">
                <div className="bg-cyan-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-100 transition-colors">
                    <GraduationCap className="text-cyan-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Gestão de Alunos</h3>
                <p className="text-sm text-gray-800">Cadastro e edição de dados dos alunos.</p>
            </button>

            {/* Manage Staff */}
            <button onClick={() => setCurrentView('MANAGE_STAFF')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all text-left group">
                <div className="bg-indigo-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                    <Briefcase className="text-indigo-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Gestão de Equipe</h3>
                <p className="text-sm text-gray-800">Secretaria e Analistas.</p>
            </button>

            {/* Requests Card */}
            <button onClick={() => setCurrentView('REQUESTS')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-red-300 transition-all text-left group">
                <div className="bg-red-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
                    <Bell className="text-red-600" size={24} />
                </div>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Solicitações</h3>
                        <p className="text-sm text-gray-800">Aprovação de turmas.</p>
                    </div>
                    {pendingRequests.length > 0 && (
                        <span className="bg-red-100 text-red-900 text-xs font-bold px-2 py-1 rounded-full">{pendingRequests.length}</span>
                    )}
                </div>
            </button>
        </div>
    </div>
  );

  // --- VIEW: USER MANAGEMENT (Students or Staff) ---
  const renderUserManagement = (roles: UserRole[], title: string) => {
    const filteredUsers = users.filter(u => 
        roles.includes(u.role) && 
        (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
         u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
         (u.cpf && u.cpf.includes(userSearchTerm)))
    );

    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => setCurrentView('MENU')} className="flex items-center text-gray-600 hover:text-blue-600 font-medium">
            <ArrowLeft size={20} className="mr-2" /> Voltar ao Menu
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                {roles.includes(UserRole.STUDENT) ? <GraduationCap className="mr-3 text-cyan-600"/> : <Briefcase className="mr-3 text-indigo-600"/>}
                {title}
            </h2>
            <div className="flex gap-4 w-full md:w-auto">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                    <input 
                    type="text" 
                    placeholder="Buscar por nome, email ou CPF..." 
                    className="pl-10 pr-4 py-2 border border-gray-400 rounded-full focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-sm bg-white text-gray-900 placeholder-gray-500 font-medium"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => openAddUserModal(roles.includes(UserRole.STUDENT) ? UserRole.STUDENT : UserRole.ANALYST)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700 flex items-center shadow-sm"
                >
                    <Plus size={18} className="mr-2" /> Adicionar Novo
                </button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-black">
                    <thead className="text-xs text-gray-900 uppercase bg-gray-100 font-bold">
                        <tr>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Telefone</th>
                            {!roles.includes(UserRole.STUDENT) && <th className="px-6 py-4">REF</th>}
                            {roles.includes(UserRole.STUDENT) && <th className="px-6 py-4">CPF</th>}
                            {!roles.includes(UserRole.STUDENT) && <th className="px-6 py-4">Cargo</th>}
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{user.email}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{user.phone || '-'}</td>
                                {!roles.includes(UserRole.STUDENT) && <td className="px-6 py-4 font-medium text-gray-900">{user.ref || '-'}</td>}
                                {roles.includes(UserRole.STUDENT) && <td className="px-6 py-4 font-medium text-gray-900">{user.cpf || '-'}</td>}
                                {!roles.includes(UserRole.STUDENT) && (
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                                            user.role === UserRole.ANALYST ? 'bg-green-100 text-green-900' : 
                                            user.role === UserRole.SECRETARY ? 'bg-purple-100 text-purple-900' : 'bg-gray-100 text-gray-900'
                                        }`}>
                                            {user.role === UserRole.ANALYST ? 'Analista' : user.role === UserRole.SECRETARY ? 'Secretaria' : 'Outro'}
                                        </span>
                                    </td>
                                )}
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => setEditingUser(user)}
                                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center mx-auto"
                                        title="Editar Usuário"
                                    >
                                        <UserCog size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-900 font-medium">
                                    Nenhum usuário encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>

        {/* Edit Modal (Kept same as before) */}
        {editingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 animate-fade-in overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                        <h3 className="text-xl font-bold text-gray-900">Editar Usuário</h3>
                        <button onClick={() => setEditingUser(null)} className="text-gray-600 hover:text-gray-900">
                            <X size={24} />
                        </button>
                    </div>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-900 mb-1">Nome Completo</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    value={editingUser.name}
                                    onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-900 mb-1">Email</label>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    value={editingUser.email}
                                    onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1">Telefone Fixo</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    value={editingUser.phone || ''}
                                    onChange={e => setEditingUser({...editingUser, phone: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1">Celular</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    value={editingUser.cellphone || ''}
                                    onChange={e => setEditingUser({...editingUser, cellphone: e.target.value})}
                                />
                            </div>
                            
                            {!roles.includes(UserRole.STUDENT) && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-900 mb-1">REF (Registro Funcional)</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                        value={editingUser.ref || ''}
                                        onChange={e => setEditingUser({...editingUser, ref: e.target.value})}
                                    />
                                </div>
                            )}

                            {editingUser.role === UserRole.STUDENT && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1">CPF</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                            value={editingUser.cpf || ''}
                                            onChange={e => setEditingUser({...editingUser, cpf: applyCPFMask(e.target.value)})}
                                            maxLength={14}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1">Data de Nascimento</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <input 
                                                type="date" 
                                                className="col-span-2 w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                                value={editingUser.birthDate || ''}
                                                onChange={e => setEditingUser({...editingUser, birthDate: e.target.value})}
                                            />
                                            <input 
                                                type="text"
                                                readOnly
                                                disabled
                                                className="col-span-1 w-full p-2 border border-gray-300 bg-gray-100 text-gray-900 rounded-lg text-center font-bold"
                                                value={editingUser.birthDate ? `${calculateAge(editingUser.birthDate)} anos` : ''}
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-900 mb-1">Endereço</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                            value={editingUser.address || ''}
                                            onChange={e => setEditingUser({...editingUser, address: e.target.value})}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-900 mb-1">Bairro</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                            value={editingUser.neighborhood || ''}
                                            onChange={e => setEditingUser({...editingUser, neighborhood: e.target.value})}
                                        />
                                    </div>
                                    
                                    {checkMinor(editingUser.birthDate || '') && (
                                        <div className="md:col-span-2 bg-orange-50 p-4 rounded-lg border border-orange-300 mt-2">
                                            <h4 className="font-bold text-orange-900 text-sm mb-2">Dados do Responsável (Menor de Idade)</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-900 mb-1">Nome</label>
                                                    <input 
                                                        type="text" className="w-full p-2 border border-gray-400 rounded text-black font-medium"
                                                        value={editingUser.guardianName || ''}
                                                        onChange={e => setEditingUser({...editingUser, guardianName: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-900 mb-1">CPF</label>
                                                    <input 
                                                        type="text" className="w-full p-2 border border-gray-400 rounded text-black font-medium"
                                                        value={editingUser.guardianCpf || ''}
                                                        onChange={e => setEditingUser({...editingUser, guardianCpf: applyCPFMask(e.target.value)})}
                                                        maxLength={14}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-900 mb-1">Tel</label>
                                                    <input 
                                                        type="text" className="w-full p-2 border border-gray-400 rounded text-black font-medium"
                                                        value={editingUser.guardianPhone || ''}
                                                        onChange={e => setEditingUser({...editingUser, guardianPhone: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-900 mb-1">Email</label>
                                                    <input 
                                                        type="email" className="w-full p-2 border border-gray-400 rounded text-black font-medium"
                                                        value={editingUser.guardianEmail || ''}
                                                        onChange={e => setEditingUser({...editingUser, guardianEmail: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 border border-gray-400 rounded-lg text-gray-900 font-medium hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-sm font-bold"
                            >
                                <Save size={18} className="mr-2" /> Salvar Alterações
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Add User Modal */}
        {isAddUserModalOpen && (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 animate-fade-in overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                        <h3 className="text-xl font-bold text-gray-900">Adicionar Novo Usuário</h3>
                        <button onClick={() => setIsAddUserModalOpen(false)} className="text-gray-600 hover:text-gray-900">
                            <X size={24} />
                        </button>
                    </div>
                    <form onSubmit={handleAddUser} className="space-y-4">
                        {/* ... (Kept same as before) */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-900 mb-2">Função / Cargo</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNewUserRole(UserRole.STUDENT)}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg border ${newUserRole === UserRole.STUDENT ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-300'}`}
                                >
                                    Aluno
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewUserRole(UserRole.ANALYST)}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg border ${newUserRole === UserRole.ANALYST ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-300'}`}
                                >
                                    Analista
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewUserRole(UserRole.SECRETARY)}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg border ${newUserRole === UserRole.SECRETARY ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-300'}`}
                                >
                                    Secretaria
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-900 mb-1">Nome Completo <span className="text-red-600">*</span></label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    value={newUserData.name}
                                    onChange={e => setNewUserData({...newUserData, name: e.target.value})}
                                />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-900 mb-1">E-mail <span className="text-red-600">*</span></label>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    value={newUserData.email}
                                    onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                                />
                            </div>

                            {/* REF Field (Required for Staff) */}
                            {newUserRole !== UserRole.STUDENT && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-900 mb-1">REF (Registro Funcional) <span className="text-red-600">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                        placeholder="Ex: RF-12345"
                                        value={newUserData.ref}
                                        onChange={e => setNewUserData({...newUserData, ref: e.target.value})}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1">Telefone Fixo</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3 top-2.5 text-gray-500" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-9 pr-3 py-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                        placeholder="(11) 3333-0000"
                                        value={newUserData.phone}
                                        onChange={e => setNewUserData({...newUserData, phone: e.target.value})}
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
                                        value={newUserData.cellphone}
                                        onChange={e => setNewUserData({...newUserData, cellphone: e.target.value})}
                                    />
                                </div>
                            </div>

                            {newUserRole === UserRole.STUDENT && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1">CPF</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                            value={newUserData.cpf || ''}
                                            onChange={e => setNewUserData({...newUserData, cpf: applyCPFMask(e.target.value)})}
                                            maxLength={14}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1">Data de Nascimento</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <input 
                                                type="date" 
                                                className="col-span-2 w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                                value={newUserData.birthDate || ''}
                                                onChange={(e) => {
                                                    const date = e.target.value;
                                                    setNewUserData({...newUserData, birthDate: date});
                                                    setIsMinor(checkMinor(date));
                                                }}
                                            />
                                            <input 
                                                type="text"
                                                readOnly
                                                disabled
                                                className="col-span-1 w-full p-2 border border-gray-300 bg-gray-100 text-gray-900 rounded-lg text-center font-bold"
                                                value={newUserData.birthDate ? `${calculateAge(newUserData.birthDate)} anos` : ''}
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-900 mb-1">Endereço (Rua e Nº)</label>
                                        <div className="relative">
                                            <Home size={16} className="absolute left-3 top-2.5 text-gray-500" />
                                            <input 
                                                type="text" 
                                                className="w-full pl-9 pr-3 py-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                                value={newUserData.address || ''}
                                                onChange={e => setNewUserData({...newUserData, address: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-900 mb-1">Bairro</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                            value={newUserData.neighborhood || ''}
                                            onChange={e => setNewUserData({...newUserData, neighborhood: e.target.value})}
                                        />
                                    </div>

                                    {/* GUARDIAN SECTION (CONDITIONAL) */}
                                    {isMinor && (
                                        <div className="md:col-span-2 bg-orange-50 p-4 rounded-lg border border-orange-300 mt-2">
                                            <h4 className="font-bold text-orange-900 text-sm mb-2">Dados do Responsável (Menor de Idade)</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-900 mb-1">Nome</label>
                                                    <input 
                                                        type="text" className="w-full p-2 border border-gray-400 rounded text-black font-medium"
                                                        value={newUserData.guardianName}
                                                        onChange={e => setNewUserData({...newUserData, guardianName: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-900 mb-1">CPF</label>
                                                    <input 
                                                        type="text" className="w-full p-2 border border-gray-400 rounded text-black font-medium"
                                                        value={newUserData.guardianCpf}
                                                        onChange={e => setNewUserData({...newUserData, guardianCpf: applyCPFMask(e.target.value)})}
                                                        maxLength={14}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-900 mb-1">Tel</label>
                                                    <input 
                                                        type="text" className="w-full p-2 border border-gray-400 rounded text-black font-medium"
                                                        value={newUserData.guardianPhone}
                                                        onChange={e => setNewUserData({...newUserData, guardianPhone: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-900 mb-1">Email</label>
                                                    <input 
                                                        type="email" className="w-full p-2 border border-gray-400 rounded text-black font-medium"
                                                        value={newUserData.guardianEmail}
                                                        onChange={e => setNewUserData({...newUserData, guardianEmail: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setIsAddUserModalOpen(false)}
                                className="px-4 py-2 border border-gray-400 rounded-lg text-gray-900 font-medium hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-sm font-bold"
                            >
                                <Plus size={18} className="mr-2" /> Cadastrar Usuário
                            </button>
                        </div>
                    </form>
                </div>
             </div>
        )}
      </div>
    );
  };

  // --- VIEW: USER AUDIT ---
  const renderUserAudit = () => {
      const filteredLogs = auditLogs.filter(log => 
          log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
          log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
          log.details.toLowerCase().includes(auditSearch.toLowerCase())
      );

      return (
        <div className="space-y-6 animate-fade-in">
             <button onClick={() => setCurrentView('MENU')} className="flex items-center text-gray-600 hover:text-blue-600 font-medium">
                <ArrowLeft size={20} className="mr-2" /> Voltar ao Menu
            </button>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <ShieldCheck className="mr-3 text-teal-600" /> Auditoria de Usuários
                </h2>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                    <input 
                    type="text" 
                    placeholder="Filtrar logs..." 
                    className="pl-10 pr-4 py-2 border border-gray-400 rounded-full focus:ring-2 focus:ring-teal-500 outline-none w-full shadow-sm bg-white text-gray-900 placeholder-gray-500 font-medium"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-black">
                        <thead className="text-xs text-gray-900 uppercase bg-teal-50 font-bold border-b border-teal-100">
                            <tr>
                                <th className="px-6 py-4">Data/Hora</th>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Cargo</th>
                                <th className="px-6 py-4">Ação</th>
                                <th className="px-6 py-4">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{log.userName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                                            log.userRole === UserRole.COORDINATOR ? 'bg-indigo-100 text-indigo-900' :
                                            log.userRole === UserRole.SECRETARY ? 'bg-purple-100 text-purple-900' :
                                            log.userRole === UserRole.ANALYST ? 'bg-green-100 text-green-900' :
                                            'bg-cyan-100 text-cyan-900'
                                        }`}>{log.userRole}</span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-700">{log.action}</td>
                                    <td className="px-6 py-4 text-gray-800">{log.details}</td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Nenhum registro encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  };


  return (
    <div className="space-y-6">
      {/* Dynamic Content Rendering */}
      {currentView === 'MENU' && renderMenu()}
      {currentView === 'OVERVIEW' && renderOverview()}
      {currentView === 'WAITLIST' && renderWaitlist()}
      {currentView === 'MODALITIES' && renderModalities()}
      {currentView === 'AUDIT' && renderAudit()}
      {currentView === 'REQUESTS' && renderRequests()}
      {currentView === 'MANAGE_STUDENTS' && renderUserManagement([UserRole.STUDENT], 'Gestão de Alunos')}
      {currentView === 'MANAGE_STAFF' && renderUserManagement([UserRole.SECRETARY, UserRole.ANALYST], 'Gestão de Equipe')}
      {currentView === 'USER_AUDIT' && renderUserAudit()}
      {currentView === 'SPACE_MANAGEMENT' && renderSpaceManagement()}
    </div>
  );
};

export default CoordinatorDashboard;