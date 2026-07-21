export type IntroStage = 'beach' | 'surface' | 'diving' | 'playing';
export type CardState = 'hidden' | 'flipped' | 'matched';
export type SharkState = 'chasing' | 'stunned' | 'attacking' | 'dead';
export type DogTarget = 'tito' | 'lia';
export type DogState = 'swimming' | 'hitting' | 'blinking' | 'fleeing' | 'celebrating';

export interface CardData { id: number; pairId: number; }
export interface BurstData { id: string; pos: [number, number, number]; color: string; }