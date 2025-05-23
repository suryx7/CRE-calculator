import { useState } from 'react'
import { Link } from 'react-router-dom'
import { unitFactors } from '../components/units'

function CSTR() {
  const [activeTab, setActiveTab] = useState('conversion')
  const [unitSystem, setUnitSystem] = useState('SI') // Default to SI units
  const [reactionType, setReactionType] = useState('a_to_b') // Default to A -> B
  const [formData, setFormData] = useState({
    flowRateA: '10',
    flowRateB: '10',
    flowRateC: '10',
    flowRateD: '10',
    volume: '100',
    rateConstant: '0.1',
    reactionOrder: '1', // Default to first order
    temperature: '25',
    pressure: '1.0',
    activationEnergy: '50',
    preExponentialFactor: '1e10',
    heatOfReaction: '0',
    heatCapacity: '4.2',
    heatTransferCoefficient: '100',
    coolingTemperature: '20',
    stoichiometryA: '1',
    stoichiometryB: '1',
    stoichiometryC: '1',
    stoichiometryD: '1',
  })

  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('liquid')
  const [isothermal, setIsothermal] = useState(true)
  const [pressureDrop, setPressureDrop] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUnitSystemChange = (e) => {
    const newSystem = e.target.value
    setUnitSystem(newSystem)
    
    // Convert all values to the new unit system
    const newFormData = { ...formData }
    
    // Apply conversion factors for each field
    Object.keys(newFormData).forEach(key => {
      if (key in unitFactors[unitSystem]) {
        const oldFactor = unitFactors[unitSystem][key].factor
        const newFactor = unitFactors[newSystem][key].factor
        
        if (oldFactor !== newFactor) {
          newFormData[key] = (parseFloat(newFormData[key]) * oldFactor / newFactor).toString()
        }
      }
    })
    
    setFormData(newFormData)
  }

  // Get the appropriate unit for a given parameter
  const getUnit = (param) => {
    return unitFactors[unitSystem][param]?.unit || ''
  }

  const calculateConversion = (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const {
        flowRateA,
        flowRateB,
        flowRateC,
        flowRateD,
        volume,
        rateConstant,
        reactionOrder,
        temperature,
        pressure,
        stoichiometryA,
        stoichiometryB,
        stoichiometryC,
        stoichiometryD,
      } = formData

      const Fa = parseFloat(flowRateA)
      const Fb = parseFloat(flowRateB)
      const Fc = parseFloat(flowRateC)
      const Fd = parseFloat(flowRateD)
      const V = parseFloat(volume)
      const k = parseFloat(rateConstant)
      const n = parseFloat(reactionOrder)
      const T = parseFloat(temperature)
      const P = parseFloat(pressure)
      const R = 0.08206 // L·atm/mol·K
      const vA = parseFloat(stoichiometryA)
      const vB = parseFloat(stoichiometryB)
      const vC = parseFloat(stoichiometryC)
      const vD = parseFloat(stoichiometryD)
      

      // Validate inputs
      if ([Fa, Fb, Fc, Fd, V, k, n, T, P, R, vA, vB, vC, vD].some(x => isNaN(x) || x < 0)) throw new Error('Please enter valid numbers for all fields')
      let tau
      let conversion
      let finalFlowRateA
      let finalFlowRateB
      let finalFlowRateC
      let finalFlowRateD  
      tau = V/Fa
      conversion = (tau * k)/(1+(tau * k))
      if (conversion > 1) {
        throw new Error('Conversion cannot exceed 100%. Please check your input values.');
      }
      
      finalFlowRateA = Fa * (1 - conversion)
        
      switch (reactionType) {
        case 'a_to_b':
          finalFlowRateB = Fb + (vB/vA) * Fa * conversion
          break
        case 'a_to_b_plus_c':
          finalFlowRateB = Fb + (vB/vA) * Fa * conversion
          finalFlowRateC = Fc + (vC/vA) * Fa * conversion
          break
        case 'a_plus_b_to_c':
          finalFlowRateB = Fb - (vB/vA) * Fa * conversion
          finalFlowRateC = Fc + (vC/vA) * Fa * conversion
          break
        case 'a_plus_b_to_c_plus_d':
          finalFlowRateB = Fb - (vB/vA) * Fa * conversion
          finalFlowRateC = Fc + (vC/vA) * Fa * conversion
          finalFlowRateC = Fc + (vC/vA) * Fa * conversion
          finalFlowRateD = Fd + (vD/vA) * Fa * conversion
          break
      }

      setResult({
        conversion: (conversion * 100).toFixed(2),
        finalFlowRateA: finalFlowRateA.toFixed(4),
        finalFlowRateB: finalFlowRateB?.toFixed(4),
        finalFlowRateC: finalFlowRateC?.toFixed(4),
        finalFlowRateD: finalFlowRateD?.toFixed(4),
        // residenceTime: tau.toFixed(2),
        // scenario: `${phase}, ${isothermal ? 'Isothermal' : 'Non-Isothermal'}, ${pressureDrop ? 'With Pressure Drop' : 'No Pressure Drop'}`
      })
    } catch (err) {
      setError(err.message)
      setResult(null)
    }
  }

  const calculateReactionRate = (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const {
        initialConcentration,
        rateConstant,
        reactionOrder,
        temperature
      } = formData

      // Convert inputs to numbers
      const C0 = parseFloat(initialConcentration)
      const k = parseFloat(rateConstant)
      const n = parseFloat(reactionOrder)
      const T = parseFloat(temperature)

      // Validate inputs
      if (isNaN(C0) || isNaN(k) || isNaN(n) || isNaN(T)) {
        throw new Error('Please enter valid numbers for all fields')
      }

      if (C0 <= 0 || k <= 0 || n <= 0 || T <= 0) {
        throw new Error('All values must be positive numbers')
      }

      // Calculate reaction rate
      const reactionRate = k * Math.pow(C0, n)

      setResult({
        reactionRate: reactionRate.toFixed(6),
        units: getUnit('reactionRate')
      })
    } catch (err) {
      setError(err.message)
      setResult(null)
    }
  }

 

  const calculateRequiredVolume = (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const {
        initialConcentration,
        flowRate,
        rateConstant,
        reactionOrder,
        temperature,
        targetConversion
      } = formData

      // Convert inputs to numbers
      const C0 = parseFloat(initialConcentration)
      const F = parseFloat(flowRate)
      const k = parseFloat(rateConstant)
      const n = parseFloat(reactionOrder)
      const T = parseFloat(temperature)
      const X = parseFloat(targetConversion) / 100 // Convert percentage to decimal

      // Validate inputs
      if (isNaN(C0) || isNaN(F) || isNaN(k) || isNaN(n) || isNaN(T) || isNaN(X)) {
        throw new Error('Please enter valid numbers for all fields')
      }

      if (C0 <= 0 || F <= 0 || k <= 0 || n <= 0 || T <= 0 || X <= 0 || X >= 1) {
        throw new Error('Invalid input values')
      }

      // Calculate required volume based on reaction order
      let volume
      if (n === 1) {
        // First order reaction
        volume = F * X / (k * (1 - X))
      } else {
        // Other reaction orders
        volume = F * X / (k * Math.pow(C0, n - 1) * (1 - X))
      }

      setResult({
        requiredVolume: volume.toFixed(2),
        units: getUnit('volume')
      })
    } catch (err) {
      setError(err.message)
      setResult(null)
    }
  }

  const renderScenarioSelectors = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
        <select value={phase} onChange={e => setPhase(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md">
          <option value="liquid">Liquid</option>
          <option value="gas">Gas</option>
        </select>
      </div>
      {phase === 'gas' && (
  <>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Isothermal?</label>
      <select
        value={isothermal}
        onChange={e => setIsothermal(e.target.value === 'true')}
        className="w-full px-4 py-2 border border-gray-300 rounded-md"
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Pressure Drop?</label>
      <select
        value={pressureDrop}
        onChange={e => setPressureDrop(e.target.value === 'true')}
        className="w-full px-4 py-2 border border-gray-300 rounded-md"
      >
        <option value="false">No</option>
        <option value="true">Yes</option>
      </select>
    </div>
  </>
)}

    </div>
  )

  const renderConversionCalculator = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Calculate CSTR Conversion</h2>
      
      <form onSubmit={calculateConversion} className="space-y-6">
        {renderScenarioSelectors()}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="reactionType" className="block text-sm font-medium text-gray-700 mb-2">
              Reaction Type
            </label>
            <select
              id="reactionType"
              value={reactionType}
              onChange={(e) => setReactionType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="a_to_b">aA → bB</option>
              <option value="a_to_b_plus_c">aA → bB + cC</option>
              <option value="a_plus_b_to_c">aA + bB → cC</option>
              <option value="a_plus_b_to_c_plus_d">aA + bB → cC + dD</option>
            </select>
          </div>    
          {/* <div>
            <label htmlFor="reactionOrder" className="block text-sm font-medium text-gray-700 mb-1">
              Reaction Order
            </label>
            <input
              type="number"
              id="reactionOrder"
              name="reactionOrder"
              value={formData.reactionOrder}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter reaction order"
              step="0.01"
              min="0"
              required
            />
          </div> */}

          {/* Stoichiometry Section */}
          <div>
            <label htmlFor="stoichiometryA" className="block text-sm font-medium text-gray-700 mb-1">
              Stoichiometry of A
            </label>
            <input
              type="number"
              id="stoichiometryA"
              name="stoichiometryA"
              value={formData.stoichiometryA}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
              min="1"
              required
            />
          </div>
          <div>
            <label htmlFor="flowRateA" className="block text-sm font-medium text-gray-700 mb-1">
              Flow Rate of A  ({getUnit('flowRate')})
            </label>
            <input
              type="number"
              id="flowRateA"
              name="flowRateA"
              value={formData.flowRateA}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter flow rate of A"
              step="0.1"
              required
            />
          </div>
          <div>
              <label htmlFor="stoichiometryB" className="block text-sm font-medium text-gray-700 mb-1">
                Stoichiometry of B
              </label>
              <input
                type="number"
                id="stoichiometryB"
                name="stoichiometryB"
                value={formData.stoichiometryB}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
                min="1"
              />
            </div>
            <div>
            <label htmlFor="flowRateB" className="block text-sm font-medium text-gray-700 mb-1">
              Flow Rate of B  ({getUnit('flowRate')})
            </label>
            <input
              type="number"
              id="flowRateB"
              name="flowRateB"
              value={formData.flowRateB}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter flow rate of B"
              step="0.1"
              required
            />
          </div>
          {(reactionType === 'a_to_b_plus_c' || reactionType === 'a_plus_b_to_c' || reactionType === 'a_plus_b_to_c_plus_d') && (
            <>
            <div>
              <label htmlFor="stoichiometryC" className="block text-sm font-medium text-gray-700 mb-1">
                Stoichiometry of C
              </label>
              <input
                type="number"
                id="stoichiometryC"
                name="stoichiometryC"
                value={formData.stoichiometryC}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1"
                required
              />
            </div>
            <div>
              <label htmlFor="flowRateC" className="block text-sm font-medium text-gray-700 mb-1">
              Flow Rate of C  ({getUnit('flowRate')})
            </label>
            <input
              type="number"
              id="flowRateC"
              name="flowRateC"
              value={formData.flowRateC}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter flow rate of C"
              step="0.1"
              required
            />
            </div>
            </>
          )}

          {reactionType === 'a_plus_b_to_c_plus_d' && (
            <>
            <div>
              <label htmlFor="stoichiometryD" className="block text-sm font-medium text-gray-700 mb-1">
                Stoichiometry of D
              </label>
              <input
                type="number"
                id="stoichiometryD"
                name="stoichiometryD"
                value={formData.stoichiometryD}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1"
                required
              />
            </div>
            <div>
              <label htmlFor="flowRateD" className="block text-sm font-medium text-gray-700 mb-1">
              Flow Rate of D  ({getUnit('flowRate')})
            </label>
            <input
              type="number"
              id="flowRateD"
              name="flowRateD"
              value={formData.flowRateD}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter flow rate of D"
              step="0.1"
              required
            />
            </div>
            </>
            
          )}
          <div>
            <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-1">
              Reactor Volume ({getUnit('volume')})
            </label>
            <input
              type="number"
              id="volume"
              name="volume"
              value={formData.volume}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter reactor volume"
              step="1"
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
  )

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
            <input
              type="number"
              id="reactionOrder"
              name="reactionOrder"
              value={formData.reactionOrder}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter reaction order"
              step="0.01"
              min="0"
              required
            />
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
            Calculate Reaction Rate
          </button>
        </div>
      </form>
    </div>
  )


  const renderRequiredVolumeCalculator = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Calculate Required Volume</h2>
      
      <form onSubmit={calculateRequiredVolume} className="space-y-6">
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
            <input
              type="number"
              id="reactionOrder"
              name="reactionOrder"
              value={formData.reactionOrder}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter reaction order"
              step="0.01"
              min="0"
              required
            />
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
            Calculate Required Volume
          </button>
        </div>
      </form>
    </div>
  )

  const renderResults = () => {
    if (!result) return null
  
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
  
            {result.finalFlowRateA !== undefined && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Final Flow Rate of A</h3>
                <p className="text-3xl font-bold text-blue-900">{result.finalFlowRateA} {getUnit('flowRate')}</p>
                <p className="text-sm text-gray-600 mt-2">Flow rate of reactant A</p>
              </div>
            )}
  
            {result.finalFlowRateB !== undefined && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Final Flow Rate of B</h3>
                <p className="text-3xl font-bold text-blue-900">{result.finalFlowRateB} {getUnit('flowRate')}</p>
                <p className="text-sm text-gray-600 mt-2">Flow rate of component B</p>
              </div>
            )}
  
            {result.finalFlowRateC !== undefined && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Final Flow Rate of C</h3>
                <p className="text-3xl font-bold text-blue-900">{result.finalFlowRateC} {getUnit('flowRate')}</p>
                <p className="text-sm text-gray-600 mt-2">Flow rate of component C</p>
              </div>
            )}
  
            {result.finalFlowRateD !== undefined && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Final Flow Rate of D</h3>
                <p className="text-3xl font-bold text-blue-900">{result.finalFlowRateD} {getUnit('flowRate')}</p>
                <p className="text-sm text-gray-600 mt-2">Flow rate of component D</p>
              </div>
            )}
            
          </div>
        )}
        
        {activeTab === 'reactionRate' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Reaction Rate</h3>
              <p className="text-3xl font-bold text-blue-900">{result.reactionRate} {result.units}</p>
              <p className="text-sm text-gray-600 mt-2">Rate of reaction at initial conditions</p>
            </div>
          </div>
        )}

        
        {activeTab === 'requiredVolume' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Required Volume</h3>
              <p className="text-3xl font-bold text-blue-900">{result.requiredVolume} {result.units}</p>
              <p className="text-sm text-gray-600 mt-2">Volume needed to achieve target conversion</p>
            </div>
          </div>
        )}
      </div>
    )
  }

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
        
        <h2 className="text-xl font-bold mb-4">CSTR</h2>
        
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
            onClick={() => setActiveTab('requiredVolume')}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              activeTab === 'requiredVolume' ? 'bg-blue-800' : 'hover:bg-blue-800'
            }`}
          >
            Required Volume
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
              <h1 className="text-xl font-bold">CSTR Calculator</h1>
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
                  <option value="requiredVolume">Required Volume</option>
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
          {activeTab === 'requiredVolume' && renderRequiredVolumeCalculator()}
          
          {renderResults()}
        </main>
      </div>
    </div>
  )
}

export default CSTR 