// import { useState } from 'react'
// import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import BatchReactor from './pages/BatchReactor'
import CSTR from './pages/CSTR'
import PFR from './pages/PFR' 
import PBR from './pages/PBR'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} /> 
        <Route path="/batch-reactor" element={<BatchReactor />} />
        <Route path="/cstr" element={<CSTR />} />
        <Route path="/pfr" element={<PFR />} />
        <Route path="/packed-bed-reactor" element={<PBR />} />
      </Routes>
    </Router>
  )
}

export default App
