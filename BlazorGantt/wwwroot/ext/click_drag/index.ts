import { EventsManager } from "./eventsManager";
import { ISelectedRegionConfig, SelectedRegion } from "./selectedRegion";

export default function(gantt: any){
	if (!gantt.ext) {
		gantt.ext = {};
	}

	const defaultConfig: ISelectedRegionConfig = {
		className: "gantt_click_drag_rect",
		useRequestAnimationFrame: true,
		callback: undefined,
		singleRow: false
	};

	const eventsManager = new EventsManager(gantt);

	gantt.ext.clickDrag = eventsManager;

	gantt.attachEvent("onGanttReady", () => {
		const config: ISelectedRegionConfig = { viewPort: gantt.$task_data, ...defaultConfig };
		if (gantt.config.click_drag){
			const clickDrag = gantt.config.click_drag;
			config.render = clickDrag.render || defaultConfig.render;
			config.className = clickDrag.className || defaultConfig.className;
			config.callback = clickDrag.callback || defaultConfig.callback;
			config.viewPort = clickDrag.viewPort || gantt.$task_data;
			config.useRequestAnimationFrame = clickDrag.useRequestAnimationFrame === undefined ?
				defaultConfig.useRequestAnimationFrame : clickDrag.useRequestAnimationFrame;

			config.singleRow = clickDrag.singleRow === undefined ? defaultConfig.singleRow : clickDrag.singleRow;
			const timeline = gantt.$ui.getView("timeline");
			const selectedRegion = new SelectedRegion(config, gantt, timeline);
			gantt.ext.clickDrag.attach(selectedRegion, clickDrag.useKey, clickDrag.ignore);
		}
	});

	gantt.attachEvent("onDestroy", () => {
		eventsManager.destructor();
	});

}