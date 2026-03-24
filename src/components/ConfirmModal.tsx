'use client';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-bg-card border border-border rounded-[16px] shadow-lg w-full max-w-[400px] mx-4">
        <div className="p-6">
          <h3 className="font-serif text-lg mb-2">{title}</h3>
          <p className="text-sm text-text-secondary">{message}</p>
        </div>
        <div className="flex gap-2 justify-end px-6 pb-6">
          <button
            onClick={onCancel}
            className="border border-border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-bg-warm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red/90 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
