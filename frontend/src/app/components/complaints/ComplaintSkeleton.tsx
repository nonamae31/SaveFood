import React from 'react';

export function ComplaintSkeleton() {
  return (
    <div className="animate-pulse flex flex-col space-y-4 p-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="flex flex-row space-x-4 border-b border-gray-100 pb-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
        </div>
      ))}
    </div>
  );
}
