import React from 'react';
import { UserPlus } from 'lucide-react';

interface TrainerInfoProps {
  name: string;
  pokemonCount: number;
  friendCount: number;
}

const TrainerInfo = ({ name, pokemonCount, friendCount }: TrainerInfoProps) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Profile Header */}
      <div className="bg-white/20 backdrop-blur-xl p-8 rounded-[32px] shadow-[0_15px_35px_rgba(0,0,0,0.1)] border border-white/40 relative overflow-hidden group hover:shadow-[0_20px_45px_rgba(0,0,0,0.15)] transition-all duration-500">
        <h1 className="text-5xl md:text-6xl text-[#17670f] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] mb-4 relative z-10 tracking-tight">{name}</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10 w-full mt-2">
          <button className="w-full sm:w-auto bg-white/30 backdrop-blur-md border border-white/50 text-[#17670f] text-2xl px-6 py-2.5 rounded-xl shadow-sm transition-transform hover:scale-[1.02] sm:hover:scale-105 hover:bg-white/40 flex justify-center items-center gap-2 drop-shadow">
            <UserPlus className="w-6 h-6" />
            Tambah Teman
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-6 relative z-10">
        {/* Pokemon Count Card */}
        <div className="bg-white/20 backdrop-blur-md p-6 rounded-[28px] shadow-[0_15px_30px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] cursor-pointer">
           <div className="w-20 h-20 bg-white/20 border border-white/30 text-[#17670f] rounded-2xl flex items-center justify-center mb-4 drop-shadow">
             <span className="text-5xl">{pokemonCount}</span>
           </div>
           <h3 className="text-[#17670f] text-4xl mb-1 drop-shadow">Hewan</h3>
           <p className="text-[#17670f]/80 text-xl tracking-wider drop-shadow">Ditangkap</p>
        </div>

        {/* Friends Count Card */}
        <div className="bg-white/20 backdrop-blur-md p-6 rounded-[28px] shadow-[0_15px_30px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] cursor-pointer">
           <div className="w-20 h-20 bg-white/20 border border-white/30 text-[#17670f] rounded-2xl flex items-center justify-center mb-4 drop-shadow">
             <span className="text-5xl">{friendCount}</span>
           </div>
           <h3 className="text-[#17670f] text-4xl mb-1 drop-shadow">Teman</h3>
           <p className="text-[#17670f]/80 text-xl tracking-wider drop-shadow">Ditambah</p>
        </div>
      </div>
    </div>
  );
};

export default TrainerInfo;
