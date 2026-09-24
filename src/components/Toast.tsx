import { useEffect, useState } from 'react';
import { onToast } from '../lib/toast';

export function Toast() {
  const [message, setMessage] = useState<string>();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = onToast((text) => {
      setMessage(text);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(undefined), 2800);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);
  return (
    <div className="toast" role="status" aria-live="polite" data-show={message ? 'true' : 'false'}>
      {message}
    </div>
  );
}
