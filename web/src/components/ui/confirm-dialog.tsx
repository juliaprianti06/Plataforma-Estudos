import { Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Excluir item',
  description = 'Deseja realmente excluir esse item? Essa ação não pode ser desfeita.',
  confirmLabel = 'Excluir',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm">
      <div className="bg-card w-full max-w-sm rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-primary">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-6 pt-8">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-white px-8 py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-destructive/90 transition-colors shadow-sm disabled:opacity-70"
          >
            {isLoading ? 'Excluindo...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
