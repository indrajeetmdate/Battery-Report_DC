
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

  const inputClass = "w-full px-6 py-3.5 bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-[#78AD3E] text-[#1A1C19] font-medium transition-colors placeholder-gray-400 font-sans rounded-full";
  const disabledInputClass = "w-full px-6 py-3.5 bg-gray-100 border-2 border-gray-200 text-gray-400 font-medium rounded-full cursor-not-allowed";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-4";

  return (
    <div className="bg-white p-8 rounded-3xl border-2 border-gray-200 shadow-[8px_8px_0_0_#1A1C19]">
      <h2 className="text-2xl font-black text-[#1A1C19] mb-6 uppercase tracking-tighter flex items-center gap-3">
        <span className="w-3 h-8 bg-[#78AD3E] rounded-full"></span>
        Battery Specifications
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* --- Editable Fields --- */}
        <div>
          <label className={labelClass}>Chemistry</label>
          <select
            name="chemistry"
            value={specs.chemistry}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="LFP">LFP (Lithium Iron Phosphate)</option>
            <option value="NMC">NMC (Nickel Manganese Cobalt)</option>
          </select>
        </div>

        <div>
           <label className={labelClass}>Cell Type</label>
          <select
            name="cellType"
            value={specs.cellType}
            onChange={handleChange}
            className={inputClass}
          >
            {Object.keys(CELL_SPECS).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-[2]">
            <label className={labelClass}>Series</label>
            <input
              type="number"
              name="series"
              value={specs.series}
              onChange={handleChange}
              min="1"
              className={inputClass}
            />
          </div>
          <div className="flex-[2]">
            <label className={labelClass}>Parallel</label>
            <input
              type="number"
              name="parallel"
              value={specs.parallel}
              onChange={handleChange}
              min="1"
              className={inputClass}
            />
          </div>
        </div>


        <div>
          <label className={labelClass}>Dimensions (L W H)</label>
          <div className="flex gap-2">
            <input
              type="number"
              name="length"
              placeholder="L"
              value={specs.length || ''}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="number"
              name="width"
              placeholder="W"
              value={specs.width || ''}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="number"
              name="height"
              placeholder="H"
              value={specs.height || ''}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Nominal Voltage (V)</label>
          <input
            type="number"
            name="nominalVoltage"
            value={specs.nominalVoltage}
            onChange={handleChange}
            step="0.1"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Rated Capacity (Ah)</label>
          <input
            type="number"
            name="ratedCapacity"
            value={specs.ratedCapacity}
            readOnly
            disabled
            className={disabledInputClass}
          />
        </div>

        {/* --- Read-Only Fields --- */}
        <div>
          <label className={labelClass}>Rated Life Cycle</label>
          <input
            type="number"
            name="ratedLifeCycle"
            value={specs.ratedLifeCycle}
            readOnly
            disabled
            className={disabledInputClass}
          />
        </div>

        <div>
          <label className={labelClass}>BMS Type</label>
          <input
            type="text"
            name="bms"
            value="Yes (Passive)"
            readOnly
            disabled
            className={disabledInputClass}
          />
        </div>

        <div className="">
          <label className={labelClass}>Warranty Period</label>
          <input
            type="text"
            name="warrantyPeriod"
            value={specs.warrantyPeriod}
            readOnly
            disabled
            className={disabledInputClass}
          />
        </div>
      </div>
    </div>
  );
};
