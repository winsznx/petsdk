# StxPet SDK

The official TypeScript SDK for interacting with the StxPet smart contract on the Stacks blockchain.

## Installation

```bash
npm install @winsznx/petsdk
```

## Usage

```typescript
import { StxPetClient } from '@winsznx/petsdk';

const client = new StxPetClient({
  contractAddress: 'SP...',
  contractName: 'stx-pet-v1',
  network: 'mainnet'
});

// Fetch pet state
const state = await client.getLiveState();
console.log('Pet Hunger:', state.effectiveHunger);

// Submit an action
const txid = await client.submitAction('feed', 'YOUR_PRIVATE_KEY');
console.log('Transaction submitted:', txid);
```

## License

MIT
