import { useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

const typeStyles = {
  success: {
    bg: 'bg-green-500',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-500',
    icon: XCircle,
  },
  warning: {
    bg: 'bg-orange-500',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-500',
    icon: Info,
  },
};

function Toast({ message, type = 'info', onClose }) {
  const styles = typeStyles[type] || typeStyles.info;
  const Icon = styles.icon;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onClose();
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [message, type, onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl px-5 py-4 text-white shadow-lg animate-slide-in-right ${styles.bg}`}
      role="alert"
    >
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg p-0.5 text-white/90 transition-colors hover:bg-white/20"
        aria-label="Close notification"
      >
        <X size={18} aria-hidden />
      </button>
    </div>
  );
}

export default Toast;
