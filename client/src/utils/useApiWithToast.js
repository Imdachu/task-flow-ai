import { useToast } from '../components/ToastProvider';
import { useApi } from './useApi';

export function useApiWithToast(apiFunction, { successMessage, errorMessage } = {}) {
  const toast = useToast();
  const api = useApi(apiFunction);

  const execute = async (...args) => {
    try {
      const res = await api.execute(...args);
      if (successMessage) toast.addToast(successMessage, 'success');
      return res;
    } catch (err) {
      const msg = errorMessage || (err && err.message) || 'Operation failed';
      toast.addToast(msg, 'error');
      throw err;
    }
  };

  return { ...api, execute };
}

export default useApiWithToast;
