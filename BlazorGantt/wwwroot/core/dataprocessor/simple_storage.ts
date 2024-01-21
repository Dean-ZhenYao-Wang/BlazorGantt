import * as utils from "../../utils/utils";

export default class SimpleStorage {
	public static create = () : SimpleStorage => {
		return new SimpleStorage();
	}

	protected _storage: { [id: string]: any; };

	protected constructor() {
		this._storage = {};
	}

	public clear = (): void => {
		this._storage = {};
	}

	public storeItem = (item: any): void => {
		this._storage[item.id] = utils.copy(item);
	}

	public getStoredItem = (id: string): any => {
		return this._storage[id] || null;
	}
}