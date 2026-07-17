import { useState, useEffect } from 'react';

interface CountdownTimerProps {
    targetDate: string;
    onExpire?: () => void;
}

export function CountdownTimer({ targetDate, onExpire }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        const target = new Date(targetDate).getTime();
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = Math.floor((target - now) / 1000);
            
            if (diff <= 0) {
                setTimeLeft(0);
                if (onExpire) {
                    onExpire();
                }
            } else {
                setTimeLeft(diff);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [targetDate, onExpire]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    if (timeLeft <= 0) return null;

    return (
        <div className="text-destructive font-mono text-xl font-bold p-2 bg-red-100 text-red-600 rounded-md inline-block">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
    );
}
