import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { SearchInput } from './SearchInput';
import { SearchDropdown } from './SearchDropdown';
import { useLiveSearch } from '@/hooks/useLiveSearch';
import { ROUTES } from '@/lib/constants';

interface GlobalSearchBarProps {
  variant?: 'header' | 'hero';
  isDark?: boolean;
}

export function GlobalSearchBar({ variant = 'header', isDark = false }: GlobalSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    query,
    setQuery,
    recentHistory,
    saveToHistory,
    clearHistory,
    removeHistoryItem
  } = useLiveSearch();

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!query) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      saveToHistory(searchQuery.trim());
      navigate(`${ROUTES.PRODUCTS}?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
    }
  };

  const isHero = variant === 'hero';

  return (
    <div className={`relative ${isHero ? 'w-full mt-8' : 'flex items-center'}`} ref={containerRef}>
      {/* Mobile trigger for header variant */}
      {!isHero && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`p-1.5 rounded-full transition-all duration-300 md:hidden flex-shrink-0 ${
            isDark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
          aria-label="Tìm kiếm"
        >
          <Search width={18} height={18} />
        </button>
      )}

      {/* Desktop Bar or Hero Bar */}
      <div className={`${!isHero ? 'hidden md:block w-64 focus-within:w-72 transition-all duration-300' : 'w-full'}`}>
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          onSubmit={handleSearch}
          onFocus={() => setIsOpen(true)}
          placeholder={isHero ? "Tìm kiếm món ăn, nhà hàng để giải cứu..." : "Tìm kiếm..."}
          variant={variant}
          isDark={isDark}
        />
      </div>

      {/* Mobile Full-Screen Overlay */}
      {isOpen && !isHero && (
        <div className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col animate-[--animate-slide-up]">
          <div className="flex items-center p-3 border-b border-gray-100 gap-2 shadow-sm">
            <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:text-gray-900 rounded-full transition-colors">
              <X width={20} height={20} />
            </button>
            <div className="flex-1">
              <SearchInput
                value={query}
                onChange={setQuery}
                onClear={() => setQuery('')}
                onSubmit={handleSearch}
                onFocus={() => setIsOpen(true)}
                placeholder="Nhập tên món ăn..."
                variant="mobile"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {!query ? (
              <SearchDropdown
                query={query}
                recentHistory={recentHistory}
                selectedIndex={selectedIndex}
                isOpen={true}
                onSelectHistory={(term) => { setQuery(term); handleSearch(term); }}
                onClearHistory={clearHistory}
                onRemoveHistoryItem={removeHistoryItem}
                setSelectedIndex={setSelectedIndex}
              />
            ) : (
              <div className="p-4 text-center">
                <p className="text-gray-500 text-sm mt-10">Nhấn Enter để tìm kiếm</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop/Hero Dropdown */}
      {isOpen && !query && (
        <div className="absolute top-full mt-2 w-full min-w-[320px] right-0 z-50 rounded-xl shadow-xl border border-gray-100 overflow-hidden bg-white">
          <SearchDropdown
            query={query}
            recentHistory={recentHistory}
            selectedIndex={selectedIndex}
            isOpen={true}
            onSelectHistory={(term) => { setQuery(term); handleSearch(term); }}
            onClearHistory={clearHistory}
            onRemoveHistoryItem={removeHistoryItem}
            setSelectedIndex={setSelectedIndex}
          />
        </div>
      )}
    </div>
  );
}
