import { 
  fetchCallReadOnlyFunction, 
  cvToValue, 
  Cl, 
  ClarityValue,
  makeContractCall,
  broadcastTransaction,
  SignedContractCallOptions,
  AnchorMode
} from '@stacks/transactions';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { StxPetConfig, LivePetState, RawPetState, PetAction } from './types';

export class StxPetClient {
  private readonly config: StxPetConfig;
  private readonly network: StacksMainnet | StacksTestnet;

  constructor(config: StxPetConfig) {
    this.config = config;
    this.network = config.network === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
  }

  /**
   * Fetches the current live state of the pet, including decay calculations.
   */
  async getLiveState(): Promise<LivePetState> {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: this.config.contractAddress,
      contractName: this.config.contractName,
      functionName: 'get-live-state',
      functionArgs: [],
      network: this.network,
      senderAddress: this.config.contractAddress,
    });

    const raw = this.parsePetState(result);
    return this.computeCurrentMeters(raw, raw.currentBlock);
  }

  /**
   * Builds a transaction for a pet action (feed, play, sleep).
   */
  async submitAction(action: PetAction, privateKey: string): Promise<string> {
    const txOptions: SignedContractCallOptions = {
      contractAddress: this.config.contractAddress,
      contractName: this.config.contractName,
      functionName: action,
      functionArgs: [],
      senderKey: privateKey,
      validateWithAbi: true,
      network: this.network,
      anchorMode: AnchorMode.Any,
    };

    const transaction = await makeContractCall(txOptions);
    const response = await broadcastTransaction(transaction, this.network);

    if ('error' in response) {
      throw new Error(`Broadcast failed: ${response.error} ${response.reason || ''}`);
    }

    return response.txid;
  }

  private parsePetState(cv: ClarityValue): RawPetState {
    const data = cvToValue(cv) as any;
    return {
      hunger: Number(data.hunger),
      happiness: Number(data.happiness),
      energy: Number(data.energy),
      lastInteractionBlock: Number(data['last-interaction-block']),
      isAlive: data['pet-alive'],
      currentBlock: Number(data['current-block']),
      totalRounds: Number(data['total-rounds']),
    };
  }

  private computeCurrentMeters(raw: RawPetState, currentBlock: number): LivePetState {
    const DECAY_RATE = 1;
    const DECAY_INTERVAL = 10;
    const DANGER_THRESHOLD = 20;

    const blocksElapsed = Math.max(0, currentBlock - raw.lastInteractionBlock);
    const decay = DECAY_RATE * Math.floor(blocksElapsed / DECAY_INTERVAL);

    const compute = (val: number) => (decay > val ? 0 : val - decay);

    const effectiveHunger = compute(raw.hunger);
    const effectiveHappiness = compute(raw.happiness);
    const effectiveEnergy = compute(raw.energy);

    const blocksInCurrentInterval = blocksElapsed % DECAY_INTERVAL;
    const blocksUntilNextDecay = DECAY_INTERVAL - blocksInCurrentInterval;

    const isDangerZone =
      effectiveHunger < DANGER_THRESHOLD ||
      effectiveHappiness < DANGER_THRESHOLD ||
      effectiveEnergy < DANGER_THRESHOLD;

    return {
      ...raw,
      effectiveHunger,
      effectiveHappiness,
      effectiveEnergy,
      blocksUntilNextDecay,
      isDangerZone,
    };
  }
}
