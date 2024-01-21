export default function(gantt: any){

	gantt.ext = gantt.ext || {};
	gantt.config.show_empty_state = false;

	gantt.ext.emptyStateElement = gantt.ext.emptyStateElement || {
		isEnabled() {
			return gantt.config.show_empty_state === true;
		},
		isGanttEmpty(){
			return !gantt.getTaskByTime().length;
		},
		renderContent(container){
			const placeholderTextElement = `<div class='gantt_empty_state_text'>
    <div class='gantt_empty_state_text_link' data-empty-state-create-task>${gantt.locale.labels.empty_state_text_link}</div>
    <div class='gantt_empty_state_text_description'>${gantt.locale.labels.empty_state_text_description}</div>
    </div>`;
			const placeholderImageElement = "<div class='gantt_empty_state_image'></div>";

			const placeholderContainer = `<div class='gantt_empty_state'>${placeholderImageElement}${placeholderTextElement}</div>`;
			container.innerHTML = placeholderContainer;
		},

		clickEvents: [],
		attachAddTaskEvent(){
			const id = gantt.attachEvent("onEmptyClick", function(e){
				const domHelpers = gantt.utils.dom;
				const gridPlaceholder = domHelpers.closest(e.target, "[data-empty-state-create-task]");
				if (gridPlaceholder){
					gantt.createTask({
						id: gantt.uid(),
						text: "New Task"
					});
				}
			});
			this.clickEvents.push(id);
		},
		detachAddTaskEvents(){
			this.clickEvents.forEach(function(event){
				gantt.detachEvent(event);
			});
			this.clickEvents = [];
		},

		getContainer(){
			if (gantt.$container) {
				const domHelpers = gantt.utils.dom;
				if (gantt.$container.contains(gantt.$grid_data)) {
					return domHelpers.closest(gantt.$grid_data, ".gantt_layout_content");
				}
				if (gantt.$container.contains(gantt.$task_data)){
					return domHelpers.closest(gantt.$task_data, ".gantt_layout_content");
				}
			}

			return null;
		},

		getNode(){
			const container = this.getContainer();
			if (!container){
				return null;
			}
			const emptyStateElementNode = container.querySelector(".gantt_empty_state_wrapper");
			return emptyStateElementNode;
		},

		show(){
			const container = this.getContainer();
			if (!container && this.isGanttEmpty()){
				return null;
			}

			const wrapper = document.createElement("div");
			wrapper.className = "gantt_empty_state_wrapper";
			wrapper.style.marginTop = (gantt.config.scale_height - container.offsetHeight) + "px";
			const oldNodes = gantt.$container.querySelectorAll(".gantt_empty_state_wrapper");
			// for IE11
			Array.prototype.forEach.call(oldNodes, function(node){
				node.parentNode.removeChild(node);
			});

			this.detachAddTaskEvents();
			this.attachAddTaskEvent();

			container.appendChild(wrapper);
			this.renderContent(wrapper);
		},
		hide(){
			const emptyStateElementNode = this.getNode();
			if (emptyStateElementNode){
				emptyStateElementNode.parentNode.removeChild(emptyStateElementNode);
			} else{
				return false;
			}

		},
		init(){ }
	};

	gantt.attachEvent("onDataRender", function() {
		const emptyStateElement = gantt.ext.emptyStateElement;
		if (emptyStateElement.isEnabled() && emptyStateElement.isGanttEmpty()) {
			emptyStateElement.show();
		} else {
			emptyStateElement.hide();
		}
	});




}
