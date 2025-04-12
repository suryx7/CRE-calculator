import { Link } from 'react-router-dom'
import { useState } from 'react'

function BatchReactor() {
  const [activeTab, setActiveTab] = useState('conversion')
  const [unitSystem, setUnitSystem] = useState('SI') // Default to SI units
  const [reactionType, setReactionType] = useState('a_to_b') // Default to A -> B
  const [formData, setFormData] = useState({
    initialConcentration: '1.0',
    reactionTime: '10',
    rateConstant: '0.1',
    reactionOrder: '0', 
    temperature: '25',
    volume: '1.0',
    pressure: '1.0',
    activationEnergy: '50',
    preExponentialFactor: '1e10',
    heatOfReaction: '0',
    heatCapacity: '4.2',
    heatTransferCoefficient: '100',
    coolingTemperature: '20',
    // New stoichiometry fields
    stoichiometryA: '1',
    stoichiometryB: '1',
    stoichiometryC: '1',
    stoichiometryD: '1',
    initialConcentrationB: '0',
    initialConcentrationC: '0',
    initialConcentrationD: '0'
  })

  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Get the appropriate unit for a given parameter
  const getUnit = (param) => {
    if (param === 'rateConstant') {
      const n = parseFloat(formData.reactionOrder) || 1; // Default to 1 if not entered
      return unitFactors[unitSystem].rateConstant(n).unit;
    }
    return unitFactors[unitSystem][param]?.unit || '';
  };

  // Unit conversion factors
  const unitFactors = {
    SI: {
        concentration: { factor: 1, unit: 'kmol/m³' },
        time: { factor: 1, unit: 's' },
        rateConstant: (n) => ({ factor: 1, unit: `(kmol^${n - 1}/m^${3*(n - 1)})·s⁻¹` }),
        temperature: { factor: 1, unit: 'K' },
        volume: { factor: 1, unit: 'm³' },
        pressure: { factor: 1, unit: 'Pa' },
        activationEnergy: { factor: 1, unit: 'J/mol' },
        heatOfReaction: { factor: 1, unit: 'J/mol' },
        heatCapacity: { factor: 1, unit: 'J/kg·K' },
        heatTransferCoefficient: { factor: 1, unit: 'W/m²·K' },
        reactionRate: { factor: 1, unit: 'kmol/m³·s' }
    },
    CGS: {
        concentration: { factor: 1e-3, unit: 'mol/cm³' },
        time: { factor: 1, unit: 's' },
        rateConstant: (n) => ({ factor: 1, unit: `(mol/cm³)^${n - 1}·s⁻¹` }),
        temperature: { factor: 1, unit: 'K' },
        volume: { factor: 1e6, unit: 'cm³' },
        pressure: { factor: 10, unit: 'dyne/cm²' },
        activationEnergy: { factor: 1e7, unit: 'erg/mol' },
        heatOfReaction: { factor: 1e7, unit: 'erg/mol' },
        heatCapacity: { factor: 1e7, unit: 'erg/g·K' },
        heatTransferCoefficient: { factor: 1e4, unit: 'erg/cm²·s·K' },
        reactionRate: { factor: 1e-3, unit: 'mol/cm³·s' }
    },
    Imperial: {
        concentration: { factor: 0.008345, unit: 'lbmol/ft³' },
        time: { factor: 1, unit: 's' },
        rateConstant: (n) => ({ factor: 1, unit: `(lbmol/ft³)^${n - 1}·s⁻¹` }),
        temperature: { factor: 1.8, unit: '°R' },
        volume: { factor: 35.3147, unit: 'ft³' },
        pressure: { factor: 0.000145, unit: 'psi' },
        activationEnergy: { factor: 0.0009478, unit: 'BTU/lbmol' },
        heatOfReaction: { factor: 0.0009478, unit: 'BTU/lbmol' },
        heatCapacity: { factor: 0.0002388, unit: 'BTU/lb·°R' },
        heatTransferCoefficient: { factor: 0.1761, unit: 'BTU/ft²·h·°R' },
        reactionRate: { factor: 0.008345, unit: 'lbmol/ft³·s' }
    }
};

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

  const calculateConversion = (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const {
        initialConcentrationA,
        initialConcentrationB,
        reactionTime,
        reactionOrder,
        rateConstant,
        temperature,
        stoichiometryA,
        stoichiometryB,
        stoichiometryC,
        stoichiometryD
      } = formData

      // Convert inputs to numbers
      const C0A = parseFloat(initialConcentrationA)
      const C0B = parseFloat(initialConcentrationB) || 0
      const t = parseFloat(reactionTime)
      const n = parseFloat(reactionOrder)
      const k = parseFloat(rateConstant)
      const T = parseFloat(temperature)
      const vA = parseFloat(stoichiometryA)
      const vB = parseFloat(stoichiometryB)
      const vC = parseFloat(stoichiometryC)
      const vD = parseFloat(stoichiometryD)

      // Validate inputs
      if (isNaN(C0A) || isNaN(t) || isNaN(k) || isNaN(n) || isNaN(T)) {
        throw new Error('Please enter valid numbers for all fields')
      }

      if (C0A < 0 || t < 0 || k < 0 || n < 0 || T < 0) {
        throw new Error('All values must be positive numbers')
      }

      // Calculate conversion based on reaction type and order
      let conversion
      if (n === 0) {
        // Zero order reaction
        conversion = (k * t) / C0A
      } else if (n === 1) {
        // First order reaction
        conversion = 1 - Math.exp(-k * t)
      } else {
        // Other reaction orders
        conversion = 1 - Math.pow(1 + (n - 1) * k * t * Math.pow(C0A, n - 1), 1 / (1 - n))
      }

      // Calculate final concentrations based on reaction type
      let finalConcentrations = {}
      let limitingReactant, conversionB
      
      switch (reactionType) {
        case 'a_to_b':
          finalConcentrations = {
            A: C0A * (1 - conversion),
            B: C0A * conversion
          }
          break
          
        case 'a_plus_b_to_c':
          limitingReactant = Math.min(C0A / vA, C0B / vB)
          conversionB = (C0B - (C0B - limitingReactant * vB)) / C0B
          finalConcentrations = {
            A: C0A * (1 - conversion),
            B: C0B * (1 - conversionB),
            C: limitingReactant * vC
          }
          break
          
        case 'a_to_b_plus_c':
          finalConcentrations = {
            A: C0A * (1 - conversion),
            B: C0A * conversion * (vB / vA),
            C: C0A * conversion * (vC / vA)
          }
          break
          
        case 'a_plus_b_to_c_plus_d':
          limitingReactant = Math.min(C0A / vA, C0B / vB)
          conversionB = (C0B - (C0B - limitingReactant * vB)) / C0B
          finalConcentrations = {
            A: C0A * (1 - conversion),
            B: C0B * (1 - conversionB),
            C: limitingReactant * vC,
            D: limitingReactant * vD
          }
          break
      }

      setResult({
        conversion: (conversion * 100).toFixed(2),
        finalConcentrations,
        units: getUnit('concentration')
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
        initialConcentrationB,
        rateConstant,
        reactionOrder,
        temperature,
        stoichiometryA,
        stoichiometryB
      } = formData

      // Convert inputs to numbers
      const C0A = parseFloat(initialConcentration)
      const C0B = parseFloat(initialConcentrationB) || 0
      const k = parseFloat(rateConstant)
      const n = parseFloat(reactionOrder)
      const T = parseFloat(temperature)
      const vA = parseFloat(stoichiometryA)
      const vB = parseFloat(stoichiometryB)

      // Validate inputs
      if (isNaN(C0A) || isNaN(k) || isNaN(n) || isNaN(T)) {
        throw new Error('Please enter valid numbers for all fields')
      }

      if (C0A <= 0 || k <= 0 || n <= 0 || T <= 0) {
        throw new Error('All values must be positive numbers')
      }

      // Calculate reaction rate based on reaction type and order
      let reactionRate
      let rateUnits = getUnit('reactionRate')

      // Handle unit conversions based on reaction order
      const concentrationUnit = getUnit('concentration')
      const timeUnit = getUnit('time')
      
      switch (reactionType) {
        case 'a_to_b':
          if (n === 0) {
            // Zero order: rate = k
            reactionRate = k
            rateUnits = `${concentrationUnit}/${timeUnit}`
          } else {
            // Other orders: rate = k * [A]^n
            reactionRate = k * Math.pow(C0A, n)
            rateUnits = `${concentrationUnit}/${timeUnit}`
          }
          break

        case 'a_plus_b_to_c':
          if (n === 0) {
            // Zero order: rate = k
            reactionRate = k
            rateUnits = `${concentrationUnit}/${timeUnit}`
          } else {
            // Other orders: rate = k * [A]^n * [B]^m
            const limitingReactant = Math.min(C0A / vA, C0B / vB)
            reactionRate = k * Math.pow(limitingReactant, n)
            rateUnits = `${concentrationUnit}/${timeUnit}`
          }
          break

        case 'a_to_b_plus_c':
          if (n === 0) {
            // Zero order: rate = k
            reactionRate = k
            rateUnits = `${concentrationUnit}/${timeUnit}`
          } else {
            // Other orders: rate = k * [A]^n
            reactionRate = k * Math.pow(C0A, n)
            rateUnits = `${concentrationUnit}/${timeUnit}`
          }
          break

        case 'a_plus_b_to_c_plus_d':
          if (n === 0) {
            // Zero order: rate = k
            reactionRate = k
            rateUnits = `${concentrationUnit}/${timeUnit}`
          } else {
            // Other orders: rate = k * [A]^n * [B]^m
            const limitingReactant = Math.min(C0A / vA, C0B / vB)
            reactionRate = k * Math.pow(limitingReactant, n)
            rateUnits = `${concentrationUnit}/${timeUnit}`
          }
          break
      }

      // Apply unit conversion factors if needed
      const unitFactor = unitFactors[unitSystem].reactionRate.factor
      reactionRate = reactionRate * unitFactor

      setResult({
        reactionRate: reactionRate.toFixed(6),
        units: rateUnits,
        details: {
          reactionType,
          order: n,
          limitingReactant: reactionType.includes('plus') ? 
            (C0A / vA < C0B / vB ? 'A' : 'B') : 'A'
        }
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
        initialConcentrationB,
        reactionTime,
        rateConstant,
        reactionOrder,
        temperature,
        heatOfReaction,
        heatCapacity,
        heatTransferCoefficient,
        coolingTemperature,
        stoichiometryA,
        stoichiometryB
      } = formData

      // Convert inputs to numbers
      const C0A = parseFloat(initialConcentration)
      const C0B = parseFloat(initialConcentrationB) || 0
      const t = parseFloat(reactionTime)
      const k = parseFloat(rateConstant)
      const n = parseFloat(reactionOrder)
      const T0 = parseFloat(temperature)
      const Hr = parseFloat(heatOfReaction)
      const Cp = parseFloat(heatCapacity)
      const U = parseFloat(heatTransferCoefficient)
      const Tc = parseFloat(coolingTemperature)
      const vA = parseFloat(stoichiometryA)
      const vB = parseFloat(stoichiometryB)

      // Validate inputs
      if (isNaN(C0A) || isNaN(t) || isNaN(k) || isNaN(n) || isNaN(T0) || 
          isNaN(Hr) || isNaN(Cp) || isNaN(U) || isNaN(Tc)) {
        throw new Error('Please enter valid numbers for all fields')
      }

      // Calculate temperature change based on reaction type
      let conversion
      let limitingReactant

      switch (reactionType) {
        case 'a_to_b':
          if (n === 0) {
            conversion = (k * t) / C0A
          } else if (n === 1) {
            conversion = 1 - Math.exp(-k * t)
          } else {
            conversion = 1 - Math.pow(1 + (n - 1) * k * t * Math.pow(C0A, n - 1), 1 / (1 - n))
          }
          limitingReactant = C0A
          break

        case 'a_plus_b_to_c':
          limitingReactant = Math.min(C0A / vA, C0B / vB)
          if (n === 0) {
            conversion = (k * t) / limitingReactant
          } else if (n === 1) {
            conversion = 1 - Math.exp(-k * t)
          } else {
            conversion = 1 - Math.pow(1 + (n - 1) * k * t * Math.pow(limitingReactant, n - 1), 1 / (1 - n))
          }
          break

        case 'a_to_b_plus_c':
          if (n === 0) {
            conversion = (k * t) / C0A
          } else if (n === 1) {
            conversion = 1 - Math.exp(-k * t)
          } else {
            conversion = 1 - Math.pow(1 + (n - 1) * k * t * Math.pow(C0A, n - 1), 1 / (1 - n))
          }
          limitingReactant = C0A
          break

        case 'a_plus_b_to_c_plus_d':
          limitingReactant = Math.min(C0A / vA, C0B / vB)
          if (n === 0) {
            conversion = (k * t) / limitingReactant
          } else if (n === 1) {
            conversion = 1 - Math.exp(-k * t)
          } else {
            conversion = 1 - Math.pow(1 + (n - 1) * k * t * Math.pow(limitingReactant, n - 1), 1 / (1 - n))
          }
          break
      }

      // Calculate heat generation and removal
      const reactionHeat = Hr * limitingReactant * conversion
      const coolingHeat = U * (T0 - Tc) * t / 60 // Convert to hours
      
      // Calculate final temperature
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

  const calculateReactionTime = (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const {
        initialConcentrationA,
        initialConcentrationB,
        rateConstant,
        reactionOrder,
        temperature,
        targetConversion,
        stoichiometryA,
        stoichiometryB
      } = formData

      // Convert inputs to numbers
      const C0A = parseFloat(initialConcentrationA)
      const C0B = parseFloat(initialConcentrationB) || 0
      const k = parseFloat(rateConstant)
      const n = parseFloat(reactionOrder)
      const T = parseFloat(temperature)
      const X = parseFloat(targetConversion) / 100 // Convert percentage to decimal
      const vA = parseFloat(stoichiometryA)
      const vB = parseFloat(stoichiometryB)

      // Validate inputs
      if (isNaN(C0A) || isNaN(k) || isNaN(n) || isNaN(T) || isNaN(X)) {
        throw new Error('Please enter valid numbers for all fields')
      }

      if (C0A <= 0 || k <= 0 || n <= 0 || T <= 0 || X <= 0 || X >= 1) {
        throw new Error('Invalid input values')
      }

      // Calculate reaction time based on reaction type and order
      let reactionTime
      let limitingReactant

      switch (reactionType) {
        case 'a_to_b':
          limitingReactant = C0A
          if (n === 0) {
            reactionTime = (X * limitingReactant) / k
          } else if (n === 1) {
            reactionTime = -Math.log(1 - X) / k
          } else {
            reactionTime = (Math.pow(1 - X, 1 - n) - 1) / ((n - 1) * k * Math.pow(limitingReactant, n - 1))
          }
          break

        case 'a_plus_b_to_c':
          limitingReactant = Math.min(C0A / vA, C0B / vB)
          if (n === 0) {
            reactionTime = (X * limitingReactant) / k
          } else if (n === 1) {
            reactionTime = -Math.log(1 - X) / k
          } else {
            reactionTime = (Math.pow(1 - X, 1 - n) - 1) / ((n - 1) * k * Math.pow(limitingReactant, n - 1))
          }
          break

        case 'a_to_b_plus_c':
          limitingReactant = C0A
          if (n === 0) {
            reactionTime = (X * limitingReactant) / k
          } else if (n === 1) {
            reactionTime = -Math.log(1 - X) / k
          } else {
            reactionTime = (Math.pow(1 - X, 1 - n) - 1) / ((n - 1) * k * Math.pow(limitingReactant, n - 1))
          }
          break

        case 'a_plus_b_to_c_plus_d':
          limitingReactant = Math.min(C0A / vA, C0B / vB)
          if (n === 0) {
            reactionTime = (X * limitingReactant) / k
          } else if (n === 1) {
            reactionTime = -Math.log(1 - X) / k
          } else {
            reactionTime = (Math.pow(1 - X, 1 - n) - 1) / ((n - 1) * k * Math.pow(limitingReactant, n - 1))
          }
          break
      }

      setResult({
        reactionTime: reactionTime.toFixed(2),
        units: getUnit('time')
      })
    } catch (err) {
      setError(err.message)
      setResult(null)
    }
  }

  const renderConversionCalculator = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Calculate Reactor Conversion</h2>
      
      <form onSubmit={calculateConversion} className="space-y-6">
        {/* Reaction Type Selection */}
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
              required
            />
          </div>
        </div>

        {/* Stoichiometry Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
          {(reactionType === 'a_plus_b_to_c' || reactionType === 'a_plus_b_to_c_plus_d') && (
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1"
                required
              />
            </div>
          )}

          {(reactionType === 'a_to_b_plus_c' || reactionType === 'a_plus_b_to_c_plus_d') && (
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
          )}

          {reactionType === 'a_plus_b_to_c_plus_d' && (
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
          )}
        </div>

        {/* Initial Concentrations Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="initialConcentrationA" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Concentration of A ({getUnit('concentration')})
            </label>
            <input
              type="number"
              id="initialConcentrationA"
              name="initialConcentrationA"
              value={formData.initialConcentrationA}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              step="0.01"
              required
            />
          </div>
          <div>
            <label htmlFor="initialConcentrationB" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Concentration of B ({getUnit('concentration')}) (if B is not present initially, leave blank)
            </label>
            <input
              type="number"
              id="initialConcentrationB"
              name="initialConcentrationB"
              value={formData.initialConcentrationB}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              step="0.01"
            />
          </div>

          {(reactionType === 'a_plus_b_to_c' || reactionType === 'a_plus_b_to_c_plus_d') && (
            <div>
              <label htmlFor="initialConcentrationB" className="block text-sm font-medium text-gray-700 mb-1">
                Initial Concentration of B ({getUnit('concentration')})
              </label>
              <input
                type="number"
                id="initialConcentrationB"
                name="initialConcentrationB"
                value={formData.initialConcentrationB}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                required
              />
            </div>
          )}
        </div>

        {/* Existing form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="reactionTime" className="block text-sm font-medium text-gray-700 mb-1">
              Reaction Time ({getUnit('time')})
            </label>
            <input
              type="number"
              id="reactionTime"
              name="reactionTime"
              value={formData.reactionTime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter reaction time"
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
        {/* Reaction Type Selection */}
        <div className="mb-6">
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
            <option value="a_to_b">A → B</option>
            <option value="a_plus_b_to_c">A + B → C</option>
            <option value="a_to_b_plus_c">A → B + C</option>
            <option value="a_plus_b_to_c_plus_d">A + B → C + D</option>
          </select>
        </div>

        {/* Stoichiometry Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
              required
            />
          </div>

          {(reactionType === 'a_plus_b_to_c' || reactionType === 'a_plus_b_to_c_plus_d') && (
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1"
                required
              />
            </div>
          )}
        </div>

        {/* Initial Concentrations Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="initialConcentration" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Concentration of A ({getUnit('concentration')})
            </label>
            <input
              type="number"
              id="initialConcentration"
              name="initialConcentration"
              value={formData.initialConcentration}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              step="0.01"
              required
            />
          </div>

          {(reactionType === 'a_plus_b_to_c' || reactionType === 'a_plus_b_to_c_plus_d') && (
            <div>
              <label htmlFor="initialConcentrationB" className="block text-sm font-medium text-gray-700 mb-1">
                Initial Concentration of B ({getUnit('concentration')})
              </label>
              <input
                type="number"
                id="initialConcentrationB"
                name="initialConcentrationB"
                value={formData.initialConcentrationB}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                required
              />
            </div>
          )}
        </div>

        {/* Rate Constant and Order Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <option value="0">Zero Order</option>
              <option value="0.5">Half Order</option>
              <option value="1">First Order</option>
              <option value="2">Second Order</option>
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
              Initial Concentration (mol/L)
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
            <label htmlFor="reactionTime" className="block text-sm font-medium text-gray-700 mb-1">
              Reaction Time (min)
            </label>
            <input
              type="number"
              id="reactionTime"
              name="reactionTime"
              value={formData.reactionTime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter reaction time"
              step="0.1"
              required
            />
          </div>
          
          <div>
            <label htmlFor="rateConstant" className="block text-sm font-medium text-gray-700 mb-1">
              Rate Constant (min⁻¹)
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
              <option value="0">Zero Order</option>
              <option value="0.5">Half Order</option>
              <option value="1">First Order</option>
              <option value="2">Second Order</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Temperature (°C)
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
              Heat of Reaction (kJ/mol)
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
              Heat Capacity (kJ/kg·K)
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
              Heat Transfer Coefficient (W/m²·K)
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
              Cooling Temperature (°C)
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

  const renderReactionTimeCalculator = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Calculate Required Reaction Time</h2>
      
      <form onSubmit={calculateReactionTime} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="initialConcentration" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Concentration (mol/L)
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
              Rate Constant (min⁻¹)
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
              <option value="0">Zero Order</option>
              <option value="0.5">Half Order</option>
              <option value="1">First Order</option>
              <option value="2">Second Order</option>
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
              Temperature (°C)
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
            Calculate Required Time
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Conversion</h3>
              <p className="text-3xl font-bold text-blue-900">{result.conversion}%</p>
              <p className="text-sm text-gray-600 mt-2">Percentage of limiting reactant converted</p>
            </div>
            
            {Object.entries(result.finalConcentrations).map(([species, concentration]) => (
              <div key={species} className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Final Concentration of {species}</h3>
                <p className="text-3xl font-bold text-blue-900">{concentration.toFixed(4)} {result.units}</p>
                <p className="text-sm text-gray-600 mt-2">Concentration of {species} at end of reaction</p>
              </div>
            ))}
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
              <h3 className="text-lg font-medium text-blue-900 mb-2">Reaction Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Reaction Type</p>
                  <p className="font-medium text-blue-900">
                    {result.details.reactionType === 'a_to_b' && 'A → B'}
                    {result.details.reactionType === 'a_plus_b_to_c' && 'A + B → C'}
                    {result.details.reactionType === 'a_to_b_plus_c' && 'A → B + C'}
                    {result.details.reactionType === 'a_plus_b_to_c_plus_d' && 'A + B → C + D'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reaction Order</p>
                  <p className="font-medium text-blue-900">
                    {result.details.order === 0 && 'Zero Order'}
                    {result.details.order === 0.5 && 'Half Order'}
                    {result.details.order === 1 && 'First Order'}
                    {result.details.order === 2 && 'Second Order'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Limiting Reactant</p>
                  <p className="font-medium text-blue-900">{result.details.limitingReactant}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rate Law</p>
                  <p className="font-medium text-blue-900">
                    {result.details.order === 0 && 'r = k'}
                    {result.details.order === 1 && 'r = k[A]'}
                    {result.details.order === 2 && 'r = k[A]²'}
                    {result.details.order === 0.5 && 'r = k[A]⁰·⁵'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'temperatureProfile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        
        {activeTab === 'reactionTime' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Required Reaction Time</h3>
              <p className="text-3xl font-bold text-blue-900">{result.reactionTime} {result.units}</p>
              <p className="text-sm text-gray-600 mt-2">Time needed to achieve target conversion</p>
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
        
        <h2 className="text-xl font-bold mb-4">Batch Reactor</h2>
        
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
            onClick={() => setActiveTab('reactionTime')}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              activeTab === 'reactionTime' ? 'bg-blue-800' : 'hover:bg-blue-800'
            }`}
          >
            Required Reaction Time
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
              <h1 className="text-xl font-bold">Batch Reactor Calculator</h1>
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
                  <option value="reactionTime">Reaction Time</option>
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
          {activeTab === 'reactionTime' && renderReactionTimeCalculator()}
          
          {renderResults()}
        </main>
      </div>
    </div>
  )
}

export default BatchReactor 