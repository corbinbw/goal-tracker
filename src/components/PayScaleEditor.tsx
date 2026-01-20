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
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pay Scale Settings</h2>

        {/* Tier Type Toggle */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commission Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="retroactive"
                checked={tierType === 'retroactive'}
                onChange={() => { setTierType('retroactive'); setSaved(false); }}
                className="mr-2"
              />
              <span className="text-sm">Retroactive (rate applies to all revenue)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="marginal"
                checked={tierType === 'marginal'}
                onChange={() => { setTierType('marginal'); setSaved(false); }}
                className="mr-2"
              />
              <span className="text-sm">Marginal (rate applies only within tier)</span>
            </label>
          </div>
        </div>

        {/* Tiers Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate %</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tiers.map((tier, index) => (
                <tr key={index}>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">$</span>
                      <input
                        type="number"
                        value={tier.minRevenue}
                        onChange={(e) => handleTierChange(index, 'minRevenue', e.target.value)}
                        className="w-28 px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">$</span>
                      <input
                        type="number"
                        value={tier.maxRevenue ?? ''}
                        placeholder="No limit"
                        onChange={(e) => handleTierChange(index, 'maxRevenue', e.target.value)}
                        className="w-28 px-2 py-1 border rounded text-sm"
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
                        className="w-20 px-2 py-1 border rounded text-sm"
                      />
                      <span className="text-gray-500 ml-1">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {tiers.length > 1 && (
                      <button
                        onClick={() => removeTier(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
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
          className="mt-4 text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Tier
        </button>
      </div>

      {/* Average Deal Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Average Deal Size (optional)
        </label>
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">$</span>
          <input
            type="number"
            value={avgDealSize}
            onChange={(e) => { setAvgDealSize(e.target.value); setSaved(false); }}
            placeholder="e.g., 3000"
            className="w-32 px-3 py-2 border rounded"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Used to estimate deals needed per day
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`px-6 py-2 rounded font-medium transition-colors ${
          saved
            ? 'bg-green-600 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {saved ? 'Saved!' : 'Save Settings'}
      </button>

      {/* Current Tiers Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Current Pay Scale Summary</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          {tiers.map((tier, i) => (
            <li key={i}>
              {tier.name}: ${tier.minRevenue.toLocaleString()} – {tier.maxRevenue ? `$${tier.maxRevenue.toLocaleString()}` : 'No limit'} at {formatPercent(tier.rate)}
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-500 mt-2">
          Type: {tierType === 'retroactive' ? 'Retroactive (full revenue at achieved tier rate)' : 'Marginal (each tier rate applies only within its range)'}
        </p>
      </div>
    </div>
  );
}
