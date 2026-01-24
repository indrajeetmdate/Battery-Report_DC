
import React from 'react';
import { BatterySpecs } from '../types';

interface BatterySpecsFormProps {
  specs: BatterySpecs;
  onChange: (specs: BatterySpecs) => void;
}

export const BatterySpecsForm: React.FC<BatterySpecsFormProps> = ({ specs, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;

    if (type === 'number') {
      newValue = parseFloat(value);
    }

    const updatedSpecs = {
      ...specs,
      [name]: newValue
    };

    // Automate Warranty and Life Cycle and Nominal Voltage based on Chemistry/Series
    if (name === 'chemistry' || name === 'series') {
      const chemistry = name === 'chemistry' ? newValue : specs.chemistry;
      const series = name === 'series' ? newValue : specs.series;

      // Voltage
      const cellVoltage = chemistry === 'LFP' ? 3.2 : 3.7;
      updatedSpecs.nominalVoltage = Number((cellVoltage * series).toFixed(1));

      // Life Cycle & Warranty
      if (chemistry === 'LFP') {
        updatedSpecs.ratedLifeCycle = 2000;
        updatedSpecs.warrantyPeriod = '3 Years';
      } else {
        updatedSpecs.ratedLifeCycle = 1000;
        updatedSpecs.warrantyPeriod = '2 Years';
      }
    }

    onChange(updatedSpecs);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-[#41463F] mb-4 flex items-center gap-2">
        <span className="w-2 h-6 bg-[#78AD3E] rounded-full"></span>
        Battery Specifications
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* --- Editable Fields --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chemistry</label>
          <select
            name="chemistry"
            value={specs.chemistry}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#78AD3E] focus:border-[#78AD3E] bg-white"
          >
            <option value="LFP">LFP (Lithium Iron Phosphate)</option>
            <option value="NMC">NMC (Nickel Manganese Cobalt)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cell Type</label>
          <select
            name="cellType"
            value={specs.cellType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#78AD3E] focus:border-[#78AD3E] bg-white"
          >
            <option value="32140">32140</option>
            <option value="32700">32700</option>
            <option value="21700">21700</option>
            <option value="18650">18650</option>
            <option value="100Ah">100 Ah</option>
            <option value="230Ah">230 Ah</option>
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Series (S)</label>
            <input
              type="number"
              name="series"
              value={specs.series}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#78AD3E] focus:border-[#78AD3E]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Parallel (P)</label>
            <input
              type="number"
              name="parallel"
              value={specs.parallel}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#78AD3E] focus:border-[#78AD3E]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Voltage (V) <span className="text-xs text-gray-400 font-normal">(Auto-calculated)</span></label>
          <input
            type="number"
            name="nominalVoltage"
            value={specs.nominalVoltage}
            onChange={handleChange}
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#78AD3E] focus:border-[#78AD3E] bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rated Capacity (Ah)</label>
          <input
            type="number"
            name="ratedCapacity"
            value={specs.ratedCapacity}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#78AD3E] focus:border-[#78AD3E]"
          />
        </div>

        {/* --- Read-Only Fields --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rated Life Cycle</label>
          <input
            type="number"
            name="ratedLifeCycle"
            value={specs.ratedLifeCycle}
            readOnly
            disabled
            className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">BMS Type</label>
          <input
            type="text"
            name="bms"
            value="Yes (Passive)"
            readOnly
            disabled
            className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
          />
        </div>

        <div className="">
          <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Period</label>
          <input
            type="text"
            name="warrantyPeriod"
            value={specs.warrantyPeriod}
            readOnly
            disabled
            className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};
