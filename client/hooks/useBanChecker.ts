import { useEffect } from 'react';
import { useAnonymousUser } from './useAnonymousUser';
import { useBanSystem } from './useBanSystem';

export function useBanChecker() {
  const { user, updateUser } = useAnonymousUser();
  const { isUsernameBanned } = useBanSystem();

  useEffect(() => {
    if (!user) return;

    // Check ban status every 2 seconds
    const checkBanStatus = () => {
      const banStatus = isUsernameBanned(user.username);

      console.log('Ban check for', user.username, ':', banStatus);

      if (banStatus.isBanned && banStatus.banRecord) {
        console.log('User is banned, updating local data');
        // User is banned, update local user data
        updateUser({
          isBanned: true,
          banReason: banStatus.banRecord.reason,
          banExpiry: banStatus.banRecord.expiryDate
        });
      } else if (user.isBanned && !banStatus.isBanned) {
        console.log('User was unbanned, clearing local data');
        // User was unbanned, update local user data
        updateUser({
          isBanned: false,
          banReason: undefined,
          banExpiry: undefined
        });
      }
    };

    // Check immediately
    checkBanStatus();

    // Then check every 2 seconds
    const interval = setInterval(checkBanStatus, 2000);

    return () => clearInterval(interval);
  }, [user, isUsernameBanned, updateUser]);
}
