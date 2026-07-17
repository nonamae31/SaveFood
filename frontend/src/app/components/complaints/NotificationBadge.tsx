import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

import { apiClient } from '@/lib/apiClient';

export function NotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const response = await apiClient<any>('/v1/complaints?page=1&size=1&status=0');
        if (isMounted) {
          setCount(response.totalCount || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchCount();
    const interval = setInterval(fetchCount, 15000); // Check every 15 seconds
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <button className="relative inline-flex items-center p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none">
      <Bell className="w-6 h-6 text-gray-600" />
      {count > 0 && (
        <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full ring-2 ring-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
