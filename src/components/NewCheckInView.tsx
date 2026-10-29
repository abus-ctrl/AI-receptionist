import React, { useState, useMemo } from 'react';
import { useArcade } from '../context/ArcadeContext';
import { Customer, CustomerPackage, GameCategory, Product, ProductVariant, Resource } from '../types';
import { normalizeIndianPhone, isValidIndianPhone, formatPhoneDisplay } from '../lib/phoneUtils';
import {
  User,
  Phone,
  Gamepad2,
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Package,
  Layers,
  Search,
  Check,
  X
} from 'lucide-react';

interface NewCheckInViewProps {
  onSessionStarted: () => void;
}

export const NewCheckInView: React.FC<NewCheckInViewProps> = ({ onSessionStarted }) => {
  const { state, findOrCreateCustomer, searchCustomers, startSession } = useArcade();

  // Customer Step State
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Game / Product Selection State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-ps');
  const [selectedProductId, setSelectedProductId] = useState<string>('prod-ps-1p');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('var-ps-1p-60');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('res-ps-01');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(''); // For minute deduction
  const [customOversOrUnits, setCustomOversOrUnits] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtered lists
  const searchResults = useMemo(() => {
    return searchCustomers(customerSearch);
  }, [customerSearch, searchCustomers]);

  const currentCategory = useMemo(() => {
    return state.gameCategories.find((c) => c.id === selectedCategoryId) || state.gameCategories[0];
  }, [selectedCategoryId, state.gameCategories]);

  const categoryProducts = useMemo(() => {
    return state.products.filter((p) => p.categoryId === selectedCategoryId && p.isActive);
  }, [selectedCategoryId, state.products]);

  const selectedProduct = useMemo(() => {
    return state.products.find((p) => p.id === selectedProductId) || categoryProducts[0];
  }, [selectedProductId, categoryProducts]);

  const productVariants = useMemo(() => {
    if (!selectedProduct) return [];
    return state.productVariants.filter((v) => v.productId === selectedProduct.id && v.isActive);
  }, [selectedProduct, state.productVariants]);

  const selectedVariant = useMemo(() => {
    if (productVariants.length === 0) return undefined;
    return productVariants.find((v) => v.id === selectedVariantId) || productVariants[0];
  }, [productVariants, selectedVariantId]);

  // Available Resources for this category
  const availableResources = useMemo(() => {
    return state.resources.filter((r) => r.categoryId === selectedCategoryId);
  }, [selectedCategoryId, state.resources]);

  // Check customer active packages for this category
  const eligibleCustomerPackages = useMemo(() => {
    if (!selectedCustomer) return [];
    const now = Date.now();
    return state.customerPackages.filter((cp) => {
      if (cp.customerId !== selectedCustomer.id) return false;
      if (cp.status !== 'ACTIVE' || cp.remainingMinutes <= 0) return false;
      if (new Date(cp.expiresAt).getTime() < now) return false;

      const pkgDef = state.packages.find((p) => p.id === cp.packageId);
      if (pkgDef && pkgDef.eligibleCategoryId && pkgDef.eligibleCategoryId !== selectedCategoryId) {
        return false;
      }
      return true;
    });
  }, [selectedCustomer, selectedCategoryId, state.customerPackages, state.packages]);

  // Calculate pricing
  const calculatedDuration = useMemo(() => {
    if (selectedVariant && selectedVariant.durationMinutes) {
      return selectedVariant.durationMinutes;
    }
    if (selectedProduct?.pricingType === 'DAY_PASS') return 480;
    if (selectedProduct?.pricingType === 'UNIT_BASED' || selectedProduct?.pricingType === 'PER_OVER') return 15;
    return 60;
  }, [selectedVariant, selectedProduct]);

  const calculatedPrice = useMemo(() => {
    if (selectedPackageId) {
      return 0; // Covered by package
    }
    if (selectedVariant) {
      return selectedVariant.price;
    }
    if (selectedProduct?.pricingType === 'PER_OVER' || selectedProduct?.pricingType === 'UNIT_BASED') {
      return (selectedProduct.defaultPrice || 0) * customOversOrUnits;
    }
    return selectedProduct?.defaultPrice || 0;
  }, [selectedPackageId, selectedVariant, selectedProduct, customOversOrUnits]);

  // Quick Select Existing Customer
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setCustomerNotes(cust.notes || '');
    setCustomerSearch('');
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerNotes('');
    setSelectedPackageId('');
  };

  // Form Submit / Start Session
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validate Customer
    if (!customerName.trim()) {
      setErrorMessage('Please enter the customer name.');
      return;
    }

    const normPhone = normalizeIndianPhone(customerPhone);
    if (!normPhone || normPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (e.g. 9820192831).');
      return;
    }

    const customer = findOrCreateCustomer(customerName.trim(), normPhone, customerNotes);

    // 2. Validate Resource
    let assignedResourceId = selectedResourceId;
    if (availableResources.length > 0) {
      if (!assignedResourceId) {
        setErrorMessage('Please select an available hardware resource or console station.');
        return;
      }
      const res = state.resources.find((r) => r.id === assignedResourceId);
      if (!res) {
        setErrorMessage('Resource does not exist.');
        return;
      }
      if (res.capacity === 1 && res.status === 'OCCUPIED') {
        setErrorMessage(`${res.name} is currently occupied. Please select an available station.`);
        return;
      }
      if (res.status === 'MAINTENANCE' || res.status === 'UNAVAILABLE') {
        setErrorMessage(`${res.name} is currently under maintenance.`);
        return;
      }
    }

    // 3. Start Session
    const result = startSession({
      customerId: customer.id,
      productId: selectedProduct.id,
      variantId: selectedVariant?.id,
      resourceId: assignedResourceId || undefined,
      durationMinutes: calculatedDuration,
      price: calculatedPrice,
      customerPackageId: selectedPackageId || undefined,
      notes: customerNotes
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to start session.');
      return;
    }

    setSuccessMessage(`Session started successfully for ${customer.name}!`);
    setTimeout(() => {
      onSessionStarted();
    }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-100">
      {/* Title */}
      <div className="pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md">
            Fast Desk Check-In
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-400 font-mono">Instant Timer Deployment</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">New Customer Check-In</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Fast-track guest registration, hardware console assignment, and automatic 5m grace countdown launch
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl flex items-center gap-2 font-bold">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer & Game Details (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Customer Details */}
          <div className="bg-[#111827] p-5 rounded-xl border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-violet-400" />
                <span>1. Customer Profile</span>
              </h2>
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold underline cursor-pointer transition-colors"
                >
                  Change Customer
                </button>
              )}
            </div>

            {/* Quick Search Lookup */}
            {!selectedCustomer && (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Quick lookup existing customer by name or phone..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#0e1526] border border-slate-700 focus:border-violet-500 rounded-lg text-white font-medium focus:outline-none placeholder-slate-500"
                />

                {/* Search Dropdown */}
                {searchResults.length > 0 && customerSearch.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#131c31] border border-slate-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-800">
                    {searchResults.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => handleSelectCustomer(cust)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-violet-950/40 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-white">{cust.name}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{cust.phone}</div>
                        </div>
                        <span className="text-[11px] text-violet-300 font-mono">
                          {cust.totalVisits} visit{cust.totalVisits > 1 ? 's' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Customer Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3 py-2 text-xs bg-[#0e1526] border border-slate-700 focus:border-violet-500 rounded-lg text-white font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile Number (+91) *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full px-3 py-2 text-xs bg-[#0e1526] border border-slate-700 focus:border-violet-500 rounded-lg text-white font-mono font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Active Customer Package Banner */}
            {eligibleCustomerPackages.length > 0 && (
              <div className="p-3 bg-violet-950/30 border border-violet-500/40 rounded-lg space-y-1.5">
                <div className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-cyan-400" />
                  <span>Customer Has Active Package Minutes:</span>
                </div>
                <div className="space-y-1">
                  {eligibleCustomerPackages.map((cp) => {
                    const def = state.packages.find((p) => p.id === cp.packageId);
                    const isSelected = selectedPackageId === cp.id;
                    return (
                      <label
                        key={cp.id}
                        className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-violet-600/30 border-violet-400 text-white font-bold'
                            : 'bg-[#0e1526] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => setSelectedPackageId(isSelected ? '' : cp.id)}
                            className="rounded text-violet-600 focus:ring-violet-500 border-slate-700"
                          />
                          <span>{def?.name || 'Prepaid Package'}</span>
                        </div>
                        <span className="font-mono tabular-nums font-bold text-cyan-300">
                          {cp.remainingMinutes} mins left
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Activity / Game Selection */}
          <div className="bg-[#111827] p-5 rounded-xl border border-slate-800 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              <span>2. Select Game or Activity</span>
            </h2>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#0e1526] rounded-lg border border-slate-800">
              {state.gameCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      const prods = state.products.filter((p) => p.categoryId === cat.id && p.isActive);
                      if (prods.length > 0) {
                        setSelectedProductId(prods[0].id);
                        const vars = state.productVariants.filter((v) => v.productId === prods[0].id);
                        if (vars.length > 0) setSelectedVariantId(vars[0].id);
                      }
                      const resList = state.resources.filter((r) => r.categoryId === cat.id && r.status === 'AVAILABLE');
                      if (resList.length > 0) {
                        setSelectedResourceId(resList[0].id);
                      } else {
                        setSelectedResourceId('');
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Product Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Product / Offering
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categoryProducts.map((p) => {
                  const isSelected = selectedProductId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProductId(p.id);
                        const vars = state.productVariants.filter((v) => v.productId === p.id && v.isActive);
                        if (vars.length > 0) setSelectedVariantId(vars[0].id);
                      }}
                      className={`p-2.5 text-left rounded-lg border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-violet-500 bg-violet-600/20 text-white shadow-xs'
                          : 'border-slate-800 bg-[#0e1526] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold truncate text-white">{p.name}</div>
                      <div className={`text-[11px] font-mono font-semibold mt-0.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`}>
                        from ₹{p.defaultPrice}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Variants (Durations) */}
            {productVariants.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Duration & Playtime Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {productVariants.map((v) => {
                    const isSelected = selectedVariantId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`p-2 text-left rounded-lg border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-500/15 text-white font-bold'
                            : 'border-slate-800 bg-[#0e1526] text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="truncate font-semibold text-white">{v.name}</div>
                        <div className="font-mono tabular-nums text-cyan-300 mt-0.5">
                          ₹{v.price}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity / Overs Selector */}
            {(selectedProduct?.pricingType === 'PER_OVER' || selectedProduct?.pricingType === 'UNIT_BASED') && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  {selectedProduct?.pricingType === 'PER_OVER' ? 'Number of Overs' : 'Tokens / Quantity'}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCustomOversOrUnits(num)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        customOversOrUnits === num
                          ? 'bg-violet-600 text-white border-violet-500 shadow-xs'
                          : 'bg-[#0e1526] text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {num} {selectedProduct?.pricingType === 'PER_OVER' ? 'Over(s)' : 'Qty'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Hardware Assignment & Launch Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Hardware / Station Assignment */}
          <div className="bg-[#111827] p-5 rounded-xl border border-slate-800 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" />
                <span>3. Hardware Station Assignment</span>
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                {availableResources.filter((r) => r.status === 'AVAILABLE').length} Free
              </span>
            </h2>

            {availableResources.length === 0 ? (
              <div className="p-3 text-xs text-slate-400 bg-[#0e1526] rounded-lg text-center border border-slate-800">
                No dedicated hardware assignment required for this activity.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableResources.map((res) => {
                  const isAvailable = res.status === 'AVAILABLE';
                  const isOccupied = res.status === 'OCCUPIED';
                  const isMaint = res.status === 'MAINTENANCE';
                  const isSelected = selectedResourceId === res.id;
                  const isShared = res.capacity > 1;
                  const canSelectShared = isShared && res.currentOccupancy < res.capacity;

                  return (
                    <button
                      key={res.id}
                      type="button"
                      disabled={(!isAvailable && !canSelectShared) || isMaint}
                      onClick={() => setSelectedResourceId(res.id)}
                      className={`w-full p-2.5 text-left rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-violet-500 bg-violet-600/20 text-white shadow-xs'
                          : isAvailable || canSelectShared
                          ? 'border-slate-800 bg-[#0e1526] text-slate-300 hover:border-slate-700'
                          : 'border-slate-800/40 bg-slate-900/40 text-slate-500 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white">{res.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {isShared
                            ? `Occupancy: ${res.currentOccupancy} / ${res.capacity} children`
                            : res.resourceType}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            isAvailable || canSelectShared
                              ? 'text-emerald-400'
                              : isOccupied
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {isAvailable ? 'Available' : isShared ? `${res.capacity - res.currentOccupancy} free` : res.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Launch Summary Card */}
          <div className="bg-[#111827] border border-violet-500/40 p-5 rounded-xl shadow-lg shadow-violet-950/20 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Session Launch Summary</span>
            </h3>

            <div className="space-y-2 text-xs border-y border-slate-800 py-3 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-white">
                  {customerName.trim() || 'Guest'} ({customerPhone || 'Phone required'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Game Offering:</span>
                <span className="font-bold text-white">{selectedProduct?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Play Duration:</span>
                <span className="font-mono tabular-nums font-bold text-cyan-300">
                  {calculatedDuration} Minutes (+5m grace)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Station:</span>
                <span className="font-bold text-white">
                  {state.resources.find((r) => r.id === selectedResourceId)?.name || 'General Area'}
                </span>
              </div>

              {selectedPackageId && (
                <div className="flex justify-between text-emerald-400 font-bold pt-1">
                  <span>Covered by Package:</span>
                  <span>-{calculatedDuration} Mins (₹0 Fee)</span>
                </div>
              )}
            </div>

            {/* Total Fee & Submit Button */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Due</div>
                <div className="text-2xl font-black font-mono tabular-nums text-white">
                  ₹{calculatedPrice}
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-violet-400/40 rounded-lg shadow-md shadow-violet-900/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Start Session & Timer</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

