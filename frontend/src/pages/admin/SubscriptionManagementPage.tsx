import { useEffect, useState } from 'react';
import { subscriptionPlansApi, type SubscriptionPlanDTO, type CreateSubscriptionPlanRequest, type UpdateSubscriptionPlanRequest } from '../../api/subscription-plans.api';
import { CreditCard, Plus, X, Pencil, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';

function SubscriptionPlanModal({
  plan,
  allPlans,
  onClose,
  onSave
}: {
  plan: SubscriptionPlanDTO | null,
  allPlans: SubscriptionPlanDTO[],
  onClose: () => void,
  onSave: (data: CreateSubscriptionPlanRequest | UpdateSubscriptionPlanRequest) => Promise<void>
}) {
  const [name, setName] = useState(plan?.name || '');
  const [monthlyPrice, setMonthlyPrice] = useState(plan?.monthlyPrice.toString() || '0');
  
  const initialFeatures = (plan?.description || '')
    .split('.')
    .map(f => f.trim())
    .filter(f => f.length > 0)
    .map(f => ({ id: Math.random().toString(), text: f, markedForDeletion: false }));
    
  const [features, setFeatures] = useState(initialFeatures);
  const [submitting, setSubmitting] = useState(false);

  // Copy Features State
  const [showCopySection, setShowCopySection] = useState(false);
  const [selectedPlanToCopy, setSelectedPlanToCopy] = useState<string>('');
  const [selectedFeaturesToCopy, setSelectedFeaturesToCopy] = useState<string[]>([]);

  const handleAddFeature = () => {
    setFeatures([...features, { id: Math.random().toString(), text: '', markedForDeletion: false }]);
  };

  const handleFeatureChange = (id: string, text: string) => {
    setFeatures(features.map(f => f.id === id ? { ...f, text } : f));
  };

  const toggleDeleteFeature = (id: string) => {
    setFeatures(features.map(f => f.id === id ? { ...f, markedForDeletion: !f.markedForDeletion } : f));
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newFeatures = [...features];
      [newFeatures[index - 1], newFeatures[index]] = [newFeatures[index], newFeatures[index - 1]];
      setFeatures(newFeatures);
    } else if (direction === 'down' && index < features.length - 1) {
      const newFeatures = [...features];
      [newFeatures[index + 1], newFeatures[index]] = [newFeatures[index], newFeatures[index + 1]];
      setFeatures(newFeatures);
    }
  };

  const handleCopyFeatures = () => {
    const newFeatures = selectedFeaturesToCopy.map(text => ({
      id: Math.random().toString(),
      text,
      markedForDeletion: false
    }));
    setFeatures([...features, ...newFeatures]);
    setShowCopySection(false);
    setSelectedPlanToCopy('');
    setSelectedFeaturesToCopy([]);
  };

  const planToCopy = allPlans.find(p => p.id === selectedPlanToCopy);
  const featuresOfPlanToCopy = planToCopy?.description?.split('.').map(f => f.trim()).filter(f => f.length > 0) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalDescription = features
        .filter(f => !f.markedForDeletion)
        .map(f => f.text.trim())
        .filter(f => f.length > 0)
        .join('. ');

      await onSave({
        name,
        description: finalDescription,
        monthlyPrice: parseFloat(monthlyPrice) || 0
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-mint-primary/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-inter">
      <div className="bg-mint-canvas rounded-[12px] shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12)] border border-mint-hairline w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-mint-canvas/80 backdrop-blur-md border-b border-mint-hairline-soft px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[22px] font-semibold text-mint-ink flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-mint-steel" />
            {plan ? 'Edit Subscription Plan' : 'Add New Plan'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-mint-surface rounded-full transition-colors text-mint-stone hover:text-mint-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-mint-stone font-medium text-[14px] mb-1">Plan Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Basic Plan"
                className="w-full px-4 py-2 bg-mint-surface border border-mint-hairline text-mint-ink rounded-[8px] focus:outline-none focus:border-mint-brand-green focus:border-2 text-[14px] transition-all"
              />
            </div>
            <div>
              <label className="block text-mint-stone font-medium text-[14px] mb-1">Monthly Price (VND)</label>
              <input
                required
                type="number"
                min="0"
                step="1000"
                value={monthlyPrice}
                onChange={e => setMonthlyPrice(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 bg-mint-surface border border-mint-hairline text-mint-ink rounded-[8px] focus:outline-none focus:border-mint-brand-green focus:border-2 text-[14px] transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-mint-hairline-soft pb-2">
              <label className="block text-mint-stone font-medium text-[14px]">
                Plan Features
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCopySection(!showCopySection)}
                  className="text-[13px] font-medium text-mint-brand-green hover:text-mint-brand-green-deep transition-colors flex items-center gap-1 bg-mint-brand-green/10 px-2 py-1 rounded"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy from another plan
                </button>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="text-[13px] font-medium text-mint-ink hover:text-black transition-colors flex items-center gap-1 bg-mint-surface px-2 py-1 rounded border border-mint-hairline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Feature
                </button>
              </div>
            </div>

            {showCopySection && (
              <div className="bg-mint-surface-soft p-4 rounded-[8px] border border-mint-hairline animate-in slide-in-from-top-2">
                <h4 className="text-[13px] font-medium text-mint-ink mb-3">Copy features from:</h4>
                <select 
                  className="w-full px-3 py-2 border border-mint-hairline rounded-[6px] text-[13px] mb-3"
                  value={selectedPlanToCopy}
                  onChange={(e) => {
                    setSelectedPlanToCopy(e.target.value);
                    setSelectedFeaturesToCopy([]);
                  }}
                >
                  <option value="">Select a plan...</option>
                  {allPlans.filter(p => p.id !== plan?.id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                {featuresOfPlanToCopy.length > 0 && (
                  <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-2">
                    {featuresOfPlanToCopy.map((f, i) => (
                      <label key={i} className="flex items-center gap-2 text-[13px] text-mint-ink cursor-pointer hover:bg-mint-surface p-1 rounded">
                        <input 
                          type="checkbox" 
                          checked={selectedFeaturesToCopy.includes(f)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFeaturesToCopy([...selectedFeaturesToCopy, f]);
                            } else {
                              setSelectedFeaturesToCopy(selectedFeaturesToCopy.filter(item => item !== f));
                            }
                          }}
                          className="rounded text-mint-brand-green focus:ring-mint-brand-green"
                        />
                        <span>{f}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {selectedPlanToCopy && (
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowCopySection(false)} className="px-3 py-1.5 text-[12px] hover:bg-mint-canvas rounded">Cancel</button>
                    <button 
                      type="button" 
                      onClick={handleCopyFeatures}
                      disabled={selectedFeaturesToCopy.length === 0}
                      className="px-3 py-1.5 text-[12px] bg-mint-brand-green text-mint-primary font-medium rounded disabled:opacity-50"
                    >
                      Add Selected ({selectedFeaturesToCopy.length})
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {features.length === 0 && (
                <p className="text-center text-mint-steel text-[13px] py-4 italic bg-mint-surface rounded-[8px]">
                  No features added yet.
                </p>
              )}
              {features.map((feature, index) => (
                <div key={feature.id} className={`flex items-center gap-3 p-2 rounded-[8px] transition-colors border ${feature.markedForDeletion ? 'bg-[#d45656]/5 border-[#d45656]/20' : 'bg-mint-canvas border-mint-hairline hover:border-mint-brand-green'}`}>
                  
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button 
                      type="button" 
                      onClick={() => moveFeature(index, 'up')}
                      disabled={index === 0}
                      className="text-mint-stone hover:text-mint-ink disabled:opacity-30 disabled:hover:text-mint-stone"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => moveFeature(index, 'down')}
                      disabled={index === features.length - 1}
                      className="text-mint-stone hover:text-mint-ink disabled:opacity-30 disabled:hover:text-mint-stone"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={feature.text}
                    onChange={(e) => handleFeatureChange(feature.id, e.target.value)}
                    disabled={feature.markedForDeletion}
                    placeholder="Describe a feature..."
                    className={`flex-1 px-3 py-2 bg-transparent text-[14px] focus:outline-none ${feature.markedForDeletion ? 'line-through text-mint-stone' : 'text-mint-ink'}`}
                  />
                  
                  {/* Delete Checkbox visually represented as a checkbox with label */}
                  <label className="flex items-center gap-2 shrink-0 cursor-pointer text-[13px] font-medium px-2 py-1 rounded hover:bg-mint-surface">
                    <input 
                      type="checkbox" 
                      checked={feature.markedForDeletion}
                      onChange={() => toggleDeleteFeature(feature.id)}
                      className="w-4 h-4 rounded text-[#d45656] focus:ring-[#d45656]"
                    />
                    <span className={feature.markedForDeletion ? 'text-[#d45656]' : 'text-mint-stone'}>Delete</span>
                  </label>

                </div>
              ))}
            </div>
            
            {features.some(f => f.markedForDeletion) && (
              <p className="text-[12px] text-[#d45656] font-medium flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" />
                Features marked for deletion will be removed when you save the plan.
              </p>
            )}

          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-mint-hairline-soft">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-[8px] text-[14px] font-medium text-mint-ink hover:bg-mint-surface border border-mint-hairline transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-[8px] text-[14px] font-medium text-mint-primary bg-mint-brand-green hover:bg-mint-brand-green-deep transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubscriptionManagementPage() {
  const [plans, setPlans] = useState<SubscriptionPlanDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{ isOpen: boolean, plan: SubscriptionPlanDTO | null }>({ isOpen: false, plan: null });

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await subscriptionPlansApi.getAllPlans();
      setPlans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleSave = async (data: CreateSubscriptionPlanRequest | UpdateSubscriptionPlanRequest) => {
    if (modalState.plan) {
      await subscriptionPlansApi.updatePlan(modalState.plan.id, data as UpdateSubscriptionPlanRequest);
    } else {
      await subscriptionPlansApi.createPlan(data as CreateSubscriptionPlanRequest);
    }
    await loadPlans();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await subscriptionPlansApi.deletePlan(id);
      await loadPlans();
    } catch (e) {
      console.error(e);
      alert('Failed to delete plan');
    }
  };

  return (
    <div className="p-8 max-w-[1280px] mx-auto font-inter bg-mint-surface-soft min-h-[calc(100vh-64px)] rounded-tl-[16px] border-t border-l border-mint-hairline shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[36px] font-semibold text-mint-ink tracking-[-0.5px] flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-mint-ink" />
            Subscription Plans
          </h1>
          <p className="text-[16px] text-mint-steel mt-2">Manage platform pricing tiers and limits.</p>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, plan: null })}
          className="bg-mint-ink hover:bg-black text-mint-canvas px-5 py-2.5 rounded-[8px] font-medium text-[14px] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Plan
        </button>
      </div>

      <div className="bg-mint-canvas rounded-[12px] border border-mint-hairline shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="text-mint-steel border-b border-mint-hairline bg-mint-surface/50">
              <tr>
                <th className="px-6 py-4 font-medium">Plan Name</th>
                <th className="px-6 py-4 font-medium">Monthly Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium w-1/2">Features / Description</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-mint-steel">
                    <div className="inline-block w-6 h-6 border-[2px] border-mint-brand-green border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-mint-steel text-[14px]">
                    No subscription plans found.
                  </td>
                </tr>
              ) : (
                plans.map(plan => (
                  <tr key={plan.id} className="hover:bg-mint-surface transition-colors border-b border-mint-hairline-soft last:border-0">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-mint-ink text-[15px]">{plan.name}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-mint-ink">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.monthlyPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold tracking-[0.5px] uppercase ${plan.isActive ? 'bg-[#7cebcb]/20 text-[#1ba673]' : 'bg-[#c37d0d]/10 text-[#c37d0d]'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {plan.description?.split('.').map(f => f.trim()).filter(f => f.length > 0).map((feature, idx) => (
                          <span key={idx} className="bg-mint-surface border border-mint-hairline text-mint-ink px-2 py-1 rounded-[6px] text-[12px]">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setModalState({ isOpen: true, plan })}
                          className="p-2 text-mint-stone hover:text-mint-ink hover:bg-mint-surface rounded-[8px] transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="p-2 text-mint-stone hover:text-[#d45656] hover:bg-[#d45656]/10 rounded-[8px] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalState.isOpen && (
        <SubscriptionPlanModal
          plan={modalState.plan}
          allPlans={plans}
          onClose={() => setModalState({ isOpen: false, plan: null })}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
