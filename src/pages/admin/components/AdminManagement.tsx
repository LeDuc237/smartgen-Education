import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { UserPlus, Edit, Trash2, Search, X, Upload, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../../../context/TranslationContext';
import { useAuthStore } from '../../../store/authStore';
import type { Admin } from '../../../lib/types';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../lib/supabase';

interface AdminManagementProps {
  admins: Admin[];
  language: 'en' | 'fr';
}

export default function AdminManagement({ admins = [], language }: AdminManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const { profile } = useAuthStore();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'coordonateur',
    about_me: '',
    current_work: '',
    whatsapp_number: '',
    password: '',
    user: '',
    gender: 'male' as 'male' | 'female',
    profile_image_url: ''
  });

  // Check if current user has permission for admin management
  const canManageAdmins = profile?.role === 'promoteur' || profile?.role === 'chef coordonateur';
  const isPromoter = profile?.role === 'promoteur';

  const filteredAdmins = admins.filter((admin) =>
    admin.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!selectedFile) return '';

    try {
      setIsUploading(true);
      const uploadData = new FormData();
      uploadData.append('file', selectedFile);
      uploadData.append('upload_preset', 'admin_profile_unsigned');
      uploadData.append('cloud_name', 'dfrznvwmu');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dfrznvwmu/image/upload',
        { method: 'POST', body: uploadData }
      );

      if (!response.ok) throw new Error('Image upload failed');
      const data = await response.json();
      return data.secure_url;
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      role: 'coordonateur',
      about_me: '',
      current_work: '',
      whatsapp_number: '',
      password: '',
      user: '',
      gender: 'male',
      profile_image_url: ''
    });
    setSelectedFile(null);
    setImagePreview('');
    setShowPassword(false);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAdmins) {
      toast.error(language === 'en' 
        ? 'Only promoteur and chef coordonateur can add new admins' 
        : 'Seuls le promoteur et le chef coordonateur peuvent ajouter des administrateurs');
      return;
    }

    try {
      let imageUrl = '';
      if (selectedFile) {
        imageUrl = await uploadImage();
      }

      const hashedPassword = await bcrypt.hash(formData.password, 10);
      
      const { error } = await supabase
        .from('admins')
        .insert([{
          ...formData,
          password: hashedPassword,
          profile_image_url: imageUrl
        }]);

      if (error) throw error;

      toast.success(language === 'en' 
        ? 'Admin added successfully' 
        : 'Administrateur ajouté avec succès');
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || (language === 'en' 
        ? 'Failed to add admin' 
        : "Échec de l'ajout de l'administrateur"));
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    // Check if user can edit this admin
    const canEdit = profile?.id === selectedAdmin.id || canManageAdmins;
    if (!canEdit) {
      toast.error(language === 'en' 
        ? 'You can only edit your own profile' 
        : 'Vous ne pouvez modifier que votre propre profil');
      return;
    }

    try {
      let imageUrl = formData.profile_image_url;
      if (selectedFile) {
        imageUrl = await uploadImage();
      }

      const updates: any = { 
        ...formData,
        profile_image_url: imageUrl
      };
      
      // Only allow role changes for promoteur and chef coordonateur
      if (!canManageAdmins) {
        delete updates.role;
      }
      
      if (formData.password) {
        updates.password = await bcrypt.hash(formData.password, 10);
      } else {
        delete updates.password;
      }

      const { error } = await supabase
        .from('admins')
        .update(updates)
        .eq('id', selectedAdmin.id);

      if (error) throw error;

      toast.success(language === 'en' 
        ? 'Admin updated successfully' 
        : 'Administrateur mis à jour avec succès');
      setShowEditModal(false);
      setSelectedAdmin(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || (language === 'en' 
        ? 'Failed to update admin' 
        : "Échec de la mise à jour de l'administrateur"));
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminRole: string) => {
    if (!canManageAdmins) {
      toast.error(language === 'en' 
        ? 'Only promoteur and chef coordonateur can delete admins' 
        : 'Seuls le promoteur et le chef coordonateur peuvent supprimer des administrateurs');
      return;
    }

    // Prevent deleting promoteur unless current user is promoteur
    if (adminRole === 'promoteur' && !isPromoter) {
      toast.error(language === 'en' 
        ? 'Only promoteur can delete another promoteur' 
        : 'Seul le promoteur peut supprimer un autre promoteur');
      return;
    }

    if (window.confirm(language === 'en' 
      ? 'Are you sure you want to delete this admin?' 
      : 'Êtes-vous sûr de vouloir supprimer cet administrateur ?')) {
      try {
        const { error } = await supabase
          .from('admins')
          .delete()
          .eq('id', adminId);

        if (error) throw error;

        toast.success(language === 'en' 
          ? 'Admin deleted successfully' 
          : 'Administrateur supprimé avec succès');
      } catch (error: any) {
        toast.error(error.message || (language === 'en' 
          ? 'Failed to delete admin' 
          : "Échec de la suppression de l'administrateur"));
      }
    }
  };

  const openEditModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFormData({
      full_name: admin.full_name,
      email: admin.email,
      role: admin.role,
      about_me: admin.about_me || '',
      current_work: admin.current_work || '',
      whatsapp_number: admin.whatsapp_number || '',
      password: '',
      user: admin.user || '',
      gender: admin.gender || 'male',
      profile_image_url: admin.profile_image_url || ''
    });
    setImagePreview(admin.profile_image_url || '');
    setShowEditModal(true);
  };

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      'promoteur': language === 'en' ? 'Founder' : 'Fondateur',
      'chef coordonateur': language === 'en' ? 'Chief Coordinator' : 'Coordonnateur en Chef',
      'coordonateur': language === 'en' ? 'Coordinator' : 'Coordonnateur',
      'IT supervisor': language === 'en' ? 'IT Supervisor' : 'Superviseur IT'
    };
    return roleMap[role] || role;
  };

  const canEditAdmin = (admin: Admin) => {
    return profile?.id === admin.id || canManageAdmins;
  };

  const canDeleteAdmin = (admin: Admin) => {
    if (!canManageAdmins) return false;
    if (admin.role === 'promoteur' && !isPromoter) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {language === 'en' ? 'Admin Management' : 'Gestion des Administrateurs'}
          </h1>
          <p className="text-gray-600">
            {language === 'en'
              ? 'Manage administrator accounts and permissions'
              : 'Gérer les comptes administrateurs et les permissions'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search admins...' : 'Rechercher des administrateurs...'}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {canManageAdmins && (
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus size={20} />
              {language === 'en' ? 'Add Admin' : 'Ajouter un administrateur'}
            </button>
          )}
        </div>
      </div>

      {/* Permission Notice */}
      {!canManageAdmins && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            {language === 'en'
              ? 'You can only edit your own profile. Contact a promoteur or chef coordonateur for other admin management.'
              : 'Vous ne pouvez modifier que votre propre profil. Contactez un promoteur ou chef coordonateur pour la gestion des autres administrateurs.'}
          </p>
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Admin' : 'Administrateur'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Role' : 'Rôle'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Contact' : 'Contact'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Work' : 'Travail'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'en' ? 'Actions' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {admin.profile_image_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={admin.profile_image_url}
                            alt={admin.full_name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                            {admin.full_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{admin.full_name}</div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                        <div className="text-xs text-gray-400">@{admin.user}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      admin.role === 'promoteur' 
                        ? 'bg-purple-100 text-purple-800'
                        : admin.role === 'chef coordonateur'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getRoleDisplay(admin.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{admin.whatsapp_number}</div>
                    <div className="text-xs text-gray-400">
                      {admin.gender === 'male' ? (language === 'en' ? 'Male' : 'Homme') : (language === 'en' ? 'Female' : 'Femme')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="max-w-32 truncate">{admin.current_work}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {canEditAdmin(admin) && (
                        <button
                          onClick={() => openEditModal(admin)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                          title={language === 'en' ? 'Edit' : 'Modifier'}
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                      {canDeleteAdmin(admin) && (
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.role)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                          title={language === 'en' ? 'Delete' : 'Supprimer'}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <AdminModal
          title={language === 'en' ? 'Add New Admin' : 'Ajouter un nouvel administrateur'}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddAdmin}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
          language={language}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
          isUploading={isUploading}
          isEdit={false}
          canManageAdmins={canManageAdmins}
        />
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <AdminModal
          title={language === 'en' ? 'Edit Admin' : 'Modifier l\'administrateur'}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleEditAdmin}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAdmin(null);
            resetForm();
          }}
          language={language}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
          isUploading={isUploading}
          isEdit={true}
          canManageAdmins={canManageAdmins}
        />
      )}
    </div>
  );
}

// Admin Modal Component
function AdminModal({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  language,
  showPassword,
  setShowPassword,
  imagePreview,
  onImageChange,
  isUploading,
  isEdit,
  canManageAdmins
}: {
  title: string;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  language: 'en' | 'fr';
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  imagePreview: string;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  isEdit: boolean;
  canManageAdmins: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Profile Image */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <Upload size={24} />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                <Upload size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500">
              {language === 'en' ? 'Click to upload profile photo' : 'Cliquez pour télécharger une photo'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'en' ? 'Full Name' : 'Nom complet'} *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'en' ? 'Username' : "Nom d'utilisateur"} *
              </label>
              <input
                type="text"
                required
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'en' ? 'Email' : 'Email'} *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'en' ? 'Password' : 'Mot de passe'} {!isEdit && '*'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required={!isEdit}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isEdit ? (language === 'en' ? 'Leave blank to keep current' : 'Laisser vide pour garder actuel') : ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role - Only editable by promoteur and chef coordonateur */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'en' ? 'Role' : 'Rôle'} *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={!canManageAdmins}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="coordonateur">
                  {language === 'en' ? 'Coordinator' : 'Coordonateur'}
                </option>
                <option value="chef coordonateur">
                  {language === 'en' ? 'Chief Coordinator' : 'Chef Coordonateur'}
                </option>
                <option value="IT supervisor">
                  {language === 'en' ? 'IT Supervisor' : 'Superviseur IT'}
                </option>
                {canManageAdmins && (
                  <option value="promoteur">
                    {language === 'en' ? 'Founder' : 'Promoteur'}
                  </option>
                )}
              </select>
              {!canManageAdmins && (
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'en' 
                    ? 'Only promoteur and chef coordonateur can change roles'
                    : 'Seuls le promoteur et le chef coordonateur peuvent changer les rôles'}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'en' ? 'Gender' : 'Genre'} *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="male">{language === 'en' ? 'Male' : 'Homme'}</option>
                <option value="female">{language === 'en' ? 'Female' : 'Femme'}</option>
              </select>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'en' ? 'WhatsApp Number' : 'Numéro WhatsApp'}
              </label>
              <input
                type="text"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="+237 6XX XXX XXX"
              />
            </div>

            {/* Current Work */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'en' ? 'Current Work' : 'Travail actuel'}
              </label>
              <input
                type="text"
                value={formData.current_work}
                onChange={(e) => setFormData({ ...formData, current_work: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* About Me */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {language === 'en' ? 'About Me' : 'À propos de moi'}
            </label>
            <textarea
              rows={3}
              value={formData.about_me}
              onChange={(e) => setFormData({ ...formData, about_me: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              {language === 'en' ? 'Cancel' : 'Annuler'}
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {isUploading 
                ? (language === 'en' ? 'Uploading...' : 'Téléchargement...')
                : (language === 'en' ? (isEdit ? 'Update' : 'Add Admin') : (isEdit ? 'Mettre à jour' : 'Ajouter'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}