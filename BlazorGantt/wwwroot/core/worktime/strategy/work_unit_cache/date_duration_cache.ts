export class DateDurationCache  {
	private _cache: any;
	constructor() {
		this.clear();
	}

	_getCacheObject(startDate: Date, unit: string, step:number){
		const cache = this._cache;
		if (!cache[unit]) {
			cache[unit] = [];
		}
		let unitCache = cache[unit];
		if(!unitCache) {
			unitCache = cache[unit] = {};
		}

		let stepCache = unitCache[step];
		if(!stepCache) {
			stepCache = unitCache[step] = {};
		}

		const year = startDate.getFullYear();
		let yearCache = stepCache[year];
		if(!yearCache){
			yearCache = stepCache[year] = {durations: {}, endDates: {}};
		}

		return yearCache;
	}
	_endDateCacheKey(startDate: number, duration: number){
		return String(startDate) + "-" + String(duration);
	}
	_durationCacheKey(startDate: number, endDate: number){
		return String(startDate) + "-" + String(endDate);
	}
	getEndDate(startDate: Date, duration: number, unit: string, step: number, compute: () => Date): number|null{
		const cache = this._getCacheObject(startDate, unit, step);

		const startDateTimestamp = startDate.valueOf();
		const key = this._endDateCacheKey(startDateTimestamp, duration);
		let endDate;
		if(cache.endDates[key] === undefined){
			const result = compute();
			const resultTimestamp = result.valueOf();
			cache.endDates[key] = resultTimestamp;
			cache.durations[this._durationCacheKey(startDateTimestamp, resultTimestamp)] = duration;
			endDate = result;
		}else{
			endDate = new Date(cache.endDates[key]);
		}

		return endDate;
	}

	getDuration(startDate: Date, endDate: Date, unit: string, step: number, compute: () => number): number|null{
		const cache = this._getCacheObject(startDate, unit, step);

		const startDateTimestamp = startDate.valueOf();
		const endDateTimestamp = endDate.valueOf();
		const key = this._durationCacheKey(startDateTimestamp, endDateTimestamp);
		let duration;
		if(cache.durations[key] === undefined){
			const result = compute();
			cache.durations[key] = result.valueOf();

			// can't populate end date due to logic of end date calculation, current unit tests capture it
			// cache.endDates[this._endDateCacheKey(startDateTimestamp, result)] = endDateTimestamp;
			duration = result;
		}else{
			duration = cache.durations[key];
		}

		return duration;
	}

	clear(): void{
		this._cache = {};
	}
}