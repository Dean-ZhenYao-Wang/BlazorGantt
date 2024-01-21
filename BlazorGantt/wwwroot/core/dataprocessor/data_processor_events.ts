import * as helpers from "../../utils/helpers";

export default class DataProcessorEvents {
	protected _dataProcessorHandlers: any[];
	protected $gantt: any;
	protected $dp: any;

	constructor(gantt: any, dp: any) {
		this.$gantt = gantt;
		this.$dp = dp;
		this._dataProcessorHandlers = [];
	}

	attach() {
		const dp = this.$dp;
		const gantt = this.$gantt;
		const treeHelper = require("../../utils/task_tree_helpers");
		const cascadeDelete = {};

		const clientSideDelete = (id) => {
			return this.clientSideDelete(id, dp, gantt);
		};

		function getTaskLinks(task) {
			let _links = [];

			if (task.$source) {
				_links = _links.concat(task.$source);
			}
			if (task.$target) {
				_links = _links.concat(task.$target);
			}

			return _links;
		}

		this._dataProcessorHandlers.push(gantt.attachEvent("onAfterTaskAdd", function(id, item) { // tslint:disable-line
			if (gantt.isTaskExists(id)) {
				dp.setGanttMode("tasks");
				dp.setUpdated(id, true, "inserted");
			}
		}));

		this._dataProcessorHandlers.push(gantt.attachEvent("onAfterTaskUpdate", function(id, item) { // tslint:disable-line
			if (gantt.isTaskExists(id)) {
				dp.setGanttMode("tasks");
				dp.setUpdated(id, true);

				// gantt can be destroyed/reinitialized after dp.setUpdated
				if(gantt._sendTaskOrder){
					gantt._sendTaskOrder(id, item);
				}
			}
		}));

		this._dataProcessorHandlers.push(gantt.attachEvent("onBeforeTaskDelete", function(id, item) { // tslint:disable-line
			if (gantt.config.cascade_delete) {
				cascadeDelete[id] = {
					tasks: treeHelper.getSubtreeTasks(gantt, id),
					links: treeHelper.getSubtreeLinks(gantt, id)
				};
			}
			// GS-631. Keep the deleted item in Gantt until we receive the successful response from the server
			if (dp.deleteAfterConfirmation) {
				dp.setGanttMode("tasks");
				dp.setUpdated(id, true, "deleted");
				return false;
			}
			return true;
		}));

		this._dataProcessorHandlers.push(gantt.attachEvent("onAfterTaskDelete", function(id, item) { // tslint:disable-line
			dp.setGanttMode("tasks");

			// not send delete request if item is not inserted into the db - just remove it from the client
			const needDbDelete = !clientSideDelete(id);
			const needCascadeDelete = gantt.config.cascade_delete && cascadeDelete[id];
			if (!needDbDelete && !needCascadeDelete) {
				return;
			}

			if (needCascadeDelete) {
				const dpMode = dp.updateMode;
				dp.setUpdateMode("off");

				const cascade = cascadeDelete[id];
				for (const i in cascade.tasks) {
					if (!clientSideDelete(i)) {
						dp.storeItem(cascade.tasks[i]);
						dp.setUpdated(i, true, "deleted");
					}
				}
				dp.setGanttMode("links");
				for (const i in cascade.links) {
					if (!clientSideDelete(i)) {
						dp.storeItem(cascade.links[i]);
						dp.setUpdated(i, true, "deleted");
					}
				}
				cascadeDelete[id] = null;

				if (dpMode !== "off") {
					dp.sendAllData();
				}
				dp.setGanttMode("tasks");
				dp.setUpdateMode(dpMode);
			}

			if (needDbDelete){
				dp.storeItem(item);
				if (!dp.deleteAfterConfirmation){
					dp.setUpdated(id, true, "deleted");
				}
			}


			if (dp.updateMode !== "off" && !dp._tSend) {
				dp.sendAllData();
			}
		}));

		this._dataProcessorHandlers.push(gantt.attachEvent("onAfterLinkUpdate", function(id, item) { // tslint:disable-line
			if (gantt.isLinkExists(id)) {
				dp.setGanttMode("links");
				dp.setUpdated(id, true);
			}
		}));

		this._dataProcessorHandlers.push(gantt.attachEvent("onAfterLinkAdd", function(id, item) { // tslint:disable-line
			if (gantt.isLinkExists(id)) {
				dp.setGanttMode("links");
				dp.setUpdated(id, true,"inserted");
			}
		}));

		this._dataProcessorHandlers.push(gantt.attachEvent("onAfterLinkDelete", function(id, item) { // tslint:disable-line
			dp.setGanttMode("links");

			const needDbDelete = !clientSideDelete(id);
			if (!needDbDelete) {
				return;
			}
			dp.storeItem(item);
			dp.setUpdated(id, true,"deleted");
		}));

		this._dataProcessorHandlers.push(gantt.attachEvent("onRowDragEnd", function(id, target) { // tslint:disable-line
			gantt._sendTaskOrder(id, gantt.getTask(id));
		}));

		let tasks = null;
		let links = null;

		this._dataProcessorHandlers.push(gantt.attachEvent("onTaskIdChange", function(oldId, newId) { // tslint:disable-line
			if (!dp._waitMode) {
				return;
			}

			const children = gantt.getChildren(newId);
			if (children.length) {
				tasks = tasks || {};

				for (let i = 0; i < children.length; i++) {
					const ch = this.getTask(children[i]);
					tasks[ch.id] = ch;
				}
			}

			const item = this.getTask(newId);
			const itemLinks = getTaskLinks(item);

			if (itemLinks.length) {
				links = links || {};

				for (let i = 0; i < itemLinks.length; i++) {
					const link = this.getLink(itemLinks[i]);
					links[link.id] = link;
				}
			}
		}));

		dp.attachEvent("onAfterUpdateFinish", function() {
			if (tasks || links) {
				gantt.batchUpdate(function() {
					for (const id in tasks) {
						gantt.updateTask(tasks[id].id);
					}

					for (const id in links) {
						gantt.updateLink(links[id].id);
					}
					tasks = null;
					links = null;
				});
				if (tasks) {
					gantt._dp.setGanttMode("tasks");
				} else {
					gantt._dp.setGanttMode("links");
				}
			}
		});

		dp.attachEvent("onBeforeDataSending", function() {
			if (this._tMode === "CUSTOM") {
				return true;
			}
			let url = this._serverProcessor;
			if (this._tMode === "REST-JSON" || this._tMode === "REST") {
				const mode = this._ganttMode;

				url = url.substring(0, url.indexOf("?") > -1 ? url.indexOf("?") : url.length);
				// editing=true&
				this.serverProcessor = url + (url.slice(-1) === "/" ? "" : "/") + mode;
			} else {
				const pluralizedMode = this._ganttMode + "s";
				this.serverProcessor = url + gantt.ajax.urlSeparator(url) + "gantt_mode=" + pluralizedMode;
			}

			return true;
		});

		dp.attachEvent("insertCallback", function insertCallback(upd, id, parent, mode) { // tslint:disable-line
			const data = upd.data || gantt.xml._xmlNodeToJSON(upd.firstChild);
			const methods = {
				add: gantt.addTask,
				isExist: gantt.isTaskExists
			};
			if (mode === "links") {
				methods.add = gantt.addLink;
				methods.isExist = gantt.isLinkExists;
			}
			if (methods.isExist.call(gantt, id)) {
				return;
			}
			data.id = id;
			methods.add.call(gantt, data);
		});

		dp.attachEvent("updateCallback", function updateCallback(upd, id) {
			const data = upd.data || gantt.xml._xmlNodeToJSON(upd.firstChild);
			if (!gantt.isTaskExists(id)) {
				return;
			}
			const objData = gantt.getTask(id);
			for (const key in data) {
				let property = data[key];
				switch (key) {
					case "id":
						continue;
					case "start_date":
					case "end_date":
						property = gantt.defined(gantt.templates.xml_date) ? gantt.templates.xml_date(property) : gantt.templates.parse_date(property);
						break;
					case "duration":
						objData.end_date = gantt.calculateEndDate({start_date: objData.start_date, duration: property, task:objData});
						break;
				}
				objData[key] = property;
			}
			gantt.updateTask(id);
			gantt.refreshData();
		});
		dp.attachEvent("deleteCallback", function deleteCallback(upd, id, parent, mode) { // tslint:disable-line
			const methods = {
				delete: gantt.deleteTask,
				isExist: gantt.isTaskExists
			};
			if (mode === "links") {
				methods.delete = gantt.deleteLink;
				methods.isExist = gantt.isLinkExists;
			} else if(mode === "assignment") {
				methods.delete = function(val) {
					gantt.$data.assignmentsStore.remove(val);
				};
				methods.isExist = function(val){
					return gantt.$data.assignmentsStore.exists(val);
				};
			}
			if (methods.isExist.call(gantt, id)) {
				methods.delete.call(gantt, id);
			}
		});

		this.handleResourceCRUD(dp, gantt);
		this.handleResourceAssignmentCRUD(dp, gantt);
	}

	clientSideDelete(id, dp, gantt){
		const updated = dp.updatedRows.slice();
		let clientOnly = false;

		if(gantt.getUserData(id, "!nativeeditor_status", dp._ganttMode) === "true_deleted"){
			clientOnly = true;
			dp.setUpdated(id,false);
		}

		for (let i = 0; i < updated.length && !dp._in_progress[id]; i++) {
			if (updated[i] === id) {
				if (gantt.getUserData(id, "!nativeeditor_status", dp._ganttMode) === "inserted") {
					clientOnly = true;
				}
				dp.setUpdated(id,false);
			}
		}
		return clientOnly;
	}

	handleResourceAssignmentCRUD(dp, gantt){
		if(!gantt.config.resources || gantt.config.resources.dataprocessor_assignments !== true){
			return;
		}

		const assignmentsStore = gantt.getDatastore(gantt.config.resource_assignment_store);
		const insertedTasks = {};
		const pendingAssignments = {};

		gantt.attachEvent("onBeforeTaskAdd", function(id, task){
			insertedTasks[id] = true;
			return true;
		});

		function putAssignmentToQueue(item){
			pendingAssignments[item.id] = item;
			insertedTasks[item.task_id] = true;
		}

		function insertResourceAssignment(assignment){
			const id = assignment.id;
			if (assignmentsStore.exists(id)) {
				dp.setGanttMode("assignment");
				dp.setUpdated(id, true,"inserted");
			}
			delete pendingAssignments[id];
		}

		gantt.attachEvent("onTaskIdChange", function(id, newId){
			delete insertedTasks[id];
		});

		assignmentsStore.attachEvent("onAfterAdd", (id, item) => {
			if(insertedTasks[item.task_id]){
				// inserting assignment of new task
				// task is not saved yet, need to wait till it gets permanent id and save assigmnents after that
				putAssignmentToQueue(item);
			}else{
				insertResourceAssignment(item);
			}
		});

		assignmentsStore.attachEvent("onAfterUpdate", (id, item) => {
			if (assignmentsStore.exists(id)) {
				if(pendingAssignments[id]){
					insertResourceAssignment(item);
				}else{
					dp.setGanttMode("assignment");
					dp.setUpdated(id, true);
				}
			}
		});

		assignmentsStore.attachEvent("onAfterDelete", (id, item) => {
			dp.setGanttMode("assignment");

			const needDbDelete = !this.clientSideDelete(id, dp, gantt);
			if (!needDbDelete) {
				return;
			}
			dp.storeItem(item);
			dp.setUpdated(id, true,"deleted");
		});

	}

	handleResourceCRUD(dp, gantt){
		if(!gantt.config.resources || gantt.config.resources.dataprocessor_resources !== true){
			return;
		}

		const resourcesStore = gantt.getDatastore(gantt.config.resource_store);

		function insertResource(resource){
			const id = resource.id;
			if (resourcesStore.exists(id)) {
				dp.setGanttMode("resource");
				dp.setUpdated(id, true,"inserted");
			}
		}

		resourcesStore.attachEvent("onAfterAdd", (id, item) => {
			insertResource(item);
		});

		resourcesStore.attachEvent("onAfterUpdate", (id, item) => {
			if (resourcesStore.exists(id)) {
				dp.setGanttMode("resource");
				dp.setUpdated(id, true);
			}
		});

		resourcesStore.attachEvent("onAfterDelete", (id, item) => {
			dp.setGanttMode("resource");

			const needDbDelete = !this.clientSideDelete(id, dp, gantt);
			if (!needDbDelete) {
				return;
			}
			dp.storeItem(item);
			dp.setUpdated(id, true,"deleted");
		});

	}


	detach() {
		helpers.forEach(this._dataProcessorHandlers, (e) => {
			this.$gantt.detachEvent(e);
		});
		this._dataProcessorHandlers = [];
	}
}
