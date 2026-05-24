'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;

  
   
    
  
}

export default function Home() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservingId, setReservingId] = useState<string | null>(null);
  const router = useRouter();

  // 1. Fetch real-time stock levels when the page loads
  useEffect(() => {
    fetch('/api/inventory')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setInventory(data);
        } else {
          setError('Failed to load inventory data structure');
        }
      })
      .catch((err) => setError('Error loading inventory data'))
      .finally(() => setLoading(false));
  }, []);

  // 2. Handle clicking the "Reserve Button"
  const handleReserve = async (item: InventoryItem) => {
    setReservingId(item.id);
    setError('');

    try {
      const response = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          warehouseId: item.warehouseId,
          quantity: 1, // Reserving 1 unit for checkout
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Explicitly show the 409 error message to the user if stock is taken
        if (response.status === 409) {
          throw new Error('409: Sorry, another shopper just grabbed the last unit of this item!');
        }
        throw new Error(data.error || 'Something went wrong');
      }

      // Success! Alert the user and show them their reservation ID
      router.push(`/checkout/${data.id}`);
      
      
      // Refresh the local page quantities automatically
      const freshRes = await fetch('/api/inventory');
      const freshData = await freshRes.json();
      setInventory(freshData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setReservingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center font-medium">Loading Allo Stock Dashboard...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Allo Multi-Warehouse Inventory</h1>
        <p className="text-slate-500 mb-6">Real-time stock monitoring with 10-minute checkout reservations.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inventory.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">Product Asset</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {item.productId}</p>
                </div>
                <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md">
  {item.warehouseId || 'Location Node'}
</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center my-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Total</p>
                  <p className="text-lg font-bold text-slate-700">{item.totalQuantity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Held</p>
                  <p className="text-lg font-bold text-amber-600">{item.reservedQuantity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Available</p>
                  <p className="text-lg font-bold text-emerald-600">{item.availableQuantity}</p>
                </div>
              </div>

              <button
                onClick={() => handleReserve(item)}
                disabled={item.availableQuantity <= 0 || reservingId !== null}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  item.availableQuantity <= 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]'
                }`}
              >
                {reservingId === item.id ? 'Holding Stock...' : item.availableQuantity <= 0 ? 'Out of Stock' : 'Proceed to Checkout (Reserve)'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}