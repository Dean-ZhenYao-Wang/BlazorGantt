export default class LocaleManager{
	private _locales: { [key: string]: any };

	constructor(config: {[key:string]:any }){
		this._locales = {};
		for(const i in config){
			this._locales[i] = config[i];
		}
	}

	addLocale = (name: string, locale) => {
		this._locales[name] = locale;
	}

	getLocale = (name: string) => {
		return this._locales[name];
	}
}