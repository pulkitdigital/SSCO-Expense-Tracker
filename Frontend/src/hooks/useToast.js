import { useCallback, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  return { toast, showToast, hideToast };
}
