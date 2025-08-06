import { useEffect } from 'react';
import { useAnonymousUser } from './useAnonymousUser';
import { useBanSystem } from './useBanSystem';

export function useBanChecker() {
  const { user, updateUser } = useAnonymousUser();
  const { isUsernameBanned } = useBanSystem();

  useEffect(() => {
    if (!user) return;

    // Check ban status function
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

    // Listen for instant ban update events
    const handleBanUpdate = () => {
      console.log('Instant ban update triggered');
      checkBanStatus();
    };

    // Add event listeners for instant updates
    window.addEventListener('banStatusChanged', handleBanUpdate);
    window.addEventListener('userBanned', handleBanUpdate);
    window.addEventListener('userUnbanned', handleBanUpdate);

    // Check every 500ms for faster updates (reduced from 2 seconds)
    const interval = setInterval(checkBanStatus, 500);

    return () => {
      clearInterval(interval);
      window.removeEventListener('banStatusChanged', handleBanUpdate);
      window.removeEventListener('userBanned', handleBanUpdate);
      window.removeEventListener('userUnbanned', handleBanUpdate);
    };
  }, [user, isUsernameBanned, updateUser]);
}
