
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EnrollmentStatus, ClassStatus, SportClass, RequestStatus, RequestType } from '../types';
import { ClipboardList, Users, Clock, Save, Plus, X, MapPin, Calendar, Edit, AlertCircle, CheckCircle, Bell } from 'lucide-react';
import { LOCATIONS } from '../constants';

const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const HOURS = Array.from({ length: 17 }, (_, i) => (i + 6).toString().padStart(2, '0')); // 06 to 22
const MINUTES = ['00', '30'];

const AnalystDashboard: React.FC = () => {
  const { classes, enrollments, currentUser, submitAttendance, requestClassCreation, requestClassUpdate, updateRequests, notifications, markNotificationAsRead } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({});
  
  // State for creating or editing class
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  
  // State for notifications
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Time selection state
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');

  const [classFormData, setClassFormData] = useState<Partial<SportClass>>({
    title: '',
    modality: '',
    days: [],
    time: '',
    location: '',
    capacity: 20,
    minAge: 10,
    maxAge: 18,
    description: ''
  });

  // Filter classes belonging to this analyst
  const myClasses = classes.filter(c => c.analystId === currentUser?.id);
  const myRequests = updateRequests.filter(r => r.analystId === currentUser?.id && r.status === RequestStatus.PENDING);
  
  // Filter notifications for this analyst
  const myNotifications = notifications.filter(n => n.recipientId === currentUser?.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = myNotifications.filter(n => !n.read).length;

  // Update time string whenever selectors change
  useEffect(() => {
    const formattedTime = `${startHour}:${startMinute} - ${endHour}:${endMinute}`;
    setClassFormData(prev => ({ ...prev, time: formattedTime }));
  }, [startHour, startMinute, endHour, endMinute]);

  const handleClassSelect = (id: string) => {
    setSelectedClassId(id);
    setIsFormOpen(false);
    // Reset attendance state
    const classEnrollments = enrollments.filter(e => e.classId === id && e.status === EnrollmentStatus.CONFIRMED);
    const initial = {};
    classEnrollments.forEach(e => {
      // @ts-ignore
      initial[e.studentId] = false; 
    });
    setAttendanceState(initial);
  };

  const parseTimeAndSetState = (timeString: string) => {
    try {
        // Expected format "HH:MM - HH:MM"
        const [start, end] = timeString.split('-').map(s => s.trim());
        const [sH, sM] = start.split(':');
        const [eH, eM] = end.split(':');
        
        setStartHour(sH || '09');
        setStartMinute(sM || '00');
        setEndHour(eH || '10');
        setEndMinute(eM || '00');
    } catch (e) {
        // Fallback defaults
        setStartHour('09');
        setStartMinute('00');
        setEndHour('10');
        setEndMinute('00');
    }
  };

  const openCreateForm = () => {
    setFormMode('create');
    setEditingClassId(null);
    setStartHour('09');
    setStartMinute('00');
    setEndHour('10');
    setEndMinute('00');
    
    setClassFormData({
        title: '',
        modality: '',
        days: [],
        time: '09:00 - 10:00',
        location: '',
        capacity: 20,
        minAge: 10,
        maxAge: 18,
        description: ''
    });
    setIsFormOpen(true);
  };

  const openEditForm = (cls: SportClass) => {
    setFormMode('edit');
    setEditingClassId(cls.id);
    parseTimeAndSetState(cls.time);
    
    setClassFormData({
        title: cls.title,
        modality: cls.modality,
        days: cls.days,
        time: cls.time,
        location: cls.location,
        capacity: cls.capacity,
        minAge: cls.minAge,
        maxAge: cls.maxAge,
        description: cls.description || ''
    });
    setIsFormOpen(true);
  };

  const togglePresence = (studentId: string) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const saveAttendance = () => {
    if (!selectedClassId) return;
    const records = Object.entries(attendanceState).map(([studentId, present]) => ({
      studentId,
      present
    }));
    submitAttendance(selectedClassId, new Date().toISOString().split('T')[0], records);
    alert('Frequência salva com sucesso!');
    setSelectedClassId(null);
  };

  // Create/Edit Class Handlers
  const handleDayToggle = (day: string) => {
    setClassFormData(prev => {
      const currentDays = prev.days || [];
      if (currentDays.includes(day)) {
        return { ...prev, days: currentDays.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...currentDays, day] };
      }
    });
  };

  const handleSubmitClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    // Basic validation
    if (!classFormData.title || !classFormData.modality || !classFormData.days?.length || !classFormData.location) {
      alert('Por favor, preencha todos os campos obrigatórios, incluindo o Local.');
      return;
    }

    // Time Validation
    const startVal = parseInt(startHour + startMinute);
    const endVal = parseInt(endHour + endMinute);
    
    if (endVal <= startVal) {
        alert('O horário de término deve ser posterior ao horário de início.');
        return;
    }

    if (formMode === 'create') {
        const newClass: SportClass = {
          id: Math.random().toString(36).substr(2, 9),
          title: classFormData.title || 'Nova Turma',
          modality: classFormData.modality || 'Geral',
          analystId: currentUser.id,
          analystName: currentUser.name,
          days: classFormData.days || [],
          time: classFormData.time || '00:00',
          location: classFormData.location || 'A definir',
          capacity: Number(classFormData.capacity) || 20,
          minAge: Number(classFormData.minAge) || 10,
          maxAge: Number(classFormData.maxAge) || 99,
          description: classFormData.description,
          status: ClassStatus.ACTIVE,
          enrolledCount: 0,
          waitingListCount: 0,
          createdAt: new Date().toISOString()
        };
        // Changed to Request flow
        requestClassCreation(newClass);
        alert('Solicitação de NOVA TURMA enviada ao Coordenador para aprovação.');
    } else {
        // Edit Mode - Send Request
        if (editingClassId) {
            requestClassUpdate(editingClassId, classFormData);
            alert('Solicitação de ALTERAÇÃO enviada ao Coordenador para aprovação.');
        }
    }

    setIsFormOpen(false);
  };

  // --- View: Attendance Form ---
  if (selectedClassId) {
    const activeClass = classes.find(c => c.id === selectedClassId);
    const students = enrollments
      .filter(e => e.classId === selectedClassId && e.status === EnrollmentStatus.CONFIRMED)
      .map(e => ({ id: e.studentId, name: e.studentName }));

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{activeClass?.title}</h2>
            <p className="text-gray-500 text-sm">Registro de Frequência - {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <button onClick={() => setSelectedClassId(null)} className="text-gray-500 hover:text-gray-700">
            Voltar
          </button>
        </div>

        <div className="space-y-2 mb-8">
          {students.map(student => (
            <div key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50 border rounded-lg transition-colors">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mr-3">
                  {student.name.charAt(0)}
                </div>
                <span className="font-medium text-gray-900">{student.name}</span>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={attendanceState[student.id] || false}
                  onChange={() => togglePresence(student.id)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {attendanceState[student.id] ? 'Presente' : 'Ausente'}
                </span>
              </label>
            </div>
          ))}
          {students.length === 0 && <p className="text-center text-gray-400 py-8">Nenhum aluno matriculado nesta turma.</p>}
        </div>

        <div className="flex justify-end">
          <button 
            onClick={saveAttendance}
            className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            <Save size={18} className="mr-2" /> Salvar Frequência
          </button>
        </div>
      </div>
    );
  }

  // --- View: Create/Edit Class Form ---
  if (isFormOpen) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">
              {formMode === 'create' ? 'Solicitar Criação de Turma' : 'Solicitar Edição de Turma'}
          </h2>
          <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start text-yellow-800 text-sm">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            <p>
              {formMode === 'create' 
                ? 'A nova turma só ficará visível após a aprovação da Coordenação.' 
                : 'As alterações feitas aqui não serão aplicadas imediatamente. Elas serão enviadas para aprovação.'}
            </p>
        </div>

        <form onSubmit={handleSubmitClass} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-1">Nome da Turma / Atividade</label>
              <input 
                type="text" 
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                placeholder="Ex: Futsal Sub-17"
                value={classFormData.title}
                onChange={e => setClassFormData({...classFormData, title: e.target.value})}
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-1">Descrição Detalhada</label>
              <textarea 
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                placeholder="Descreva a atividade, equipamentos necessários, etc."
                value={classFormData.description}
                onChange={e => setClassFormData({...classFormData, description: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Modalidade</label>
              <input 
                type="text" 
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                placeholder="Ex: Futsal, Natação, Dança"
                value={classFormData.modality}
                onChange={e => setClassFormData({...classFormData, modality: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Local da Aula</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <select 
                  required
                  className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                  value={classFormData.location || ''}
                  onChange={e => setClassFormData({...classFormData, location: e.target.value})}
                >
                    <option value="">Selecione um local...</option>
                    {LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-2">Horário da Atividade</label>
              <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-bold text-sm">De:</span>
                    <select 
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {HOURS.map(h => <option key={`s-h-${h}`} value={h}>{h}</option>)}
                    </select>
                    <span className="font-bold">:</span>
                    <select 
                        value={startMinute}
                        onChange={(e) => setStartMinute(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {MINUTES.map(m => <option key={`s-m-${m}`} value={m}>{m}</option>)}
                    </select>
                </div>

                <div className="hidden md:block text-gray-400 font-bold">até</div>

                <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-bold text-sm md:hidden">Até:</span>
                    <select 
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {HOURS.map(h => <option key={`e-h-${h}`} value={h}>{h}</option>)}
                    </select>
                    <span className="font-bold">:</span>
                    <select 
                        value={endMinute}
                        onChange={(e) => setEndMinute(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {MINUTES.map(m => <option key={`e-m-${m}`} value={m}>{m}</option>)}
                    </select>
                </div>
                
                <div className="ml-auto text-sm text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded">
                    {startHour}:{startMinute} - {endHour}:{endMinute}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Capacidade (Vagas)</label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                  value={classFormData.capacity}
                  onChange={e => setClassFormData({...classFormData, capacity: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Idade Mínima</label>
              <input 
                type="number" 
                required
                min="0"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                value={classFormData.minAge}
                onChange={e => setClassFormData({...classFormData, minAge: parseInt(e.target.value)})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Idade Máxima</label>
              <input 
                type="number" 
                required
                min="0"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                value={classFormData.maxAge}
                onChange={e => setClassFormData({...classFormData, maxAge: parseInt(e.target.value)})}
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">Dias da Semana</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      classFormData.days?.includes(day)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button 
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-2 mr-4 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm flex items-center"
            >
              {formMode === 'create' ? <Plus size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
              {formMode === 'create' ? 'Solicitar Criação' : 'Solicitar Alteração'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- View: Dashboard List ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Painel do Analista</h2>
        
        <div className="flex items-center gap-4">
             {/* NOTIFICATIONS BELL */}
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

            <button 
            onClick={openCreateForm}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm"
            >
            <Plus size={20} className="mr-2" /> Nova Turma
            </button>
        </div>
      </div>
      
      {myRequests.length > 0 && (
         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
             <h3 className="text-yellow-800 font-bold text-sm mb-2 flex items-center">
                 <Clock size={16} className="mr-2" /> Solicitações Pendentes
             </h3>
             <ul className="text-sm text-yellow-700 space-y-1">
                 {myRequests.map(req => (
                     <li key={req.id}>
                       • {req.requestType === RequestType.CREATE ? 'Criação de' : 'Alteração em'} <strong>{req.classTitle}</strong> aguardando aprovação.
                     </li>
                 ))}
             </ul>
         </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myClasses.map(cls => {
            // Check if there are updates pending for this class
            const hasPendingRequest = myRequests.some(r => r.classId === cls.id && r.requestType === RequestType.UPDATE);

            return (
                <div key={cls.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
                    {hasPendingRequest && (
                        <div className="absolute top-2 right-2" title="Alteração pendente">
                            <Clock className="text-yellow-500" size={20} />
                        </div>
                    )}
                    <div className="flex justify-between items-start mb-4 pr-6">
                    <h3 className="text-xl font-bold text-gray-900">{cls.title}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-semibold">{cls.modality}</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                    <p className="flex items-center text-gray-700"><Clock size={16} className="mr-2 text-gray-400" /> {cls.days.join('/')} • {cls.time}</p>
                    <p className="flex items-center text-gray-700"><MapPin size={16} className="mr-2 text-gray-400" /> {cls.location}</p>
                    <p className="flex items-center text-gray-700"><Users size={16} className="mr-2 text-gray-400" /> {cls.enrolledCount} / {cls.capacity} Alunos</p>
                    <p className="flex items-center text-gray-700"><Calendar size={16} className="mr-2 text-gray-400" /> {cls.minAge} a {cls.maxAge} anos</p>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleClassSelect(cls.id)}
                            className="flex-1 flex justify-center items-center bg-white border-2 border-blue-500 text-blue-600 py-2 rounded-lg hover:bg-blue-50 font-medium transition-colors text-sm"
                        >
                            <ClipboardList size={16} className="mr-2" /> Frequência
                        </button>
                        <button 
                            onClick={() => openEditForm(cls)}
                            disabled={hasPendingRequest}
                            className={`flex justify-center items-center border-2 py-2 px-3 rounded-lg font-medium transition-colors ${
                                hasPendingRequest 
                                ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            title={hasPendingRequest ? 'Aguardando aprovação' : 'Editar Turma'}
                        >
                            <Edit size={16} />
                        </button>
                    </div>
                </div>
            );
        })}
        {myClasses.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed">
            <p className="mb-4">Você não possui turmas ativas.</p>
            {myRequests.length > 0 && <p className="text-xs text-yellow-600">(Você tem solicitações pendentes)</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalystDashboard;
