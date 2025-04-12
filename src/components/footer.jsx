function Footer() {
  return (
    <footer className="bg-blue-800 text-white py-4 mt-12">
      <div className="container mx-auto px-4">
        <p className="text-center">
          &copy; {new Date().getFullYear()} Chemical Reactor Engineering Calculator. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
