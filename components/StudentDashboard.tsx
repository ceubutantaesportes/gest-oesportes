
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EnrollmentStatus } from '../types';
import { Calendar, Clock, MapPin, User as UserIcon, Filter, AlertCircle, CheckCircle, ArrowLeft, Info, Map, Trash2, LogOut } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { classes, enrollments, currentUser, cancelEnrollment } = useApp();
  const [filter, setFilter] = useState('');
  
  // Persist selected class view in Local Storage
  const [selectedClassId, setSelectedClassId] = useState<string | null>(() => {
    return localStorage.getItem('student_selected_class');
  });

  useEffect(() => {
    if (selectedClassId) {
        localStorage.setItem('student_selected_class', selectedClassId);
    } else {
        localStorage.removeItem('student_selected_class');
    }
  }, [selectedClassId]);

  const myEnrollments = enrollments.filter(e => e.studentId === currentUser?.id);
  
  const filteredClasses = classes.filter(c => 
    c.title.toLowerCase().includes(filter.toLowerCase()) || 
    c.modality.toLowerCase().includes(filter.toLowerCase())
  );

  // Derived state for the selected class
  const selectedClass = selectedClassId ? classes.find(c => c.id === selectedClassId) : null;

  const handleCancelMyEnrollment = (enrollmentId: string) => {
    if (window.confirm("Tem certeza que deseja cancelar sua inscrição nesta atividade?")) {
        const result = cancelEnrollment(enrollmentId);
        if (result.success) {
            alert("Inscrição cancelada com sucesso.");
            // Opcional: Voltar para a lista ou manter na tela atualizada
        }
    }
  };

  // --- DETAIL VIEW ---
  if (selectedClass) {
    const enrollment = myEnrollments.find(e => e.classId === selectedClass.id);
    const isEnrolled = !!enrollment;
    const isFull = selectedClass.enrolledCount >= selectedClass.capacity;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white">
          <button 
            onClick={() => setSelectedClassId(null)}
            className="flex items-center text-blue-100 hover:text-white mb-4 transition-colors font-medium"
            type="button"
          >
            <ArrowLeft size={20} className="mr-2" /> Voltar para lista
          </button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-blue-500 text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider mb-2 inline-block">
                {selectedClass.modality}
              </span>
              <h1 className="text-3xl font-bold">{selectedClass.title}</h1>
            </div>
            
            {/* Status Badge in Header */}
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">
              <div className="flex flex-col items-center">
                 <span className="text-xs uppercase opacity-80 font-bold tracking-wider">Situação da Matrícula</span>
                 {isEnrolled ? (
                    <div className="mt-1 flex flex-col items-center">
                        <span className={`font-bold text-lg ${
                            enrollment?.status === EnrollmentStatus.CONFIRMED ? 'text-green-300' : 'text-yellow-300'
                        }`}>
                            {enrollment?.status === EnrollmentStatus.CONFIRMED ? 'Confirmada' : 'Lista de Espera'}
                        </span>
                    </div>
                 ) : (
                    <span className="font-bold text-lg text-white mt-1">Não Matriculado</span>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-gray-900 mb-2 text-sm font-bold uppercase tracking-wide">
                <Clock size={16} className="mr-2 text-blue-500" /> Horários
              </div>
              <p className="font-medium text-black text-lg">{selectedClass.days.join(' / ')}</p>
              <p className="text-black">{selectedClass.time}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-gray-900 mb-2 text-sm font-bold uppercase tracking-wide">
                <MapPin size={16} className="mr-2 text-blue-500" /> Local
              </div>
              <p className="font-medium text-black text-lg">{selectedClass.location}</p>
              <p className="text-black text-sm">CEU Butantã</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-gray-900 mb-2 text-sm font-bold uppercase tracking-wide">
                <UserIcon size={16} className="mr-2 text-blue-500" /> Responsável
              </div>
              <p className="font-medium text-black text-lg">{selectedClass.analystName}</p>
              <p className="text-black text-sm">Analista de Esportes</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-gray-900 mb-2 text-sm font-bold uppercase tracking-wide">
                <Calendar size={16} className="mr-2 text-blue-500" /> Faixa Etária
              </div>
              <p className="font-medium text-black text-lg">{selectedClass.minAge} a {selectedClass.maxAge} anos</p>
              <p className="text-black text-sm">Idade obrigatória</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Description */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Info className="mr-2 text-gray-400" /> Sobre a Atividade
              </h2>
              <div className="prose text-gray-800 leading-relaxed">
                <p>
                  {selectedClass.description || "Nenhuma descrição detalhada informada para esta atividade. Entre em contato com a secretaria para mais informações."}
                </p>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2">Observações Importantes</h3>
                <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm font-medium">
                  <li>O uso de roupa adequada para a prática esportiva é obrigatório.</li>
                  <li>Chegue com 10 minutos de antecedência.</li>
                  <li>Atestado médico atualizado é necessário para confirmação da matrícula na secretaria.</li>
                </ul>
              </div>
            </div>

            {/* Right Column: Enrollment Status */}
            <div className="lg:col-span-1">
               <div className="bg-white border rounded-xl shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Disponibilidade</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">Vagas Preenchidas</span>
                        <span className="font-bold text-gray-900">{selectedClass.enrolledCount} / {selectedClass.capacity}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} 
                          style={{ width: `${Math.min(100, (selectedClass.enrolledCount / selectedClass.capacity) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                         <span className="text-gray-700 font-medium">Lista de Espera</span>
                         <span className="font-bold text-gray-900">{selectedClass.waitingListCount} aguardando</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    {isEnrolled && enrollment ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col items-center">
                          <div className="flex items-center text-green-800 font-bold mb-3 text-sm">
                             <CheckCircle className="mr-2" size={18} /> Você está inscrito!
                          </div>
                          <button 
                             onClick={() => handleCancelMyEnrollment(enrollment.id)}
                             className="text-red-600 hover:text-red-800 text-xs font-bold hover:underline bg-white px-4 py-2 rounded-full border border-red-200 shadow-sm flex items-center transition-colors hover:bg-red-50"
                          >
                             <LogOut size={14} className="mr-1" /> Cancelar/Sair da Turma
                          </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        {isFull ? (
                          <>
                            <div className="mb-3 text-orange-600 font-bold flex items-center justify-center text-sm">
                                <AlertCircle size={16} className="mr-1" /> Turma cheia. Inscrição irá para fila.
                            </div>
                            <button disabled className="w-full bg-orange-100 text-orange-800 py-3 rounded-lg font-bold opacity-75 cursor-not-allowed">
                                Entrar na Fila (Apenas Presencial)
                            </button>
                            <p className="text-xs text-gray-500 mt-2 font-medium">Compareça à secretaria para entrar na fila.</p>
                          </>
                        ) : (
                          <>
                            <div className="mb-4 text-green-700 font-bold flex items-center justify-center text-sm">
                                <CheckCircle size={16} className="mr-1" /> Vagas disponíveis
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                <h4 className="text-blue-900 font-bold text-sm mb-2 flex items-center justify-center">
                                    <Map size={16} className="mr-2"/> Matrícula Presencial
                                </h4>
                                <p className="text-blue-800 text-xs font-medium leading-relaxed">
                                    Para realizar sua matrícula, compareça à secretaria do CEU Butantã portando:
                                </p>
                                <ul className="text-left text-blue-800 text-xs mt-2 space-y-1 list-disc list-inside">
                                    <li>Documento de Identidade (RG/CPF)</li>
                                    <li>Comprovante de Endereço</li>
                                    <li>Atestado Médico (Dermatológico para piscinas)</li>
                                </ul>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- MAIN LIST VIEW ---
  return (
    <div className="space-y-8">
      {/* My Enrollments Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <UserIcon className="mr-2 text-blue-600" /> Minhas Matrículas
        </h2>
        {myEnrollments.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-500 border border-gray-100 font-medium">
            Você ainda não está matriculado em nenhuma atividade.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myEnrollments.map(enrollment => {
              const classInfo = classes.find(c => c.id === enrollment.classId);
              if (!classInfo) return null;
              return (
                <div key={enrollment.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 relative group hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{classInfo.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                      enrollment.status === EnrollmentStatus.CONFIRMED ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {enrollment.status === EnrollmentStatus.CONFIRMED ? 'Matriculado' : 'Lista de Espera'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1 mb-3 font-medium">
                    <p className="flex items-center"><Clock size={14} className="mr-2 text-gray-400" /> {classInfo.days.join('/')} • {classInfo.time}</p>
                    <p className="flex items-center"><MapPin size={14} className="mr-2 text-gray-400" /> {classInfo.location}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                        onClick={() => setSelectedClassId(classInfo.id)}
                        className="text-blue-600 text-sm font-bold hover:underline flex items-center flex-1"
                        type="button"
                    >
                        Ver detalhes
                    </button>
                    <button
                        onClick={() => handleCancelMyEnrollment(enrollment.id)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                        title="Cancelar Matrícula"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Class Catalog Section */}
      <section>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Turmas Disponíveis</h2>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtrar modalidade..." 
              className="pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm bg-white text-gray-900 font-medium"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map(cls => {
            const isFull = cls.enrolledCount >= cls.capacity;

            return (
              <div key={cls.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden flex flex-col h-full">
                <div className="bg-blue-600 h-1.5"></div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-gray-900 line-clamp-1" title={cls.title}>{cls.title}</h3>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold whitespace-nowrap ml-2">{cls.modality}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-700 mb-4 flex-1 font-medium">
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2 text-blue-500 flex-shrink-0" />
                      <span>{cls.days.join(' / ')} • {cls.time}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-2 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{cls.location}</span>
                    </div>
                    <div className="flex items-center">
                      <UserIcon size={16} className="mr-2 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{cls.analystName}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2 text-blue-500 flex-shrink-0" />
                      <span>{cls.minAge} a {cls.maxAge} anos</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t mt-auto">
                    <div className="text-xs">
                      {isFull ? (
                        <span className="text-orange-600 font-bold flex items-center">
                          <AlertCircle size={14} className="mr-1" /> Lista de Espera ({cls.waitingListCount})
                        </span>
                      ) : (
                        <span className="text-green-600 font-bold flex items-center">
                          <CheckCircle size={14} className="mr-1" /> Vagas Abertas ({cls.capacity - cls.enrolledCount})
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setSelectedClassId(cls.id)}
                      className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
                      type="button"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
