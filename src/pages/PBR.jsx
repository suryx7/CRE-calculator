import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { unitFactors } from '../components/units';

function PBR() {
  const [activeTab, setActiveTab] = useState('conversion');
  const [unitSystem, setUnitSystem] = useState('SI');
  const [formData, setFormData] = useState({
    initialConcentration: 1.0,
    flowRate: 0.1,
    bedLength: 1.0,
    rateConstant: 0.1,
    reactionOrder: 1,
    temperature: 298.15,
    pressure: 1.0,
    activationEnergy: 50000,
    preExponentialFactor: 1e13,
    heatOfReaction: -50000,
    heatCapacity: 2000,
    heatTransferCoefficient: 100,
    coolingTemperature: 293.15,
    bedPorosity: 0.4,
    particleDiameter: 0.005,
    superficialVelocity: 0.1
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleUnitSystemChange = (e) => {
    const newSystem = e.target.value;
    const newFormData = { ...formData };
    
    // Convert all values to the new unit system
    Object.keys(unitFactors).forEach(param => {
      if (formData[param] !== undefined) {
        const currentFactor = unitFactors[param][unitSystem].factor;
        const newFactor = unitFactors[param][newSystem].factor;
        newFormData[param] = (formData[param] * currentFactor) / newFactor;
      }
    });
    
    setUnitSystem(newSystem);
    setFormData(newFormData);
  };

  const getUnit = (param) => {
    return unitFactors[param]?.[unitSystem]?.unit || '';
  };

  const calculateConversion = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const {
        initialConcentration,
        bedLength,
        rateConstant,
        reactionOrder,
        superficialVelocity
      } = formData;

      // Convert inputs to numbers
      const C0 = parseFloat(initialConcentration);
      const L = parseFloat(bedLength);
      const k = parseFloat(rateConstant);
      const n = parseFloat(reactionOrder);
      const u = parseFloat(superficialVelocity);

      // Validate inputs
      if (isNaN(C0) || isNaN(L) || isNaN(k) || isNaN(n) || isNaN(u)) {
        throw new Error('Please enter valid numbers for all fields');
      }

      if (C0 <= 0 || L <= 0 || k <= 0 || n <= 0 || u <= 0) {
        throw new Error('All values must be positive numbers');
      }

      // Calculate residence time
      const tau = L / u;
      
      // Calculate conversion based on reaction order
      let conversion;
      if (n === 1) {
        // First order reaction
        conversion = 1 - Math.exp(-k * tau);
      } else {
        // Other reaction orders
        conversion = 1 - Math.pow(1 + (n - 1) * k * Math.pow(C0, n - 1) * tau, 1 / (1 - n));
      }

      // Calculate final concentration
      const finalConcentration = C0 * (1 - conversion);

      setResult({
        conversion: (conversion * 100).toFixed(2),
        finalConcentration: finalConcentration.toFixed(4),
        residenceTime: tau.toFixed(2)
      });
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  const calculateReactionRate = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const {
        initialConcentration,
        rateConstant,
        reactionOrder,
        temperature,
        activationEnergy,
        preExponentialFactor
      } = formData;

      // Convert inputs to numbers
      const C0 = parseFloat(initialConcentration);
      const k = parseFloat(rateConstant);
      const n = parseFloat(reactionOrder);
      const T = parseFloat(temperature);
      const Ea = parseFloat(activationEnergy);
      const A = parseFloat(preExponentialFactor);

      // Validate inputs
      if (isNaN(C0) || isNaN(k) || isNaN(n) || isNaN(T) || isNaN(Ea) || isNaN(A)) {
        throw new Error('Please enter valid numbers for all fields');
      }

      if (C0 <= 0 || k <= 0 || n <= 0 || T <= 0 || Ea <= 0 || A <= 0) {
        throw new Error('All values must be positive numbers');
      }

      // Calculate temperature-dependent rate constant using Arrhenius equation
      const R = 8.314; // Gas constant in J/(mol·K)
      const kT = A * Math.exp(-Ea / (R * T));
      
      // Calculate reaction rate
      const reactionRate = kT * Math.pow(C0, n);

      setResult({
        reactionRate: reactionRate.toFixed(6),
        temperatureDependentRateConstant: kT.toFixed(6),
        units: getUnit('reactionRate')
      });
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  const calculateTemperatureProfile = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const {
        initialConcentration,
        flowRate,
        bedLength,
        heatOfReaction,
        heatCapacity,
        heatTransferCoefficient,
        coolingTemperature,
        bedPorosity,
        particleDiameter
      } = formData;

      // Convert inputs to numbers
      const C0 = parseFloat(initialConcentration);
      const F = parseFloat(flowRate);
      const L = parseFloat(bedLength);
      const Hr = parseFloat(heatOfReaction);
      const Cp = parseFloat(heatCapacity);
      const U = parseFloat(heatTransferCoefficient);
      const Tc = parseFloat(coolingTemperature);
      const eps = parseFloat(bedPorosity);
      const dp = parseFloat(particleDiameter);

      // Validate inputs
      if (isNaN(C0) || isNaN(F) || isNaN(L) || isNaN(Hr) || isNaN(Cp) || 
          isNaN(U) || isNaN(Tc) || isNaN(eps) || isNaN(dp)) {
        throw new Error('Please enter valid numbers for all fields');
      }

      // Calculate effective heat transfer coefficient based on bed properties
      const effectiveHeatTransfer = U * (1 - eps) * (1 / dp);
      
      // Calculate temperature profile along the bed
      const points = 10;
      const dx = L / points;
      const temperatures = [];
      
      for (let i = 0; i <= points; i++) {
        const x = i * dx;
        const T = Tc + (Hr / (F * Cp)) * (1 - Math.exp(-effectiveHeatTransfer * x / (F * Cp)));
        temperatures.push({ position: x, temperature: T });
      }

      setResult({
        temperatures,
        maxTemperature: Math.max(...temperatures.map(t => t.temperature)).toFixed(1),
        minTemperature: Math.min(...temperatures.map(t => t.temperature)).toFixed(1),
        units: getUnit('temperature')
      });
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  const calculateRequiredLength = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const {
        initialConcentration,
        flowRate,
        rateConstant,
        reactionOrder,
        targetConversion,
        superficialVelocity
      } = formData;

      // Convert inputs to numbers
      const C0 = parseFloat(initialConcentration);
      const F = parseFloat(flowRate);
      const k = parseFloat(rateConstant);
      const n = parseFloat(reactionOrder);
      const X = parseFloat(targetConversion) / 100; // Convert percentage to decimal
      const u = parseFloat(superficialVelocity);

      // Validate inputs
      if (isNaN(C0) || isNaN(F) || isNaN(k) || isNaN(n) || isNaN(X) || isNaN(u)) {
        throw new Error('Please enter valid numbers for all fields');
      }

      if (C0 <= 0 || F <= 0 || k <= 0 || n <= 0 || X <= 0 || X >= 1 || u <= 0) {
        throw new Error('Invalid input values');
      }

      // Calculate required length based on reaction order
      let requiredLength;
      if (n === 1) {
        // First order reaction
        requiredLength = u * Math.log(1 / (1 - X)) / k;
      } else {
        // Other reaction orders
        requiredLength = u * (Math.pow(1 - X, 1 - n) - 1) / ((n - 1) * k * Math.pow(C0, n - 1));
      }

      const residenceTime = requiredLength / u;

      setResult({
        requiredLength: requiredLength.toFixed(2),
        residenceTime: residenceTime.toFixed(2),
        units: getUnit('length')
      });
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  const renderConversionCalculator = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Calculate PBR Conversion</h2>
      
      <form onSubmit={calculateConversion} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
            <label htmlFor="initialConcentration" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Concentration ({getUnit('concentration')})
        </label>
        <input
          type="number"
              id="initialConcentration"
          name="initialConcentration"
          value={formData.initialConcentration}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter initial concentration"
              step="0.01"
              required
        />
      </div>
          
      <div>
            <label htmlFor="superficialVelocity" className="block text-sm font-medium text-gray-700 mb-1">
              Superficial Velocity ({getUnit('velocity')})
        </label>
        <input
          type="number"
              id="superficialVelocity"
              name="superficialVelocity"
              value={formData.superficialVelocity}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter superficial velocity"
              step="0.01"
              required
        />
      </div>
          
      <div>
            <label htmlFor="bedLength" className="block text-sm font-medium text-gray-700 mb-1">
              Bed Length ({getUnit('length')})
        </label>
        <input
          type="number"
              id="bedLength"
          name="bedLength"
          value={formData.bedLength}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter bed length"
              step="0.1"
              required
        />
      </div>
          
      <div>
            <label htmlFor="rateConstant" className="block text-sm font-medium text-gray-700 mb-1">
          Rate Constant ({getUnit('rateConstant')})
        </label>
        <input
          type="number"
              id="rateConstant"
          name="rateConstant"
          value={formData.rateConstant}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter rate constant"
              step="0.0001"
              required
        />
      </div>
          
      <div>
            <label htmlFor="reactionOrder" className="block text-sm font-medium text-gray-700 mb-1">
          Reaction Order
        </label>
            <select
              id="reactionOrder"
          name="reactionOrder"
          value={formData.reactionOrder}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="1">First Order</option>
              <option value="2">Second Order</option>
              <option value="0.5">Half Order</option>
            </select>
      </div>
          
      <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
          Temperature ({getUnit('temperature')})
        </label>
        <input
          type="number"
              id="temperature"
          name="temperature"
          value={formData.temperature}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter temperature"
              step="0.1"
              required
        />
      </div>
      </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
      </div>
        )}
        
        <div className="flex justify-center">
      <button
            type="submit"
            className="bg-blue-900 text-white px-6 py-3 rounded-md hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Calculate Conversion
      </button>
        </div>
      </form>
    </div>
  );

  const renderReactionRateCalculator = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Calculate Reaction Rate</h2>
      
      <form onSubmit={calculateReactionRate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
            <label htmlFor="initialConcentration" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Concentration ({getUnit('concentration')})
        </label>
        <input
          type="number"
              id="initialConcentration"
          name="initialConcentration"
          value={formData.initialConcentration}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter initial concentration"
              step="0.01"
              required
        />
      </div>
          
      <div>
            <label htmlFor="rateConstant" className="block text-sm font-medium text-gray-700 mb-1">
          Rate Constant ({getUnit('rateConstant')})
        </label>
        <input
          type="number"
              id="rateConstant"
          name="rateConstant"
          value={formData.rateConstant}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter rate constant"
              step="0.0001"
              required
        />
      </div>
          
      <div>
            <label htmlFor="reactionOrder" className="block text-sm font-medium text-gray-700 mb-1">
          Reaction Order
        </label>
            <select
              id="reactionOrder"
          name="reactionOrder"
          value={formData.reactionOrder}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="1">First Order</option>
              <option value="2">Second Order</option>
              <option value="0.5">Half Order</option>
            </select>
      </div>
          
      <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
          Temperature ({getUnit('temperature')})
        </label>
        <input
          type="number"
              id="temperature"
          name="temperature"
          value={formData.temperature}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter temperature"
              step="0.1"
              required
        />
      </div>
          
      <div>
            <label htmlFor="activationEnergy" className="block text-sm font-medium text-gray-700 mb-1">
          Activation Energy ({getUnit('activationEnergy')})
        </label>
        <input
          type="number"
              id="activationEnergy"
          name="activationEnergy"
          value={formData.activationEnergy}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter activation energy"
              step="1000"
              required
        />
      </div>
          
      <div>
            <label htmlFor="preExponentialFactor" className="block text-sm font-medium text-gray-700 mb-1">
          Pre-exponential Factor
        </label>
        <input
          type="number"
              id="preExponentialFactor"
          name="preExponentialFactor"
          value={formData.preExponentialFactor}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter pre-exponential factor"
              step="1e10"
              required
        />
      </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="flex justify-center">
      <button
            type="submit"
            className="bg-blue-900 text-white px-6 py-3 rounded-md hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Calculate Reaction Rate
      </button>
        </div>
      </form>
    </div>
  );

  const renderTemperatureProfileCalculator = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Calculate Temperature Profile</h2>
      
      <form onSubmit={calculateTemperatureProfile} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
            <label htmlFor="initialConcentration" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Concentration ({getUnit('concentration')})
        </label>
        <input
          type="number"
              id="initialConcentration"
              name="initialConcentration"
              value={formData.initialConcentration}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter initial concentration"
              step="0.01"
              required
        />
      </div>
          
      <div>
            <label htmlFor="flowRate" className="block text-sm font-medium text-gray-700 mb-1">
              Flow Rate ({getUnit('flowRate')})
            </label>
            <input
              type="number"
              id="flowRate"
              name="flowRate"
              value={formData.flowRate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter flow rate"
              step="0.01"
              required
            />
          </div>
          
          <div>
            <label htmlFor="bedLength" className="block text-sm font-medium text-gray-700 mb-1">
              Bed Length ({getUnit('length')})
            </label>
            <input
              type="number"
              id="bedLength"
              name="bedLength"
              value={formData.bedLength}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter bed length"
              step="0.1"
              required
            />
          </div>
          
          <div>
            <label htmlFor="heatOfReaction" className="block text-sm font-medium text-gray-700 mb-1">
          Heat of Reaction ({getUnit('heatOfReaction')})
        </label>
        <input
          type="number"
              id="heatOfReaction"
          name="heatOfReaction"
          value={formData.heatOfReaction}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter heat of reaction"
              step="1000"
              required
        />
      </div>
          
      <div>
            <label htmlFor="heatCapacity" className="block text-sm font-medium text-gray-700 mb-1">
          Heat Capacity ({getUnit('heatCapacity')})
        </label>
        <input
          type="number"
              id="heatCapacity"
          name="heatCapacity"
          value={formData.heatCapacity}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter heat capacity"
              step="10"
              required
        />
      </div>
          
      <div>
            <label htmlFor="heatTransferCoefficient" className="block text-sm font-medium text-gray-700 mb-1">
          Heat Transfer Coefficient ({getUnit('heatTransferCoefficient')})
        </label>
        <input
          type="number"
              id="heatTransferCoefficient"
          name="heatTransferCoefficient"
          value={formData.heatTransferCoefficient}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter heat transfer coefficient"
              step="1"
              required
        />
      </div>
          
      <div>
            <label htmlFor="coolingTemperature" className="block text-sm font-medium text-gray-700 mb-1">
              Cooling Temperature ({getUnit('temperature')})
        </label>
        <input
          type="number"
              id="coolingTemperature"
          name="coolingTemperature"
          value={formData.coolingTemperature}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter cooling temperature"
              step="0.1"
              required
        />
      </div>
          
      <div>
            <label htmlFor="bedPorosity" className="block text-sm font-medium text-gray-700 mb-1">
              Bed Porosity
        </label>
        <input
          type="number"
              id="bedPorosity"
              name="bedPorosity"
              value={formData.bedPorosity}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter bed porosity"
              step="0.01"
              min="0"
              max="1"
              required
        />
      </div>
          
      <div>
            <label htmlFor="particleDiameter" className="block text-sm font-medium text-gray-700 mb-1">
              Particle Diameter ({getUnit('length')})
        </label>
        <input
          type="number"
              id="particleDiameter"
              name="particleDiameter"
              value={formData.particleDiameter}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter particle diameter"
              step="0.0001"
              required
        />
      </div>
      </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="flex justify-center">
      <button
            type="submit"
            className="bg-blue-900 text-white px-6 py-3 rounded-md hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Calculate Temperature Profile
      </button>
        </div>
      </form>
    </div>
  );

  const renderRequiredLengthCalculator = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Calculate Required Length</h2>
      
      <form onSubmit={calculateRequiredLength} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
            <label htmlFor="initialConcentration" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Concentration ({getUnit('concentration')})
        </label>
        <input
          type="number"
              id="initialConcentration"
          name="initialConcentration"
          value={formData.initialConcentration}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter initial concentration"
              step="0.01"
              required
        />
      </div>
          
      <div>
            <label htmlFor="flowRate" className="block text-sm font-medium text-gray-700 mb-1">
          Flow Rate ({getUnit('flowRate')})
        </label>
        <input
          type="number"
              id="flowRate"
          name="flowRate"
          value={formData.flowRate}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter flow rate"
              step="0.01"
              required
        />
      </div>
          
      <div>
            <label htmlFor="rateConstant" className="block text-sm font-medium text-gray-700 mb-1">
          Rate Constant ({getUnit('rateConstant')})
        </label>
        <input
          type="number"
              id="rateConstant"
          name="rateConstant"
          value={formData.rateConstant}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter rate constant"
              step="0.0001"
              required
        />
      </div>
          
      <div>
            <label htmlFor="reactionOrder" className="block text-sm font-medium text-gray-700 mb-1">
          Reaction Order
        </label>
            <select
              id="reactionOrder"
          name="reactionOrder"
          value={formData.reactionOrder}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="1">First Order</option>
              <option value="2">Second Order</option>
              <option value="0.5">Half Order</option>
            </select>
      </div>
          
      <div>
            <label htmlFor="targetConversion" className="block text-sm font-medium text-gray-700 mb-1">
              Target Conversion (%)
        </label>
        <input
          type="number"
              id="targetConversion"
          name="targetConversion"
              value={formData.targetConversion || 90}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter target conversion"
              step="1"
              min="1"
              max="99"
              required
        />
      </div>
          
      <div>
            <label htmlFor="superficialVelocity" className="block text-sm font-medium text-gray-700 mb-1">
              Superficial Velocity ({getUnit('velocity')})
        </label>
        <input
          type="number"
              id="superficialVelocity"
              name="superficialVelocity"
              value={formData.superficialVelocity}
          onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter superficial velocity"
              step="0.01"
              required
        />
      </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="flex justify-center">
      <button
            type="submit"
            className="bg-blue-900 text-white px-6 py-3 rounded-md hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Calculate Required Length
      </button>
        </div>
      </form>
    </div>
  );

  const renderResults = () => {
    if (!result) return null;

  return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">Results</h2>
        
        {activeTab === 'conversion' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Conversion</h3>
              <p className="text-3xl font-bold text-blue-900">{result.conversion}%</p>
              <p className="text-sm text-gray-600 mt-2">Percentage of reactant converted to product</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Final Concentration</h3>
              <p className="text-3xl font-bold text-blue-900">{result.finalConcentration} {getUnit('concentration')}</p>
              <p className="text-sm text-gray-600 mt-2">Concentration of reactant remaining</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Residence Time</h3>
              <p className="text-3xl font-bold text-blue-900">{result.residenceTime} {getUnit('time')}</p>
              <p className="text-sm text-gray-600 mt-2">Time spent in the reactor</p>
            </div>
          </div>
        )}
        
        {activeTab === 'reactionRate' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Reaction Rate</h3>
              <p className="text-3xl font-bold text-blue-900">{result.reactionRate} {result.units}</p>
              <p className="text-sm text-gray-600 mt-2">Rate of reaction at initial conditions</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Temperature-Dependent Rate Constant</h3>
              <p className="text-3xl font-bold text-blue-900">{result.temperatureDependentRateConstant}</p>
              <p className="text-sm text-gray-600 mt-2">Rate constant adjusted for temperature</p>
            </div>
          </div>
        )}
        
        {activeTab === 'temperatureProfile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Maximum Temperature</h3>
              <p className="text-3xl font-bold text-blue-900">{result.maxTemperature} {result.units}</p>
              <p className="text-sm text-gray-600 mt-2">Highest temperature in the reactor</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Minimum Temperature</h3>
              <p className="text-3xl font-bold text-blue-900">{result.minTemperature} {result.units}</p>
              <p className="text-sm text-gray-600 mt-2">Lowest temperature in the reactor</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Temperature Range</h3>
              <p className="text-3xl font-bold text-blue-900">{(result.maxTemperature - result.minTemperature).toFixed(1)} {result.units}</p>
              <p className="text-sm text-gray-600 mt-2">Difference between max and min temperatures</p>
            </div>
          </div>
        )}
        
        {activeTab === 'requiredLength' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Required Length</h3>
              <p className="text-3xl font-bold text-blue-900">{result.requiredLength} {result.units}</p>
              <p className="text-sm text-gray-600 mt-2">Length needed to achieve target conversion</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Residence Time</h3>
              <p className="text-3xl font-bold text-blue-900">{result.residenceTime} {getUnit('time')}</p>
              <p className="text-sm text-gray-600 mt-2">Time spent in the reactor</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white p-4 hidden md:block fixed h-screen overflow-y-auto">
        <div className="mb-8">
          <Link to="/" className="flex items-center text-white hover:text-blue-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
        
        <h2 className="text-xl font-bold mb-4">PBR</h2>
        
        <div className="mb-6">
          <label htmlFor="unitSystem" className="block text-sm font-medium mb-2">
              Unit System
            </label>
            <select
            id="unitSystem"
              value={unitSystem}
              onChange={handleUnitSystemChange}
            className="w-full bg-blue-800 text-white px-3 py-2 rounded-md"
          >
            <option value="SI">SI Units</option>
            <option value="CGS">CGS Units</option>
            <option value="Imperial">Imperial Units</option>
            </select>
          </div>
        
        <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('conversion')}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              activeTab === 'conversion' ? 'bg-blue-800' : 'hover:bg-blue-800'
              }`}
            >
              Conversion Calculator
            </button>
            <button
              onClick={() => setActiveTab('reactionRate')}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              activeTab === 'reactionRate' ? 'bg-blue-800' : 'hover:bg-blue-800'
            }`}
          >
            Reaction Rate
            </button>
            <button
              onClick={() => setActiveTab('temperatureProfile')}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              activeTab === 'temperatureProfile' ? 'bg-blue-800' : 'hover:bg-blue-800'
            }`}
          >
            Temperature Profile
            </button>
            <button
              onClick={() => setActiveTab('requiredLength')}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              activeTab === 'requiredLength' ? 'bg-blue-800' : 'hover:bg-blue-800'
            }`}
          >
            Required Length
            </button>
          </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        <header className="bg-blue-900 text-white p-6 shadow-lg md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="text-white hover:text-blue-200 transition-colors mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold">PBR Calculator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={unitSystem}
                onChange={handleUnitSystemChange}
                className="bg-blue-800 text-white px-3 py-1 rounded-md appearance-none pr-8"
              >
                <option value="SI">SI Units</option>
                <option value="CGS">CGS Units</option>
                <option value="Imperial">Imperial Units</option>
              </select>
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="bg-blue-800 text-white px-3 py-1 rounded-md appearance-none pr-8"
                >
                  <option value="conversion">Conversion</option>
                  <option value="reactionRate">Reaction Rate</option>
                  <option value="temperatureProfile">Temperature</option>
                  <option value="requiredLength">Required Length</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="p-6">
              {activeTab === 'conversion' && renderConversionCalculator()}
              {activeTab === 'reactionRate' && renderReactionRateCalculator()}
              {activeTab === 'temperatureProfile' && renderTemperatureProfileCalculator()}
              {activeTab === 'requiredLength' && renderRequiredLengthCalculator()}
          
          {renderResults()}
        </main>
      </div>
    </div>
  );
}

export default PBR; 
