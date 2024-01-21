const MAX_UNDO_STEPS = 100;

export class Undo {

	maxSteps = MAX_UNDO_STEPS;
	undoEnabled = true;
	redoEnabled = true;
	action: any = {
		create: (commands?: any[]): any => {
			return { commands: (commands ? commands.slice() : []) };
		},
		invert: (action: any): any => {
			const gantt = this._gantt;
			const revert = gantt.copy(action);
			const commands = this.command;
			for (let i = 0; i < action.commands.length; i++) {
				const command = revert.commands[i] = commands.invert(revert.commands[i]);
				if (command.type === commands.type.update || command.type === commands.type.move) {
					[command.value, command.oldValue] = [command.oldValue, command.value];
				}
			}
			return revert as any;
		}
	};
	command: any = {
		// entities that require different processing for undoing-redoing changes (gantt.config.undo_types)
		entity: null,

		// types of traced actions (gantt.config.undo_actions)
		type: null,

		create: (value: any, oldValue: any, type: any, entity: any): any => {
			const gantt = this._gantt;
			return {
				entity,
				type,
				value: gantt.copy(value),
				oldValue: gantt.copy(oldValue || value)
			};
		},
		invert: (command: any): any => {
			const gantt = this._gantt;
			const revert = gantt.copy(command);
			revert.type = this.command.inverseCommands(command.type);
			return revert;
		},
		inverseCommands: (command: any): any => {
			const gantt = this._gantt;
			const types = this.command.type;
			switch (command) {
				case types.update:
					return types.update;
				case types.remove:
					return types.add;
				case types.add:
					return types.remove;
				case types.move:
					return types.move;
				default:
					gantt.assert(false, "Invalid command "+ command);
					return null;
			}
		}
	};

	private _undoStack = [];
	private _redoStack = [];
	private _gantt: any;

	constructor(gantt: any){
		this._gantt = gantt;
	}
	getUndoStack() {
		return this._undoStack;
	}
	setUndoStack(stack: []) {
		this._undoStack = stack;
	}

	getRedoStack() {
		return this._redoStack;
	}
	setRedoStack(stack: []) {
		this._redoStack = stack;
	}

	clearUndoStack() {
		this._undoStack = [];
	}

	clearRedoStack() {
		this._redoStack = [];
	}

	updateConfigs() {
		const gantt = this._gantt;
		this.maxSteps = gantt.config.undo_steps || MAX_UNDO_STEPS;
		this.command.entity = gantt.config.undo_types;
		this.command.type = gantt.config.undo_actions;
		this.undoEnabled = !!gantt.config.undo;
		this.redoEnabled = !!gantt.config.redo; // GS-873, Redo should work even when the `gantt.config.undo` is disabled.
	}

	undo() {
		const gantt = this._gantt;
		this.updateConfigs();
		if (!this.undoEnabled) {
			return;
		}

		const action = this._pop(this._undoStack);
		if (action) {
			this._reorderCommands(action);
		}
		if (gantt.callEvent("onBeforeUndo", [action]) !== false) {
			if (action) {
				this._applyAction(this.action.invert(action));
				this._push(this._redoStack, gantt.copy(action));
				gantt.callEvent("onAfterUndo", [action]);
				return;
			}
		}
		gantt.callEvent("onAfterUndo", [null]);
	}

	redo() {
		const gantt = this._gantt;
		this.updateConfigs();
		if (!this.redoEnabled) {
			return;
		}

		const action = this._pop(this._redoStack);
		if (action) {
			this._reorderCommands(action);
		}

		if (gantt.callEvent("onBeforeRedo", [action]) !== false) {
			if (action) {
				this._applyAction(action);
				this._push(this._undoStack, gantt.copy(action));
				gantt.callEvent("onAfterRedo", [action]);
				return;
			}
		}
		gantt.callEvent("onAfterRedo", [null]);
	}

	// storeUndo:
	logAction(action: any) {
		this._push(this._undoStack, action);
		this._redoStack = [];
	}

	private _push(stack: any, action: any): any {
		const gantt = this._gantt;
		if (!action.commands.length) {
			return;
		}

		const event = stack === this._undoStack ? "onBeforeUndoStack" : "onBeforeRedoStack";
		if (gantt.callEvent(event, [action]) === false){
			return;
		}
		// commands can be removed from event handler
		if (!action.commands.length) {
			return;
		}

		stack.push(action);
		while (stack.length > this.maxSteps) {
			stack.shift();
		}
		return action;
	}

	private _pop(stack: any): any {
		return stack.pop();
	}

	private _reorderCommands(action) {
		// firstly process tasks and only then links
		// in order to ensure links are added not earlier than their tasks
		// firstly to 'move' actions and only then updates
		const weights = { any: 0, link:1, task:2 };
		const actionWeights = { move: 1, any:0 };
		action.commands.sort(function(a, b) {
			if (a.entity === "task" && b.entity === "task") {
				if (a.type !== b.type) {
					return (actionWeights[b.type] || 0) - (actionWeights[a.type] || 0);
				} else if (a.type === "move" && a.oldValue && b.oldValue && b.oldValue.parent === a.oldValue.parent) {
					return a.oldValue.$index - b.oldValue.$index;
				} else {
					return 0;
				}
			} else {
				const weightA = weights[a.entity] || weights.any;
				const weightB = weights[b.entity] || weights.any;
				return weightB - weightA;
			}

		});
	}

	private _applyAction(action: any) {
		let command = null;
		const entities = this.command.entity;
		const actions = this.command.type;
		const gantt = this._gantt;
		const methods = {};
		methods[entities.task] = {
			add: "addTask",
			get: "getTask",
			update: "updateTask",
			remove: "deleteTask",
			move: "moveTask",
			isExists: "isTaskExists"
		};
		methods[entities.link] = {
			add: "addLink",
			get: "getLink",
			update: "updateLink",
			remove: "deleteLink",
			isExists: "isLinkExists"
		};

		gantt.batchUpdate(function() {
			for (let i = 0; i < action.commands.length; i++) {
				command = action.commands[i];
				const method = methods[command.entity][command.type];
				const getMethod = methods[command.entity].get;
				const check = methods[command.entity].isExists;

				if (command.type === actions.add) {
					gantt[method](command.oldValue, command.oldValue.parent, command.oldValue.$local_index);
				} else if (command.type === actions.remove) {
					if (gantt[check](command.value.id)) {
						gantt[method](command.value.id);
					}
				} else if (command.type === actions.update) {
					const item = gantt[getMethod](command.value.id);
					for(const prop in command.value){
						if(!prop.startsWith("$") && !prop.startsWith("_")){
							item[prop] = command.value[prop];
						}
					}

					gantt[method](command.value.id);
				} else if (command.type === actions.move) {
					gantt[method](command.value.id, command.value.$local_index, command.value.parent);
					// GS-680: We should send the changes to the server after we undo vertical reorder
					gantt.callEvent("onRowDragEnd", [command.value.id]);
				}
			}
		});
	}
}