export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        {/* Animated equalizer bars */}
        <div className="flex h-12 items-end justify-center gap-1">
          <div className="w-2 bg-violet-600 rounded-t-sm animate-bounce" style={{ height: "40%", animationDuration: "1s" }} />
          <div className="w-2 bg-fuchsia-600 rounded-t-sm animate-bounce" style={{ height: "80%", animationDuration: "1.2s", animationDelay: "0.2s" }} />
          <div className="w-2 bg-indigo-500 rounded-t-sm animate-bounce" style={{ height: "60%", animationDuration: "0.9s", animationDelay: "0.4s" }} />
          <div className="w-2 bg-pink-500 rounded-t-sm animate-bounce" style={{ height: "100%", animationDuration: "1.1s", animationDelay: "0.1s" }} />
          <div className="w-2 bg-violet-400 rounded-t-sm animate-bounce" style={{ height: "50%", animationDuration: "1s", animationDelay: "0.5s" }} />
        </div>
        <p className="text-sm font-semibold tracking-widest text-gray-400 uppercase animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}