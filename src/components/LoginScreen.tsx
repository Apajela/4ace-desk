import React, { useEffect, useState } from 'react';
import {
  HardHat,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  User,
  UserPlus,
  LogIn,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { UserProfile, CompanySettings } from '../types';

export interface LoginScreenProps {
  users: UserProfile[];
  onLogin: (user: UserProfile, rememberSession: boolean) => void;
  onCreateUser?: (user: UserProfile) => void;
  company: CompanySettings;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLogin,
  onCreateUser,
  company,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('4ace_remembered_credentials');
      if (saved) {
        const credentials = JSON.parse(saved) as { username?: string; password?: string };
        setUsername(credentials.username || ''); setPassword(credentials.password || '');
        setRememberSession(Boolean(credentials.username && credentials.password));
        setHasSavedCredentials(Boolean(credentials.username && credentials.password));
      }
    } catch { /* browser storage may be unavailable */ }
  }, []);
  const [errorMessage, setErrorMessage] = useState('');

  // Register / Add User state
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Please enter both Username and Password.');
      return;
    }

    // Match by username
    const matched = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUser ||
        u.name.toLowerCase().includes(cleanUser)
    );

    if (!matched) {
      setErrorMessage('Incorrect username.');
      return;
    }

    // Verify password or PIN
    const isPassValid = cleanPass === matched.password || cleanPass === matched.pin;

    if (!isPassValid) {
      setErrorMessage('Incorrect password.');
      return;
    }

    try { if (rememberSession) localStorage.setItem('4ace_remembered_credentials', JSON.stringify({ username: cleanUser, password: cleanPass })); else localStorage.removeItem('4ace_remembered_credentials'); } catch {}
    setHasSavedCredentials(rememberSession);
    onLogin(matched, rememberSession);
  };

  const handleUseSavedLogin = () => {
    const matched = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
    if (!matched) { setErrorMessage('Incorrect username or password.'); return; }
    onLogin(matched, true);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUser = regUsername.trim().toLowerCase();
    if (!regName.trim() || !cleanUser || !regPassword.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    // Check if username is already taken
    const exists = users.some((u) => u.username.toLowerCase() === cleanUser);
    if (exists) {
      setErrorMessage('This username is already taken. Please choose another.');
      return;
    }

    // Generate initials from name
    const initials = regName
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AU';

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: regName.trim(),
      username: cleanUser,
      password: regPassword.trim(),
      pin: regPassword.trim().slice(0, 6) || '1234',
      role: regRole.trim(),
      accessLevel: 'Field Engineer',
      avatarInitials: initials,
      avatarColor: 'bg-[#123B5D] text-white font-bold',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`,
      title: regRole.trim(),
      prcLicense: '',
      phone: '+63 917 000 0000',
      email: `${cleanUser}@4acedesk.com`,
      company: company.companyName,
      companyName: company.companyName,
      companyAddress: company.address,
      licenseNumber: company.licenseNumber,
    };

    if (onCreateUser) {
      onCreateUser(newUser);
    }
    setRegSuccess(true);
    setTimeout(() => {
      if (rememberSession) { try { localStorage.setItem('4ace_remembered_credentials', JSON.stringify({ username: cleanUser, password: regPassword.trim() })); } catch {} }
      onLogin(newUser, rememberSession);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-white text-[#263238] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#123B5D] flex items-center justify-center text-white shadow-lg mx-auto">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#123B5D]">
              {company.companyName}
            </h1>
            <p className="text-xs text-[#263238]/70 mt-0.5 font-medium">
              Authorized Site Operations &amp; Construction EMS Terminal
            </p>
          </div>
        </div>

        {/* Login / Create Account Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          {/* Tabs: Sign In vs Create Account */}
          <div className="grid grid-cols-2 p-1 bg-[#EAF7FA] rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'text-[#123B5D]/70 hover:text-[#123B5D]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Enter Username &amp; Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'text-[#123B5D]/70 hover:text-[#123B5D]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#18A999]" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message for Registration */}
          {regSuccess && (
            <div className="p-3 bg-teal-50 border border-[#18A999]/30 rounded-xl text-[#0d786d] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#18A999]" />
              <span>Account created successfully. Logging in...</span>
            </div>
          )}

          {/* MODE: LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#123B5D] mb-1.5">
                  Username *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#18A999] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username (e.g. arriana, marksantos)"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#263238] focus:bg-white focus:outline-none focus:border-[#18A999] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#123B5D] mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#18A999] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#263238] focus:bg-white focus:outline-none focus:border-[#18A999] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[#263238]/80 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="rounded border-slate-300 text-[#18A999] focus:ring-[#18A999] h-3.5 w-3.5"
                  />
                  <span>Remember me</span>
                </label>

              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#18A999] hover:bg-[#148f81] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
              {hasSavedCredentials && <button type="button" onClick={handleUseSavedLogin} className="w-full py-2.5 border border-[#18A999] text-[#123B5D] hover:bg-[#EAF7FA] rounded-xl text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18A999]">Use saved login information</button>}


            </form>
          )}

          {/* MODE: CREATE ACCOUNT / ADD USER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#123B5D] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Engr. Juan Dela Cruz"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[#263238] focus:bg-white focus:outline-none focus:border-[#18A999]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#123B5D] mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. juandc"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[#263238] focus:bg-white focus:outline-none focus:border-[#18A999]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#123B5D] mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[#263238] focus:bg-white focus:outline-none focus:border-[#18A999]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#123B5D] mb-1">
                  Designation / Role *
                </label>
                <input
                  type="text"
                  required
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  placeholder="e.g. Managing Contractor, Senior Project Engineer"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[#263238] focus:bg-white focus:outline-none focus:border-[#18A999]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#18A999] hover:bg-[#148f81] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account &amp; Log In</span>
              </button>
            </form>
          )}
        </div>

        {/* Security Footer Notice */}
        <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#263238]/60">
          <ShieldCheck className="w-3.5 h-3.5 text-[#18A999]" />
          <span>Encrypted Local Vault &amp; Authorized Personnel Access Only</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
