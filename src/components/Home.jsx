import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import Footer from './footer'
function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white p-6 text-center shadow-lg">
        <img src={logo} alt="CRE Logo" className="w-32 h-32 mx-auto mb-4" />
        <h1 className="text-4xl font-bold tracking-wide">Chemical Reaction Engineering Calculator</h1>
      </header>
      
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <section>
          <h2 className="text-2xl font-semibold text-blue-900 text-center mb-8">Available Calculators</h2>
          <div className="grid grid-cols-1 md:grid gap-8 p-4">
            <Link to="/batch-reactor" className="no-underline">
              <div className="flex flex-col md:flex-row bg-white rounded-xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                <img src="/src/assets/reactors/BatchReactor.png" alt="Batch Reactor" className="w-full md:w-48 h-48 object-contain mb-4 md:mb-0 md:mr-6" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-blue-900 mb-3">Batch Reactor</h3>
                  <p className="text-gray-600 leading-relaxed">This is a closed system where reactants are added to a vessel, allowed to react for a certain period (batch time), and then the products are removed. There's no inflow or outflow of reactants or products during the reaction. Offers flexibility in handling small-scale reactions, easy to control reaction conditions, and suitable for reactions requiring multiple steps or where precise control is necessary. Commonly used in pharmaceuticals, specialty chemicals, and research laboratories for small-scale synthesis, process development, and optimization.</p>
                </div>
              </div>
            </Link>
            <Link to="/cstr" className="no-underline">
              <div className="flex flex-col md:flex-row bg-white rounded-xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                <img src="/src/assets/reactors/CSTR.png" alt="CSTR" className="w-full md:w-48 h-48 object-contain mb-4 md:mb-0 md:mr-6" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-blue-900 mb-3">Continuous Stirred Tank Reactor</h3>
                  <p className="text-gray-600 leading-relaxed">It is a type of reactor where reactants are continuously fed into a well-mixed tank reactor and products are continuously removed. It's characterized by uniform composition throughout the reactor. Offers good temperature and concentration control due to uniform mixing. Residence time distribution is relatively broad, meaning reactants spend varying amounts of time in the reactor. Commonly used in large-scale industrial processes like chemical production, wastewater treatment, and fermentation.</p>
                </div>
              </div>
            </Link>
            <Link to="/pfr" className="no-underline">
              <div className="flex flex-col md:flex-row bg-white rounded-xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                <img src="/src/assets/reactors/PFR.png" alt="PFR" className="w-full md:w-48 h-48 object-contain mb-4 md:mb-0 md:mr-6" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-blue-900 mb-3">Plug Flow Reactor</h3>
                  <p className="text-gray-600 leading-relaxed">A type of reactor where reactants flow through a tube-like vessel with no mixing in the radial direction. The composition of the reaction mixture changes continuously along the length of the reactor. Offers high conversion efficiency and precise control over reaction conditions. Commonly used in large-scale chemical production, petroleum refining, and gas-phase reactions.</p>
                </div>
              </div>
            </Link>
            <Link to="/packed-bed-reactor" className="no-underline">
              <div className="flex flex-col md:flex-row bg-white rounded-xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                <img src="/src/assets/reactors/PackedBedReactor.png" alt="Packed Bed Reactor" className="w-full md:w-48 h-48 object-contain mb-4 md:mb-0 md:mr-6" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-blue-900 mb-3">Packed Bed Reactor</h3>
                  <p className="text-gray-600 leading-relaxed">A type of reactor filled with solid catalyst particles. Reactants flow through the bed of particles, where the reaction takes place on the catalyst surface. Offers high surface area for reaction and efficient heat transfer. Commonly used in catalytic processes, such as petroleum refining, chemical synthesis, and environmental applications.</p>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home