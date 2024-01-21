const SENSITIVITY = 20;
const TIMEOUT = 50;
const SCROLLSTEP = 10;

export default class ScrollableGrid {
	public getCurrentX;
	private $gantt;
	private $grid;
	private _dnd;
	private _scrollView;
	private _scrollOrder: 0 | 1 | -1 = 0;

	constructor(params) {
		const {gantt, grid, dnd, getCurrentX} = params;
		this.$gantt = gantt;
		this.$grid = grid;
		this._dnd = dnd;
		this.getCurrentX = getCurrentX;
		this._scrollView = this.$gantt.$ui.getView(this.$grid.$config.scrollX);
		this.attachEvents();
	}
	attachEvents() {
		if (this.isScrollable()) {
			this._dnd.attachEvent("onDragMove", (obj, e) => {
				const gridBoundingRect = this.$grid.$grid.getBoundingClientRect();
				const maxLeft = gridBoundingRect.right;
				const minLeft = gridBoundingRect.left;
				const currentX = this.getCurrentX(e.clientX);

				if (currentX >= maxLeft - SENSITIVITY) {
					this.autoscrollRight();
					this.autoscrollStart();
				}
				if (currentX <= minLeft + SENSITIVITY) {
					this.autoscrollLeft();
					this.autoscrollStart();
				}
				if (currentX < maxLeft - SENSITIVITY && currentX > minLeft + SENSITIVITY) {
					this.autoscrollStop();
				}
				return true;
			});
			this._dnd.attachEvent("onDragEnd", () => {
				this.autoscrollStop();
			});
		}
	}
	autoscrollStart() {
		if (this._scrollOrder === 0) {
			return;
		}
		const scrollStep = SCROLLSTEP * this._scrollOrder;
		const scrollState = this._scrollView.getScrollState();
		this._scrollView.scrollTo(scrollState.position + scrollStep);
		setTimeout(() => { this.autoscrollStart(); }, TIMEOUT);
	}
	autoscrollRight() {
		this._scrollOrder = 1;
	}
	autoscrollLeft() {
		this._scrollOrder = -1;
	}
	autoscrollStop() {
		this._scrollOrder = 0;
	}
	getCorrection() {
		if (!this.isScrollable()) {
			return 0;
		}
		return this._scrollView.getScrollState().position;
	}
	isScrollable() {
		return !!this.$grid.$config.scrollable;
	}
}