export default class ExtensionsManager{
	private _extensions: { [key: string]: any };

	constructor(config: { [key: string]: any }){
		this._extensions = {};
		for(const i in config){
			this._extensions[i] = config[i];
		}
	}

	addExtension = (name: string, ext: any) => {
		this._extensions[name] = ext;
	}

	getExtension = (name: string): any => {
		return this._extensions[name];
	}
}