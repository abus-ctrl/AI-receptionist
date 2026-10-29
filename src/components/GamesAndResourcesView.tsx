import React, { useState } from 'react';
import { useArcade } from '../context/ArcadeContext';
import { useAuth } from '../context/AuthContext';
import { Resource, ResourceStatus, Product, ProductVariant } from '../types';
import {
  Gamepad2,
  Layers,
  Wrench,
  CheckCircle,
  AlertCircle,
  Edit2,
  Sparkles,
  Users,
  Clock,
  Save,
  X
} from 'lucide-react';

export const GamesAndResourcesView: React.FC = () => {
  const { state, updateResourceStatus, updateProductPrice, updateProductVariantPrice } = useArcade();
  const { isOwner } = useAuth();

  const [activeTab, setActiveTab] = useState<'RESOURCES' | 'CATALOGUE'>('RESOURCES');
  const [editingPriceItem, setEditingPriceItem] = useState<{ id: string; type: 'PRODUCT' | 'VARIANT'; currentPrice: number; name: string } | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<number>(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredResources = state.resources.filter((r) => {
    if (categoryFilter === 'ALL') return true;
    return r.categoryId === categoryFilter;
  });

  const filteredProducts = state.products.filter((p) => {
    if (categoryFilter === 'ALL') return true;
    return p.categoryId === categoryFilter;
  });

  const handleStatusChange = (resourceId: string, newStatus: ResourceStatus) => {
    updateResourceStatus(resourceId, newStatus);
  };

  const handleSavePrice = () => {
    if (!editingPriceItem) return;
    if (editingPriceItem.type === 'PRODUCT') {
      updateProductPrice(editingPriceItem.id, newPriceValue);
    } else {
      updateProductVariantPrice(editingPriceItem.id, newPriceValue);
    }
    setEditingPriceItem(null);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Games & Physical Resources</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hardware station allocation, maintenance toggles, and official price catalogue
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('RESOURCES')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'RESOURCES' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Physical Hardware ({state.resources.length})
          </button>
          <button
            onClick={() => setActiveTab('CATALOGUE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'CATALOGUE' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Product Catalogue ({state.products.length})
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
            categoryFilter === 'ALL'
              ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          All Activities
        </button>
        {state.gameCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
              categoryFilter === c.id
                ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* VIEW A: PHYSICAL HARDWARE RESOURCES */}
      {activeTab === 'RESOURCES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((res) => {
            const isAvailable = res.status === 'AVAILABLE';
            const isOccupied = res.status === 'OCCUPIED';
            const isMaint = res.status === 'MAINTENANCE';
            const isShared = res.capacity > 1;

            return (
              <div
                key={res.id}
                className="bg-[#0E1526] rounded-xl border border-slate-800 p-4 flex flex-col justify-between text-slate-100 shadow-sm hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">{res.name}</h3>
                      <div className="text-xs text-slate-400">{res.resourceType}</div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isOccupied
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  {/* Shared capacity indicator */}
                  {isShared && (
                    <div className="my-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-medium">
                      <div className="flex justify-between text-slate-300">
                        <span>Current Occupancy:</span>
                        <span className="font-mono tabular-nums text-white font-bold">
                          {res.currentOccupancy} / {res.capacity} children
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden border border-slate-700">
                        <div
                          className="bg-gradient-to-r from-violet-500 to-cyan-500 h-2 transition-all"
                          style={{ width: `${Math.min(100, (res.currentOccupancy / res.capacity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Toggle Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Toggle Status:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStatusChange(res.id, 'AVAILABLE')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer border ${
                        isAvailable
                          ? 'bg-emerald-600 text-white border-emerald-500 font-semibold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Available
                    </button>
                    <button
                      onClick={() => handleStatusChange(res.id, 'OCCUPIED')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer border ${
                        isOccupied
                          ? 'bg-amber-600 text-white border-amber-500 font-semibold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Occupied
                    </button>
                    <button
                      onClick={() => handleStatusChange(res.id, 'MAINTENANCE')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer border ${
                        isMaint
                          ? 'bg-rose-600 text-white border-rose-500 font-semibold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Maint.
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW B: PRODUCT CATALOGUE & RATES */}
      {activeTab === 'CATALOGUE' && (
        <div className="bg-[#0E1526] rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Product / Activity</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Pricing Model</th>
                  <th className="p-3">Variants / Durations</th>
                  <th className="p-3 text-right">Listed Rate</th>
                  {isOwner && <th className="p-3 text-right">Owner Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredProducts.map((p) => {
                  const cat = state.gameCategories.find((c) => c.id === p.categoryId);
                  const variants = state.productVariants.filter((v) => v.productId === p.id);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-white">{p.name}</td>
                      <td className="p-3 text-slate-400">{cat?.name}</td>
                      <td className="p-3 font-mono text-slate-400">
                        {p.pricingType}
                      </td>
                      <td className="p-3">
                        {variants.length > 0 ? (
                          <div className="space-y-1">
                            {variants.map((v) => (
                              <div key={v.id} className="flex items-center justify-between max-w-xs text-slate-300">
                                <span>{v.name}</span>
                                <span className="font-mono tabular-nums font-bold text-white">₹{v.price}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500">Single rate item</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-white text-sm">
                        ₹{p.defaultPrice}
                      </td>
                      {isOwner && (
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setEditingPriceItem({
                                id: p.id,
                                type: 'PRODUCT',
                                currentPrice: p.defaultPrice,
                                name: p.name
                              });
                              setNewPriceValue(p.defaultPrice);
                            }}
                            className="text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Rate</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Price Modal (Owner Only) */}
      {editingPriceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] rounded-xl shadow-2xl border border-slate-800 max-w-sm w-full p-5 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Update Catalogue Rate</h3>
              <button
                onClick={() => setEditingPriceItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Update rate for <strong className="font-semibold text-white">{editingPriceItem.name}</strong>.
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Price (₹ INR) *
              </label>
              <input
                type="number"
                min={0}
                value={newPriceValue}
                onChange={(e) => setNewPriceValue(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg font-mono font-bold tabular-nums text-white focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPriceItem(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrice}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors cursor-pointer shadow-md shadow-violet-900/30"
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
