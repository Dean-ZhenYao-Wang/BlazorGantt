import * as domHelpers from "../../core/ui/utils/dom_helpers";
import { SelectedRegion } from "./selectedRegion";

export class EventsManager {
	private _mouseDown: boolean = false;
	private _domEvents: any;
	private _originPosition: string;
	private _gantt: any;
	private _restoreOriginPosition: () => void;
	constructor(gantt: any) {
		this._gantt = gantt;
		this._domEvents = gantt._createDomEventScope();
	}

	attach(selectedRegion: SelectedRegion, useKey?: "shiftKey" | "ctrlKey" | "altKey", ignore?: any): void {
		const gantt = this._gantt;
		const _target = selectedRegion.getViewPort();
		this._originPosition = window.getComputedStyle(_target).display;
		this._restoreOriginPosition = () => {
			_target.style.position = this._originPosition;
		};
		if (this._originPosition === "static") {
			_target.style.position = "relative";
		}
		const state = gantt.$services.getService("state");
		state.registerProvider("clickDrag", () => {
			const result = { autoscroll: false };
			return result;
		});


		let scheduledDndCoordinates = null;
		const startDragAndDrop = () => {
			if (!scheduledDndCoordinates) {
				return;
			}

			this._mouseDown = true;
			selectedRegion.setStart(gantt.copy(scheduledDndCoordinates));
			selectedRegion.setPosition(gantt.copy(scheduledDndCoordinates));
			selectedRegion.setEnd(gantt.copy(scheduledDndCoordinates));
			scheduledDndCoordinates = null;
		};

		this._domEvents.attach(_target, "mousedown", (event) => {
			scheduledDndCoordinates = null;
			let filterTargets = ".gantt_task_line, .gantt_task_link";
			if (ignore !== undefined) {
				if (ignore instanceof Array) {
					filterTargets = ignore.join(", ");
				} else {
					filterTargets = ignore;
				}
			}
			if (filterTargets) {
				if (gantt.utils.dom.closest(event.target, filterTargets)) {
					return;
				}
			}
			state.registerProvider("clickDrag", () => {
				const result = { autoscroll: this._mouseDown };
				return result;
			});

			if (useKey && event[useKey] !== true) { return; }
			scheduledDndCoordinates = this._getCoordinates(event, selectedRegion);
		});
		const eventElement = domHelpers.getRootNode(gantt.$root) || document.body;
		this._domEvents.attach(eventElement, "mouseup", (event) => {
			scheduledDndCoordinates = null;
			if (useKey && event[useKey] !== true) { return; }
			if (this._mouseDown === true) {
				this._mouseDown = false;
				const coordinates = this._getCoordinates(event, selectedRegion);
				selectedRegion.dragEnd(coordinates);
			}
		});
		this._domEvents.attach(_target, "mousemove", (event) => {
			if (useKey && event[useKey] !== true) { return; }
			// GS-854. If we don't have useKey for the click_drag extension,
			// check the drag_timeline to not simultaneously use both extensions
			const dragTimeline = this._gantt.ext.clickDrag;
			const dragTimelineUseKey = (this._gantt.config.drag_timeline || {}).useKey;
			if (dragTimeline && dragTimelineUseKey) {
				if (!useKey && event[dragTimelineUseKey]) {
					return;
				}
			}
			let coordinates = null;
			if(!this._mouseDown && scheduledDndCoordinates){
				coordinates = this._getCoordinates(event, selectedRegion);
				if(Math.abs(scheduledDndCoordinates.relative.left - coordinates.relative.left) > 5){
					// add small threshold not to start dnd on simple click
					startDragAndDrop();
				}
				return;
			}
			if (this._mouseDown === true) {
				coordinates = this._getCoordinates(event, selectedRegion);
				selectedRegion.setEnd(coordinates);
				selectedRegion.render();
			}
		});
	}

	detach(): void {
		const gantt = this._gantt;
		this._domEvents.detachAll();
		if(this._restoreOriginPosition){
			this._restoreOriginPosition();
		}

		const state = gantt.$services.getService("state");
		state.unregisterProvider("clickDrag");
	}

	destructor(): void {
		this.detach();
	}

	private _getCoordinates(event: MouseEvent, selectedRegion: SelectedRegion) {
		const viewPort = selectedRegion.getViewPort();
		const viewPortBounds = viewPort.getBoundingClientRect();
		const { clientX, clientY } = event;
		const result = {
			absolute: {
				left: clientX,
				top: clientY,
			},
			relative: {
				left: clientX - viewPortBounds.left + viewPort.scrollLeft,
				top: clientY - viewPortBounds.top + viewPort.scrollTop
			}
		};
		return result;
	}
}