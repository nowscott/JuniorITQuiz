import { useEffect, type Dispatch, type SetStateAction } from 'react';

export function useExamTimer(params: {
  isActive: boolean;
  timeLeft: number;
  setTimeLeft: Dispatch<SetStateAction<number>>;
  onExpire: () => void;
}) {
  const { isActive, timeLeft, setTimeLeft, onExpire } = params;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, onExpire, setTimeLeft, timeLeft]);
}
