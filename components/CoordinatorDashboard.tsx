import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, AlertTriangle, ClipboardCheck, Calendar, Search, ArrowRight, CheckCircle, XCircle, Clock, PlusSquare, Eye, ArrowLeft, Mail, Phone, FileText, LayoutGrid, ListOrdered, ChevronRight, BarChart2, Bell, GraduationCap, Briefcase, UserCog, Save, X, Plus, Smartphone, Home, ShieldCheck, Activity, LayoutTemplate, AlertOctagon, Trash2 } from 'lucide-react';
import { RequestStatus, RequestType, EnrollmentStatus, UserRole, User, SportClass } from '../types';
import { LOCATIONS } from '../constants';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

type DashboardView = 'MENU' | 'OVERVIEW' | 'WAITLIST' | 'MODALITIES' | 'AUDIT' | 'REQUESTS' | 'MANAGE_STUDENTS' | 'MANAGE_STAFF' | 'USER_AUDIT' | 'SPACE_MANAGEMENT';

const CoordinatorDashboard: React.FC = () => {
  const { classes, enrollments, attendance, users, updateRequests, resolveUpdateRequest, updateUser, addUser, deleteUser, auditLogs, notifications, markNotificationAsRead, currentUser } = useApp();
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
  const totalEnrolled = enrollments.filter(e => e.status === EnrollmentStatus.CONFIRMED).length; 
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
    name: c.title.split(' ')[0], // Short name
    Vagas: c.capacity,
    Matriculados: c.enrolledCount
  })).slice(0, 10); // Limit for chart readability

  // --- Attendance Audit Logic ---
  const [selectedAnalystId, setSelectedAnalystId] = useState<string>('');
  const [selectedAuditClassId, setSelectedAuditClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const analysts = users.filter(u => u.role === UserRole.ANALYST);
  // unused for now: const filteredAuditClasses = classes.filter(c => selectedAnalystId ? c.analystId === selectedAnalystId : true);
  
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

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center">
            <button onClick={() => setCurrentView('MENU')} className="mr-4 text-gray-600 hover:text-blue-600">
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <p className="text-gray-900 text-sm font-bold">Taxa de Ocupação</p>
                <h3 className="text-3xl font-extrabold text-black">{occupancyRate}%</h3>
                <p className="text-xs text-gray-500">{totalEnrolled} de {totalSpots} vagas</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
                <p className="text-gray-900 text-sm font-bold">Fila de Espera</p>
                <h3 className="text-3xl font-extrabold text-black">{waitlistTotal}</h3>
                <p className="text-xs text-gray-500">Alunos aguardando</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                <p className="text-gray-900 text-sm font-bold">Solicitações Pendentes</p>
                <h3 className="text-3xl font-extrabold text-black">{pendingRequests.length}</h3>
                <p className="text-xs text-gray-500">Requerem atenção</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                <p className="text-gray-900 text-sm font-bold">Alunos Ativos</p>
                <h3 className="text-3xl font-extrabold text-black">{totalEnrolled}</h3>
                <p className="text-xs text-gray-500">Matrículas confirmadas</p>
            </div>
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
                                                        <span className="capitalize">{key}:</span> {Array.isArray(value) ? value.join(', ') : value.toString()}
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
                    <h2 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h2>
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
      
      {pendingRequests.length > 0 && (
         <div 
            onClick={() => setCurrentView('REQUESTS')}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 cursor-pointer hover:bg-yellow-100 transition-colors flex items-center justify-between"
         >
             <div className="flex items-center">
                <AlertTriangle className="text-yellow-600 mr-3" size={24} />
                <div>
                    <h3 className="text-yellow-800 font-bold">Atenção Necessária</h3>
                    <p className="text-yellow-700 text-sm">Existem {pendingRequests.length} solicitações aguardando sua aprovação.</p>
                </div>
             </div>
             <ArrowRight className="text-yellow-600" />
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <button onClick={() => setCurrentView('OVERVIEW')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all text-left group">
            <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <BarChart2 className="text-blue-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Visão Geral</h3>
            <p className="text-gray-600 text-sm mt-1">Estatísticas e indicadores.</p>
        </button>

        <button onClick={() => setCurrentView('REQUESTS')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-yellow-300 transition-all text-left group">
            <div className="bg-yellow-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-100 transition-colors">
                <ClipboardCheck className="text-yellow-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Solicitações</h3>
            <p className="text-gray-600 text-sm mt-1">Aprovar turmas e vagas.</p>
        </button>

        <button onClick={() => setCurrentView('AUDIT')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-400 transition-all text-left group">
            <div className="bg-gray-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                <ShieldCheck className="text-gray-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Auditoria</h3>
            <p className="text-gray-600 text-sm mt-1">Logs de sistema.</p>
        </button>

        <button onClick={() => setCurrentView('MANAGE_STUDENTS')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all text-left group">
            <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                <GraduationCap className="text-green-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Alunos</h3>
            <p className="text-gray-600 text-sm mt-1">Gerenciar cadastros.</p>
        </button>

        <button onClick={() => setCurrentView('MANAGE_STAFF')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all text-left group">
            <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                <Briefcase className="text-purple-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Equipe</h3>
            <p className="text-gray-600 text-sm mt-1">Analistas e Secretaria.</p>
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
      {/* Fallback for not implemented views in this simplified example */}
      {(currentView !== 'MENU' && currentView !== 'OVERVIEW' && currentView !== 'AUDIT' && currentView !== 'REQUESTS') && (
         <div className="text-center p-12">
            <button onClick={() => setCurrentView('MENU')} className="mb-4 text-blue-600 flex items-center justify-center mx-auto font-bold"><ArrowLeft className="mr-2"/> Voltar</button>
            <h2 className="text-xl text-gray-500">Módulo em desenvolvimento...</h2>
         </div>
      )}
    </div>
  );
};

export default CoordinatorDashboard;