export interface RawPetState {
  readonly hunger: number;
  readonly happiness: number;
  readonly energy: number;
  readonly lastInteractionBlock: number;
  readonly isAlive: boolean;
  readonly currentBlock: number;
  readonly totalRounds: number;
}

export interface LivePetState extends RawPetState {
  readonly effectiveHunger: number;
  readonly effectiveHappiness: number;
  readonly effectiveEnergy: number;
  readonly blocksUntilNextDecay: number;
  readonly isDangerZone: boolean;
}

export type PetAction = 'feed' | 'play' | 'sleep';

export interface StxPetConfig {
  readonly contractAddress: string;
  readonly contractName: string;
  readonly network: 'mainnet' | 'testnet';
}
