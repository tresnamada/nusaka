import { create } from 'zustand'

interface JoystickState {
    forward: number;
    right: number;
    setMovement: (forward: number, right: number) => void;

    // Player Profile Data
    playerId: string | null;
    playerName: string | null;
    hasSaveData: boolean | null; // null = checking, false = no save, true = has save
    setPlayerProfile: (id: string | null, name: string | null, hasSave: boolean) => void;

    // UI State
    menuState: 'checking' | 'main' | 'create_character' | 'playing';
    setMenuState: (state: 'checking' | 'main' | 'create_character' | 'playing') => void;
}

export const useJoystickStore = create<JoystickState>((set) => ({
    forward: 0,
    right: 0,
    setMovement: (forward, right) => set({ forward, right }),

    playerId: null,
    playerName: null,
    hasSaveData: null,
    setPlayerProfile: (id: string | null, name: string | null, hasSave: boolean) =>
        set({ playerId: id, playerName: name, hasSaveData: hasSave }),

    menuState: 'checking',
    setMenuState: (state: 'checking' | 'main' | 'create_character' | 'playing') => set({ menuState: state })
}))
