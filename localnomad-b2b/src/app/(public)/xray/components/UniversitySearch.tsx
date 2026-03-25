'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { searchUniversities, getAllUniversities } from '../lib/data';
import { trackUniversitySearch } from '../lib/analytics';
import type { UniversitySearchItem } from '../lib/types';
import { formatNumber } from '../lib/calculations';

interface Props {
  selectedUniversity: string | null;
  onSelect: (name: string) => void;
  initialUniv?: string;
}

export default function UniversitySearch({ selectedUniversity, onSelect, initialUniv }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UniversitySearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-populate from URL param
  useEffect(() => {
    if (initialUniv) {
      const all = getAllUniversities();
      const match = all.find((u) => u.name === initialUniv);
      if (match) {
        onSelect(match.name);
        setQuery(match.name);
      }
    }
  }, [initialUniv, onSelect]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        const found = searchUniversities(query);
        setResults(found);
        setIsOpen(found.length > 0);
        setHighlightIndex(-1);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
        && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback((name: string) => {
    setQuery(name);
    setIsOpen(false);
    onSelect(name);
    trackUniversitySearch(name);
  }, [onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex].name);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="대학명을 입력하세요 (예: 선문대, ㅅㅁㄷ)"
          className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl
                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                     outline-none transition-all"
          aria-label="대학 검색"
          aria-expanded={isOpen}
          role="combobox"
          aria-autocomplete="list"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200
                     rounded-xl shadow-lg max-h-80 overflow-y-auto"
          role="listbox"
        >
          {results.map((uni, i) => (
            <button
              key={uni.name}
              onClick={() => handleSelect(uni.name)}
              className={`w-full px-4 py-3 text-left flex justify-between items-center
                         hover:bg-indigo-50 transition-colors
                         ${i === highlightIndex ? 'bg-indigo-50' : ''}
                         ${i === 0 ? 'rounded-t-xl' : ''}
                         ${i === results.length - 1 ? 'rounded-b-xl' : ''}`}
              role="option"
              aria-selected={i === highlightIndex}
            >
              <span className="font-medium text-gray-900">{uni.name}</span>
              <span className="text-sm text-gray-500">
                유학생 {formatNumber(uni.total)}명
                {uni.region && ` · ${uni.region}`}
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedUniversity && (
        <p className="mt-3 text-center text-sm text-gray-500">
          선택됨: <span className="font-semibold text-indigo-600">{selectedUniversity}</span>
        </p>
      )}
    </div>
  );
}
