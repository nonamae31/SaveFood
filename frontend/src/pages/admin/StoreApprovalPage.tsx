import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import type { AdminStoreApprovalDTO } from '../../api/admin.api';
import { Check, X, Building, MapPin, Phone, MessageSquare, User } from 'lucide-react';

export default function StoreApprovalPage() {
  const [stores, setStores] = useState<AdminStoreApprovalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchStores = () => {
    setLoading(true);
    adminApi.getPendingStores()
      .then(setStores)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this store?')) return;
    try {
      await adminApi.approveStore(id);
      setStores(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to approve store');
    }
  };

  const handleReject = async (id: string) => {
    if (!reviewNotes.trim()) {
      alert('Please provide review notes for rejection.');
      return;
    }
    try {
      await adminApi.rejectStore(id, reviewNotes);
      setStores(prev => prev.filter(s => s.id !== id));
      setRejectingId(null);
      setReviewNotes('');
    } catch (e) {
      console.error(e);
      alert('Failed to reject store');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building className="w-8 h-8 text-indigo-600" />
            Store Approvals
          </h1>
          <p className="text-gray-500 mt-2">Review and manage pending store applications.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
          <p className="text-gray-500 mt-2">There are no pending store applications to review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map(store => (
            <div key={store.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{store.name}</h3>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Pending
                  </span>
                </div>
                
                <div className="space-y-3 text-sm text-gray-600 mb-6">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                    <span>{store.addressLine}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{store.phoneNumber || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900">{store.ownerName}</span>
                      <span className="text-gray-400 ml-2">{store.ownerEmail}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400">
                  Applied on {new Date(store.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 border-t border-gray-100">
                {rejectingId === store.id ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <textarea 
                        autoFocus
                        placeholder="Reason for rejection..."
                        value={reviewNotes}
                        onChange={e => setReviewNotes(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm min-h-[80px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReject(store.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Confirm Reject
                      </button>
                      <button 
                        onClick={() => { setRejectingId(null); setReviewNotes(''); }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleApprove(store.id)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button 
                      onClick={() => setRejectingId(store.id)}
                      className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
