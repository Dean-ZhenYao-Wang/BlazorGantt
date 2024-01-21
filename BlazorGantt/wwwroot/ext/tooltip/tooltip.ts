import * as domHelpers from "../../core/ui/utils/dom_helpers";

interface IViewPosition{
	top: number;
	left: number;
}

interface IViewBox extends IViewPosition{
	width: number;
	height: number;
	bottom: number;
	right: number;
}

export class Tooltip {
	private _root: HTMLElement;
	private _tooltipNode: HTMLElement;
	private _gantt: any;

	constructor(gantt: any){
		this._gantt = gantt;
	}

	getNode() : HTMLElement {
		const gantt = this._gantt;
		if (!this._tooltipNode){
			this._tooltipNode = document.createElement("div");
			this._tooltipNode.className = "gantt_tooltip";
			gantt._waiAria.tooltipAttr(this._tooltipNode);
		}
		return this._tooltipNode;
	}

	setViewport(node: HTMLElement):Tooltip{
		this._root = node;
		return this;
	}

	show(left: number, top: number): Tooltip;
	show(event: MouseEvent): Tooltip;
	show(left: number | MouseEvent, top?: number): Tooltip {
		const gantt = this._gantt;
		const container = document.body;
		const node = this.getNode();

		if(!domHelpers.isChildOf(node, container)){
			this.hide();
			container.appendChild(node);
		}

		if (this._isLikeMouseEvent(left)) {
			const position = this._calculateTooltipPosition(left as MouseEvent);
			top = position.top;
			left = position.left;
		}

		node.style.top = top + "px";
		node.style.left = left + "px";

		gantt._waiAria.tooltipVisibleAttr(node);
		return this;
	}
	hide() : Tooltip{
		const gantt = this._gantt;
		const node = this.getNode();
		if(node && node.parentNode){
			node.parentNode.removeChild(node);
		}
		gantt._waiAria.tooltipHiddenAttr(node);
		return this;
	}

	setContent(html: string) : Tooltip{
		const node = this.getNode();
		node.innerHTML = html;
		return this;
	}

	// it is for salesforce, because it proxies event to it own events
	private _isLikeMouseEvent(event: any): boolean {
		if (!event || typeof event !== "object") {
			return false;
		}
		return "clientX" in event && "clientY" in event;
	}

	private _getViewPort() : HTMLElement {
		return this._root || document.body;
	}


	private _calculateTooltipPosition(event: MouseEvent): IViewPosition{
		const gantt = this._gantt;
		// top/left coordinates inside the viewport by mouse position
		const viewport =  this._getViewPortSize();
		const tooltipNode = this.getNode();
		const tooltip: IViewBox = {
			top:0,
			left: 0,
			width: tooltipNode.offsetWidth,
			height: tooltipNode.offsetHeight,
			bottom: 0,
			right: 0
		};

		const offsetX = gantt.config.tooltip_offset_x;
		const offsetY = gantt.config.tooltip_offset_y;

		const container = document.body;
		const mouse = domHelpers.getRelativeEventPosition(event, container);
		const containerPos = domHelpers.getNodePosition(container);
		mouse.y += containerPos.y; // to fix margin collapsing

		tooltip.top = mouse.y;
		tooltip.left = mouse.x;
		tooltip.top += offsetY;
		tooltip.left += offsetX;
		tooltip.bottom = tooltip.top + tooltip.height;
		tooltip.right = tooltip.left + tooltip.width;

		const scrollTop = window.scrollY + container.scrollTop; // to fix margin collapsing
		// edge cases when the tooltip element can be partially hidden by edges of the viewport
		if(tooltip.top < viewport.top - scrollTop){
			tooltip.top = viewport.top;
			tooltip.bottom = tooltip.top + tooltip.height;
		}else if(tooltip.bottom > viewport.bottom){
			tooltip.bottom = viewport.bottom;
			tooltip.top = tooltip.bottom - tooltip.height;
		}

		if(tooltip.left < viewport.left){
			tooltip.left = viewport.left;
			tooltip.right = viewport.left + tooltip.width;
		}else if(tooltip.right > viewport.right){
			tooltip.right = viewport.right;
			tooltip.left = tooltip.right - tooltip.width;
		}

		if(mouse.x >= tooltip.left && mouse.x <= tooltip.right) {
			tooltip.left = mouse.x - tooltip.width - offsetX;
			tooltip.right = tooltip.left + tooltip.width;
		}

		if(mouse.y >= tooltip.top && mouse.y <= tooltip.bottom) {
			tooltip.top = mouse.y - tooltip.height - offsetY;
			tooltip.bottom = tooltip.top + tooltip.height;
		}

		return tooltip;
	}

	private _getViewPortSize() : IViewBox {
		const gantt = this._gantt;
		const container = this._getViewPort();
		let viewport = container;
		let scrollTop = window.scrollY + document.body.scrollTop;
		let scrollLeft = window.scrollX + document.body.scrollLeft;
		let pos;
		// support for the initial tooltip mode where the tooltip element was attached to the data area of gantt
		if(container === gantt.$task_data){
			viewport = gantt.$task;
			scrollTop = 0;
			scrollLeft = 0;
			pos = domHelpers.getNodePosition(gantt.$task);
		}else{
			pos = domHelpers.getNodePosition(viewport);
		}
		return {
			left:pos.x + scrollLeft,
			top: pos.y + scrollTop,
			width: pos.width,
			height: pos.height,
			bottom: pos.y + pos.height + scrollTop,
			right: pos.x + pos.width + scrollLeft
		};
	}
}
