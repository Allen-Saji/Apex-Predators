export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦁</span>
            <span className="font-black text-sm tracking-tight">
              <span className="text-red-500">APEX</span>{' '}
              <span className="text-gray-400">PREDATORS</span>
            </span>
          </div>
          <p className="text-xs text-gray-600">
            Built on Monad · Only the strongest survive
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Twitter</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Discord</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Docs</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
