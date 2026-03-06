import React from 'react';
import Link from 'next/link';
import CharacterViewer from '@/components/CharacterViewer';
import TrainerInfo from '@/components/CharacterInfo';
import PokemonGrid from '@/components/HewanFlex';

const pokemons = [
  {
    id: 1,
    name: 'Pikachu',
    level: 25,
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'
  },
  { id: 2, isEmpty: true },
  { id: 3, isEmpty: true },
];

const trainerData = {
  name: 'Nusaka',
  pokemons: pokemons
};

export default function ProfilePage() {
  return (
    <div 
      className="min-h-screen bg-[#87CEEB] p-4 md:p-8 lg:p-12"
      style={{ fontFamily: 'var(--font-nanum-pen)' }}
    >
      <div className="max-w-7xl mx-auto text-[#17670f]">
        <header className="mb-10 flex items-center gap-6">
          <Link 
            href="/" 
            className="text-5xl md:text-7xl text-[#17670f] drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] hover:scale-110 hover:-translate-x-2 transition-transform mt-2"
          >
            ←
          </Link>
          <h1 
            className="text-6xl md:text-8xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] leading-tight mt-2"
          >
            Profil Pemain
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Character Section */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="sticky top-8">
              <CharacterViewer />
            </div>
          </div>

          {/* Right Column: Profile Info */}
          <div className="lg:col-span-8 flex flex-col gap-8 text-[#17670f]">
            <TrainerInfo 
              name={trainerData.name} 
              pokemonCount={trainerData.pokemons.filter(p => !p.isEmpty).length}
              friendCount={67}
            />
            
            <div className="bg-white/20 backdrop-blur-xl p-8 rounded-[32px] shadow-[0_15px_35px_rgba(0,0,0,0.1)] border border-white/40">
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 mb-8 text-center sm:text-left">
                <h2 className="text-4xl text-[#17670f] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] tracking-tight">Koleksi Hewan</h2>
                <button className="w-full sm:w-auto bg-white/30 backdrop-blur-md px-6 py-3 rounded-xl border border-white/40 shadow-sm transition-transform hover:scale-105 hover:bg-white/40">
                  <span className="text-2xl text-[#17670f] drop-shadow uppercase tracking-widest">+ Tambah Hewan</span>
                </button>
              </div>
              <PokemonGrid pokemons={trainerData.pokemons} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
