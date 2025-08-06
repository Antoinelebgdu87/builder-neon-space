import React, { useState, useEffect } from 'react';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';
import { useUserAccounts } from '@/hooks/useUserAccounts';
import PasswordSetupDialog from './PasswordSetupDialog';
import UserLoginDialog from './UserLoginDialog';

export default function UserAuthManager() {
  const { user, setPasswordCreated, loginUser, logoutUser } = useAnonymousUser();
  const { createAccount, validateLogin, accountExists } = useUserAccounts();
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (user && !user.hasPassword && !user.isLoggedIn) {
      // New user without password - show password setup
      const timer = setTimeout(() => {
        setShowPasswordSetup(true);
      }, 2000); // Show after 2 seconds

      return () => clearTimeout(timer);
    } else if (user && user.hasPassword && !user.isLoggedIn) {
      // User with password but not logged in - show login
      setShowLogin(true);
    }
  }, [user]);

  const handleSetPassword = async (password: string) => {
    if (!user) throw new Error('Aucun utilisateur trouvé');

    try {
      await createAccount(user.username, password);
      setPasswordCreated();
      setShowPasswordSetup(false);
    } catch (error) {
      throw error;
    }
  };

  const handleLogin = async (username: string, password: string) => {
    const isValid = await validateLogin(username, password);
    
    if (!isValid) {
      throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
    }

    loginUser(username);
    setShowLogin(false);
  };

  const handleLogout = () => {
    logoutUser();
    setShowLogin(true);
  };

  // Check if user is disconnected and needs to login
  useEffect(() => {
    if (user && user.hasPassword && !user.isLoggedIn) {
      setShowLogin(true);
    }
  }, [user?.isLoggedIn, user?.hasPassword]);

  return (
    <>
      {user && (
        <>
          <PasswordSetupDialog
            isOpen={showPasswordSetup}
            username={user.username}
            onSetPassword={handleSetPassword}
          />
          
          <UserLoginDialog
            isOpen={showLogin}
            onClose={() => setShowLogin(false)}
            onLogin={handleLogin}
          />
        </>
      )}
    </>
  );
}
