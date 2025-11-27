
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { X, Save, Lock, User as UserIcon, Mail, Phone, MapPin, Home, Briefcase, AlertCircle } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateCurrentUserProfile } = useApp();
  
  // Form State
  const [formData, setFormData] = useState<Partial<User>>({});
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  // Initialize form when modal opens or user changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name,
        email: currentUser.email,
        ref: currentUser.ref || '',
        phone: currentUser.phone || '',
        cellphone: currentUser.cellphone || '',
        address: currentUser.address || '',
        neighborhood: currentUser.neighborhood || ''
      });
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setFormError('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const isStudent = currentUser.role === UserRole.STUDENT;
  const isCoordinator = currentUser.role === UserRole.COORDINATOR;
  // Secretaria e Analistas podem editar, mas com restrições (não editam REF nem Email)
  // Coordenador edita tudo
  // Aluno só visualiza
  const canEditGeneral = !isStudent; 
  const canEditSensitive = isCoordinator; // Email e REF apenas coordenador

  const applyRefMask = (value: string) => {
    let v = value.replace(/\D/g, ""); // Remove tudo que não é dígito
    v = v.slice(0, 8); // Limita a 8 dígitos numéricos
    
    // Aplica a máscara 000.000.0/0
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{1})(\d{1})$/, "$1/$2");
    
    return v;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setFormError('');

    if (isStudent) return; // Segurança extra

    // Validação de REF para Administrativos se estiver sendo editado
    if (canEditSensitive && currentUser.role !== UserRole.STUDENT) {
        if (!formData.ref) {
            setFormError('O campo REF é obrigatório para o seu cargo.');
            return;
        }
        if (formData.ref.length < 11) { // 000.000.0/0 tem 11 caracteres
            setFormError('O REF deve estar no formato 000.000.0/0');
            return;
        }
    }

    // Prepare update data
    const updates: Partial<User> = { ...formData };

    // Validate Password Change
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setPasswordError('As senhas não coincidem.');
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      updates.password = newPassword;
    }

    // Call update context
    updateCurrentUserProfile(updates);
    
    // Close modal
    alert('Perfil atualizado com sucesso!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center">
            <UserIcon className="mr-2" size={24} /> Meu Perfil
          </h2>
          <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {formError && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm font-bold flex items-center border border-red-200">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" /> {formError}
              </div>
          )}

          <form id="profile-form" onSubmit={handleSave} className="space-y-6">
            
            {/* Identity Section */}
            <div className="space-y-4">
              <h3 className="text-gray-900 font-bold border-b pb-2 flex items-center text-sm uppercase tracking-wide">
                Dados Pessoais
              </h3>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input 
                    type="text" 
                    required
                    disabled={!canEditGeneral}
                    className={`w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white font-medium ${!canEditGeneral ? 'bg-gray-100 text-gray-500' : ''}`}
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
              </div>

              {/* REF Field - Only for non-students */}
              {currentUser.role !== UserRole.STUDENT && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">REF (Registro Funcional) <span className="text-red-500">*</span></label>
                  <div className="relative">
                      <Briefcase size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input 
                      type="text" 
                      required
                      disabled={!canEditSensitive}
                      placeholder="000.000.0/0"
                      className={`w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white font-medium ${!canEditSensitive ? 'bg-gray-100 text-gray-500' : ''}`}
                      value={formData.ref || ''}
                      onChange={e => setFormData({...formData, ref: applyRefMask(e.target.value)})}
                      maxLength={11}
                      />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Formato obrigatório: 000.000.0/0</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
                <div className="relative">
                    <Mail size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input 
                    type="email" 
                    required
                    disabled={!canEditSensitive}
                    className={`w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white font-medium ${!canEditSensitive ? 'bg-gray-100 text-gray-500' : ''}`}
                    value={formData.email || ''}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Telefone Fixo</label>
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        <input 
                        type="text" 
                        disabled={!canEditGeneral}
                        className={`w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white font-medium ${!canEditGeneral ? 'bg-gray-100 text-gray-500' : ''}`}
                        value={formData.phone || ''}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Celular</label>
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        <input 
                        type="text" 
                        disabled={!canEditGeneral}
                        className={`w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white font-medium ${!canEditGeneral ? 'bg-gray-100 text-gray-500' : ''}`}
                        value={formData.cellphone || ''}
                        onChange={e => setFormData({...formData, cellphone: e.target.value})}
                        />
                    </div>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-4">
               <h3 className="text-gray-900 font-bold border-b pb-2 flex items-center text-sm uppercase tracking-wide">
                Endereço
              </h3>
               <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Logradouro e Número</label>
                <div className="relative">
                    <Home size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input 
                    type="text" 
                    disabled={!canEditGeneral}
                    className={`w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white font-medium ${!canEditGeneral ? 'bg-gray-100 text-gray-500' : ''}`}
                    value={formData.address || ''}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Bairro</label>
                <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input 
                    type="text" 
                    disabled={!canEditGeneral}
                    className={`w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white font-medium ${!canEditGeneral ? 'bg-gray-100 text-gray-500' : ''}`}
                    value={formData.neighborhood || ''}
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                    />
                </div>
              </div>
            </div>

            {/* Security Section (Only show if editing is allowed) */}
            {canEditGeneral && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                <h3 className="text-gray-900 font-bold border-b border-gray-200 pb-2 flex items-center text-sm uppercase tracking-wide">
                  <Lock size={16} className="mr-2"/> Alterar Senha
                </h3>
                
                {passwordError && (
                    <div className="text-red-600 text-sm font-bold bg-red-50 p-2 rounded border border-red-200">
                        {passwordError}
                    </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nova Senha</label>
                  <input 
                    type="password" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    placeholder="Deixe em branco para manter a atual"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-200 transition-colors"
          >
            {isStudent ? 'Fechar' : 'Cancelar'}
          </button>
          
          {!isStudent && (
            <button 
                type="submit" 
                form="profile-form"
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center shadow-sm transition-colors"
            >
                <Save size={18} className="mr-2" /> Salvar Alterações
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default UserProfileModal;
