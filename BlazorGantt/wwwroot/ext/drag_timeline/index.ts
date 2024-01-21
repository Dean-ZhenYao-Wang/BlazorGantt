import { EventsManager } from "./eventsManager";
export default function(gantt: any){
	if (!gantt.ext){
		gantt.ext = {};
	}

	gantt.ext.dragTimeline = {
		create: () => EventsManager.create(gantt)
	};

	gantt.config.drag_timeline = {
		enabled: true
	};
}