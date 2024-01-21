import { QuickInfo } from "./quickInfo";

export default function(gantt: any){

if (!gantt.ext) {
	gantt.ext = {};
}
gantt.ext.quickInfo = new QuickInfo(gantt);

gantt.config.quickinfo_buttons = ["icon_delete","icon_edit"];
gantt.config.quick_info_detached = true;
gantt.config.show_quick_info = true;

gantt.templates.quick_info_title = function(start, end, ev){ return ev.text.substr(0,50); };
gantt.templates.quick_info_content = function(start, end, ev){ return ev.details || ev.text; };
gantt.templates.quick_info_date = function(start, end, ev){
	return gantt.templates.task_time(start, end, ev);
};
gantt.templates.quick_info_class = function(start, end, task){ return ""; };

gantt.attachEvent("onTaskClick", function(id,e){
	// GS-1460 Don't show Quick Info when clicking on the "+" button
	if (!gantt.utils.dom.closest(e.target, ".gantt_add")){
		setTimeout(function() {
			gantt.ext.quickInfo.show(id);
		}, 0);
	}

	return true;
});

const events = ["onViewChange", "onLightbox", "onBeforeTaskDelete", "onBeforeDrag"];
const hidingFunction = function(){
	gantt.ext.quickInfo.hide();
	return true;
};
for (let i=0; i<events.length; i++){
	gantt.attachEvent(events[i], hidingFunction);
}
// GS-957: We don't want to hide QuickInfo when we click on it.
gantt.attachEvent("onEmptyClick", function(e){
	let hideQuickInfo = true;
	const parent = document.querySelector(".gantt_cal_quick_info");
	if (parent){
		const quickInfoClick = gantt.utils.dom.isChildOf(e.target, parent);
		if (quickInfoClick){
			hideQuickInfo = false;
		}
	}
	if (hideQuickInfo){
		hidingFunction();
	}
});
function clearQuickInfo() {
	gantt.ext.quickInfo.hide();
	gantt.ext.quickInfo._quickInfoBox = null;
	return true;
}
gantt.attachEvent("onGanttReady", clearQuickInfo);
gantt.attachEvent("onDestroy", clearQuickInfo);

gantt.event(window, "keydown", function(e){
	if (e.keyCode === 27){
		gantt.ext.quickInfo.hide();
	}
});

}