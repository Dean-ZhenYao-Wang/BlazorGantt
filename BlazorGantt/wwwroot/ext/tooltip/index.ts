import {TooltipManager} from "./tooltipManager";

export default function(gantt: any){

gantt.config.tooltip_timeout = 30;
gantt.config.tooltip_offset_y = 20;
gantt.config.tooltip_offset_x = 10;
gantt.config.tooltip_hide_timeout = 30;



const tooltipManager = new TooltipManager(gantt);

gantt.ext.tooltips = tooltipManager;

gantt.attachEvent("onGanttReady", function(){

	tooltipManager.tooltipFor({
		selector: "["+gantt.config.task_attribute+"]:not(.gantt_task_row)",
		html: (event: MouseEvent) => {
			if (gantt.config.touch && !gantt.config.touch_tooltip) {
				return;
			}

			const targetTaskId = gantt.locate(event);
			if(gantt.isTaskExists(targetTaskId)){
				const task = gantt.getTask(targetTaskId);
				return gantt.templates.tooltip_text(task.start_date, task.end_date, task);
			}
			return null;
		},
		global: false
	});
});

gantt.attachEvent("onDestroy", function() {
	tooltipManager.destructor();
});

gantt.attachEvent("onLightbox", function() {
	tooltipManager.hideTooltip();
});
const isLinkCreate = () => {
	const state = gantt.getState();
	return !!state.link_source_id;
};
gantt.attachEvent("onBeforeTooltip", function() {
	if (isLinkCreate()){
		return false;
	}
});

gantt.attachEvent("onGanttScroll", function(){
	tooltipManager.hideTooltip();
});

}