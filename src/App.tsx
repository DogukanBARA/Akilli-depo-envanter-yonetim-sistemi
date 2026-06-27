/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Landing from './components/Landing';

import { UserRole } from './types';
import { loadSession, saveSession, clearSession } from './lib/session';
import * as repo from './lib/repo';

export default function App() {
  // F5 sonrası: geçerli (süresi dolmamış) oturum varsa doğrudan Dashboard.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!loadSession());
  const [userRole, setUserRole] = useState<UserRole>(() => loadSession()?.role ?? 'admin');
  const [userName, setUserName] = useState<string | undefined>(() => loadSession()?.name);
  const [showLanding, setShowLanding] = useState<boolean>(() => !loadSession());

  // Veri katmanı + varsayılan kullanıcı/görev seed'i (Login'den önce hazır olsun).
  useEffect(() => {
    repo.init();
  }, []);

  const handleLogin = (role: UserRole, name?: string) => {
    saveSession(role, name);
    setUserRole(role);
    setUserName(name);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    setShowLanding(true);
  };

  return (
    <div className="min-h-screen">
      {showLanding && !isLoggedIn ? (
        <Landing onEnter={() => setShowLanding(false)} />
      ) : isLoggedIn ? (
        <Dashboard onLogout={handleLogout} role={userRole} displayName={userName} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}
