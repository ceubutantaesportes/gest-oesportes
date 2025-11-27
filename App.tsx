
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { UserRole } from './types';
import StudentDashboard from './components/StudentDashboard';
import SecretaryDashboard from './components/SecretaryDashboard';
import AnalystDashboard from './components/AnalystDashboard';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import UserProfileModal from './components/UserProfileModal';
import { Menu, LogOut, LayoutDashboard, User, ShieldCheck, Mail, Lock, AlertCircle, Eye, EyeOff, UserCog } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(email, password);
    if (!success) {
      setError('E-mail ou senha inválidos.');
    }
  };

  // Helper to fill form for demo purposes
  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('123456');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">CEU Butantã</h1>
          <p className="text-gray-500">Sistema de Gestão Esportiva</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
              <AlertCircle size={16} className="mr-2" /> {error}
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
