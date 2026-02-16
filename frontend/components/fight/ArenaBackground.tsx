import Image from 'next/image';

export default function ArenaBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Arena photo */}
      <Image
        src="/arenas/jungle.jpg"
        alt="Arena"
        fill
        className="object-cover"
        priority
        quality={90}
      />
      {/* Dark overlay to keep fighters readable */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Vignette edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.8)_100%)]" />
      {/* Top and bottom fade to page bg */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </div>
  );
}
