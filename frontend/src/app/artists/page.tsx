export default function ArtistsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-gray-700 bg-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <a href="/" className="text-blue-400 hover:underline">← Back Home</a>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Browse Artists</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="bg-gray-700 h-48 rounded mb-4 flex items-center justify-center">
                <span className="text-gray-500">Artist {i} Photo</span>
              </div>
              <h2 className="text-xl font-bold mb-2">Artist {i}</h2>
              <p className="text-gray-400 mb-4">Professional performer • Rating: 4.8★</p>
              <a href={`/artists/${i}`} className="inline-block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                View Profile
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
