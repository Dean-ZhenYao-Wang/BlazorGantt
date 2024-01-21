export default function(gantt: any){

interface IBody extends HTMLElement {
	msRequestFullscreen?: () => void;
	mozRequestFullScreen?: () => void;
	webkitRequestFullscreen?: (ALLOW_KEYBOARD_INPUT: any) => void;
}


interface IConsole extends Console {
	warning?: (str: string) => void;
}

interface IDocument extends Document {
	fullscreenElement: Element;
	mozFullScreenElement?: Element;
	webkitFullscreenElement?: Element;
	msFullscreenElement?: Element;
	webkitFullscreenEnabled?: boolean;
	mozFullScreenEnabled?: boolean;
	msFullscreenEnabled?: boolean;
	msExitFullscreen?: () => void;
	mozCancelFullScreen?: () => void;
	webkitExitFullscreen?: () => void;
}

interface IElement extends Element {
	ALLOW_KEYBOARD_INPUT?: boolean;
}

interface IElementSizes extends ISizes {
	modified: boolean;
}

interface ISizes {
	width: null | string;
	height: null | string;
	top: null | string;
	left: null | string;
	position: null | string;
	zIndex: null | number;
}

function isExpanded() {
	const element = ((document as IDocument).fullscreenElement ||
		(document as IDocument).mozFullScreenElement ||
		(document as IDocument).webkitFullscreenElement ||
		(document as IDocument).msFullscreenElement);
	return !!(element && element === document.body);
}

function isFullscreenAvailable() {
	try {
		return (document as IDocument).fullscreenEnabled ||
			(document as IDocument).webkitFullscreenEnabled ||
			(document as IDocument).mozFullScreenEnabled ||
			(document as IDocument).msFullscreenEnabled;
	} catch (e) {
		console.error("Fullscreen is not available:", e); // tslint:disable-line:no-console
	}
}

const state = gantt.$services.getService("state");
state.registerProvider("fullscreen", () => {
	if (isFullscreenAvailable()){
		return { fullscreen: isExpanded() };
	} else {
		return undefined;
	}
});

let backupBodyPadding = {
	overflow: null,
	padding: null,
	paddingTop: null,
	paddingRight: null,
	paddingBottom: null,
	paddingLeft: null
};

const backupElementSizes: IElementSizes = {
	width: null,
	height: null,
	top: null,
	left: null,
	position: null,
	zIndex: null,
	modified: false
};

let backupPositioning = null;
function resetParentPositioning(root){
	let parent = root.parentNode;
	const positions = [];
	while(parent && parent.style){
		positions.push({
			element: parent,
			originalPositioning: parent.style.position
		});
		parent.style.position = "static";
		parent = parent.parentNode;
	}
	return positions;
}

function restoreParentPositioning(positions: any[]){
	positions.forEach(record => {
		record.element.style.position = record.originalPositioning;
	});
}

// expand gantt root element to fullscreen automatically
function setFullScreenSizes() {
	const root = gantt.ext.fullscreen.getFullscreenElement();
	const body = document.body;
	updateSizes(root.style, backupElementSizes);
	backupBodyPadding = {
		overflow: body.style.overflow,
		padding: body.style.padding ? body.style.padding : null,
		paddingTop: body.style.paddingTop ? body.style.paddingTop : null,
		paddingRight: body.style.paddingRight ? body.style.paddingRight : null,
		paddingBottom: body.style.paddingBottom ? body.style.paddingBottom : null,
		paddingLeft: body.style.paddingLeft ? body.style.paddingLeft : null
	};

	if (body.style.padding) {
		body.style.padding = "0";
	}
	if (body.style.paddingTop) {
		body.style.paddingTop = "0";
	}
	if (body.style.paddingRight) {
		body.style.paddingRight = "0";
	}
	if (body.style.paddingBottom) {
		body.style.paddingBottom = "0";
	}
	if (body.style.paddingLeft) {
		body.style.paddingLeft = "0";
	}

	body.style.overflow = "hidden";

	root.style.width = "100vw";
	root.style.height = "100vh";
	root.style.top = "0px";
	root.style.left = "0px";
	root.style.position = "absolute";
	root.style.zIndex = 1;
	backupElementSizes.modified = true;
	backupPositioning = resetParentPositioning(root);
}

function restoreSizes() {
	const root = gantt.ext.fullscreen.getFullscreenElement();
	const body = document.body;
	if (backupElementSizes.modified) {
		if (backupBodyPadding.padding) {
			body.style.padding = backupBodyPadding.padding;
		}
		if (backupBodyPadding.paddingTop) {
			body.style.paddingTop = backupBodyPadding.paddingTop;
		}
		if (backupBodyPadding.paddingRight) {
			body.style.paddingRight = backupBodyPadding.paddingRight;
		}
		if (backupBodyPadding.paddingBottom) {
			body.style.paddingBottom = backupBodyPadding.paddingBottom;
		}
		if (backupBodyPadding.paddingLeft) {
			body.style.paddingLeft = backupBodyPadding.paddingLeft;
		}

		body.style.overflow = backupBodyPadding.overflow;
		backupBodyPadding = {
			overflow: null,
			padding: null,
			paddingTop: null,
			paddingRight: null,
			paddingBottom: null,
			paddingLeft: null
		};
		updateSizes(backupElementSizes, root.style);
		backupElementSizes.modified = false;
	}
	restoreParentPositioning(backupPositioning);
	backupPositioning = null;
}

function updateSizes(source: ISizes, target: ISizes) {
	target.width = source.width;
	target.height = source.height;
	target.top = source.top;
	target.left = source.left;
	target.position = source.position;
	target.zIndex = source.zIndex;
}

function addDOMEvents() {
	gantt.event(document, "webkitfullscreenchange", onFullScreenChange);
	gantt.event(document, "mozfullscreenchange", onFullScreenChange);
	gantt.event(document, "MSFullscreenChange", onFullScreenChange);
	// For IE on Win 10
	gantt.event(document, "fullscreenChange", onFullScreenChange);
	gantt.event(document, "fullscreenchange", onFullScreenChange);
}

let expandGantt = false;
function onFullScreenChange() {
	if (!gantt.$container) {
		// do nothing if gantt is not yet initialized
		return;
	}
	let event: "onExpand" | "onCollapse";
	const isBodyExpanded = isExpanded();

	if (isBodyExpanded) {
		if (expandGantt) {
			event = "onExpand";
			setFullScreenSizes();
		}
	} else if (expandGantt) {
		expandGantt = false;
		event = "onCollapse";
		restoreSizes();
	}
	setTimeout(() => {
		gantt.render();
	});
	setTimeout(() => {
		gantt.callEvent(event, [gantt.ext.fullscreen.getFullscreenElement()]);
	});
}

function cantFullscreen() {
	if (!gantt.$container) { // check is gantt initialized or not
		return true;
	}
	if (!gantt.ext.fullscreen.getFullscreenElement()) {
		return true;
	}
	if (!isFullscreenAvailable()) {
		// tslint:disable-next-line: no-console
		const method = (console as IConsole).warning || console.log;
		method("The `fullscreen` feature not being allowed, or full-screen mode not being supported");
		return true;
	}
	return false;
}

gantt.ext.fullscreen = {
	expand(): void {
		if (cantFullscreen()) {
			return;
		}

		if (isExpanded()) {
			return;
		}

		if (!gantt.callEvent("onBeforeExpand", [this.getFullscreenElement()])) {
			return;
		}
		expandGantt = true;

		// we switch body to fullscreen and then expand fullscreen element to viewport
		// we do it to correct display common elements: lightboxes, tooltip etc.
		const element = document.body as IBody;
		const requestArguments = element.webkitRequestFullscreen ?
			[(Element as unknown as IElement).ALLOW_KEYBOARD_INPUT] : [];

		const requestFullscreen = element.msRequestFullscreen ||
			element.mozRequestFullScreen ||
			element.webkitRequestFullscreen ||
			element.requestFullscreen;

		if (requestFullscreen) {
			requestFullscreen.apply(element, requestArguments);
		}
	},
	collapse(): void {
		if (cantFullscreen()) {
			return;
		}

		if (!isExpanded()) {
			return;
		}

		if (!gantt.callEvent("onBeforeCollapse", [this.getFullscreenElement()])) {
			return;
		}

		const requestExitFullscreen = (document as IDocument).msExitFullscreen ||
			(document as IDocument).mozCancelFullScreen ||
			(document as IDocument).webkitExitFullscreen ||
			(document as IDocument).exitFullscreen;

		if (requestExitFullscreen) {
			requestExitFullscreen.apply(document);
		}
	},
	toggle(): void {
		if (cantFullscreen()) {
			return;
		}
		if (!isExpanded()) {
			this.expand();
		} else {
			this.collapse();
		}

	},
	getFullscreenElement(): HTMLElement {
		return gantt.$root;
	},
};

gantt.expand = function() {
	gantt.ext.fullscreen.expand();
};

gantt.collapse = function(){
	gantt.ext.fullscreen.collapse();
};

gantt.attachEvent("onGanttReady", addDOMEvents);

}