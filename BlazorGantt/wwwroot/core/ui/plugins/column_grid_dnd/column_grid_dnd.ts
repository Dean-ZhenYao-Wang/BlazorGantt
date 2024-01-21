import * as domHelpers from "../../utils/dom_helpers";
import ScrollableGrid from "./scrollable_grid";

const COLUMN_ID_ATTR_NAME = "data-column-id";

export class ColumnsGridDnd {
	private $gantt;
	private $grid;
	private _dragX;
	private _dnd;
	private _originAutoscroll;
	private _scrollableGrid: ScrollableGrid;
	private _draggedCell;
	private _targetMarker = null;
	private _gridConfig;
	constructor(gantt, grid) {
		this.$gantt = gantt;
		this.$grid = grid;
	}
	init() {
		const DND = this.$gantt.$services.getService("dnd");
		this._dnd = new DND(this.$grid.$grid_scale, { updates_per_second: 60 });
		this._scrollableGrid = new ScrollableGrid({
			gantt: this.$gantt,
			grid: this.$grid,
			dnd: this._dnd,
			getCurrentX: this.calculateCurrentPosition
		});
		this.attachEvents();
	}
	attachEvents() {
		this._dnd.attachEvent("onBeforeDragStart", (obj, e) => {
			this._draggedCell = this.$gantt.utils.dom.closest(e.target, ".gantt_grid_head_cell");
			if(!this._draggedCell){
				return;
			}

			const columns = this.$grid.$getConfig().columns;
			const columnName = this._draggedCell.getAttribute(COLUMN_ID_ATTR_NAME);
			let draggedColumn;
			let draggedIndex;
			columns.map(function(column, index){
				if(column.name === columnName){
					draggedColumn = column;
					draggedIndex = index;
				}
			});

			if (this.$grid.callEvent("onBeforeColumnDragStart", [{ draggedColumn, draggedIndex}]) === false) {
				return false;
			}

			if (!this._draggedCell || !draggedColumn) {
				return false;
			}

			this._gridConfig = this.$grid.$getConfig();
			this._originAutoscroll = this.$gantt.config.autoscroll;
			this.$gantt.config.autoscroll = false;
			return true;
		});

		this._dnd.attachEvent("onAfterDragStart", (obj, e) => {
			if (!this._draggedCell) {
				return; // GS-1333: don't try to reorder a column when we resize it
			}
			this._dnd.config.column = this._draggedCell.getAttribute(COLUMN_ID_ATTR_NAME);
			this._dnd.config.marker.innerHTML = this._draggedCell.outerHTML;
			this._dnd.config.marker.classList.add("gantt_column_drag_marker");
			this._dnd.config.marker.style.height = this._gridConfig.scale_height + "px";
			this._dnd.config.marker.style.lineHeight = this._gridConfig.scale_height + "px";
			this._draggedCell.classList.add("gantt_grid_head_cell_dragged");
		});

		this._dnd.attachEvent("onDragMove", (obj, e) => {
			if(!this._draggedCell){
				return;
			}

			this._dragX = e.clientX;
			const x = this.calculateCurrentPosition(e.clientX);
			const columnIndexes = this.findColumnsIndexes();
			const targetIndex = columnIndexes.targetIndex;
			const draggedIndex = columnIndexes.draggedIndex;
			const columns = this.$grid.$getConfig().columns;

			const draggedColumn = columns[draggedIndex];
			const targetColumn = columns[targetIndex];
			if (this.$grid.callEvent("onColumnDragMove", [{ draggedColumn, targetColumn, draggedIndex, targetIndex }]) === false) {
				this.cleanTargetMarker();
				return false;
			}
			this.setMarkerPosition(x);
			this.drawTargetMarker(columnIndexes);
			return true;
		});

		this._dnd.attachEvent("onDragEnd", () => {
			if (!this._draggedCell) {
				return;
			}
			this.$gantt.config.autoscroll = this._originAutoscroll;
			this._draggedCell.classList.remove("gantt_grid_head_cell_dragged");
			this.cleanTargetMarker();
			this.reorderColumns();
		});

	}
	reorderColumns() {
		const { targetIndex, draggedIndex } = this.findColumnsIndexes();

		const columns = this.$grid.$getConfig().columns;
		const draggedColumn = columns[draggedIndex];
		const targetColumn = columns[targetIndex];

		if (this.$grid.callEvent("onBeforeColumnReorder", [{ draggedColumn, targetColumn, draggedIndex, targetIndex }]) === false) {
			return;
		}
		if (targetIndex === draggedIndex) {
			return;
		}
		columns.splice(draggedIndex, 1);
		columns.splice(targetIndex, 0, draggedColumn);
		this.$gantt.render();
		this.$grid.callEvent("onAfterColumnReorder", [{ draggedColumn, targetColumn, draggedIndex, targetIndex }]);
	}
	findColumnsIndexes() {
		const draggedId = this._dnd.config.column;
		const columns = this.$grid.$getConfig().columns;
		let targetIndex: number;
		let draggedIndex: number;
		let xBefore: number;
		let xAfter: number;
		const currentColumn = { startX: 0, endX: 0 };

		let start = 0;
		let end = columns.length - 1;
		let compare = (a, b) => a <= b;
		let next = (index) => ++index;
		if (this.$gantt.config.rtl) {
			start = columns.length - 1;
			end = 0;
			compare = (a, b) => a >= b;
			next = (index) => --index;
		}

		let columnRelativePos: number;

		const relativeX = this._dragX - this.$grid.$grid.getBoundingClientRect().left + this._scrollableGrid.getCorrection();
		for (let i = start; compare(i, end); i = next(i)) {
			if (targetIndex !== undefined && draggedIndex !== undefined) {
				break;
			}
			if(!columns[i].hide) {
				currentColumn.startX = currentColumn.endX;
				currentColumn.endX += columns[i].width;

				// if drop on a column or drop after the last column
				if (relativeX >= currentColumn.startX && (relativeX <= currentColumn.endX || !compare(next(i), end))) {
					targetIndex = i;
					xBefore = currentColumn.startX;
					xAfter = currentColumn.endX;
					columnRelativePos = (relativeX - currentColumn.startX) / (currentColumn.endX - currentColumn.startX);
				}
				if (draggedId === columns[i].name) {
					draggedIndex = i;
				}
			}
		}

		return {
			targetIndex,
			draggedIndex,
			xBefore,
			xAfter,
			columnRelativePos
		};
	}
	setMarkerPosition(x: number, y: number = 10) {
		const { marker } = this._dnd.config;
		const gridOffset = this._dnd._obj.getBoundingClientRect();
		marker.style.top = `${gridOffset.y + y}px`;
		marker.style.left = `${x}px`;
	}
	calculateCurrentPosition = (eventX: number) => {
		const gridBoundingRect = this.$grid.$grid.getBoundingClientRect();
		const maxLeft = gridBoundingRect.right;
		const minLeft = gridBoundingRect.left;
		let x = eventX;
		if (x > maxLeft) {
			x = maxLeft;
		}
		if (x < minLeft) {
			x = minLeft;
		}
		return x;
	}
	drawTargetMarker({ targetIndex, draggedIndex, xBefore, xAfter, columnRelativePos }) {
		if (!this._targetMarker) {
			this._targetMarker = document.createElement("div");
			domHelpers.addClassName(this._targetMarker, "gantt_grid_target_marker");
			this._targetMarker.style.display = "none";
			this._targetMarker.style.height = `${this._gridConfig.scale_height}px`;
		}

		// marker can be detached after gantt.render
		if(!this._targetMarker.parentNode){
			this.$grid.$grid_scale.appendChild(this._targetMarker);
		}

		let nextPosition: number;
		if (targetIndex > draggedIndex) {
			nextPosition = xAfter;
		} else if (targetIndex < draggedIndex) {
			nextPosition = xBefore;
		} else {
			if(columnRelativePos > 0.5){
				nextPosition = xAfter;
			}else{
				nextPosition = xBefore;
			}
		}

		this._targetMarker.style.left = `${nextPosition}px`;
		this._targetMarker.style.display = "block";
	}
	cleanTargetMarker() {
		if (this._targetMarker && this._targetMarker.parentNode) {
			this.$grid.$grid_scale.removeChild(this._targetMarker);
		}
		this._targetMarker = null;
	}
}