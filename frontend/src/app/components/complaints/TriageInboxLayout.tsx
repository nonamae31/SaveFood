import React from 'react';

export function TriageInboxLayout({
  sidebar,
  list,
  detail
}: {
  sidebar: React.ReactNode;
  list: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      {/* Cột 1: Sidebar / Filters */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto hidden md:block">
        {sidebar}
      </div>
      
      {/* Cột 2: Danh sách */}
      <div className="w-full md:w-1/3 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        {list}
      </div>
      
      {/* Cột 3: Chi tiết */}
      <div className="hidden lg:block flex-1 bg-gray-50 overflow-y-auto">
        {detail}
      </div>
    </div>
  );
}
