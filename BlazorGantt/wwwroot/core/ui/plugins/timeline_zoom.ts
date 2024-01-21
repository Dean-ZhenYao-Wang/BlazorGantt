import * as env from "../../../utils/env";
import * as eventable from "../../../utils/eventable";
import { IScale, TModifierKeys } from "../../common/config";

interface ITimelineZoomConfig {
	handler?: (e: Event) => {};
	startDate?: Date;
	endDate?: Date;
	levels: IZoomLevel[];
	activeLevelIndex?: number;
	widthStep?: number;
	minColumnWidth?: number;
	maxColumnWidth?: number;
	useKey?: "ctrlKey" | "altKey" | "shiftKey";
	trigger?: "wheel" | null | undefined;
	element?: Element | (() => Element);
}

const USE_KEY = ["ctrlKey", "altKey", "shiftKey", "metaKey"];

interface IZoomLevel {
	name?: string;
	scale_height?: number;
	min_column_width: number;
	scales: IScale[];
}

const _defaultScales = [
	[
		{
			unit: "month",
			date: "%M",
			step: 1
		},
		{
			unit: "day",
			date: "%d",
			step: 1
		}
	],
	[
		{
			unit: "day",
			date: "%d %M",
			step: 1
		}
	],
	[
		{
			unit: "day",
			date: "%d %M",
			step: 1
		},
		{
			unit: "hour",
			date: "%H:00",
			step: 8
		},
	],
	[
		{
			unit: "day",
			date: "%d %M",
			step: 1
		},
		{
			unit: "hour",
			date: "%H:00",
			step: 1
		},
	],
];

export default class TimelineZoom {
	public attachEvent: (eventName: string, handler: () => void) => string;
	public callEvent: (eventName: string, args: any[]) => any;
	public detachEvent: (eventName: string) => any;
	protected _initialStartDate: Date;
	protected _initialEndDate: Date;
	protected _activeLevelIndex: number;
	protected _levels: IZoomLevel[];
	protected _handler: (e: any) => void;
	protected $gantt;
	protected _widthStep: number;
	protected _minColumnWidth: number;
	protected _maxColumnWidth: number;
	protected _useKey: TModifierKeys;
	protected _visibleDate: Date;
	protected _initialized: boolean;
	protected _domEvents: any;

	constructor(gantt) {
		this.$gantt = gantt;
		this._domEvents = this.$gantt._createDomEventScope();
	}

	public init(config: ITimelineZoomConfig) {
		// GS-1354 and GS-1318. If we check the headless mode using the function,
		// it will return false when Gantt is not initialized, but we may want to do it later
		if(this.$gantt.env.isNode){
			return;
		}
		this._initialStartDate = config.startDate;
		this._initialEndDate = config.endDate;
		this._activeLevelIndex = config.activeLevelIndex ? config.activeLevelIndex : 0;
		this._levels = this._mapScales(config.levels || _defaultScales);
		this._handler = config.handler || this._defaultHandler;
		this._minColumnWidth = config.minColumnWidth || 60;
		this._maxColumnWidth = config.maxColumnWidth || 240;
		this._widthStep = config.widthStep || 3/8 * config.minColumnWidth;
		this._useKey = config.useKey;

		if(!this._initialized){
			eventable(this);
			this.$gantt.attachEvent("onGanttScroll", () => {
				this._getVisibleDate();
			});
		}

		this._domEvents.detachAll();

		if(config.trigger === "wheel"){
			if(this.$gantt.$root){
				this._attachWheelEvent(config);
			}else{
				this.$gantt.attachEvent("onGanttReady", () => {
					this._attachWheelEvent(config);
				});
			}
		}

		this._initialized = true;
		this.setLevel(this._activeLevelIndex);
	}

	public zoomIn = () => {
		const index = this.getCurrentLevel() - 1;
		if(index < 0){
			return;
		}
		this.setLevel(index);
	}

	public zoomOut = () => {
		const index = this.getCurrentLevel() + 1;
		if(index > this._levels.length - 1){
			return;
		}
		this.setLevel(index);
	}

	public getCurrentLevel = () => {
		return this._activeLevelIndex;
	}

	public getLevels = () => {
		return this._levels;
	}

	public setLevel = (level: number|string) => {
		const zoomLevel = this._getZoomIndexByName(level);

		if(zoomLevel === -1){
			this.$gantt.assert(zoomLevel !== -1, "Invalid zoom level for gantt.ext.zoom.setLevel. " + level + " is not an expected value.");
		}
		this._setLevel(zoomLevel, 0);
	}

	protected _getZoomIndexByName = (levelName: number|string) => {
		let zoomLevel:number = -1;
		if(typeof levelName === "string"){
			if(!isNaN(Number(levelName)) &&  this._levels[Number(levelName)]){
				zoomLevel = Number(levelName);
			}else{
				for(let i = 0; i < this._levels.length; i++){
					if(this._levels[i].name === levelName){
						zoomLevel = i;
						break;
					}
				}
			}
		}else{
			zoomLevel = levelName;
		}
		return zoomLevel;
	}

	protected _mapScales(levels: IScale[][] | any): IZoomLevel[]{
		return levels.map((l) => {
			if(Array.isArray(l)){
				return {
					scales: l
				};
			}else{
				return l;
			}
		});
	}

	protected _getVisibleDate = () => {
		// GS-1450. Don't try to get the visible date if there is no timeline
		if (!this.$gantt.$task){
			return null;
		}
		const scrollPos = this.$gantt.getScrollState().x;
		const viewPort = this.$gantt.$task.offsetWidth;
		this._visibleDate = this.$gantt.dateFromPos(scrollPos + viewPort/2);
	}

	protected _setLevel = (level: number, cursorOffset: number) => {
		this._activeLevelIndex = level;

		const gantt = this.$gantt;
		const nextConfig = gantt.copy(this._levels[this._activeLevelIndex]);
		const chartConfig = gantt.copy(nextConfig);
		delete chartConfig.name;

		gantt.mixin(gantt.config, chartConfig, true);

		const isRendered = !!gantt.$root && !!gantt.$task;

		if(isRendered){
			if(cursorOffset){
				const cursorDate = this.$gantt.dateFromPos(cursorOffset + this.$gantt.getScrollState().x);
				this.$gantt.render();
				const newPosition = this.$gantt.posFromDate(cursorDate);
				this.$gantt.scrollTo(newPosition - cursorOffset);
			}else{
				const viewPort = this.$gantt.$task.offsetWidth;
				if(!this._visibleDate){
					this._getVisibleDate();
				}
				const middleDate = this._visibleDate;
				this.$gantt.render();
				const newPosition = this.$gantt.posFromDate(middleDate);
				this.$gantt.scrollTo(newPosition - viewPort/2);
			}

			this.callEvent("onAfterZoom", [this._activeLevelIndex, nextConfig]);
		}
	}

	private _attachWheelEvent = (config) => {
		const event = env.isFF ? "wheel" : "mousewheel";
		let el: Element;
		if(typeof config.element === "function"){
			el = config.element();
		}else{
			el = config.element as Element;
		}
		if (!el){
			return;
		}

		this._domEvents.attach(el, event, this.$gantt.bind(function(e) {
			if (this._useKey) {
				if (USE_KEY.indexOf(this._useKey) < 0) {
					return false;
				}
				if (!e[this._useKey]) {
					return false;
				}
			}
			if (typeof this._handler === "function") {
				this._handler.apply(this, [e]);
				return true;
			}
		}, this), {passive: false});
	}

	private _defaultHandler = (e: any):void => {
		const timelineOffset = this.$gantt.$task.getBoundingClientRect().x;
		const cursorOffset = e.clientX - timelineOffset;
		const wheelY = this.$gantt.env.isFF ? (e.deltaY*-40) : e.wheelDelta;
		let wheelUp = false;
		if (wheelY > 0) {
			wheelUp = true;
		}
		e.preventDefault();
		e.stopPropagation();
		this._setScaleSettings(wheelUp, cursorOffset);
	}

	private _setScaleSettings(wheelUp: boolean, cursorOffset: number) {
		if (wheelUp) {
			this._stepUp(cursorOffset);
		} else {
			this._stepDown(cursorOffset);
		}
	}

	private _setScaleDates = () => {
		if(this._initialStartDate && this._initialEndDate){
			this.$gantt.config.start_date = this._initialStartDate;
			this.$gantt.config.end_date = this._initialEndDate;
		}
	}

	private _stepUp(cursorOffset) {
		if (this._activeLevelIndex >= this._levels.length - 1) {
			return;
		}

		let nextLevel = this._activeLevelIndex;
		this._setScaleDates();

		if(this._widthStep){
			let newColumnWidth = this.$gantt.config.min_column_width + this._widthStep;
			if (newColumnWidth > this._maxColumnWidth) {
				newColumnWidth = this._minColumnWidth;
				nextLevel++;
			}

			this.$gantt.config.min_column_width = newColumnWidth;
		}else{
			nextLevel++;
		}
		this._setLevel(nextLevel, cursorOffset);
	}
	private _stepDown(cursorOffset) {
		if (this._activeLevelIndex < 1) {
			return;
		}

		let nextLevel = this._activeLevelIndex;
		this._setScaleDates();

		if(this._widthStep){
			let newColumnWidth = this.$gantt.config.min_column_width - this._widthStep;
			if (newColumnWidth < this._minColumnWidth) {
				newColumnWidth = this._maxColumnWidth;
				nextLevel--;
			}
			this.$gantt.config.min_column_width = newColumnWidth;
		}else{
			nextLevel--;
		}
		this._setLevel(nextLevel, cursorOffset);
	}
}