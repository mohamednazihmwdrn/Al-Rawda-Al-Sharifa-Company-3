import React from 'react';
import { UsersDatabase } from '../types';

interface LoginScreenProps {
  users: UsersDatabase;
  loginUsername: string;
  setLoginUsername: (u: string) => void;
  loginPassword: string;
  setLoginPassword: (p: string) => void;
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  onLogin,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onLogin();
    }
  };

  return (
    <div id="login-screen" className="login-container no-print" dir="rtl">
      <div className="login-logo">
        <div className="icon" style={{ fontSize: '48px', color: 'var(--primary-dark)' }}>🏛️</div>
        <h1>الروضة الشريفة</h1>
        <p>نظام إدارة النواقص المتكامل</p>
      </div>
      <div className="form-group">
        <label>🔑 اختيار الحساب</label>
        <select
          id="username"
          value={loginUsername}
          onChange={(e) => setLoginUsername(e.target.value)}
        >
          {(() => {
            const orderMap: Record<string, number> = {
              admin: 1,
              rawda: 2,
              safaa: 3,
              nahas: 4,
              nadi: 5,
            };
            const sortedKeys = Object.keys(users).sort((a, b) => {
              const scoreA = orderMap[a] || 999;
              const scoreB = orderMap[b] || 999;
              return scoreA - scoreB;
            });
            return sortedKeys.map((key) => (
              <option key={key} value={key}>
                {users[key].name}
              </option>
            ));
          })()}
        </select>
      </div>
      <div className="form-group">
        <label>🔒 كلمة المرور</label>
        <input
          type="password"
          id="password"
          placeholder="••••••"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <button className="btn-login" onClick={onLogin}>
        تسجيل الدخول
      </button>
      <div className="login-footer">جميع الحقوق محفوظة © 2026</div>
    </div>
  );
};
