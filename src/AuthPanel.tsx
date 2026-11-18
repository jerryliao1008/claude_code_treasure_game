import { useState, type FormEvent } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { api } from './api';

interface AuthPanelProps {
  user: string | null;
  onLogin: (username: string) => void;
  onLogout: () => void;
}

export default function AuthPanel({ user, onLogin, onLogout }: AuthPanelProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setPassword('');
    setConfirm('');
    setError('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = mode === 'login'
        ? await api.login(username, password)
        : await api.register(username, password);
      setPassword('');
      setConfirm('');
      onLogin(res.username);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    try {
      await api.logout();
    } finally {
      setBusy(false);
      onLogout();
    }
  };

  const panelStyle = {
    width: '100%',
    maxWidth: '40rem',
    background: 'rgba(255, 255, 255, 0.6)',
  };

  if (user) {
    return (
      <div className="flex items-center justify-between gap-4 p-4 mb-8 rounded-lg border-2 border-amber-400" style={panelStyle}>
        <span className="text-amber-900">
          Logged in as <span className="font-semibold">{user}</span>
        </span>
        <Button variant="outline" onClick={logout} disabled={busy}>
          Log out
        </Button>
      </div>
    );
  }

  const isRegister = mode === 'register';
  const inputStyle = { flex: '1 1 8rem', width: 'auto', background: 'white' };
  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1rem',
    marginBottom: '-2px',
    borderBottom: `3px solid ${active ? '#d97706' : 'transparent'}`,
    color: active ? '#78350f' : '#b45309',
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
  });

  return (
    <form
      onSubmit={submit}
      className="p-4 mb-8 rounded-lg border-2 border-amber-400"
      style={panelStyle}
    >
      <div className="flex mb-4" role="tablist" style={{ borderBottom: '2px solid #fcd34d' }}>
        <button type="button" role="tab" aria-selected={!isRegister} style={tabStyle(!isRegister)} onClick={() => switchMode('login')}>
          Log in
        </button>
        <button type="button" role="tab" aria-selected={isRegister} style={tabStyle(isRegister)} onClick={() => switchMode('register')}>
          Sign up
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
        <Input
          type="password"
          placeholder="Password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        {isRegister && (
          <Input
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={inputStyle}
          />
        )}
        <Button
          type="submit"
          disabled={busy || !username || !password || (isRegister && !confirm)}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isRegister ? 'Create account' : 'Log in'}
        </Button>
      </div>
      <p className="text-sm mt-2 text-amber-700">
        {error
          ? <span className="text-red-600">{error}</span>
          : isRegister
            ? 'Username: 3-20 letters, digits or _. Password: at least 6 characters.'
            : 'Playing as guest - scores are not saved. Log in to keep your last 100 games.'}
      </p>
    </form>
  );
}
