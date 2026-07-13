import { useState } from 'react';

const STORAGE_KEY = 'ergogroup-ev2-acknowledged';

export function useEV2Modal() {
  const [open, setOpen] = useState(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return true;
    }
  });

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setOpen(false);
  };

  return { open, dismiss };
}
