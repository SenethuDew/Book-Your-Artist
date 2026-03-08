export default function ArtistProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-gray-700 bg-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <a href="/artists" className="text-blue-400 hover:underline">← Back to Artists</a>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="bg-gray-700 h-64 rounded mb-4 flex items-center justify-center">
                <span className="text-gray-500">Artist Photo</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Artist {params.id}</h1>
              <p className="text-yellow-400 mb-4">⭐ 4.8 (24 reviews)</p>
              <button className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-bold">
                Book Now
              </button>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-2xl font-bold mb-4">About</h2>
              <p className="text-gray-300 mb-6">
                Professional artist with years of experience in various genres.
              </p>
              
              <h2 className="text-2xl font-bold mb-4">Availability</h2>
              <div className="space-y-2 text-gray-300">
                <p>✓ Weekends available</p>
                <p>✓ Full day bookings</p>
                <p>✓ Travel willing</p>
              </div>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">Pricing</h2>
              <p className="text-gray-300">Starting at $500/hour</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
