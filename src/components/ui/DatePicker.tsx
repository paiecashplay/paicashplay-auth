'use client';

import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  label?: string;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Sélectionner une date", 
  className = '', 
  required = false,
  label 
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const isoString = date.toISOString().split('T')[0];
    onChange(isoString);
    setIsOpen(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-9 h-9"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentMonth && 
        selectedDate.getFullYear() === currentYear;
      
      const isToday = new Date().getDate() === day && 
        new Date().getMonth() === currentMonth && 
        new Date().getFullYear() === currentYear;

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          className={`w-9 h-9 text-sm rounded-lg font-medium transition-all duration-200 ${
            isSelected 
              ? 'bg-emerald-500 text-white shadow-md' 
              : isToday 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <div 
          className="relative cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <i className="fas fa-calendar-alt absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500 z-10"></i>
          <input
            type="text"
            value={value ? formatDisplayDate(value) : ''}
            placeholder={placeholder}
            readOnly
            className="w-full pl-12 pr-12 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400 cursor-pointer font-medium"
            onClick={() => setIsOpen(true)}
          />
          <i className={`fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-emerald-400 transition-transform duration-200 pointer-events-none ${
            isOpen ? 'rotate-180' : ''
          }`}></i>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-2 bg-white border border-emerald-200 rounded-xl shadow-2xl w-full sm:w-80 p-5 backdrop-blur-sm">
            {/* Header with month/year navigation */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setCurrentYear(currentYear - 1)}
                  className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <i className="fas fa-angle-double-left"></i>
                </button>
                <button
                  type="button"
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <i className="fas fa-angle-left"></i>
                </button>
              </div>
              
              <div className="text-center">
                <div className="font-bold text-lg text-gray-800">
                  {MONTHS[currentMonth]} {currentYear}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <i className="fas fa-angle-right"></i>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentYear(currentYear + 1)}
                  className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <i className="fas fa-angle-double-right"></i>
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-emerald-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {renderCalendar()}
            </div>

            {/* Quick actions */}
            <div className="flex justify-between pt-3 border-t border-emerald-100">
              <button
                type="button"
                onClick={() => {
                  onChange(new Date().toISOString().split('T')[0]);
                  setIsOpen(false);
                }}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold px-3 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <i className="fas fa-calendar-day mr-1"></i>
                Aujourd'hui
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-times mr-1"></i>
                Effacer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}