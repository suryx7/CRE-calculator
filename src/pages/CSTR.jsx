import { useState } from 'react'
import { Link } from 'react-router-dom'
import { unitFactors } from '../components/units'

function CSTR() {
  const [activeTab, setActiveTab] = useState('conversion')
  const [unitSystem, setUnitSystem] = useState('SI') // Default to SI units
  const [formData, setFormData] = useState({
    initialConcentration: '1.0',
    flowRate: '10',
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
  })

  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

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
        initialConcentration,
        flowRate,
        volume,
        rateConstant,
        reactionOrder,
        temperature
      } = formData

      // Convert inputs to numbers
      const C0 = parseFloat(initialConcentration)
      const F = parseFloat(flowRate)
      const V = parseFloat(volume)
      const k = parseFloat(rateConstant)
      const n = parseFloat(reactionOrder)
      const T = parseFloat(temperature)

      // Validate inputs
      if (isNaN(C0) || isNaN(F) || isNaN(V) || isNaN(k) || isNaN(n) || isNaN(T)) {
        throw new Error('Please enter valid numbers for all fields')
      }

      if (C0 <= 0 || F <= 0 || V <= 0 || k <= 0 || n <= 0 || T <= 0) {
        throw new Error('All values must be positive numbers')
      }

      // Calculate residence time
      const tau = V / F

      // Calculate conversion based on reaction order
      let conversion
      if (n === 1) {
        // First order reaction
        conversion = k * tau / (1 + k * tau)
      } else {
        // Other reaction orders
        // For CSTR: X = 1 - (1 / (1 + k * tau * C0^(n-1)))
        conversion = 1 - (1 / (1 + k * tau * Math.pow(C0, n - 1)))
      }

      // Calculate final concentration
      const finalConcentration = C0 * (1 - conversion)

      setResult({
        conversion: (conversion * 100).toFixed(2),
        finalConcentration: finalConcentration.toFixed(4),
        residenceTime: tau.toFixed(2)
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

  const calculateTemperatureProfile = (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const {
        initialConcentration,
        flowRate,
        volume,
        rateConstant,
        reactionOrder,
        temperature,
        heatOfReaction,
        heatCapacity,
        heatTransferCoefficient,
        coolingTemperature
      } = formData

      // Convert inputs to numbers
      const C0 = parseFloat(initialConcentration)
      const F = parseFloat(flowRate)
      const V = parseFloat(volume)
      const k = parseFloat(rateConstant)
      const n = parseFloat(reactionOrder)
      const T0 = parseFloat(temperature)
      const Hr = parseFloat(heatOfReaction)
      const Cp = parseFloat(heatCapacity)
      const U = parseFloat(heatTransferCoefficient)
      const Tc = parseFloat(coolingTemperature)

      // Validate inputs
      if (isNaN(C0) || isNaN(F) || isNaN(V) || isNaN(k) || isNaN(n) || isNaN(T0) || 
          isNaN(Hr) || isNaN(Cp) || isNaN(U) || isNaN(Tc)) {
        throw new Error('Please enter valid numbers for all fields')
      }

      // Calculate residence time
      const tau = V / F

      // Calculate conversion (simplified for temperature profile)
      const conversion = k * tau / (1 + k * tau)

      // Calculate temperature change
      // For CSTR: Q = F*rho*Cp*(T - T0) = -Hr*F*C0*X - U*A*(T - Tc)
      // Simplified approach:
      const reactionHeat = Hr * C0 * conversion
      const coolingHeat = U * (T0 - Tc) * tau / 60 // Convert to hours
      
      const finalTemperature = T0 + (reactionHeat / (Cp * 1000)) - (coolingHeat / (Cp * 1000))

      setResult({
        initialTemperature: T0.toFixed(1),
        finalTemperature: finalTemperature.toFixed(1),
        temperatureChange: (finalTemperature - T0).toFixed(1),
        units: getUnit('temperature')
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

  const renderConversionCalculator = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Calculate CSTR Conversion</h2>
      
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
            Calculate Reaction Rate
          </button>
        </div>
      </form>
    </div>
  )

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
              step="0.1"
              required
            />
          </div>
          
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
              Initial Temperature ({getUnit('temperature')})
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
              step="1"
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
              step="0.1"
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
              step="10"
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
          </div>
        )}
        
        {activeTab === 'temperatureProfile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Initial Temperature</h3>
              <p className="text-3xl font-bold text-blue-900">{result.initialTemperature} {result.units}</p>
              <p className="text-sm text-gray-600 mt-2">Starting temperature of the reactor</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Final Temperature</h3>
              <p className="text-3xl font-bold text-blue-900">{result.finalTemperature} {result.units}</p>
              <p className="text-sm text-gray-600 mt-2">Temperature after reaction</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Temperature Change</h3>
              <p className="text-3xl font-bold text-blue-900">{result.temperatureChange} {result.units}</p>
              <p className="text-sm text-gray-600 mt-2">Change in temperature during reaction</p>
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
            onClick={() => setActiveTab('temperatureProfile')}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              activeTab === 'temperatureProfile' ? 'bg-blue-800' : 'hover:bg-blue-800'
            }`}
          >
            Temperature Profile
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
                  <option value="temperatureProfile">Temperature</option>
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
          {activeTab === 'temperatureProfile' && renderTemperatureProfileCalculator()}
          {activeTab === 'requiredVolume' && renderRequiredVolumeCalculator()}
          
          {renderResults()}
        </main>
      </div>
    </div>
  )
}

export default CSTR 