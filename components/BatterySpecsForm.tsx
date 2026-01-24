
import React from 'react';
import { BatterySpecs } from '../types';
import { CELL_SPECS } from '../constants';

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

    updateDependentFields(updatedSpecs, name, newValue);
  };

  const handleAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    let currentApps = specs.applications || [];

    if (checked) {
      if (!currentApps.includes(value)) currentApps = [...currentApps, value];
    } else {
      currentApps = currentApps.filter(app => app !== value);
    }

    const updatedSpecs = {
      ...specs,
      applications: currentApps
    };
    onChange(updatedSpecs);
  };

  const updateDependentFields = (currentSpecs: BatterySpecs, changedField: string, newValue: any) => {
    // Automate Warranty, Life Cycle, Voltage, Capacity, Weight
    const triggers = ['chemistry', 'series', 'parallel', 'cellType'];

    if (triggers.includes(changedField)) {
      const chemistry = currentSpecs.chemistry;
      const series = Number(currentSpecs.series) || 0;
      const parallel = Number(currentSpecs.parallel) || 0;
      const cellType = currentSpecs.cellType;

      // 1. Voltage Calculation
      const cellVoltage = chemistry === 'LFP' ? 3.2 : 3.7;
      currentSpecs.nominalVoltage = Number((cellVoltage * series).toFixed(1));

      // 2. Capacity and Weight Calculation (from CELL_SPECS)
      const cellSpec = CELL_SPECS[cellType];
      if (cellSpec) {
        // Capacity = Cell Capacity * Parallel
        currentSpecs.ratedCapacity = Number((cellSpec.capacity * parallel).toFixed(1));

        // Weight = Cell Weight * Total Cells (S * P)
        // We format it as a string "XX.X kg"
        const totalWeight = cellSpec.weight * series * parallel;
        currentSpecs.weight = `${totalWeight.toFixed(2)} kg`;
      }

      // 3. Life Cycle & Warranty Logic
      // Rule: If 100Ah or 230Ah -> 3000 cycles
      if (cellType === '100Ah' || cellType === '230Ah') {
        currentSpecs.ratedLifeCycle = 3000;
        currentSpecs.warrantyPeriod = '5 Years';
      } else if (chemistry === 'LFP') {
        currentSpecs.ratedLifeCycle = 2000;
        currentSpecs.warrantyPeriod = '3 Years';
      } else {
        currentSpecs.ratedLifeCycle = 1000;
        currentSpecs.warrantyPeriod = '2 Years';
      }
    }
    onChange(currentSpecs);
  };

  const APP_OPTIONS = ["2W EV", "3W EV", "Solar Street Light", "UPS", "Inverter", "ESS"];

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
            {Object.keys(CELL_SPECS).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
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
