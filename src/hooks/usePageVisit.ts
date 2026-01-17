import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve a persistent visitor ID
const getVisitorId = (): string => {
  const storageKey = 'chopa_visitor_id';
  let visitorId = localStorage.getItem(storageKey);
  
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(storageKey, visitorId);
  }
  
  return visitorId;
};

export const usePageVisit = () => {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Don't track admin pages
        if (location.pathname.startsWith('/admin')) {
          return;
        }

        const visitorId = getVisitorId();
        
        await supabase.from('page_visits').insert({
          page_path: location.pathname,
          visitor_id: visitorId,
          user_agent: navigator.userAgent.substring(0, 500), // Limit length
          referrer: document.referrer?.substring(0, 500) || null,
        });
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.error('Failed to track page visit:', error);
      }
    };

    trackVisit();
  }, [location.pathname]);
};
