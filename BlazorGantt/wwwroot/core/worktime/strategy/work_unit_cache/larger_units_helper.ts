

export class LargerUnitsCache {
	private _weekCache: Map<number, number>;
	private _monthCache: Map<number, number>;
	private _calendar: any;
	constructor(calendar) {
		this.clear();
		this._calendar = calendar;
	}

	getMinutesPerWeek = (weekStart: Date) => {
		const key = weekStart.valueOf();

		if(this._weekCache.has(key)){
			return this._weekCache.get(key);
		}

		const calendar = this._calendar;
		const gantt = this._calendar.$gantt;

		let minutesPerWeek = 0;
		let start = gantt.date.week_start(new Date(weekStart));
		for(let i = 0; i < 7; i++){
			minutesPerWeek += calendar.getHoursPerDay(start) * 60;
			start = gantt.date.add(start, 1, "day");
		}

		this._weekCache.set(key, minutesPerWeek);
		return minutesPerWeek;
	}

	getMinutesPerMonth = (monthStart: Date) => {
		const key = monthStart.valueOf();

		if(this._monthCache.has(key)){
			return this._monthCache.get(key);
		}

		const calendar = this._calendar;
		const gantt = this._calendar.$gantt;

		let minutesPerMonth = 0;
		let start = gantt.date.week_start(new Date(monthStart));
		const nextMonth = gantt.date.add(start, 1, "month").valueOf();
		while(start.valueOf() < nextMonth){
			minutesPerMonth += calendar.getHoursPerDay(start) * 60;
			start = gantt.date.add(start, 1, "day");
		}

		this._monthCache.set(key, minutesPerMonth);
		return minutesPerMonth;
	}

	clear = (): void => {
		this._weekCache = new Map<number, number>();
		this._monthCache = new Map<number, number>();
	}
}