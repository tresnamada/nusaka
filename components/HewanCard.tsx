import React from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';

interface PokemonCardProps {
  image?: string;
  name?: string;
  level?: number;
  isEmpty?: boolean;
}

const PokemonCard = ({ image, name, level, isEmpty }: PokemonCardProps) => {
  if (isEmpty || !name || !image || level === undefined) {
    return (
      <div className="min-w-[250px] w-[250px] shrink-0 snap-center bg-white/20 border-2 border-dashed border-white/50 backdrop-blur-md rounded-[24px] p-6 h-[232px] flex flex-col items-center justify-center transition-all duration-500 hover:bg-white/30 hover:border-white hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.1)] group cursor-pointer">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 transition-all duration-500 group-hover:bg-white/40 group-hover:scale-110 drop-shadow">
          <Plus className="w-8 h-8 text-[#17670f]/50 transition-colors duration-500 group-hover:text-[#17670f]" />
        </div>
        <span className="text-[#17670f]/70 font-bold text-2xl tracking-widest uppercase transition-colors duration-500 group-hover:text-[#17670f] drop-shadow">Kosong</span>
      </div>
    );
  }

  return (
    <div className="min-w-[250px] w-[250px] shrink-0 snap-center bg-white/20 backdrop-blur-md rounded-[24px] p-6 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-3 hover:shadow-[0_25px_50px_rgba(0,0,0,0.15)] hover:bg-white/40 flex flex-col items-center group relative overflow-hidden border border-white/40 cursor-pointer z-10 hover:z-20">
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-white rounded-full opacity-0 blur-2xl group-hover:opacity-30 group-hover:scale-150 transition-all duration-700 ease-out"></div>
      <div className="relative w-28 h-28 mb-5 transform group-hover:scale-125 group-hover:drop-shadow-2xl transition-all duration-500 z-10 group-hover:-translate-y-2">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain"
        />
      </div>
      
      <div className="w-full flex flex-col items-center z-10 transition-transform duration-500 group-hover:translate-y-1">
        <h3 className="text-[#17670f] font-black text-4xl mb-2 tracking-tight transition-colors duration-300 drop-shadow">{name}</h3>
        <span className="bg-white/30 text-[#17670f] font-bold text-xl uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/50 shadow-sm transition-all duration-300 group-hover:bg-[#17670f] group-hover:text-white group-hover:border-[#17670f] group-hover:shadow-md drop-shadow">
          Lv. {level}
        </span>
      </div>
    </div>
  );
};

export default PokemonCard;
