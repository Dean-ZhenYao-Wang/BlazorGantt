export class WorkUnitsObjectCache{
	private _cache: any;
	constructor() {
		this.clear();
	}

	getItem(unit: string, timestamp: string, value: Date): number|boolean {
		const cache = this._cache;
		if (cache && cache[unit]) {
			const units = cache[unit];
			if(units === undefined){
				return -1;
			}
			const subCache = units[value.getFullYear()];
			if (subCache && subCache[timestamp] !== undefined) {
				return subCache[timestamp];
			}
		}

		return -1;
	}
	setItem(unit: string, timestamp: string, value: boolean, rawValue: Date): void {
		if (!unit || !timestamp) {
			return;
		}

		const cache = this._cache;

		if (!cache) {
			return;
		}
		if (!cache[unit]) {
			cache[unit] = [];
		}
		const unitCache = cache[unit];

		const year = rawValue.getFullYear();
		let yearCache = unitCache[year];
		if(!yearCache){
			yearCache = unitCache[year] = {};
		}
		yearCache[timestamp] = value;
	}
	clear(): void{
		this._cache = {};
	}
}