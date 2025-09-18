'use client';

import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  label?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
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
  label,
  minDate,
  maxDate,
  disabled = false
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
    
    // Vérifier les limites de date
    if (minDate && isoString < minDate) return;
    if (maxDate && isoString > maxDate) return;
    
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
      const dayDate = new Date(currentYear, currentMonth, day);
      const dayIsoString = dayDate.toISOString().split('T')[0];
      
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentMonth && 
        selectedDate.getFullYear() === currentYear;
      
      const isToday = new Date().getDate() === day && 
        new Date().getMonth() === currentMonth && 
        new Date().getFullYear() === currentYear;
      
      const isDisabled = 
        (minDate && dayIsoString < minDate) || 
        (maxDate && dayIsoString > maxDate);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isDisabled && handleDateSelect(day)}
          disabled={isDisabled}
          className={`w-9 h-9 text-sm rounded-lg font-medium transition-all duration-200 ${
            isDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : isSelected 
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
          className={`relative ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => !disabled && setIsOpen(true)}
        >
          <i className={`fas fa-calendar-alt absolute left-4 top-1/2 transform -translate-y-1/2 z-10 ${
            disabled ? 'text-gray-300' : 'text-emerald-500'
          }`}></i>
          <input
            type="text"
            value={value ? formatDisplayDate(value) : ''}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 font-medium ${
              disabled 
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-gray-900 placeholder-gray-400 cursor-pointer'
            }`}
            onClick={() => !disabled && setIsOpen(true)}
          />
          <i className={`fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 transition-transform duration-200 pointer-events-none ${
            disabled ? 'text-gray-300' : 'text-emerald-400'
          } ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-2 bg-white border border-emerald-200 rounded-xl shadow-2xl w-full sm:w-80 p-5 backdrop-blur-sm">
            {/* Header with month/year selectors */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 bg-white text-gray-800 font-medium"
              >
                {MONTHS.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 bg-white text-gray-800 font-medium"
              >
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const startYear = minDate ? new Date(minDate).getFullYear() : currentYear - 100;
                  const endYear = maxDate ? new Date(maxDate).getFullYear() : currentYear;
                  const years = [];
                  for (let year = endYear; year >= startYear; year--) {
                    years.push(<option key={year} value={year}>{year}</option>);
                  }
                  return years;
                })()}
              </select>
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
                  const today = new Date().toISOString().split('T')[0];
                  if ((!minDate || today >= minDate) && (!maxDate || today <= maxDate)) {
                    onChange(today);
                    setIsOpen(false);
                  }
                }}
                disabled={(() => {
                  const today = new Date().toISOString().split('T')[0];
                  return (minDate && today < minDate) || (maxDate && today > maxDate);
                })()}
                className="text-sm font-semibold px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
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