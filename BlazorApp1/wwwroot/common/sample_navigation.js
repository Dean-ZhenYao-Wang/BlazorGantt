function addCodeHighlight() {
	const codeMirror = document.querySelector(".CodeMirror");
	if (codeMirror) codeMirror.parentNode.removeChild(codeMirror);

	const editor = CodeMirror.fromTextArea(document.querySelector("textarea"), {
		mode: "htmlmixed",
		styleActiveLine: true,
		lineNumbers: true,
		lineWrapping: true,
		matchBrackets: true,
		extraKeys: { "Ctrl-Space": "autocomplete" },
	});
}

function addApiReference(folder, file) {
	//clear when switching to another sample:
	const propertiesSection = document.querySelector(".properties");
	const templatesSection = document.querySelector(".templates");
	const methodsSection = document.querySelector(".methods");
	const eventsSection = document.querySelector(".events");
	const otherSection = document.querySelector(".other");
	const suggestionsSection = document.querySelector(".suggestions");
	const filesSection = document.querySelector(".files");

	propertiesSection.innerHTML = "";
	templatesSection.innerHTML = "";
	methodsSection.innerHTML = "";
	eventsSection.innerHTML = "";
	otherSection.innerHTML = "";
	suggestionsSection.innerHTML = "";
	filesSection.innerHTML = "";

	const svg = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
	<g id="arrow-bottom-right 1">
	<path id="Vector" d="M3.205 9.5L2.5 8.795L7.795 3.5L4.5 3.5L4.5 2.5L9.5 2.5L9.5 7.5L8.5 7.5L8.5 4.205L3.205 9.5Z" fill="#0288D1" fill-opacity="0.7"/>
	</g>
	</svg>`;
	function appendAdditionalFiles(line, type) {
		if (line.indexOf("dhtmlxgantt") > -1) {
			return;
		}
		let linkProperty = "src";
		if (type == "css") {
			linkProperty = "href";
		}
		type = "." + type;

		let srcIndex = line.indexOf(linkProperty);
		if (srcIndex > -1) {
			let leftUrlPart = line.slice(srcIndex + type.length + 2);
			let rightUrlPart = null;
			let filename = null;
			if (leftUrlPart.indexOf("googleapis") > -1) {
				rightUrlPart = leftUrlPart.split('"')[0];
				filename = "Google API file";
			} else {
				rightUrlPart = leftUrlPart.split(type)[0] + type;
				let fileNameIndex = rightUrlPart.lastIndexOf("/");
				filename = rightUrlPart.slice(fileNameIndex + 1);
				if (leftUrlPart.indexOf("Chart.js") > -1) {
					rightUrlPart += leftUrlPart.split(type)[1] + type;
					filename = "Chart.js";
				}
			}

			let url = null;
			if (rightUrlPart.indexOf("http") > -1) {
				url = rightUrlPart;
			} else {
				let currentFolder = location.href.substring(
					0,
					location.href.lastIndexOf("/samples")
				);
				url = currentFolder + "/samples/" + folder + "/" + rightUrlPart;
			}

			let fileElement = document.createElement("div");
			fileElement.innerHTML = `<div class='api-link'><a href="${url}" target='_blank'>${filename} ${svg}</a></div>`;
			filesSection.appendChild(fileElement);
		}
	}

	let lines = atob(sampleSource[folder][file]).split("\n");
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];

		if (line.indexOf("<title>") > -1) {
			let sampleName = line.split("<title>").join("").split("</title>").join("").trim();
			let suggestionsElement = document.createElement("div");
			suggestionsElement.innerHTML = `<div class='api-link'><a href = \"https://www.google.com/search?q=${sampleName} site:docs.dhtmlx.com/gantt\" target='_blank' >${sampleName} ${svg}</a></div>`;
			suggestionsSection.appendChild(suggestionsElement);
		}
		if (line.indexOf("<script") > -1) {
			appendAdditionalFiles(line, "js");
		}
		if (line.indexOf("<link") > -1) {
			appendAdditionalFiles(line, "css");
		}

		let indexStart = line.indexOf("gantt.");
		if (indexStart > -1) {
			let leftCut = line.slice(indexStart);
			let middleIndex = leftCut.indexOf(".");
			let middleCut = leftCut.slice(middleIndex + 1);
			// second occurence
			if (middleCut.indexOf("gantt.") > -1) {
				lines.push(middleCut);
				middleCut = middleCut.split("gantt.")[0];
			}

			if (middleCut.indexOf("config.") > -1) {
				let configValue = parseLine(middleCut, "config.");
				if (
					!configValue ||
					isCustomProperty("gantt.config." + configValue)
				) {
					continue;
				}

				let configElement = document.createElement("div");
				configElement.innerHTML = `<div class='api-link'><a href = https://docs.dhtmlx.com/gantt/api__gantt_${configValue}_config.html target='_blank'>${configValue} ${svg}</a></div>`;

				if (
					checkDuplicateNodes(
						propertiesSection,
						configElement.innerHTML
					)
				) {
					propertiesSection.appendChild(configElement);
				}
			} else if (middleCut.indexOf("templates.") > -1) {
				let templateValue = parseLine(middleCut, "templates.");
				if (
					!templateValue ||
					isCustomProperty("gantt.templates." + templateValue)
				) {
					continue;
				}

				let templateElement = document.createElement("div");
				templateElement.innerHTML = `<div class='api-link'><a href = https://docs.dhtmlx.com/gantt/api__gantt_${templateValue}_template.html target='_blank'>${templateValue} ${svg}</a></div>`;

				if (
					checkDuplicateNodes(
						templatesSection,
						templateElement.innerHTML
					)
				) {
					templatesSection.appendChild(templateElement);
				}
			} else if (middleCut.indexOf("ext.") > -1) {
				let extValue = parseLine(middleCut, "ext.");
				if (!extValue) {
					continue;
				}
				let postfix = "_ext";
				if (extValue == "zoom") {
					postfix = "";
				}
				if (extValue == "inlineEditors") {
					extValue = "inline_editors";
				}

				const extElement = document.createElement("div");
				extElement.innerHTML = `<div class='api-link'><a href = https://docs.dhtmlx.com/gantt/desktop__${extValue}${postfix}.html target='_blank'>${extValue} ${svg}</a></div>`;

				if (checkDuplicateNodes(otherSection, extElement.innerHTML)) {
					otherSection.appendChild(extElement);
				}
			} else if (middleCut.indexOf("attachEvent") > -1) {
				const eventValue = parseLine(middleCut, "attachEvent(", 13);
				if (
					!eventValue ||
					isCustomProperty("gantt.events." + eventValue)
				) {
					continue;
				}
				if (middleCut.indexOf("$resourcesStore") > -1) {
					continue;
				}

				const eventElement = document.createElement("div");
				eventElement.innerHTML = `<div class='api-link'><a href = https://docs.dhtmlx.com/gantt/api__gantt_${eventValue.toLowerCase()}_event.html target='_blank'>${eventValue} ${svg}</a></div>`;

				if (
					checkDuplicateNodes(eventsSection, eventElement.innerHTML)
				) {
					eventsSection.appendChild(eventElement);
				}
			} else if (
				middleCut.indexOf("date.") > -1 ||
				middleCut.indexOf("date[") > -1
			) {
				let indexOfDate = middleCut.indexOf("date.");
				if (indexOfDate < 0) {
					indexOfDate = middleCut.indexOf("date[");
				}

				let tmpLeft = middleCut.slice(indexOfDate + 5);
				let tmpRight = tmpLeft.split("=")[0];
				let dateProcessValue = tmpRight
					.replace(/[\W]+/g, ".")
					.split(".")[0]
					.match(/\w/g)
					.join("");

				const dateProcessElement = document.createElement("div");
				dateProcessElement.innerHTML = `<div class='api-link'><a href = https://docs.dhtmlx.com/gantt/api__gantt_date_other.html target='_blank'>gantt.date.${dateProcessValue} ${svg}</a></div>`;

				if (
					checkDuplicateNodes(
						otherSection,
						dateProcessElement.innerHTML
					)
				) {
					otherSection.appendChild(dateProcessElement);
				}
			} else if (
				middleCut.indexOf("locale.") > -1 ||
				middleCut.indexOf("i18n.") > -1
			) {
				const localizationElement = document.createElement("div");
				localizationElement.innerHTML = `<div class='api-link'><a href = https://docs.dhtmlx.com/gantt/desktop__localization.html target='_blank'>Localization ${svg}</a></div>`;

				if (
					checkDuplicateNodes(
						otherSection,
						localizationElement.innerHTML
					)
				) {
					otherSection.appendChild(localizationElement);
				}

				const localeElement = document.createElement("div");
				localeElement.innerHTML = `<div class='api-link'><a href = https://docs.dhtmlx.com/gantt/api__gantt_locale_other.html target='_blank'>gantt.locale ${svg}</a></div>`;

				if (
					checkDuplicateNodes(otherSection, localeElement.innerHTML)
				) {
					otherSection.appendChild(localeElement);
				}
			} else if (middleCut.indexOf("utils") > -1) {
				const utilsElement = document.createElement("div");
				utilsElement.innerHTML = `<div class='api-link'><a href = https://docs.dhtmlx.com/gantt/api__gantt_utils_other.html target='_blank'>utils ${svg}</a></div>`;

				if (checkDuplicateNodes(otherSection, utilsElement.innerHTML)) {
					otherSection.appendChild(utilsElement);
				}
			} else if (middleCut.indexOf("(") > -1) {
				let tmpRight = middleCut.split("(")[0];
				let tmpValue = tmpRight
					.replace(/[\W]+/g, ".")
					.split(".")[0]
					.match(/\w/g);
				let methodValue = null;
				if (tmpValue && tmpValue[0]) {
					methodValue = tmpValue.join("");
				} else {
					continue;
				}

				if (isCustomProperty("gantt." + methodValue)) {
					continue;
				}

				let methodElement = document.createElement("div");
				methodElement.innerHTML = `<div class='api-link'><a href = https://docs.dhtmlx.com/gantt/api__gantt_${methodValue.toLowerCase()}.html target='_blank'>${methodValue} ${svg}</a></div>`;
				if (methodValue == "ignore_time") {
					methodElement.innerHTML = `<div class='api-link'><a href = https://docs.dhtmlx.com/gantt/desktop__custom_scale.html target='_blank'>${methodValue} ${svg}</a></div>`;
				}

				if (
					checkDuplicateNodes(methodsSection, methodElement.innerHTML)
				) {
					methodsSection.appendChild(methodElement);
				}
			}
		}
	}
}

function parseLine(middleCut, value, length) {
	length = length || value.length;

	let tmpLeft = middleCut.slice(middleCut.indexOf(value) + length);
	let tmpRight = tmpLeft.split("=")[0];
	let tmpValue = tmpRight.replace(/[\W]+/g, ".").split(".")[0].match(/\w/g);

	if (tmpValue && tmpValue[0]) {
		return tmpValue.join("");
	}

	return false;
}

function checkDuplicateNodes(el, content) {
	let children = el.childNodes;
	for (let i = 0; i < children.length; i++) {
		if (children[i].innerHTML == content) {
			return false;
		}
	}
	return true;
}

// Do not generate links for custom properties
function isCustomProperty(value) {
	let customProperties = [
		"gantt.config.add_column",
		"gantt.config.font_width_ratio",
		"gantt.config.show_drag_vertical",
		"gantt.config.show_drag_dates",
		"gantt.config.drag_label_width",
		"gantt.templates.drag_date",
		"gantt.config.drag_date",
		"gantt.config.show_slack",
		"gantt.config.scroll_position",
		"gantt.templates.drag_date",
		"gantt.$container",
		"gantt.performAction",
	];
	if (customProperties.indexOf(value) > -1) {
		return true;
	} else {
		return false;
	}
}

function addCover() {
	let parent = document.querySelector(".demo");
	let frame = document.querySelector("#x6");
	let svg = `<div class="loading"><svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z" class="spinner"/></svg></div>`;
	let loader = document.querySelector(".loading");
	if (loader){	
		loader.remove();
	} else {
		parent.insertAdjacentHTML("afterbegin",svg);
	}
	frame.style.display = "none";
}

function toggle_demo(type) {
	let views = {};

	views.demo = document.querySelector("#x6");
	views.code = document.querySelector("#source_code");
	views.api = document.querySelector("#api_reference");

	for (let el in views) {
		views[el].style.display = "none";
	}
	views[type].style.display = "block";

	let tabs = {};

	tabs.demo = document.getElementsByClassName("show_demo");
	tabs.code = document.getElementsByClassName("show_code");
	tabs.api = document.getElementsByClassName("show_api");

	for (let el in tabs) {
		for (let i = 0; i < tabs[el].length; i++) {
			tabs[el][i].classList.remove("active");
		}
	}

	for (let i = 0; i < tabs[type].length; i++) {
		tabs[type][i].classList.add("active");
	}

	if (type == "code") {
		addCodeHighlight();
	}
}

function is_mobile() {
	let is_mobile_device = navigator.userAgent.match(
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i
	)
		? true
		: false;

	return is_mobile_device;
}

function toggle_list() {
	let pageAsideElem = document.getElementById("page-aside");

	if (pageAsideElem.classList.contains("aside-state") && is_mobile()) {
		bodyScrollLock.enableBodyScroll(pageAsideElem);
	} else {
		bodyScrollLock.disableBodyScroll(pageAsideElem);
	}

	pageAsideElem.classList.toggle("aside-state");
}

function toggle_mobile_menu(e) {
	if (e.target.classList.contains("page-aside")) {
		toggle_list();
	}
}

function filterSamples(value) {
	let links = document.querySelector(".links");
	let folders = links.querySelectorAll("input");

	for (let i = 0; i < folders.length; i++) {
		folders[i].checked = !!value;
	}

	let files = links.querySelectorAll(".link");
	let results = false;
	let showWithChildren = {};

	for (let i = 0; i < files.length; i++) {
		let file = files[i];
		if (
			value &&
			file.innerHTML.toLowerCase().indexOf(value.toLowerCase()) < 0
		) {
			file.style.display = "none";
		} else {
			file.style.display = "";
			results = true;
			let relatedFolder =
				file.parentNode.parentNode.querySelector("label");
			if (relatedFolder) {
				showWithChildren[relatedFolder.innerHTML] = true;
			}
		}
	}

	let labels = links.querySelectorAll("label");
	for (let i = 0; i < labels.length; i++) {
		if (
			value &&
			labels[i].innerHTML.toLowerCase().indexOf(value.toLowerCase()) < 0
		) {
			labels[i].classList.add("hidden");
		} else {
			labels[i].classList.remove("hidden");
			let childSamples = labels[i].parentNode.querySelectorAll(".link");
			for (let j = 0; j < childSamples.length; j++) {
				childSamples[j].style.display = "";
			}
			results = true;
		}
		if (showWithChildren[labels[i].innerHTML]) {
			labels[i].classList.remove("hidden");
			results = true;
		}
	}

	let noResults = document.querySelector(".no_results");

	if (results) {
		noResults.classList.remove("visible");
	} else {
		noResults.classList.add("visible");
	}
}

function isFolder() {
	const folderName = false;
	const path = window.location.pathname;
	const sampleFolders = [
		"01_initialization",
		"02_extensions",
		"03_scales",
		"04_customization",
		"05_lightbox",
		"06_skins",
		"07_grid",
		"08_api",
		"09_worktime",
		"10_layout",
		"11_resources",
		"20_multiple",
	];
	sampleFolders.forEach(function (folder) {
		if (path.indexOf(folder) > -1) {
			folderName = folder;
		}
	});
	return folderName;
}

function loadSampleFromParams() {
	const paramString = window.location.search || "sample='01_initialization/01_basic_init.html'";

	let folder = isFolder();
	if (folder) {
		let sample = document.querySelector("[data-folder='" + folder + "']");
		if (sample) {
			sample.click();
		}
	}

	let params = paramString.split("&");
	params.forEach(function (parameter) {
		if (parameter.indexOf("filter=") > -1) {
			let filter = decodeURI(parameter.split("filter=")[1])
				.replace(/"/g, "")
				.replace(/'/g, "");
			document.querySelector(".search-field").value = filter;
			filterSamples(filter);
		}
		if (parameter.indexOf("sample=") > -1) {
			let link = decodeURI(parameter.split("sample=")[1])
				.replace(/"/g, "")
				.replace(/'/g, "");
			let path = link.split("/");
			if (path[0] == ".") {
				path[0] =
					document.querySelector("[data-folder]").dataset.folder;
			}
			let sample = document.querySelector(
				"[data-folder='" + path[0] + "'][id='" + path[1] + "']"
			);

			if (sample) {
				sample.click();
				setTimeout(function () {
					sample.parentNode.parentNode.querySelector("input").checked = true;
					let menu = document.querySelector(".links");
					let offset = menu.getBoundingClientRect().top;
					let folderCoordinates = sample.parentNode.parentNode.getBoundingClientRect();
					menu.scrollTo(0, folderCoordinates.y - offset);
				}, 4);
			}
		}
	});
}

function shareSample() {
	removeShareDialog();

	const currentUrl =
			window.location.protocol +
			"//" +
			window.location.host +
			window.location.pathname,
		currentSample = document.querySelector("#current_sample"),
		sample = currentSample.attributes.href.value,
		filter = document.querySelector(".search-field").value,
		link = currentUrl + "?sample='" + sample + "'&filter='" + filter + "'";

	const shareElement = document.createElement("div");
	shareElement.className = "share_dialog";

	const shareElementInside = document.createElement("div");
	shareElementInside.className = "share_dialog-field";

	const shareText = document.createElement("div");
	shareText.className = "share_text";

	shareElement.appendChild(shareText);

	const shareLink = document.createElement("input");
	shareLink.className = "share_link";
	shareLink.value = link;
	shareElementInside.appendChild(shareLink);

	const shareButton = document.createElement("input");
	shareButton.className = "share_button";
	shareButton.type = "button";
	shareButton.value = "Copy link";

	shareButton.onclick = function () {
		navigator.clipboard.writeText(shareLink.value);
		shareButton.value = "Copied!";
	};

	shareElementInside.appendChild(shareButton);
	shareElement.appendChild(shareElementInside);
	document.body.appendChild(shareElement);
}

function removeShareDialog() {
	const shareElement = document.querySelector(".share_dialog");

	if (shareElement) {
		shareElement.innerHTML = "";
		shareElement.parentNode.removeChild(shareElement);
	}
}

function navDropdown() {
	const navDropdownElement = document.getElementById("nav-dropdown-list");
	navDropdownElement.classList.toggle("opened");
}

function toggle_dropdown(e) {
	navDropdown();
	document.getElementById("nav-dropdown-chosen").innerText = e.target.innerText;
}

function addHref() {
	let links = document.querySelectorAll(".link");
	for (let i = 0; i < links.length; i++) {
		links[i].href = `./${links[i].dataset.folder}/${links[i].id}`;
	}
}


document.addEventListener("DOMContentLoaded", addHref);
