import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile, StaffRole } from '../types';
import { storageEngine } from '../lib/storage';
import { normalizeIndianPhone } from '../lib/phoneUtils';

interface AuthContextType {
  currentUser: Profile | null;
  role: StaffRole;
  isOwner: boolean;
  isReceptionist: boolean;
  loginWithMobile: (phone: string, pin?: string) => { success: boolean; error?: string };
  requestOtp: (phone: string) => { success: boolean; otp?: string; error?: string };
  verifyOtpAndLogin: (phone: string, otp: string) => { success: boolean; error?: string };
  logout: () => void;
  switchRole: (role: StaffRole) => void;
  createStaffAccount: (data: { email?: string; fullName: string; role: StaffRole; phone: string; pin?: string }) => { success: boolean; error?: string };
  staffList: Profile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'wonderland_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [generatedOtps, setGeneratedOtps] = useState<Record<string, string>>({});

  useEffect(() => {
    const state = storageEngine.getState();
    setStaffList(state.profiles);

    const savedUserId = localStorage.getItem(AUTH_USER_KEY);
    if (savedUserId) {
      const found = state.profiles.find((p) => p.id === savedUserId);
      if (found) {
        setCurrentUser(found);
      }
    }
  }, []);

  const loginWithMobile = useCallback(
    (phoneInput: string, pinInput?: string): { success: boolean; error?: string } => {
      const state = storageEngine.getState();
      const normPhone = normalizeIndianPhone(phoneInput);

      if (!normPhone || normPhone.length !== 10) {
        return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
      }

      const staff = state.profiles.find((p) => normalizeIndianPhone(p.phone) === normPhone);
      if (!staff) {
        return {
          success: false,
          error: 'No staff account registered with this mobile number. Use demo credentials or register below.'
        };
      }

      if (!staff.isActive) {
        return { success: false, error: 'Staff account has been deactivated. Contact the arcade owner.' };
      }

      // Check PIN if account has one configured (default is 1234)
      if (staff.pin && pinInput !== undefined && pinInput.trim() !== '') {
        if (staff.pin !== pinInput.trim()) {
          return { success: false, error: 'Incorrect 4-digit security PIN.' };
        }
      }

      setCurrentUser(staff);
      localStorage.setItem(AUTH_USER_KEY, staff.id);
      return { success: true };
    },
    []
  );

  const requestOtp = useCallback(
    (phoneInput: string): { success: boolean; otp?: string; error?: string } => {
      const state = storageEngine.getState();
      const normPhone = normalizeIndianPhone(phoneInput);

      if (!normPhone || normPhone.length !== 10) {
        return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
      }

      const staff = state.profiles.find((p) => normalizeIndianPhone(p.phone) === normPhone);
      if (!staff) {
        return { success: false, error: 'Mobile number not found in staff directory.' };
      }

      // Generate realistic 4-digit verification code
      const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtps((prev) => ({ ...prev, [normPhone]: mockOtp }));

      return { success: true, otp: mockOtp };
    },
    []
  );

  const verifyOtpAndLogin = useCallback(
    (phoneInput: string, otpInput: string): { success: boolean; error?: string } => {
      const state = storageEngine.getState();
      const normPhone = normalizeIndianPhone(phoneInput);
      const expectedOtp = generatedOtps[normPhone] || '1234';

      if (otpInput.trim() !== expectedOtp && otpInput.trim() !== '1234') {
        return { success: false, error: 'Invalid verification code. Enter the code displayed or default 1234.' };
      }

      const staff = state.profiles.find((p) => normalizeIndianPhone(p.phone) === normPhone);
      if (!staff) {
        return { success: false, error: 'Staff account not found.' };
      }

      setCurrentUser(staff);
      localStorage.setItem(AUTH_USER_KEY, staff.id);
      return { success: true };
    },
    [generatedOtps]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_USER_KEY);
    setCurrentUser(null);
  }, []);

  const switchRole = useCallback((newRole: StaffRole) => {
    const state = storageEngine.getState();
    const target = state.profiles.find((p) => p.role === newRole && p.isActive);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(AUTH_USER_KEY, target.id);
    }
  }, []);

  const createStaffAccount = useCallback(
    (data: { email?: string; fullName: string; role: StaffRole; phone: string; pin?: string }): { success: boolean; error?: string } => {
      const state = storageEngine.getState();
      const normPhone = normalizeIndianPhone(data.phone);

      if (!normPhone || normPhone.length !== 10) {
        return { success: false, error: 'Please enter a valid 10-digit Indian phone number.' };
      }

      const existing = state.profiles.find((p) => normalizeIndianPhone(p.phone) === normPhone);
      if (existing) {
        return { success: false, error: 'A staff profile with this mobile number already exists.' };
      }

      const newProfile: Profile = {
        id: `usr-${Date.now()}`,
        locationId: state.locations[0]?.id || 'loc-01',
        email: data.email || `${normPhone}@wonderland.com`,
        fullName: data.fullName.trim(),
        role: data.role,
        phone: normPhone,
        pin: data.pin || '1234',
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const updatedProfiles = [...state.profiles, newProfile];
      storageEngine.saveState({ ...state, profiles: updatedProfiles });
      setStaffList(updatedProfiles);

      // Auto login as new user
      setCurrentUser(newProfile);
      localStorage.setItem(AUTH_USER_KEY, newProfile.id);

      return { success: true };
    },
    []
  );

  const role = currentUser?.role || 'receptionist';
  const isOwner = role === 'owner';
  const isReceptionist = role === 'receptionist';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isOwner,
        isReceptionist,
        loginWithMobile,
        requestOtp,
        verifyOtpAndLogin,
        logout,
        switchRole,
        createStaffAccount,
        staffList
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
