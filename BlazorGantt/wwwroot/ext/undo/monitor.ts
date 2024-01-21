const noTrack = {
	onBeforeUndo: "onAfterUndo",
	onBeforeRedo: "onAfterRedo"
};

const batchActions = [
	"onTaskDragStart",
	"onAfterTaskUpdate",
	"onAfterTaskDelete",
	"onBeforeBatchUpdate"
];

export class Monitor {
	private _batchAction = null;
	private _batchMode = false;
	private _ignore = false;
	private _ignoreMoveEvents = false;
	private _initialTasks = {};
	private _initialLinks = {};
	private _nestedTasks =  {};
	private _nestedLinks = {};
	private _timeout;
	private _gantt: any;
	private _undo: any;

	constructor(undo: any, gantt: any) {
		this._undo = undo;
		this._gantt = gantt;
		this._attachEvents();
	}

	store(id: any, type: any, overwrite: boolean = false) {
		if (type === this._gantt.config.undo_types.task) {
			return this._storeTask(id, overwrite);
		}
		if (type === this._gantt.config.undo_types.link) {
			return this._storeLink(id, overwrite);
		}
		return false;
	}
	isMoveEventsIgnored() {
		return this._ignoreMoveEvents;
	}
	toggleIgnoreMoveEvents(newValue?: boolean) {
		this._ignoreMoveEvents = newValue || false;
	}
	startIgnore() {
		this._ignore = true;
	}
	stopIgnore() {
		this._ignore = false;
	}
	startBatchAction() {
		// try catching updates made from event handlers using timeout
		if (!this._timeout){
			this._timeout = setTimeout(() => {
				this.stopBatchAction();
				this._timeout = null;
			}, 10);
		}


		if (this._ignore || this._batchMode) {
			return;
		}

		this._batchMode = true;
		this._batchAction = this._undo.action.create();
	}
	stopBatchAction() {
		if (this._ignore) {
			return;
		}
		const undo = this._undo;
		if (this._batchAction) {
			undo.logAction(this._batchAction);
		}
		this._batchMode = false;
		this._batchAction = null;
	}
	onTaskAdded(task: any) {
		if (!this._ignore) {
			this._storeTaskCommand(task, this._undo.command.type.add);
		}
	}
	onTaskUpdated(task: any) {
		if (!this._ignore) {
			this._storeTaskCommand(task, this._undo.command.type.update);
		}
	}
	onTaskMoved(task: any) {
		if (!this._ignore) {
			(task as any).$local_index = this._gantt.getTaskIndex(task.id);
			const oldValue = this.getInitialTask(task.id);
			if((task as any).$local_index === oldValue.$local_index &&
				this._gantt.getParent(task) === this._gantt.getParent(oldValue)){
					return;
				}
			this._storeEntityCommand(
				task,
				this.getInitialTask(task.id),
				this._undo.command.type.move,
				this._undo.command.entity.task
			);
		}
	}
	onTaskDeleted(task: any) {
		if (!this._ignore) {
			this._storeTaskCommand(task, this._undo.command.type.remove);
			if (this._nestedTasks[task.id]) {
				const children = this._nestedTasks[task.id];
				for (let i = 0; i < children.length; i++) {
					this._storeTaskCommand(children[i], this._undo.command.type.remove);
				}
			}
			if (this._nestedLinks[task.id]) {
				const childrenLinks = this._nestedLinks[task.id];
				for (let i = 0; i < childrenLinks.length; i++) {
					this._storeLinkCommand(childrenLinks[i], this._undo.command.type.remove);
				}
			}
		}
	}
	onLinkAdded(link: any) {
		if (!this._ignore) {
			this._storeLinkCommand(link, this._undo.command.type.add);
		}
	}
	onLinkUpdated(link: any) {
		if (!this._ignore) {
			this._storeLinkCommand(link, this._undo.command.type.update);
		}
	}
	onLinkDeleted(link: any) {
		if (!this._ignore) {
			this._storeLinkCommand(link, this._undo.command.type.remove);
		}
	}
	setNestedTasks(id: any, taskIds: any[]) {
		const gantt = this._gantt;
		let task = null;
		const tasks = [];
		let	linkIds = this._getLinks(gantt.getTask(id));

		for (let i = 0; i < taskIds.length; i++) {
			task = this.setInitialTask(taskIds[i]);
			linkIds = linkIds.concat(this._getLinks(task));
			tasks.push(task);
		}

		const uniqueLinks = {};
		for (let i = 0; i < linkIds.length; i++) {
			uniqueLinks[linkIds[i]] = true;
		}
		const links = [];
		for (const i in uniqueLinks) {
			links.push(this.setInitialLink(i));
		}
		this._nestedTasks[id] = tasks;
		this._nestedLinks[id] = links;
	}
	setInitialTask(id: any, overwrite?: boolean) {
		const gantt = this._gantt;
		if (overwrite || (!this._initialTasks[id] || !this._batchMode)) {
			const task = gantt.copy(gantt.getTask(id));
			task.$index = gantt.getGlobalTaskIndex(id);
			task.$local_index = gantt.getTaskIndex(id);
			this.setInitialTaskObject(id, task);
		}
		return this._initialTasks[id];
	}
	getInitialTask(id: any) {
		return this._initialTasks[id];
	}
	clearInitialTasks() {
		this._initialTasks = {};
	}
	setInitialTaskObject(id: any, object: any) {
		this._initialTasks[id] = object;
	}
	setInitialLink(id: any, overwrite?: boolean) {
		if (!this._initialLinks[id] || !this._batchMode) {
			this._initialLinks[id] = this._gantt.copy(this._gantt.getLink(id));
		}
		return this._initialLinks[id];
	}
	getInitialLink(id: any) {
		return this._initialLinks[id];
	}
	clearInitialLinks() {
		this._initialLinks = {};
	}
	private _attachEvents() {
		let deleteCacheCooldown = null;
		const gantt = this._gantt;

		const saveInitialAll = () => {
			if (!deleteCacheCooldown) {
				deleteCacheCooldown = setTimeout(() => {
					deleteCacheCooldown = null;
				});

				this.clearInitialTasks();
				gantt.eachTask((task: any) => {
					this.setInitialTask(task.id);
				});

				this.clearInitialLinks();
				gantt.getLinks().forEach((link: any) => {
					this.setInitialLink(link.id);
				});
			}
		};
		const getMoveObjectByTaskId = (id: any) => {
			return gantt.copy(gantt.getTask(id));
		};

		for (const i in noTrack) {
			gantt.attachEvent(i, () => {
				this.startIgnore();
				return true;
			});
			gantt.attachEvent(noTrack[i], () => {
				this.stopIgnore();
				return true;
			});
		}

		for (let i  = 0; i < batchActions.length; i++) {
			gantt.attachEvent(batchActions[i], () => {
				this.startBatchAction();
				return true;
			});
		}

		gantt.attachEvent("onParse", () => {
			this._undo.clearUndoStack();
			this._undo.clearRedoStack();
			saveInitialAll();
		});
		gantt.attachEvent("onAfterTaskAdd", (id: any, task: any) => {
			this.setInitialTask(id, true);
			this.onTaskAdded(task);
		});
		gantt.attachEvent("onAfterTaskUpdate", (id: any, task: any) => {
			this.onTaskUpdated(task);
		});
		gantt.attachEvent("onAfterTaskDelete", (id: any, task: any) => {
			this.onTaskDeleted(task);
		});
		gantt.attachEvent("onAfterLinkAdd", (id: any, link: any) => {
			this.setInitialLink(id, true);
			this.onLinkAdded(link);
		});
		gantt.attachEvent("onAfterLinkUpdate", (id: any, link: any) => {
			this.onLinkUpdated(link);
		});
		gantt.attachEvent("onAfterLinkDelete", (id: any, link: any) => {
			this.onLinkDeleted(link);
		});
		gantt.attachEvent("onRowDragEnd", (id: any, target: any) => {
			this.onTaskMoved(getMoveObjectByTaskId(id));
			this.toggleIgnoreMoveEvents();
			return true;
		});
		gantt.attachEvent("onBeforeTaskDelete", (id: any) => {
			this.store(id, gantt.config.undo_types.task);
			const nested = [];

			// remember task indexes in case their being deleted in a loop, so they could be restored in the correct order
			saveInitialAll();

			gantt.eachTask((task: any) => {
				nested.push(task.id);
			}, id);
			this.setNestedTasks(id, nested);
			return true;
		});
		const datastore = gantt.getDatastore("task");

		datastore.attachEvent("onBeforeItemMove", (id: any, parent: any, tindex: number) => {
			if (!this.isMoveEventsIgnored()) {
				saveInitialAll();
			}
			return true;
		});

		datastore.attachEvent("onAfterItemMove", (id: any, parent: any, tindex: number) => {
			if (!this.isMoveEventsIgnored()) {
				this.onTaskMoved(getMoveObjectByTaskId(id));
			}
			return true;
		});

		gantt.attachEvent("onRowDragStart", (id: any, target: any, e: Event) => {
			this.toggleIgnoreMoveEvents(true);
			saveInitialAll();
			return true;
		});

		gantt.attachEvent("onBeforeTaskDrag", (taskId: any) => this.store(taskId, gantt.config.undo_types.task));

		gantt.attachEvent("onLightbox", (taskId: any) => this.store(taskId, gantt.config.undo_types.task));

		gantt.attachEvent("onBeforeTaskAutoSchedule", (task: any) => {
			this.store(task.id, gantt.config.undo_types.task);
			return true;
		});

		if (gantt.ext.inlineEditors) {
			gantt.ext.inlineEditors.attachEvent("onEditStart", (state: any) => {
				this.store(state.id, gantt.config.undo_types.task);
			});
		}
	}

	private _storeCommand(command: any) {
		const undo = this._undo;
		undo.updateConfigs();

		if (!undo.undoEnabled) {
			return;
		}

		if (this._batchMode) {
			this._batchAction.commands.push(command);
		} else {
			const action = undo.action.create([command]);
			undo.logAction(action);
		}
	}
	private _storeEntityCommand(obj: any, old: any, actionType: any, entityType: any) {
		const undo = this._undo;
		const command = undo.command.create(obj, old, actionType, entityType);
		this._storeCommand(command);
	}
	private _storeTaskCommand(obj: any, type: any) {
		if(this._gantt.isTaskExists(obj.id)){
			(obj as any).$local_index = this._gantt.getTaskIndex(obj.id);
		}

		this._storeEntityCommand(obj, this.getInitialTask(obj.id), type, this._undo.command.entity.task);
	}
	private _storeLinkCommand(obj: any, type: any) {
		this._storeEntityCommand(obj, this.getInitialLink(obj.id), type, this._undo.command.entity.link);
	}
	private _getLinks(task: any) {
		return task.$source.concat(task.$target);
	}
	private _storeTask(taskId: any, overwrite: boolean = false) {
		const gantt = this._gantt;
		this.setInitialTask(taskId, overwrite);
		gantt.eachTask((child: any) => {
			this.setInitialTask(child.id);
		}, taskId);
		return true;
	}
	private _storeLink(linkId: any, overwrite: boolean = false) {
		this.setInitialLink(linkId, overwrite);
		return true;
	}
}