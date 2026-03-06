import React from 'react';
import PokemonCard from './HewanCard';

interface Pokemon {
  id: number;
  name?: string;
  level?: number;
  image?: string;
  isEmpty?: boolean;
}

interface PokemonGridProps {
  pokemons: Pokemon[];
}

const PokemonGrid = ({ pokemons }: PokemonGridProps) => {
  return (
    <div className="flex flex-row overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {pokemons.map((pokemon) => (
        <PokemonCard
          key={pokemon.id}
          name={pokemon.name}
          level={pokemon.level}
          image={pokemon.image}
          isEmpty={pokemon.isEmpty}
        />
      ))}
    </div>
  );
};

export default PokemonGrid;
