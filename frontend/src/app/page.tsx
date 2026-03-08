export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <nav className="border-b border-gray-700 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-white">Book Your Artist</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Find & Book Your Artist</h2>
          <p className="text-xl text-gray-300 mb-8">
            Connect with talented artists for your next event
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-2">For Clients</h3>
              <p className="text-gray-300 mb-4">Search and book artists for your events</p>
              <a href="/artists" className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded">
                Browse Artists
              </a>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-2">For Artists</h3>
              <p className="text-gray-300 mb-4">Get discovered and manage your bookings</p>
              <a href="/register" className="inline-block bg-green-600 hover:bg-green-700 px-6 py-2 rounded">
                Register as Artist
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
