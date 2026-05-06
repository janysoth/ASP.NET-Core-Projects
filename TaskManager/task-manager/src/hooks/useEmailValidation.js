import { useEffect, useRef, useState } from 'react';
import { checkEmailExists } from '../services/api';

export const useEmailValidation = ({
  value,
  enabled,
  mode,
  syncError,
  onResult,
}) => {
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const lastValueRef = useRef('');
  const onResultRef = useRef(onResult);

  // Keep latest callback without triggering effect
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!enabled || !value || syncError) return;

    // Prevent duplicate calls
    if (lastValueRef.current === value) return;
    lastValueRef.current = value;

    let active = true;

    const run = async () => {
      setIsChecking(true);

      try {
        const res = await checkEmailExists(value);
        const exists = res.data.emailExists;

        if (!active) return;

        let message = '';

        if (mode === 'register') {
          message = exists ? 'Email already exists.' : '';
        }

        if (mode === 'login') {
          message = !exists ? 'Email does not exist.' : '';
        }

        setError(message);
        onResultRef.current?.(message);

      } catch {
        if (active) {
          const errMsg = 'Unable to validate email';
          setError(errMsg);
          onResultRef.current?.(errMsg);
        }
      } finally {
        if (active) setIsChecking(false);
      }
    };

    run();

    return () => {
      active = false;
    };

  }, [value, enabled, mode, syncError]);

  return { error, isChecking };
};