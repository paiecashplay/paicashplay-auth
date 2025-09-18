'use client';

import { useState } from 'react';

interface BirthDateSelectorProps {
  value: string;
  onChange: (date: string) => void;
  minAge?: number;
  maxAge?: number;
  required?: boolean;
  label?: string;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function BirthDateSelector({ 
  value, 
  onChange, 
  minAge = 4,
  maxAge = 100,
  required = false,
  label = 'Date de naissance'
}: BirthDateSelectorProps) {
  
  const parseDate = (dateString: string) => {
    if (!dateString) return { day: '', month: '', year: '' };
    const date = new Date(dateString);
    return {
      day: date.getDate().toString(),
      month: date.getMonth().toString(),
      year: date.getFullYear().toString()
    };
  };

  const { day, month, year } = parseDate(value);
  
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - maxAge;
  const maxYear = currentYear - minAge;

  const updateDate = (newDay: string, newMonth: string, newYear: string) => {
    if (newDay && newMonth && newYear) {
      const date = new Date(parseInt(newYear), parseInt(newMonth), parseInt(newDay));
      onChange(date.toISOString().split('T')[0]);
    } else {
      onChange('');
    }
  };

  const getDaysInMonth = (monthIndex: number, yearValue: number) => {
    return new Date(yearValue, monthIndex + 1, 0).getDate();
  };

  const selectedMonth = month ? parseInt(month) : -1;
  const selectedYear = year ? parseInt(year) : 0;
  const daysInMonth = selectedMonth >= 0 && selectedYear ? getDaysInMonth(selectedMonth, selectedYear) : 31;

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="grid grid-cols-3 gap-3">
        {/* Jour */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Jour</label>
          <select
            value={day}
            onChange={(e) => updateDate(e.target.value, month, year)}
            className="w-full px-3 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white text-gray-900"
          >
            <option value="">--</option>
            {Array.from({ length: daysInMonth }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>

        {/* Mois */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Mois</label>
          <select
            value={month}
            onChange={(e) => updateDate(day, e.target.value, year)}
            className="w-full px-3 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white text-gray-900"
          >
            <option value="">--</option>
            {MONTHS.map((monthName, index) => (
              <option key={index} value={index}>{monthName}</option>
            ))}
          </select>
        </div>

        {/* Année */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Année</label>
          <select
            value={year}
            onChange={(e) => updateDate(day, month, e.target.value)}
            className="w-full px-3 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white text-gray-900"
          >
            <option value="">----</option>
            {Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
              const yearValue = maxYear - i;
              return <option key={yearValue} value={yearValue}>{yearValue}</option>;
            })}
          </select>
        </div>
      </div>

      {value && (
        <div className="mt-2 text-center">
          <span className="text-sm text-emerald-600 font-medium">
            <i className="fas fa-birthday-cake mr-1"></i>
            {(() => {
              const birthDate = new Date(value);
              const today = new Date();
              let age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
              return `${age} ans`;
            })()}
          </span>
        </div>
      )}
    </div>
  );
}