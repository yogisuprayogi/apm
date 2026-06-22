import React from 'react';
import { ShieldAlert, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
}) => {
  const icons = {
    danger: (
      <div className="p-3 bg-rose-100 rounded-full dark:bg-rose-950/40">
        <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400" />
      </div>
    ),
    warning: (
      <div className="p-3 bg-amber-100 rounded-full dark:bg-amber-950/40">
        <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
    ),
    info: (
      <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-950/40">
        <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
    ),
    success: (
      <div className="p-3 bg-emerald-100 rounded-full dark:bg-emerald-950/40">
        <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
      </div>
    ),
  };

  const confirmButtonClass = {
    danger: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 shadow-rose-200 dark:shadow-none text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 shadow-amber-100 dark:shadow-none text-white',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-200 dark:shadow-none text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-200 dark:shadow-none text-white',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
          >
            <div className="flex flex-col items-center text-center">
              {icons[type]}

              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                {title}
              </h3>

              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {message}
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full justify-center">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClass[type]}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
