import * as eventable from "../../utils/eventable";
import { isEventable } from "../../utils/helpers";

export interface ISelectedRegionConfig {
	className?: string;
	render?: (startPoint: IPoint, endPoint: IPoint) => HTMLElement;
	viewPort?: HTMLElement;
	useRequestAnimationFrame: boolean;
	callback?: (startPoint: IPoint, endPoint: IPoint, startDate: Date, endDate: Date, tasksByDate: any[], tasksByIndex: any[]) => void;
	singleRow: boolean;
}

interface ICoordinates {
	left: number;
	top: number;
}

export interface IPoint {
	absolute: ICoordinates;
	relative: ICoordinates;
}

export class SelectedRegion {
	render: () => void;
	private _viewPort: HTMLElement & eventable;
	private _el: HTMLElement = document.createElement("div");
	private _callback: (startPoint: IPoint, endPoint: IPoint, startDate: Date, endDate: Date, tasksByDate: any[], tasksByIndex: any[]) => void;
	private _startPoint: IPoint;
	private _endPoint: IPoint;
	private _positionPoint: IPoint;
	private _useRequestAnimationFrame: boolean;
	private _startDate: Date;
	private _endDate: Date;
	private _singleRow: boolean;
	private _gantt: any;
	private _view: any;

	constructor(config: ISelectedRegionConfig, gantt: any, view: any) {
		this._gantt = gantt;
		this._view = view;
		this._viewPort = config.viewPort;
		this._el.classList.add(config.className);
		if (typeof config.callback === "function") {
			this._callback = config.callback;
		}

		this.render = () => {
			let node;
			if(config.render){
				node = config.render(this._startPoint, this._endPoint);
			}else{
				node = this.defaultRender(this._startPoint, this._endPoint);
			}

			if(node !== this._el){
				if(this._el && this._el.parentNode){
					this._el.parentNode.removeChild(this._el);
				}
				this._el = node;
			}

			if (config.className !== "") {
				this._el.classList.add(config.className);
			}
			this.draw();
		};

		if (!isEventable(this._viewPort)) {
			eventable(this._viewPort);
		}
		this._singleRow = config.singleRow;
		this._useRequestAnimationFrame = config.useRequestAnimationFrame;
	}

	defaultRender = (start: IPoint, end: IPoint) => {
		if(!this._el){
			this._el = document.createElement("div");
		}
		const node = this._el;
		// const gantt = this._gantt;

		const top = Math.min(start.relative.top, end.relative.top);
		const bottom = Math.max(start.relative.top, end.relative.top);
		const left = Math.min(start.relative.left, end.relative.left);
		const right = Math.max(start.relative.left, end.relative.left);

		if (this._singleRow) {
			const pos = this._getTaskPositionByTop(this._startPoint.relative.top);
			node.style.height = pos.height + "px";
			node.style.top = pos.top + "px";
		} else {
			node.style.height = Math.abs(bottom - top) + "px";
			node.style.top = top + "px";
		}
		node.style.width = Math.abs(right - left) + "px";
		node.style.left = left + "px";
		return node;
	}

	draw() {
		if (this._useRequestAnimationFrame) {
			return requestAnimationFrame(() => {
				this._viewPort.appendChild(this.getElement());
			});
		} else {
			this._viewPort.appendChild(this.getElement());
		}
	}

	clear() {
		if (this._useRequestAnimationFrame) {
			return requestAnimationFrame(() => {
				if (!this._el.parentNode) {
					return;
				}
				this._viewPort.removeChild(this._el);
			});
		} else {
			if (!this._el.parentNode) {
				return;
			}
			this._viewPort.removeChild(this._el);
		}
	}

	getElement() {
		return this._el;
	}

	getViewPort() {
		return this._viewPort;
	}

	setStart(startPoint: IPoint) {
		const gantt = this._gantt;
		this._startPoint = startPoint;
		this._startDate = gantt.dateFromPos(this._startPoint.relative.left);
		this._viewPort.callEvent("onBeforeDrag", [this._startPoint]);
	}

	setEnd(endPoint: IPoint) {
		const gantt = this._gantt;
		this._endPoint = endPoint;
		if (this._singleRow) {
			const pos = this._getTaskPositionByTop(this._startPoint.relative.top);
			this._endPoint.relative.top = pos.top;
		}
		this._endDate = gantt.dateFromPos(this._endPoint.relative.left);
		if (this._startPoint.relative.left > this._endPoint.relative.left) {
			this._positionPoint = {
				relative: { left: this._endPoint.relative.left, top: this._positionPoint.relative.top },
				absolute: { left: this._endPoint.absolute.left, top: this._positionPoint.absolute.top }
			};
		}
		if (this._startPoint.relative.top > this._endPoint.relative.top) {
			this._positionPoint = {
				relative: { left: this._positionPoint.relative.left, top: this._endPoint.relative.top },
				absolute: { left: this._positionPoint.absolute.left, top: this._endPoint.absolute.top }
			};
		}


		this._viewPort.callEvent("onDrag", [this._startPoint, this._endPoint]);
	}

	setPosition(positionPoint: IPoint) {
		this._positionPoint = positionPoint;
	}

	dragEnd(endPoint: IPoint) {
		const gantt = this._gantt;
		if(endPoint.relative.left < 0){
			endPoint.relative.left = 0;
		}
		this._viewPort.callEvent("onBeforeDragEnd", [this._startPoint, endPoint]);
		this.setEnd(endPoint);
		// GS-1422. The endDate can be null if we drag the mouse outside the Gantt container
		this._endDate = this._endDate || gantt.getState().max_date;

		if (this._startDate.valueOf() > this._endDate.valueOf()) {
			[ this._startDate, this._endDate ] = [ this._endDate, this._startDate ];
		}
		this.clear();
		const tasksByTime = gantt.getTaskByTime(this._startDate, this._endDate);
		const tasksByIndex = this._getTasksByTop(this._startPoint.relative.top, this._endPoint.relative.top);

		this._viewPort.callEvent("onDragEnd", [this._startPoint, this._endPoint]);
		if (this._callback) {
			this._callback(this._startPoint, this._endPoint, this._startDate, this._endDate, tasksByTime, tasksByIndex);
		}
	}

	getInBounds() {
		return this._singleRow;
	}

	private _getTasksByTop(start: number, end:number) {
		const gantt = this._gantt;
		let startValue = start;
		let endValue = end;
		if (start > end) {
			startValue = end;
			endValue = start;
		}
		const startIndex = this._getTaskPositionByTop(startValue).index;
		const endIndex = this._getTaskPositionByTop(endValue).index;
		const result = [];
		for (let i = startIndex; i <= endIndex; i++) {
			const task = gantt.getTaskByIndex(i);
			if (task) {
				result.push(gantt.getTaskByIndex(i));
			}
		}
		return result;
	}

	private _getTaskPositionByTop(top: number){
		const gantt = this._gantt;
		const view = this._view;
		const index = view.getItemIndexByTopPosition(top);
		const task = gantt.getTaskByIndex(index);
		if(task){
			const height = view.getItemHeight(task.id);
			const itemTop = view.getItemTop(task.id);
			return {
				top: itemTop || 0,
				height: height || 0,
				index,
			};
		} else {
			const dataHeight = view.getTotalHeight();
			return {
				top: top > dataHeight ? dataHeight : 0,
				height: gantt.config.row_height,
				index: top > dataHeight ? gantt.getTaskCount() : 0,
			};
		}
	}
}