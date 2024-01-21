export default class DurationFormatterNumeric {
	static create = (settings: any = null) => {
		return new DurationFormatterNumeric();
	}
	canParse = (value: string) : boolean => {
		return !isNaN(this.parse(value));
	}
	format = (value: number) : string => {
		return String(value);
	}
	parse = (value: string) : number => {
		return parseInt(value, 10);
	}
}