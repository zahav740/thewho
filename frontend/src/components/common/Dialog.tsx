/**
 * @file: Dialog.tsx
 * @description: Базовые компоненты диалогового окна (исправлено)
 * @created: 2025-06-30
 */
import React, { useEffect } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Content */}
      <div className="relative z-50">
        {children}
      </div>
    </div>
  );
};

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogContent: React.FC<DialogContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 m-4 max-w-lg w-full max-h-[90vh] overflow-y-auto ${className}`}>
      <div className="flex justify-end mb-2">
        <button 
          className="text-gray-400 hover:text-gray-600 text-xl"
          onClick={(e) => {
            // Найдем Dialog родителя и закроем его
            const dialogElement = (e.target as HTMLElement).closest('[role="dialog"]')?.parentElement;
            if (dialogElement) {
              const backdrop = dialogElement.querySelector('[data-backdrop="true"]') as HTMLElement;
              if (backdrop) {
                backdrop.click();
              }
            }
          }}
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  );
};

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
};

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ children, className = '' }) => {
  return (
    <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  );
};
