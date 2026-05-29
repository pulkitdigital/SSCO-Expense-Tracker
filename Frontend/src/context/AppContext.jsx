// import {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useMemo,
//   useState,
// } from 'react';
// import {
//   getExpenses,
//   addExpense,
//   triggerSync as apiTriggerSync,
//   getProfile as apiGetProfile,
//   saveProfile as apiSaveProfile,
//   updateExpense as apiUpdateExpense,
//   deleteExpense as apiDeleteExpense,
//   downloadRowPDF,
// } from '../services/api';
// import { useToast } from '../hooks/useToast';

// const defaultProfile = {
//   companyName: 'SSCO',
//   address: '',
//   gstin: '',
//   phone: '',
//   email: '',
// };

// const AppContext = createContext(null);

// function normalizeProfile(data) {
//   return {
//     companyName: data?.companyName ?? defaultProfile.companyName,
//     address: data?.address ?? '',
//     gstin: data?.gstin ?? '',
//     phone: data?.phone ?? '',
//     email: data?.email ?? '',
//   };
// }

// export function AppProvider({ children }) {
//   const { toast, showToast, hideToast } = useToast();
//   const [expenses, setExpenses] = useState([]);
//   const [profile, setProfile] = useState(defaultProfile);
//   const [loading, setLoading] = useState(false);
//   const [isOnline, setIsOnline] = useState(
//     typeof window !== 'undefined' ? window.navigator.onLine : true
//   );
//   const [syncing, setSyncing] = useState(false);

//   const loadExpenses = useCallback(async ({ silent = false } = {}) => {
//     if (!silent) {
//       setLoading(true);
//     }
//     try {
//       const data = await getExpenses();
//       setExpenses(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error('loadExpenses failed:', error);
//     } finally {
//       if (!silent) {
//         setLoading(false);
//       }
//     }
//   }, []);

//   const loadProfile = useCallback(async () => {
//     try {
//       const data = await apiGetProfile();
//       setProfile(normalizeProfile(data));
//     } catch (error) {
//       console.error('loadProfile failed:', error);
//     }
//   }, []);

//   const saveExpense = useCallback(
//     async (data) => {
//       try {
//         await addExpense(data);
//         await loadExpenses({ silent: true });
//       } catch (error) {
//         console.error('saveExpense failed:', error);
//         throw error;
//       }
//     },
//     [loadExpenses]
//   );

//   const runTriggerSync = useCallback(async () => {
//     setSyncing(true);
//     try {
//       await apiTriggerSync();
//       await loadExpenses({ silent: true });
//     } catch (error) {
//       console.error('triggerSync failed:', error);
//       throw error;
//     } finally {
//       setSyncing(false);
//     }
//   }, [loadExpenses]);

//   const updateProfile = useCallback(async (data) => {
//     try {
//       const updated = await apiSaveProfile(data);
//       setProfile(normalizeProfile(updated));
//       return updated;
//     } catch (error) {
//       console.error('updateProfile failed:', error);
//       throw error;
//     }
//   }, []);

//   const editExpense = useCallback(
//     async (id, data) => {
//       console.log('[AppContext] editExpense', id, data);
//       if (id == null || id === '') {
//         showToast('Cannot update: missing expense id', 'error');
//         throw new Error('Missing expense id');
//       }
//       try {
//         await apiUpdateExpense(id, data);
//         await loadExpenses({ silent: true });
//         showToast('Expense updated!', 'success');
//       } catch (error) {
//         console.error('editExpense failed:', error);
//         showToast('Failed to update expense', 'error');
//         throw error;
//       }
//     },
//     [loadExpenses, showToast]
//   );

//   const removeExpense = useCallback(
//     async (id) => {
//       console.log('[AppContext] removeExpense', id);
//       if (id == null || id === '') {
//         showToast('Cannot delete: missing expense id', 'error');
//         throw new Error('Missing expense id');
//       }
//       try {
//         await apiDeleteExpense(id);
//         await loadExpenses({ silent: true });
//         showToast('Expense deleted!', 'success');
//       } catch (error) {
//         console.error('removeExpense failed:', error);
//         showToast('Failed to delete expense', 'error');
//         throw error;
//       }
//     },
//     [loadExpenses, showToast]
//   );

//   const downloadSinglePDF = useCallback(
//     async (id) => {
//       console.log('[AppContext] downloadSinglePDF', id);
//       if (id == null || id === '') {
//         showToast('Cannot download PDF: missing expense id', 'error');
//         throw new Error('Missing expense id');
//       }
//       try {
//         await downloadRowPDF(id);
//         showToast('PDF downloaded!', 'success');
//       } catch (error) {
//         console.error('downloadSinglePDF failed:', error);
//         showToast('PDF download failed', 'error');
//         throw error;
//       }
//     },
//     [showToast]
//   );

//   useEffect(() => {
//     loadExpenses();
//     loadProfile();
//   }, [loadExpenses, loadProfile]);

//   useEffect(() => {
//     const handleOnline = () => setIsOnline(true);
//     const handleOffline = () => setIsOnline(false);

//     window.addEventListener('online', handleOnline);
//     window.addEventListener('offline', handleOffline);

//     return () => {
//       window.removeEventListener('online', handleOnline);
//       window.removeEventListener('offline', handleOffline);
//     };
//   }, []);

//   useEffect(() => {
//     if (!isOnline) return;

//     runTriggerSync().catch(() => {});
//   }, [isOnline, runTriggerSync]);

//   const value = useMemo(
//     () => ({
//       expenses,
//       profile,
//       loading,
//       isOnline,
//       syncing,
//       loadExpenses,
//       saveExpense,
//       editExpense,
//       removeExpense,
//       downloadSinglePDF,
//       updateProfile,
//       triggerSync: runTriggerSync,
//       showToast,
//       hideToast,
//       toast,
//     }),
//     [
//       expenses,
//       profile,
//       loading,
//       isOnline,
//       syncing,
//       loadExpenses,
//       saveExpense,
//       editExpense,
//       removeExpense,
//       downloadSinglePDF,
//       updateProfile,
//       runTriggerSync,
//       showToast,
//       hideToast,
//       toast,
//     ]
//   );

//   return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
// }

// export function useApp() {
//   const context = useContext(AppContext);
//   if (!context) {
//     throw new Error('useApp must be used within an AppProvider');
//   }
//   return context;
// }






































import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getExpenses,
  addExpense,
  triggerSync as apiTriggerSync,
  getProfile as apiGetProfile,
  saveProfile as apiSaveProfile,
  updateExpense as apiUpdateExpense,
  deleteExpense as apiDeleteExpense,
  downloadRowPDF,
  fillExpenseEntry as apiFillExpenseEntry,  // NEW — add this to api.js too
} from '../services/api';
import { useToast } from '../hooks/useToast';

const defaultProfile = {
  companyName: 'SSCO',
  address: '',
  gstin: '',
  phone: '',
  email: '',
};

const AppContext = createContext(null);

function normalizeProfile(data) {
  return {
    companyName: data?.companyName ?? defaultProfile.companyName,
    address: data?.address ?? '',
    gstin: data?.gstin ?? '',
    phone: data?.phone ?? '',
    email: data?.email ?? '',
  };
}

export function AppProvider({ children }) {
  const { toast, showToast, hideToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );
  const [syncing, setSyncing] = useState(false);

  const loadExpenses = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('loadExpenses failed:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const data = await apiGetProfile();
      setProfile(normalizeProfile(data));
    } catch (error) {
      console.error('loadProfile failed:', error);
    }
  }, []);

  const saveExpense = useCallback(
    async (data) => {
      try {
        await addExpense(data);
        await loadExpenses({ silent: true });
      } catch (error) {
        console.error('saveExpense failed:', error);
        throw error;
      }
    },
    [loadExpenses]
  );

  // NEW — Fill actuals for a receipt-only entry
  // Calls PATCH /api/expenses/:id/entry
  const fillEntry = useCallback(
    async (id, data) => {
      console.log('[AppContext] fillEntry', id, data);
      if (id == null || id === '') {
        showToast('Cannot update: missing expense id', 'error');
        throw new Error('Missing expense id');
      }
      try {
        await apiFillExpenseEntry(id, data);
        await loadExpenses({ silent: true });
        showToast('Entry filled successfully!', 'success');
      } catch (error) {
        console.error('fillEntry failed:', error);
        showToast('Failed to fill entry', 'error');
        throw error;
      }
    },
    [loadExpenses, showToast]
  );

  const runTriggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      await apiTriggerSync();
      await loadExpenses({ silent: true });
    } catch (error) {
      console.error('triggerSync failed:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [loadExpenses]);

  const updateProfile = useCallback(async (data) => {
    try {
      const updated = await apiSaveProfile(data);
      setProfile(normalizeProfile(updated));
      return updated;
    } catch (error) {
      console.error('updateProfile failed:', error);
      throw error;
    }
  }, []);

  const editExpense = useCallback(
    async (id, data) => {
      console.log('[AppContext] editExpense', id, data);
      if (id == null || id === '') {
        showToast('Cannot update: missing expense id', 'error');
        throw new Error('Missing expense id');
      }
      try {
        await apiUpdateExpense(id, data);
        await loadExpenses({ silent: true });
        showToast('Expense updated!', 'success');
      } catch (error) {
        console.error('editExpense failed:', error);
        showToast('Failed to update expense', 'error');
        throw error;
      }
    },
    [loadExpenses, showToast]
  );

  const removeExpense = useCallback(
    async (id) => {
      console.log('[AppContext] removeExpense', id);
      if (id == null || id === '') {
        showToast('Cannot delete: missing expense id', 'error');
        throw new Error('Missing expense id');
      }
      try {
        await apiDeleteExpense(id);
        await loadExpenses({ silent: true });
        showToast('Expense deleted!', 'success');
      } catch (error) {
        console.error('removeExpense failed:', error);
        showToast('Failed to delete expense', 'error');
        throw error;
      }
    },
    [loadExpenses, showToast]
  );

  const downloadSinglePDF = useCallback(
    async (id) => {
      console.log('[AppContext] downloadSinglePDF', id);
      if (id == null || id === '') {
        showToast('Cannot download PDF: missing expense id', 'error');
        throw new Error('Missing expense id');
      }
      try {
        await downloadRowPDF(id);
        showToast('PDF downloaded!', 'success');
      } catch (error) {
        console.error('downloadSinglePDF failed:', error);
        showToast('PDF download failed', 'error');
        throw error;
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadExpenses();
    loadProfile();
  }, [loadExpenses, loadProfile]);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    runTriggerSync().catch(() => {});
  }, [isOnline, runTriggerSync]);

  const value = useMemo(
    () => ({
      expenses,
      profile,
      loading,
      isOnline,
      syncing,
      loadExpenses,
      saveExpense,
      fillEntry,        // NEW
      editExpense,
      removeExpense,
      downloadSinglePDF,
      updateProfile,
      triggerSync: runTriggerSync,
      showToast,
      hideToast,
      toast,
    }),
    [
      expenses,
      profile,
      loading,
      isOnline,
      syncing,
      loadExpenses,
      saveExpense,
      fillEntry,        // NEW
      editExpense,
      removeExpense,
      downloadSinglePDF,
      updateProfile,
      runTriggerSync,
      showToast,
      hideToast,
      toast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}