
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { X, Save, Lock, User as UserIcon, Mail, Phone, MapPin, Home, Briefcase } from 'lucide-react';

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
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

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
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
              </div>

              {/* REF Field - Only for non-students */}
              {currentUser.role !== UserRole.STUDENT && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">REF (Registro Funcional)</label>
                  <div className="relative">
                      <Briefcase size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input 
                      type="text" 
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                      value={formData.ref || ''}
                      onChange={e => setFormData({...formData, ref: e.target.value})}
                      />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
                <div className="relative">
                    <Mail size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input 
                    type="email" 
                    required
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
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
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
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
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
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
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
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
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    value={formData.neighborhood || ''}
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                    />
                </div>
              </div>
            </div>

            {/* Security Section */}
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

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="profile-form"
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center shadow-sm transition-colors"
          >
            <Save size={18} className="mr-2" /> Salvar Alterações
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserProfileModal;
