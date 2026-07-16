import React from 'react';
import type { SearchSuggestion } from '../../../types/search.types';
import { Store, Utensils, Tag } from 'lucide-react';

interface LiveResultItemProps {
  item: SearchSuggestion;
  isActive: boolean;
  onClick: (item: SearchSuggestion) => void;
  onMouseEnter: () => void;
}

export const LiveResultItem: React.FC<LiveResultItemProps> = ({ item, isActive, onClick, onMouseEnter }) => {
  const getIcon = () => {
    if (item.type === 'store') return <Store size={18} className="text-blue-500" />;
    if (item.type === 'category') return <Tag size={18} className="text-green-500" />;
    return <Utensils size={18} className="text-orange-500" />;
  };

  return (
    <div
      onClick={() => onClick(item)}
      onMouseEnter={onMouseEnter}
      className={`flex items-center px-4 py-3 cursor-pointer transition-colors duration-150 ${
        isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex-shrink-0 mr-3 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          getIcon()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{item.subtitle}</p>
        )}
      </div>
      {item.type === 'store' && (
        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full ml-2 font-medium border border-blue-200">Cửa hàng</span>
      )}
      {item.type === 'food' && (
        <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full ml-2 font-medium border border-orange-200">Món ăn</span>
      )}
      {item.type === 'category' && (
        <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full ml-2 font-medium border border-green-200">Danh mục</span>
      )}
    </div>
  );
};
