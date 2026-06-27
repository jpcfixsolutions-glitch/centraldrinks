import { useEffect, useRef } from 'react';

function esCampoEscaneable(target) {
  if (!(target instanceof HTMLElement)) return false;
  return target.dataset.barcodeScanner === 'true';
}

function debeIgnorarEvento(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (esCampoEscaneable(target)) return false;

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

export function useBarcodeScanner({ onScan, enabled = true, minLength = 4 }) {
  const bufferRef = useRef('');
  const ultimaTeclaRef = useRef(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      if (debeIgnorarEvento(e.target)) return;

      const ahora = Date.now();
      if (ahora - ultimaTeclaRef.current > 120) {
        bufferRef.current = '';
      }
      ultimaTeclaRef.current = ahora;

      if (e.key === 'Enter') {
        const codigo = bufferRef.current.trim();
        bufferRef.current = '';
        if (codigo.length >= minLength && /^\d+$/.test(codigo)) {
          e.preventDefault();
          onScanRef.current(codigo);
        }
        return;
      }

      if (e.key.length === 1 && /^\d$/.test(e.key)) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, minLength]);
}
