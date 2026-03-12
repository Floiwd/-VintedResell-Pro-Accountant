import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{title}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">{message}</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-rose-100 dark:shadow-none hover:bg-rose-700 transition-all active:scale-95"
            >
              Supprimer définitivement
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              Annuler
            </button>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ConfirmModal;