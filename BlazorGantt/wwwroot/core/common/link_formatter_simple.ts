export default class LinkFormatterSimple {
	static create = (settings: any = null, gantt: any): LinkFormatterSimple => {
		return new LinkFormatterSimple(gantt);
	}
	protected _linkReg: RegExp;
	protected _gantt: any;

	constructor(gantt: any) {
		this._linkReg = /^[0-9\.]+/;
		this._gantt = gantt;
	}

	format = (link: any) : string => {
		const wbs = this._getWBSCode(link.source);
		return wbs;
	}

	canParse = (value: string) : boolean => {
		return this._linkReg.test(value);
	}
	parse = (value: string) : any => {
		if(!this.canParse(value)){
			return null;
		}

		const linkPart = this._linkReg.exec(value)[0].trim();

		const source = this._findSource(linkPart) || null;

		return {
			id: undefined,
			source,
			target: null,
			type: this._gantt.config.links.finish_to_start,
			lag: 0
		};
	}

	protected _getWBSCode = (source: number | string) => {
		const pred = this._gantt.getTask(source);
		return this._gantt.getWBSCode(pred);
	}

	protected _findSource = (value: string) => {
		const reqTemplate = new RegExp("^[0-9\.]+", "i");
		if(reqTemplate.exec(value)){
			const wbs = reqTemplate.exec(value)[0];
			const task = this._gantt.getTaskByWBSCode(wbs);
			if(task){
				return task.id;
			}
		}
		return null;
	}
}