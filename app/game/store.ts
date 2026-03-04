import { create } from 'zustand'

interface JoystickState {
    forward: number;
    right: number;
    setMovement: (forward: number, right: number) => void;
}

export const useJoystickStore = create<JoystickState>((set) => ({
    forward: 0,
    right: 0,
    setMovement: (forward, right) => set({ forward, right }),
}))
