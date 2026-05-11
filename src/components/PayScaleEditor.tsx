'use client';

import { useState } from 'react';
import { PayScale, Tier } from '@/lib/types';
import { formatPercent, generateId } from '@/lib/calculations';

interface Props {
  payScale: PayScale;
  onSave: (scale: PayScale) => void;
}

export default function PayScaleEditor({ payScale, onSave }: Props) {
  const [tiers, setTiers] = useState<Tier[]>(payScale.tiers);
  const [tierType, setTierType] = useState<'retroactive' | 'marginal'>(payScale.tierType);
  const [avgDealSize, setAvgDealSize] = useState<string>(
    payScale.avgDealSize?.toString() || ''
  );
  const [saved, setSaved] = useState(false);

  const handleTierChange = (index: number, field: keyof Tier, value: string) => {
    const newTiers = [...tiers];
    if (field === 'name') {
      newTiers[index].name = value;
    } else if (field === 'minRevenue') {
      newTiers[index].minRevenue = parseFloat(value) || 0;
    } else if (field === 'maxRevenue') {
      newTiers[index].maxRevenue = value === '' ? null : parseFloat(value) || 0;
    } else if (field === 'rate') {
      // Convert percentage input to decimal
      newTiers[index].rate = (parseFloat(value) || 0) / 100;
    }
    setTiers(newTiers);
    setSaved(false);
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier?.maxRevenue ? lastTier.maxRevenue + 1 : 0;
    setTiers([
      ...tiers,
      { name: `Tier ${tiers.length + 1}`, minRevenue: newMin, maxRevenue: null, rate: 0 }
    ]);
    setSaved(false);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
      setSaved(false);
    }
  };

  const handleSave = () => {
    onSave({
      id: payScale.id || generateId(),
      tierType,
      tiers,
      avgDealSize: avgDealSize ? parseFloat(avgDealSize) : null
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-emerald-700">Configuration</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">Pay Scale Settings</h2>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Commission Type
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-lg border p-3 transition-colors ${
              tierType === 'retroactive' ? 'border-slate-900 bg-slate-50' : 'border-stone-200 bg-white'
            }`}>
              <input
                type="radio"
                value="retroactive"
                checked={tierType === 'retroactive'}
                onChange={() => { setTierType('retroactive'); setSaved(false); }}
                className="sr-only"
              />
              <span className="block text-sm font-semibold text-slate-950">Retroactive</span>
              <span className="mt-1 block text-xs text-slate-500">Rate applies to all revenue.</span>
            </label>
            <label className={`cursor-pointer rounded-lg border p-3 transition-colors ${
              tierType === 'marginal' ? 'border-slate-900 bg-slate-50' : 'border-stone-200 bg-white'
            }`}>
              <input
                type="radio"
                value="marginal"
                checked={tierType === 'marginal'}
                onChange={() => { setTierType('marginal'); setSaved(false); }}
                className="sr-only"
              />
              <span className="block text-sm font-semibold text-slate-950">Marginal</span>
              <span className="mt-1 block text-xs text-slate-500">Rate applies only within each tier.</span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-stone-200">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Min Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Max Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Rate %</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {tiers.map((tier, index) => (
                <tr key={index}>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                      className="w-full rounded border border-stone-300 px-2 py-1 text-sm outline-none focus:border-slate-900"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className="mr-1 text-slate-500">$</span>
                      <input
                        type="number"
                        value={tier.minRevenue}
                        onChange={(e) => handleTierChange(index, 'minRevenue', e.target.value)}
                        className="w-28 rounded border border-stone-300 px-2 py-1 text-sm outline-none focus:border-slate-900"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className="mr-1 text-slate-500">$</span>
                      <input
                        type="number"
                        value={tier.maxRevenue ?? ''}
                        placeholder="No limit"
                        onChange={(e) => handleTierChange(index, 'maxRevenue', e.target.value)}
                        className="w-28 rounded border border-stone-300 px-2 py-1 text-sm outline-none focus:border-slate-900"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.1"
                        value={(tier.rate * 100).toFixed(1)}
                        onChange={(e) => handleTierChange(index, 'rate', e.target.value)}
                        className="w-20 rounded border border-stone-300 px-2 py-1 text-sm outline-none focus:border-slate-900"
                      />
                      <span className="ml-1 text-slate-500">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {tiers.length > 1 && (
                      <button
                        onClick={() => removeTier(index)}
                        className="text-sm font-semibold text-rose-600 hover:text-rose-800"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addTier}
          className="mt-4 rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-stone-50"
        >
          + Add Tier
        </button>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Average Deal Size (optional)
        </label>
        <div className="flex max-w-xs items-center rounded-md border border-stone-300 bg-white px-3 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-200">
          <span className="mr-1 text-slate-500">$</span>
          <input
            type="number"
            value={avgDealSize}
            onChange={(e) => { setAvgDealSize(e.target.value); setSaved(false); }}
            placeholder="e.g., 3000"
            className="min-w-0 flex-1 py-2 outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Used to estimate deals needed per day
        </p>
      </section>

      <button
        onClick={handleSave}
        className={`rounded-md px-6 py-3 font-semibold transition-colors ${
          saved
            ? 'bg-green-600 text-white'
            : 'bg-slate-950 text-white hover:bg-slate-800'
        }`}
      >
        {saved ? 'Saved!' : 'Save Settings'}
      </button>

      <section className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Current Pay Scale Summary</h3>
        <ul className="space-y-1 text-sm text-slate-600">
          {tiers.map((tier, i) => (
            <li key={i}>
              {tier.name}: ${tier.minRevenue.toLocaleString()} - {tier.maxRevenue ? `$${tier.maxRevenue.toLocaleString()}` : 'No limit'} at {formatPercent(tier.rate)}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Type: {tierType === 'retroactive' ? 'Retroactive (full revenue at achieved tier rate)' : 'Marginal (each tier rate applies only within its range)'}
        </p>
      </section>
    </div>
  );
}
