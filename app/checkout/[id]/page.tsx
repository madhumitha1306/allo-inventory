'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params?.id as string;

  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds (600s)
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  // 1. Live countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format seconds into MM:SS display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 2. Handle "Confirm Purchase" Button (Payment Success)
  const handleConfirm = async () => {
    setIsProcessing(true);
    setStatusMessage('');

    try {
      const response = await fetch(`/api/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Explicitly show 410 error to user if reservation expired
        if (response.status === 410) {
          throw new Error('410: Your 10-minute reservation hold has expired. The stock was released.');
        }
        throw new Error(data.error || 'Failed to confirm purchase');
      }

      alert('Payment Confirmed! Your order is being processed.');
      router.push('/'); // Send them back to the clean dashboard
    } catch (err: any) {
      setStatusMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Handle "Cancel" Button (Release Hold Early)
  const handleCancel = async () => {
    setIsProcessing(true);
    setStatusMessage('');

    try {
      const response = await fetch(`/api/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to release reservation');
      }

      alert('Reservation cancelled. Your stock hold has been released back to the store.');
      router.push('/'); // Send them back to the dashboard immediately
    } catch (err: any) {
      setStatusMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800 flex items-center justify-center">
      <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Secure Checkout</h1>
        <p className="text-sm text-slate-500 mb-6 font-mono">Hold ID: {reservationId}</p>

        {/* Live Timer Visual Block */}
        <div className={`p-6 rounded-lg mb-6 border ${isExpired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <p className="text-xs uppercase font-semibold tracking-wider mb-1">Time Remaining to Complete Payment</p>
          <p className="text-4xl font-mono font-bold">{isExpired ? '00:00' : formatTime(timeLeft)}</p>
        </div>

        {statusMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium text-left">
            {statusMessage}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={isExpired || isProcessing}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
              isExpired || isProcessing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Confirm Purchase'}
          </button>

          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-lg font-semibold text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.99]"
          >
            Cancel Reservation
          </button>
        </div>
      </div>
    </main>
  );
}