import React, { useEffect, useRef } from 'react';
import { Clock, Trash2, Search } from 'lucide-react';

interface SearchDropdownProps {
  query: string;
  recentHistory: string[];
  selectedIndex: number;
  isOpen: boolean;
  onSelectHistory: (term: string) => void;
  onClearHistory: () => void;
  onRemoveHistoryItem?: (term: string) => void;
  setSelectedIndex: (index: number) => void;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  query,
  recentHistory = [],
  selectedIndex,
  isOpen,
  onSelectHistory,
  onClearHistory,
  onRemoveHistoryItem,
  setSelectedIndex,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && selectedIndex >= 0 && dropdownRef.current) {
      const activeItem = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen || query) return null; // Only show when there is NO query

  return (
    <div 
      ref={dropdownRef}
      className="bg-white overflow-hidden max-h-[400px] overflow-y-auto flex flex-col w-full h-full"
    >
      <div className="py-2">
        {recentHistory?.length > 0 ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 font-medium">
              <span>Lịch sử tìm kiếm</span>
              <button 
                onClick={onClearHistory}
                className="text-blue-600 hover:text-blue-800 transition-colors hover:underline"
              >
                Xoá tất cả
              </button>
            </div>
            <ul>
              {recentHistory.map((term, index) => (
                <li 
                  key={term}
                  data-index={index}
                  className={`flex items-center px-4 py-2.5 cursor-pointer transition-colors ${
                    selectedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onSelectHistory(term)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Clock size={16} className={`mr-3 ${selectedIndex === index ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`flex-1 text-sm ${selectedIndex === index ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                    {term}
                  </span>
                  {onRemoveHistoryItem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveHistoryItem(term);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                      title="Xoá"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="px-4 py-8 text-center flex flex-col items-center justify-center text-gray-500">
            <Search size={32} className="mb-3 text-gray-200" />
            <p className="text-sm">Chưa có lịch sử tìm kiếm</p>
          </div>
        )}
      </div>
    </div>
  );
};
