
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

    // Automate Warranty and Life Cycle based on Chemistry
    if (name === 'chemistry') {
      if (newValue === 'LFP') {
        updatedSpecs.ratedLifeCycle = 2000;
        updatedSpecs.warrantyPeriod = '3 Years';
      } else if (newValue === 'NMC') {
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Voltage (V)</label>
          <input 
            type="number" 
            name="nominalVoltage" 
            value={specs.nominalVoltage} 
            onChange={handleChange}
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#78AD3E] focus:border-[#78AD3E]"
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

        <div className="md:col-span-2">
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
