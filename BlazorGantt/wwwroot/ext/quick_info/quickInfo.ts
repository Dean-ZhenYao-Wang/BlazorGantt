
interface IQuickInfoContainer{
	parent: HTMLElement;
	xViewport: HTMLElement;
	yViewport: HTMLElement;
}

export class QuickInfo {
	private _quickInfoTask: any;
	private _quickInfoBoxId: number | string;
	private _quickInfoBox: HTMLElement;
	private _quickInfoReadonly: boolean | null;
	private _container: HTMLElement;
	private _gantt: any;

	constructor(gantt: any) {
		this._gantt = gantt;
	}

	// show at coordinates:
	// show(x: number, y: number)
	// show for a task:
	// show(id: any)
	show : {
		(x: number, y: number) : void;
		(id: any) : void;
	} = (id: any | number, y? : number) : void => {
		if (y === undefined) {
			this._showForTask(id);
		} else {
			this._showAtCoordinates(id as number, y);
		}
	}

	hide = (forced?: boolean) : any => {
		const gantt = this._gantt;
		const qi = this._quickInfoBox;
		this._quickInfoBoxId = 0;
		const taskId = this._quickInfoTask;
		this._quickInfoTask = null;

		if (qi && qi.parentNode){

			if (gantt.config.quick_info_detached) {
				gantt.callEvent("onAfterQuickInfo", [taskId]);
				return qi.parentNode.removeChild(qi);
			}

			qi.className += " gantt_qi_hidden";
			if (qi.style.right === "auto"){
				qi.style.left = "-350px";
			} else {
				qi.style.right = "-350px";
			}

			if (forced) {
				qi.style.left = qi.style.right = "";
				qi.parentNode.removeChild(qi);
			}
			gantt.callEvent("onAfterQuickInfo", [taskId]);
		}
	}

	getNode = (): HTMLElement => {
		if(this._quickInfoBox) {
			return this._quickInfoBox;
		}
		return null;
	}

	setContainer = (container: string|HTMLElement): void => {
		if(container){
			this._container = typeof container === "string" ? document.getElementById(container) : container;
		}
	}

	setContent = (content?: any) => {
		const gantt = this._gantt;

		const defaultContent = {
			taskId: null,
			header: {
				title: "",
				date: ""
			},
			content: "",
			buttons: gantt.config.quickinfo_buttons
		};

		if(!content){
			content = defaultContent;
		}

		if(!content.taskId){
			content.taskId = defaultContent.taskId;
		}

		if(!content.header){
			content.header = defaultContent.header;
		}

		if(!content.header.title){
			content.header.title = defaultContent.header.title;
		}
		if(!content.header.date){
			content.header.date = defaultContent.header.date;
		}
		if(!content.content){
			content.content = defaultContent.content;
		}
		if(!content.buttons){
			content.buttons = defaultContent.buttons;
		}


		let qi = this.getNode();
		if(!qi){
			qi = this._createQuickInfoElement();
		}

		if(content.taskId){
			this._quickInfoBoxId = content.taskId;
		}

		const titleBox = qi.querySelector(".gantt_cal_qi_title") as HTMLElement;
		const titleContent = titleBox.querySelector(".gantt_cal_qi_tcontent");
		const titleDate = titleBox.querySelector(".gantt_cal_qi_tdate");
		const main = qi.querySelector(".gantt_cal_qi_content");
		const controls = qi.querySelector(".gantt_cal_qi_controls") as HTMLElement;

		gantt._waiAria.quickInfoHeader(qi, [content.header.title, content.header.date].join(" "));

		titleContent.innerHTML = content.header.title;
		titleDate.innerHTML = content.header.date;

		if(!content.header.title && !content.header.date){
			titleBox.style.display = "none";
		}else{
			titleBox.style.display = "";
		}
		main.innerHTML = content.content;

		const buttons = content.buttons;
		if(!buttons.length){
			controls.style.display = "none";
		}else{
			controls.style.display = "";
		}
		let html = "";
		for (let i = 0; i < buttons.length; i++){

			const ariaAttr = gantt._waiAria.quickInfoButtonAttrString(gantt.locale.labels[buttons[i]]);

			html += "<div class=\"gantt_qi_big_icon "+buttons[i]+"\" title=\""
				+gantt.locale.labels[buttons[i]]+"\" " + ariaAttr +"><div class='gantt_menu_icon " + buttons[i]
				+ "'></div><div>"+gantt.locale.labels[buttons[i]]+"</div></div>";
		}
		controls.innerHTML = html;

		gantt.eventRemove(qi, "click", this._qiButtonClickHandler);
		gantt.eventRemove(qi, "keypress", this._qiKeyPressHandler);

		gantt.event(qi, "click", this._qiButtonClickHandler);
		gantt.event(qi, "keypress", this._qiKeyPressHandler);
	}

	private _qiButtonClickHandler = (ev) => {
		ev = ev || event;
		this._qi_button_click(ev.target || ev.srcElement);
	}

	private _qiKeyPressHandler = (e) => {
		e = e || event;
		// @ts-ignore
		const code = e.which||event.keyCode;
		if (code === 13 || code === 32){
			setTimeout(() => {
				this._qi_button_click(e.target || e.srcElement);
			},1);
		}
	}

	private _showAtCoordinates(x: number, y: number) : void {
		this.hide(true);
		this._quickInfoBoxId = 0;
		this._quickInfoTask = null;
		if(!this._quickInfoBox){
			this._createQuickInfoElement();
			this.setContent();
		}

		this._appendAtCoordinates(x, y);
		this._gantt.callEvent("onQuickInfo", [null]);
	}

	private _showForTask(id: any) : void {
		const gantt = this._gantt;
		if ((
			id === this._quickInfoBoxId &&
			gantt.utils.dom.isChildOf(this._quickInfoBox, document.body)
		) || !gantt.config.show_quick_info) {
			// not show if the quick info is already displayed for this task, or if it shouldn't be displayed
			return;
		}
		this.hide(true);
		const offset = 6; // offset TASK <> QI-BOX in 'px'
		const container = this._getContainer();
		const pos = this._get_event_counter_part(id, offset, container.xViewport, container.yViewport);

		if (pos){
			this._quickInfoBox = this._init_quick_info(id);
			this._quickInfoTask = id;
			this._quickInfoBox.className = this._prepare_quick_info_classname(id);

			this._fill_quick_data(id);
			this._show_quick_info(pos, offset);
			gantt.callEvent("onQuickInfo", [id]);
		}
	}

	private _get_event_counter_part(id: any, offset: number, xViewport: HTMLElement, yViewport: HTMLElement) : any {
		const gantt = this._gantt;
		let domEv = gantt.getTaskNode(id);
		if (!domEv) {
			domEv = gantt.getTaskRowNode(id);
			if (!domEv) {
				return null;
			}
		}
		let left = 0;
		const top = offset + domEv.offsetTop + domEv.offsetHeight;

		let node = domEv;

		if (gantt.utils.dom.isChildOf(node, xViewport)) {
			while (node && node !== xViewport){
				left += node.offsetLeft;
				node = node.offsetParent;
			}
		}

		const scroll = gantt.getScrollState();

		if(node){
			const dx = (left + domEv.offsetWidth/2) - scroll.x > (xViewport.offsetWidth/2) ? 1 : 0;
			const dy = (top + domEv.offsetHeight/2) - scroll.y > (yViewport.offsetHeight/2) ? 1 : 0;

			return { left, top, dx, dy, width:domEv.offsetWidth, height:domEv.offsetHeight };
		}
		return null;
	}

	private _createQuickInfoElement() : HTMLElement {
		const gantt = this._gantt;
		const qi = document.createElement("div");
		qi.className += "gantt_cal_quick_info";
		gantt._waiAria.quickInfoAttr(qi);

		// title
		const ariaAttr = gantt._waiAria.quickInfoHeaderAttrString();
		let html = "<div class=\"gantt_cal_qi_title\" "+ariaAttr+">" +
			"<div class=\"gantt_cal_qi_tcontent\"></div><div  class=\"gantt_cal_qi_tdate\"></div>" +
			"</div>" +
			"<div class=\"gantt_cal_qi_content\"></div>";

		// buttons
		html += "<div class=\"gantt_cal_qi_controls\">";
		html += "</div>";

		qi.innerHTML = html;


		if (gantt.config.quick_info_detached) {
			const container = this._getContainer();
			gantt.event(container.parent, "scroll", () => { this.hide(); });
		}

		this._quickInfoBox = qi;
		return qi;
	}

	private _init_quick_info(id: any) : HTMLElement {
		const gantt = this._gantt;
		const task = gantt.getTask(id);
		if(typeof this._quickInfoReadonly === "boolean"){
			if(gantt.isReadonly(task) !== this._quickInfoReadonly){
				this.hide(true);
				this._quickInfoBox = null;
			}
		}

		this._quickInfoReadonly = gantt.isReadonly(task);

		if (!this._quickInfoBox){
			this._quickInfoBox = this._createQuickInfoElement();
		}

		return this._quickInfoBox;
	}

	private _prepare_quick_info_classname(id: any) : string {
		const gantt = this._gantt;
		const task = gantt.getTask(id);

		let css = "gantt_cal_quick_info";
		const template = gantt.templates.quick_info_class(task.start_date, task.end_date, task);

		if(template){
			css += " " + template;
		}
		return css;
	}

	private _fill_quick_data(id: any) : void {
		const gantt = this._gantt;
		const ev = gantt.getTask(id);

		this._quickInfoBoxId = id;

		let allowedButtons = [];
		if (this._quickInfoReadonly){
			const buttons = gantt.config.quickinfo_buttons;
			const isEditor = {icon_delete: true, icon_edit: true};
			for (let i = 0; i < buttons.length; i++){
				if(this._quickInfoReadonly && isEditor[buttons[i]]){
					continue;
				}
				allowedButtons.push(buttons[i]);
			}
		} else {
			allowedButtons = gantt.config.quickinfo_buttons;
		}

		this.setContent({
			header: {
				title: gantt.templates.quick_info_title(ev.start_date, ev.end_date, ev),
				date: gantt.templates.quick_info_date(ev.start_date, ev.end_date, ev)
			},
			content: gantt.templates.quick_info_content(ev.start_date, ev.end_date, ev),
			buttons: allowedButtons
		});
	}

	private _appendAtCoordinates(x: number, y: number): void {
		const qi = this._quickInfoBox;
		const container = this._getContainer();
		if (!qi.parentNode ||
			qi.parentNode.nodeName.toLowerCase() === "#document-fragment"){ // IE8
			container.parent.appendChild(qi);
		}

		qi.style.left = x + "px";
		qi.style.top = y + "px";
	}

	private _show_quick_info(pos: any, offset: number) : void {
		const gantt = this._gantt;
		const qi = this._quickInfoBox;
		if (gantt.config.quick_info_detached) {
			const container = this._getContainer();
			if (!qi.parentNode ||
				qi.parentNode.nodeName.toLowerCase() === "#document-fragment"){ // IE8
				container.parent.appendChild(qi);
			}
			const width = qi.offsetWidth;
			const popupHeight = qi.offsetHeight;

			const scrolls = gantt.getScrollState();
			const xViewport = container.xViewport;
			const yViewport = container.yViewport;
			const screenWidth = xViewport.offsetWidth + scrolls.x - width;

			const relativePopupTop = pos.top - scrolls.y;
			const relativePopupBottom = relativePopupTop + popupHeight;

			let top = pos.top;
			if(relativePopupBottom > yViewport.offsetHeight / 2){
				top = pos.top - (popupHeight + pos.height + 2*offset);
				if(top < scrolls.y && relativePopupBottom <= yViewport.offsetHeight){
					top = pos.top;
				}
			}

			if (top < scrolls.y) {
				top = scrolls.y;
			}

			const x = Math.min(Math.max(scrolls.x, pos.left - pos.dx*(width - pos.width)), screenWidth);
			const y = top;

			this._appendAtCoordinates(x, y);
		} else {
			qi.style.top = 20 + "px";
			if (pos.dx === 1){
				qi.style.right = "auto";
				qi.style.left = "-300px";

				setTimeout(() => {
					qi.style.left = "10px";
				},1);
			} else {
				qi.style.left = "auto";
				qi.style.right = "-300px";

				setTimeout(() => {
					qi.style.right = "10px";
				},1);
			}
			qi.className += " gantt_qi_"+(pos.dx === 1 ? "left" : "right");
			gantt.$root.appendChild(qi);
		}
	}

	private _qi_button_click(node: any) : void {
		const gantt = this._gantt;
		const box = this._quickInfoBox;
		if (!node || node === box){
			return;
		}

		const mask = node.className;
		if (mask.indexOf("_icon") !== -1){
			const id = this._quickInfoBoxId;
			gantt.$click.buttons[mask.split(" ")[1].replace("icon_","")](id);
		} else {
			this._qi_button_click(node.parentNode);
		}
	}

	private _getContainer(): IQuickInfoContainer{
		const gantt = this._gantt;
		let container = this._container ? this._container : gantt.$task_data;
		if (container && container.offsetHeight && container.offsetWidth) {
			return {
				parent: container,
				xViewport: gantt.$task,
				yViewport: gantt.$task_data
			};
		}
		container = this._container ? this._container : gantt.$grid_data;
		if (container && container.offsetHeight && container.offsetWidth) {
			return {
				parent: container,
				xViewport: gantt.$grid,
				yViewport: gantt.$grid_data
			};
		}

		return {
			parent: this._container ? this._container : gantt.$layout,
			xViewport: gantt.$layout,
			yViewport: gantt.$layout
		};
	}
}
