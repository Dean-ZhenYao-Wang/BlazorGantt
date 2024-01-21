export class WorkUnitsMapCache {
	private _cache: Map<string, Array<Map<string, boolean>>>;
	constructor() {
		this.clear();
	}

	getItem(unit: string, timestamp: string, value: Date): number|boolean {
		if (this._cache.has(unit)) {
			const unitCache = this._cache.get(unit);

			const subCache = unitCache[value.getFullYear()];
			if (subCache && subCache.has(timestamp)) {
				return subCache.get(timestamp);
			}
		}

		return -1;
	}
	setItem(unit: string, timestamp: string, value: boolean, rawValue: Date): void {
		if (!unit || !timestamp) {
			return;
		}

		const cache = this._cache;
		const year = rawValue.getFullYear();

		let unitCache;
		if (!cache.has(unit)) {
			unitCache = [];
			cache.set(unit, unitCache);
		} else {
			unitCache = cache.get(unit);
		}

		let yearCache = unitCache[year];
		if(!yearCache){
			yearCache = unitCache[year] = new Map<string, boolean>();
		}


		yearCache.set(timestamp, value);
	}
	clear(): void{
		this._cache = new Map<string, Array<Map<string, boolean>>>();
	}
}