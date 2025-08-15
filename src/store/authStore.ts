
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

export interface Student {
  id: string;
  full_name: string;
  guardian_name: string;
  guardian_phone: string;
  class: string;
  quarter: string;
  days_per_week: number;
  user: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  profile: any;
  role: 'teacher' | 'student' | 'admin' | null;
  loading: boolean;
  signIn: (identifier: string, password: string, isAdmin?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (profile: any, role: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  role: null,
  loading: false,

  setUser: (profile, role) => set({ profile, role }),

  signIn: async (identifier, password, isAdmin = false) => {
    set({ loading: true });
    const cleanIdentifier = identifier.toLowerCase().trim();

    try {
      // Admin login
      if (isAdmin) {
        const { data: admin, error } = await supabase
          .from('admins')
          .select('*')
          .or(`email.ilike.${cleanIdentifier},user.ilike.${cleanIdentifier}`)
          .maybeSingle();

        if (error) throw error;
        if (admin) {
          const valid = await bcrypt.compare(password, admin.password);
          if (!valid) throw new Error('Invalid password');
          return set({ profile: admin, role: 'admin', loading: false });
        }
        throw new Error('Admin not found');
      }

      // Teacher login
      const teacher = await supabase
        .from('teachers')
        .select('*')
        .or(`email.ilike.${cleanIdentifier},user.ilike.${cleanIdentifier}`)
        .eq('is_approved', true)
        .maybeSingle();

      if (teacher.data) {
        const valid = await bcrypt.compare(password, teacher.data.password);
        if (!valid) throw new Error('Invalid password');
        return set({ profile: teacher.data, role: 'teacher', loading: false });
      }

      // Student login using identifier and guardian_name as password
      // Student login using identifier and guardian_name as password
const student = await supabase
  .from('students')
  .select('*')
  .ilike('user', cleanIdentifier)
  .maybeSingle();

if (student.data) {
  const guardianMatch =
    student.data.guardian_name.toLowerCase().trim() === password.toLowerCase().trim();

  if (!guardianMatch) throw new Error('Guardian name does not match');

  return set({ profile: student.data, role: 'student', loading: false });
}

throw new Error('User not found');


      
    } catch (error: any) {
      set({ loading: false });
      throw new Error(error.message || 'Authentication failed');
    }
  },

  signOut: async () => {
    set({ profile: null, role: null });
  },
}));
