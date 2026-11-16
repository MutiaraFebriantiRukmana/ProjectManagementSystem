import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin menyimpan/menghapus data ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 500); // match duration-500
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !show) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
      >
        <div className="glass-card overflow-hidden rounded-2xl border border-border shadow-2xl bg-surface-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-surface-1/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${type === 'danger' ? 'bg-error/10 border-error/20 text-error' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                {type === 'danger' ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
            </div>
            <button 
              onClick={onCancel}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Body */}
          <div className="px-6 py-5">
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border bg-surface-1/50 px-6 py-4">
            <button
              onClick={onCancel}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 active:scale-[0.98] transition-all ${
                type === 'danger' 
                  ? 'bg-error shadow-error/25' 
                  : 'bg-gradient-to-r from-primary to-primary-dark shadow-primary/25'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
