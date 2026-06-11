import { createSeededRandom } from 'octavian';
import type { RandomInt } from '../../round.ts';

export type { RandomInt };

function stringToSeed(seed: string): number {
	let hash = 0x811c9dc5;
	for (let index = 0; index < seed.length; index++) {
		hash ^= seed.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

export function seededRandomInt(seed: string): RandomInt {
	const random = createSeededRandom(stringToSeed(seed));
	return (count) => {
		if (count <= 0) return 0;
		return Math.min(Math.floor(random() * count), count - 1);
	};
}
