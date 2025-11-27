
import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { UserRole, User } from './types';
import StudentDashboard from './components/StudentDashboard';
import SecretaryDashboard from './components/SecretaryDashboard';
import AnalystDashboard from './components/AnalystDashboard';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import UserProfileModal from './components/UserProfileModal';
import { Menu, LogOut, LayoutDashboard, User as UserIcon, ShieldCheck, Mail, Lock, AlertCircle, Eye, EyeOff, UserCog, UserPlus, ArrowLeft, Calendar, FileText, Phone } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { login, addUser, users } = useApp();
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration State
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  
  // Guardian State (for minors)
  const [isMinor, setIsMinor] = useState(false);
  const [regGuardianName, setRegGuardianName] = useState('');
  const [regGuardianCpf, setRegGuardianCpf] = useState('');
  const [regGuardianPhone, setRegGuardianPhone] = useState('');

  // Helper to calculate age
  useEffect(() => {
    if (regBirthDate) {
      const today = new Date();
      const birth = new Date(regBirthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
      }
      setIsMinor(age < 18);
    }
  }, [regBirthDate]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(email, password);
    if (!success) {
      setError('E-mail ou senha inválidos.');
    }
  };

  const applyCPFMask = (value: string) => {
    let v = value.replace(/\D/g, "");
    v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return v;
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (regPassword !== regConfirmPassword) {
        setError('As senhas não coincidem.');
        return;
    }
    if (regPassword.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    if (users.some(u => u.email === regEmail)) {
        setError('Este e-mail já está cadastrado.');
        return;
    }
    if (isMinor && (!regGuardianName || !regGuardianCpf || !regGuardianPhone)) {
        setError('Para menores de 18 anos, os dados do responsável são obrigatórios.');
        return;
    }

    // Create User
    const newUser: User = {
        id: `u_self_${Date.now()}`,
        role: UserRole.STUDENT,
        name: regName,
        email: regEmail,
        password: regPassword,
        cpf: regCpf,
        birthDate: regBirthDate,
        cellphone: regPhone,
        guardianName: isMinor ? regGuardianName : undefined,
        guardianCpf: isMinor ? regGuardianCpf : undefined,
        guardianPhone: isMinor ? regGuardianPhone : undefined,
        guardianEmail: isMinor ? regEmail : undefined // Fallback
    };

    addUser(newUser);
    // Auto login
    login(regEmail, regPassword);
  };

  // Helper to fill form for demo purposes
  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('123456');
    setError('');
  };

  if (isRegistering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl animate-fade-in overflow-y-auto max-h-[90vh]">
            <div className="mb-6">
                <button 
                    onClick={() => setIsRegistering(false)}
                    className="flex items-center text-gray-500 hover:text-blue-600 transition-colors text-sm font-bold mb-4"
                >
                    <ArrowLeft size={16} className="mr-1" /> Voltar para Login
                </button>
                <h1 className="text-2xl font-extrabold text-gray-900">Cadastro de Aluno</h1>
                <p className="text-gray-500 text-sm">Preencha seus dados para acessar o CEU Butantã.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center mb-6 border border-red-200 font-bold">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0" /> {error}
                </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                required
                                value={regName}
                                onChange={e => setRegName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 font-medium"
                                placeholder="Seu nome completo"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">CPF</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                required
                                value={regCpf}
                                onChange={e => setRegCpf(applyCPFMask(e.target.value))}
                                maxLength={14}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 font-medium"
                                placeholder="000.000.000-00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Data de Nascimento</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                required
                                value={regBirthDate}
                                onChange={e => setRegBirthDate(e.target.value)}
                                className="w-full pl-3 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 font-medium"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Celular / WhatsApp</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                required
                                value={regPhone}
                                onChange={e => setRegPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 font-medium"
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">E-mail (Login)</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="email" 
                                required
                                value={regEmail}
                                onChange={e => setRegEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 font-medium"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                required
                                value={regPassword}
                                onChange={e => setRegPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 font-medium"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                required
                                value={regConfirmPassword}
                                onChange={e => setRegConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 font-medium"
                                placeholder="Repita a senha"
                            />
                        </div>
                    </div>
                </div>

                {isMinor && (
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mt-4">
                        <h3 className="text-orange-900 font-bold text-sm mb-3 flex items-center">
                            <ShieldCheck size={18} className="mr-2"/> Dados do Responsável (Menor de 18 anos)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-800 mb-1">Nome do Responsável</label>
                                <input 
                                    type="text" 
                                    required={isMinor}
                                    value={regGuardianName}
                                    onChange={e => setRegGuardianName(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">CPF do Responsável</label>
                                <input 
                                    type="text" 
                                    required={isMinor}
                                    value={regGuardianCpf}
                                    onChange={e => setRegGuardianCpf(applyCPFMask(e.target.value))}
                                    maxLength={14}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Celular do Responsável</label>
                                <input 
                                    type="text" 
                                    required={isMinor}
                                    value={regGuardianPhone}
                                    onChange={e => setRegGuardianPhone(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg mt-6 flex items-center justify-center"
                >
                    <UserPlus size={20} className="mr-2" /> Finalizar Cadastro
                </button>
            </form>
        </div>
      </div>
    );
  }

  // --- LOGIN VIEW ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">CEU Butantã</h1>
          <p className="text-gray-500">Sistema de Gestão Esportiva</p>
        </div>
        
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center border border-red-200 font-bold">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" /> {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                placeholder="seu.email@ceu.sp.gov.br"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">Não tem uma conta?</p>
            <button 
                onClick={() => setIsRegistering(true)}
                className="text-blue-600 hover:text-blue-800 font-bold text-sm mt-1 hover:underline"
            >
                Criar cadastro de Aluno
            </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-center font-bold text-gray-400 uppercase tracking-wide mb-4">Contas de Teste (Senha: 123456)</p>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button onClick={() => fillCredentials('joao.student@ceu.sp.gov.br')} className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-700 rounded-lg text-left transition-colors">
              <span className="block font-bold">Aluno</span> João Silva
            </button>
            <button onClick={() => fillCredentials('ana.sec@ceu.sp.gov.br')} className="p-2 bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-purple-700 rounded-lg text-left transition-colors">
              <span className="block font-bold">Secretaria</span> Ana Pereira
            </button>
            <button onClick={() => fillCredentials('alexandre.analista@ceu.sp.gov.br')} className="p-2 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-700 rounded-lg text-left transition-colors">
              <span className="block font-bold">Analista</span> Alexandre Silva
            </button>
            <button onClick={() => fillCredentials('lucas.ribeiro@sme.prefeitura.sp.gov.br')} className="p-2 bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-orange-700 rounded-lg text-left transition-colors">
              <span className="block font-bold">Coordenação</span> Lucas Ribeiro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC = () => {
  const { currentUser, logout } = useApp();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const renderContent = () => {
    switch (currentUser?.role) {
      case UserRole.STUDENT: return <StudentDashboard />;
      case UserRole.SECRETARY: return <SecretaryDashboard />;
      case UserRole.ANALYST: return <AnalystDashboard />;
      case UserRole.COORDINATOR: return <CoordinatorDashboard />;
      default: return <div>Role not found</div>;
    }
  };

  const roleLabels = {
    [UserRole.STUDENT]: 'Área do Aluno',
    [UserRole.SECRETARY]: 'Secretaria',
    [UserRole.ANALYST]: 'Analista de Esportes',
    [UserRole.COORDINATOR]: 'Coordenação Geral',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">CEU Butantã</h1>
          <p className="text-slate-400 text-xs mt-1">Gestão de Atividades</p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6 bg-slate-800 p-3 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{currentUser?.name}</p>
              <p className="text-xs text-slate-400 truncate">{roleLabels[currentUser?.role || UserRole.STUDENT]}</p>
            </div>
          </div>
          
          <button 
             onClick={() => setIsProfileOpen(true)}
             className="w-full flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors mb-8 border border-slate-700"
          >
             <UserCog size={16} className="mr-2" /> Meu Perfil
          </button>

          <nav className="space-y-2">
            <button className="w-full text-left px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium flex items-center">
              <LayoutDashboard size={16} className="mr-2" /> Dashboard
            </button>
            {/* Future nav items could go here */}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
          <button 
            onClick={logout}
            className="flex items-center text-red-400 hover:text-red-300 transition-colors w-full text-sm font-medium"
          >
            <LogOut size={18} className="mr-2" /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm lg:hidden flex items-center justify-between p-4">
          <h2 className="font-bold text-gray-800">CEU Butantã</h2>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainSwitcher />
    </AppProvider>
  );
};

const MainSwitcher: React.FC = () => {
  const { currentUser } = useApp();
  return currentUser ? <DashboardLayout /> : <LoginScreen />;
};

export default App;
