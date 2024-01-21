export default function(gantt: any) {

	gantt.ext = gantt.ext || {};

	gantt.ext.export_api = gantt.ext.export_api || {

		_apiUrl: "https://export.dhtmlx.com/gantt",

		getNodeJSTransport(url: string): { module: {request: any}, defaultPort: number } {
			const protocol = url.split("://")[0];
			let module;
			let defaultPort;
			switch (protocol) {
				case "https":
					module = require("https");
					defaultPort = 443;
					break;
				case "http":
					module = require("http");
					defaultPort = 80;
					break;
				default:
					throw new Error(`Unsupported protocol: ${protocol}, url: ${url}`);
			}
			return {
				module,
				defaultPort
			};
		},

		_prepareConfigPDF(config, type){
			if (config && config.raw) {
				let previousDateRage = null;
				if (config.start && config.end){
					previousDateRage = {
						start_date: gantt.config.start_date,
						end_date: gantt.config.end_date,
					};
					gantt.config.start_date = gantt.date.str_to_date(gantt.config.date_format)(config.start);
					gantt.config.end_date = gantt.date.str_to_date(gantt.config.date_format)(config.end);
				}

				config = gantt.mixin(config, {
					name: "gantt." + type, data: gantt.ext.export_api._serializeHtml()
				});

				if (previousDateRage){
					gantt.config.start_date = previousDateRage.start_date;
					gantt.config.end_date = previousDateRage.end_date;
				}
			} else {
				config = gantt.mixin((config || {}), {
					name: "gantt." + type,
					data: gantt.ext.export_api._serializeAll(),
					config: gantt.config
				});
				gantt.ext.export_api._fixColumns(config.config.columns);
			}
			
			gantt.ext.export_api._sendToExport(config, type);
		},

		exportToPDF(config) {
			gantt.ext.export_api._prepareConfigPDF(config, "pdf");
		},

		exportToPNG(config) {
			gantt.ext.export_api._prepareConfigPDF(config, "png");
		},


		exportToICal(config) {
			config = gantt.mixin((config || {}), {
				name: "gantt.ical",
				data: gantt.ext.export_api._serializePlain().data,
			});
			gantt.ext.export_api._sendToExport(config, "ical");
		},

		exportToExcel(config) {
			config = config || {};

			let tasks;
			let dates;
			let state;
			let scroll;
			// GS-2124, we need to get all task nodes to correctly obtain the colors
			const smartRendering = gantt.config.smart_rendering;
			if (config.visual === "base-colors"){
				gantt.config.smart_rendering = false;
			}

			if (config.start || config.end) {
				state = gantt.getState();
				dates = [gantt.config.start_date, gantt.config.end_date];
				scroll = gantt.getScrollState();
				const convert = gantt.date.str_to_date(gantt.config.date_format);
				tasks = gantt.eachTask;

				if (config.start){
					gantt.config.start_date = convert(config.start);
				}
				if (config.end){
					gantt.config.end_date = convert(config.end);
				}

				gantt.render();
				gantt.config.smart_rendering = smartRendering;

				gantt.eachTask = gantt.ext.export_api._eachTaskTimed(gantt.config.start_date, gantt.config.end_date);
			} else if (config.visual === "base-colors"){
				gantt.render();
				gantt.config.smart_rendering = smartRendering;
			}

			gantt._no_progress_colors = config.visual === "base-colors";

			let data = null;
			if (!gantt.env.isNode) {
				data = gantt.ext.export_api._serializeTable(config).data;
			}

			config = gantt.mixin(config, {
				name: "gantt.xlsx",
				title: "Tasks",
				data,
				columns: gantt.ext.export_api._serializeColumns({ rawDates: true }),
			});

			if (config.visual){
				config.scales = gantt.ext.export_api._serializeScales(config);
			}

			gantt.ext.export_api._sendToExport(config, "excel");

			if (config.start || config.end) {
				gantt.config.start_date = state.min_date;
				gantt.config.end_date = state.max_date;
				gantt.eachTask = tasks;

				gantt.render();
				gantt.scrollTo(scroll.x, scroll.y);

				gantt.config.start_date = dates[0];
				gantt.config.end_date = dates[1];
			}
		},

		exportToJSON(config) {
			config = gantt.mixin((config || {}), {
				name: "gantt.json",
				data: gantt.ext.export_api._serializeAll(),
				config: gantt.config,
				columns: gantt.ext.export_api._serializeColumns(),
				worktime: gantt.ext.export_api._getWorktimeSettings(),
			});
			gantt.ext.export_api._sendToExport(config, "json");
		},


		importFromExcel(config) {
			try {
				const formData = config.data;
				if (formData instanceof FormData) {

				} else if (formData instanceof File) {
					const data = new FormData();
					data.append("file", formData);
					config.data = data;
				}
			} catch (error) {}
			if (gantt.env.isNode) {
				gantt.ext.export_api._nodejsImportExcel(config);
			} else {
				gantt.ext.export_api._sendImportAjaxExcel(config);
			}
		},

		importFromMSProject(config) {
			const formData = config.data;

			try {
				if (formData instanceof FormData) {

				} else if (formData instanceof File) {
					const data = new FormData();
					data.append("file", formData);
					config.data = data;
				}
			} catch (error) {}
			if (gantt.env.isNode) {
				gantt.ext.export_api._nodejsImportMSP(config);
			} else {
				gantt.ext.export_api._sendImportAjaxMSP(config);
			}
		},

		importFromPrimaveraP6(config) {
			config.type = "primaveraP6-parse";
			return gantt.importFromMSProject(config);
		},
		exportToMSProject(config) {
			config = config || {};
			config.skip_circular_links = config.skip_circular_links === undefined ? true : !!config.skip_circular_links;

			const oldXmlFormat = gantt.templates.xml_format;
			const oldFormatDate = gantt.templates.format_date;
			const oldXmlDate = gantt.config.xml_date;
			const oldDateFormat = gantt.config.date_format;

			const exportServiceDateFormat = "%d-%m-%Y %H:%i:%s";

			gantt.config.xml_date = exportServiceDateFormat;
			gantt.config.date_format = exportServiceDateFormat;
			gantt.templates.xml_format = gantt.date.date_to_str(exportServiceDateFormat);
			gantt.templates.format_date = gantt.date.date_to_str(exportServiceDateFormat);
			const data = gantt.ext.export_api._serializeAll();

			gantt.ext.export_api._customProjectProperties(data, config);

			gantt.ext.export_api._customTaskProperties(data, config);

			if (config.skip_circular_links) {
				gantt.ext.export_api._clearRecLinks(data);
			}

			config = gantt.ext.export_api._exportConfig(data, config);

			gantt.ext.export_api._sendToExport(config, config.type || "msproject");
			gantt.config.xml_date = oldXmlDate;
			gantt.config.date_format = oldDateFormat;
			gantt.templates.xml_format = oldXmlFormat;
			gantt.templates.format_date = oldFormatDate;

			gantt.config.$custom_data = null;
			gantt.config.custom = null;
		},

		exportToPrimaveraP6(config) {
			config = config || {};
			config.type = "primaveraP6";
			return gantt.exportToMSProject(config);
		},

		_nodejsImportExcel(config) {
			// tslint:disable-next-line no-implicit-dependencies
			const formDataInstance = require("form-data");

			const url = config.server || gantt.ext.export_api._apiUrl;
			const network = gantt.ext.export_api.getNodeJSTransport(url);
			const parts1 = url.split("://")[1];
			const parts2 = parts1.split("/")[0].split(":");
			const parts3 = parts1.split("/");

			const hostname = parts2[0];
			const port = parts2[1] || network.defaultPort;
			const path = "/" + parts3.slice(1).join("/");

			const options = {
				hostname,
				port,
				path,
				method: "POST",
				headers: {
					"X-Requested-With": "XMLHttpRequest"
				}
			};

			const formData = new formDataInstance();
			formData.append("file", config.data);
			formData.append("type", "excel-parse");
			formData.append("data", JSON.stringify({
				sheet: config.sheet || 0
			}));

			options.headers["Content-Type"] = formData.getHeaders()["content-type"];

			const req = network.module.request(options, function(res) {
				let resData = "";
				res.on("data", function(d) {
					resData += d;
				});
				res.on("end", function(d) {
					config.callback(resData.toString());
				});
			});

			req.on("error", function(error) {
				// tslint:disable-next-line no-console
				console.error(error);
			});
			formData.pipe(req);
		},
		_nodejsImportMSP(config) {

			// tslint:disable-next-line no-implicit-dependencies
			const formDataInstance = require("form-data");

			const url = config.server || gantt.ext.export_api._apiUrl;
			const network = gantt.ext.export_api.getNodeJSTransport(url);
			const parts1 = url.split("://")[1];
			const parts2 = parts1.split("/")[0].split(":");
			const parts3 = parts1.split("/");

			const hostname = parts2[0];
			const port = parts2[1] || network.defaultPort;
			const path = "/" + parts3.slice(1).join("/");

			const options = {
				hostname,
				port,
				path,
				method: "POST",
				headers: {
					"X-Requested-With": "XMLHttpRequest"
				}
			};

			const settings = {
				durationUnit: config.durationUnit || undefined,
				projectProperties: config.projectProperties || undefined,
				taskProperties: config.taskProperties || undefined,
			};

			const formData = new formDataInstance();
			formData.append("file", config.data);
			formData.append("type", config.type || "msproject-parse");
			formData.append("data", JSON.stringify(settings), options);

			options.headers["Content-Type"] = formData.getHeaders()["content-type"];

			const req = network.module.request(options, function(res) {
				let resData = "";
				res.on("data", function(d) {
					resData += d;
				});
				res.on("end", function(d) {
					config.callback(resData.toString());
				});
			});

			req.on("error", function(error) {
				// tslint:disable-next-line no-console
				console.error(error);
			});
			formData.pipe(req);
		},



		_fixColumns(columns) {
			for (let i = 0; i < columns.length; i++) {
				columns[i].label = columns[i].label || gantt.locale.labels["column_" + columns[i].name];
				if (typeof columns[i].width === "string") {
					columns[i].width = columns[i].width * 1;
				}
			}
		},


		_xdr(url, pack, cb) {
			if (gantt.env.isNode) {
				gantt.ext.export_api._nodejsPostRequest(url, pack, cb);
			} else {
				gantt.ajax.post(url, pack, cb);
			}
		},

		_nodejsPostRequest(url, pack, cb){
			const network = gantt.ext.export_api.getNodeJSTransport(url);

			const parts1 = url.split("://")[1];
			const parts2 = parts1.split("/")[0].split(":");
			const parts3 = parts1.split("/");

			const hostname = parts2[0];
			const port = parts2[1] || network.defaultPort;
			const path = "/" + parts3.slice(1).join("/");

			const options = {
				hostname,
				port,
				path,
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Length": JSON.stringify(pack).length
				}
			};

			const req = network.module.request(options, function(res) {
				const resData = [];
				res.on("data", function(d) {
					resData.push(d);
				});
				res.on("end", function(d) {
					cb(Buffer.concat(resData));
				});
			});

			req.on("error", function(error) {
				// tslint:disable-next-line no-console
				console.error(error);
			});

			req.write(JSON.stringify(pack));
			req.end();
		},

		_markColumns(base) {
			const columns = base.config.columns;
			if (columns){
				for (let i = 0; i < columns.length; i++) {
					if (columns[i].template){
						columns[i].$template = true;
					}
				}
			}
		},


		_sendImportAjaxExcel(config) {
			const url = config.server || gantt.ext.export_api._apiUrl;
			const store = config.store || 0;
			const formData = config.data;
			const callback = config.callback;

			formData.append("type", "excel-parse");
			formData.append("data", JSON.stringify({
				sheet: config.sheet || 0
			}));

			if (store){
				formData.append("store", store);
			}

			const xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function(e) {
				if (xhr.readyState === 4 && xhr.status === 0) {// network error
					if (callback) {
						callback(null);
					}
				}
			};

			xhr.onload = function() {
				const fail = xhr.status > 400;
				let info = null;

				if (!fail) {
					try {
						info = JSON.parse(xhr.responseText);
					} catch (e) { }
				}

				if (callback) {
					callback(info);
				}
			};

			xhr.open("POST", url, true);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.send(formData);
		},


		_ajaxToExport(data, type, callback) {
			delete data.callback;

			const url = data.server || gantt.ext.export_api._apiUrl;
			const pack = "type=" + type + "&store=1&data=" + encodeURIComponent(JSON.stringify(data));

			const cb = function(loader) {
				const xdoc = loader.xmlDoc || loader;
				const fail = xdoc.status > 400;
				let info = null;

				if (!fail) {
					try {
						info = JSON.parse(xdoc.responseText);
					} catch (e) { }
				}
				callback(info);
			};

			gantt.ext.export_api._xdr(url, pack, cb);
		},
		_serializableGanttConfig(config) {
			const result = gantt.mixin({}, config);

			if (result.columns) {
				result.columns = result.columns.map(function(col) {
					const copy = gantt.mixin({}, col);
					delete copy.editor;
					return copy;
				});
			}

			delete result.editor_types;
			return result;
		},

		_sendToExport(data, type) {
			const convert = gantt.date.date_to_str(gantt.config.date_format || gantt.config.xml_date);
			if (data.config) {
				data.config = gantt.copy(gantt.ext.export_api._serializableGanttConfig(data.config));
				gantt.ext.export_api._markColumns(data, type);

				if (data.config.start_date && data.config.end_date) {
					if (data.config.start_date instanceof Date) {
						data.config.start_date = convert(data.config.start_date);
					}
					if (data.config.end_date instanceof Date) {
						data.config.end_date = convert(data.config.end_date);
					}
				}
			}

			if (gantt.env.isNode) {
				const url = data.server || gantt.ext.export_api._apiUrl;
				const pack = {
					type,
					store: 0,
					data: JSON.stringify(data)
				};
				const callbackFunction = data.callback || function(response) {
					// tslint:disable-next-line no-console
					console.log(response);
				};

				return gantt.ext.export_api._xdr(url, pack, callbackFunction);
			}

			if (data.callback) {
				return gantt.ext.export_api._ajaxToExport(data, type, data.callback);
			}


			const form = gantt.ext.export_api._createHiddenForm();
			form.firstChild.action = data.server || gantt.ext.export_api._apiUrl;
			form.firstChild.childNodes[0].value = JSON.stringify(data);
			form.firstChild.childNodes[1].value = type;
			form.firstChild.submit();
		},

		_createHiddenForm() {
			if (!gantt.ext.export_api._hidden_export_form) {
				const t = gantt.ext.export_api._hidden_export_form = document.createElement("div");
				t.style.display = "none";
				t.innerHTML = "<form method='POST' target='_blank'><textarea name='data' style='width:0px; height:0px;' readonly='true'></textarea><input type='hidden' name='type' value=''></form>";
				document.body.appendChild(t);
			}
			return gantt.ext.export_api._hidden_export_form;
		},


		_copyObjectBase(obj) {
			const copy = {
				start_date: undefined,
				end_date: undefined
			};
			for (const key in obj) {
				if (key.charAt(0) === "$"){
					continue;
				}
				copy[key] = obj[key];
			}
			const formatDate = gantt.templates.xml_format || gantt.templates.format_date;

			copy.start_date = formatDate(copy.start_date);
			if (copy.end_date){
				copy.end_date = formatDate(copy.end_date);
			}

			return copy;
		},


		_color_box: null,
		_color_hash: {},

		_getStyles(css) {
			if (!gantt.ext.export_api._color_box) {
				gantt.ext.export_api._color_box = document.createElement("DIV");
				gantt.ext.export_api._color_box.style.cssText = "position:absolute; display:none;";
				document.body.appendChild(gantt.ext.export_api._color_box);
			}
			if (gantt.ext.export_api._color_hash[css]){
				return gantt.ext.export_api._color_hash[css];
			}

			gantt.ext.export_api._color_box.className = css;
			const color = gantt.ext.export_api._getColor(gantt.ext.export_api._color_box, "color");
			const backgroundColor = gantt.ext.export_api._getColor(gantt.ext.export_api._color_box, "backgroundColor");
			return (gantt.ext.export_api._color_hash[css] = color + ";" + backgroundColor);
		},


		_getMinutesWorktimeSettings(parsedRanges) {
			const minutes = [];
			parsedRanges.forEach(function(range) {
				minutes.push(range.startMinute);
				minutes.push(range.endMinute);
			});
			return minutes;
		},

		_getWorktimeSettings() {

			const defaultWorkTimes = {
				hours: [0, 24],
				minutes: null,
				dates: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true }
			};

			let time;
			if (!gantt.config.work_time) {
				time = defaultWorkTimes;
			} else {
				const wTime = gantt._working_time_helper;
				if (wTime && wTime.get_calendar) {
					time = wTime.get_calendar();
				} else if (wTime) {
					time = {
						hours: wTime.hours,
						minutes: null,
						dates: wTime.dates
					};
				} else if (gantt.config.worktimes && gantt.config.worktimes.global) {
					const settings = gantt.config.worktimes.global;

					if (settings.parsed) {
						const minutes = gantt.ext.export_api._getMinutesWorktimeSettings(settings.parsed.hours);
						time = {
							hours: null,
							minutes,
							dates: {}
						};
						for (const i in settings.parsed.dates) {
							if (Array.isArray(settings.parsed.dates[i])) {
								time.dates[i] = gantt.ext.export_api._getMinutesWorktimeSettings(settings.parsed.dates[i]);
							} else {
								time.dates[i] = settings.parsed.dates[i];
							}
						}
					} else {
						time = {
							hours: settings.hours,
							minutes: null,
							dates: settings.dates
						};
					}

				} else {
					time = defaultWorkTimes;
				}
			}

			return time;
		},


		_eachTaskTimed(start, end) {
			return function(code, parent, master) {
				parent = parent || gantt.config.root_id;
				master = master || gantt;

				const branch = gantt.getChildren(parent);
				if (branch){
					for (let i = 0; i < branch.length; i++) {
						const item = gantt._pull[branch[i]];
						if ((!start || item.end_date > start) && (!end || item.start_date < end)){
							code.call(master, item);
						}

						if (gantt.hasChild(item.id)){
							gantt.eachTask(code, item.id, master);
						}
					}
				}
			};
		},


		// patch broken json serialization in gantt 2.1
		_originalCopyObject: gantt.json._copyObject,


		_copyObjectPlain(obj) {
			const text = gantt.templates.task_text(obj.start_date, obj.end_date, obj);

			const copy = gantt.ext.export_api._copyObjectBase(obj);
			copy.text = text || copy.text;

			return copy;
		},

		_getColor(node, style) {
			const value = node.currentStyle ? node.currentStyle[style] : getComputedStyle(node, null)[style];
			const rgb = value.replace(/\s/g, "").match(/^rgba?\((\d+),(\d+),(\d+)/i);
			return ((rgb && rgb.length === 4) ?
				("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
				("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
				("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : value).replace("#", "");
		},


		// excel serialization
		_copyObjectTable(obj) {
			// Excel interprets UTC time as local time in every timezone, send local time instead of actual UTC time.
			// https://github.com/SheetJS/js-xlsx/issues/126#issuecomment-60531614
			const toISOstring = gantt.date.date_to_str("%Y-%m-%dT%H:%i:%s.000Z");

			const copy = gantt.ext.export_api._copyObjectColumns(obj, gantt.ext.export_api._copyObjectPlain(obj));
			if (copy.start_date){
				copy.start_date = toISOstring(obj.start_date);
			}
			if (copy.end_date){
				copy.end_date = toISOstring(obj.end_date);
			}

			// private gantt._day_index_by_date was replaced by public gantt.columnIndexByDate in gantt 5.0
			const getDayIndex = gantt._day_index_by_date ? gantt._day_index_by_date : gantt.columnIndexByDate;

			copy.$start = getDayIndex.call(gantt, obj.start_date);
			copy.$end = getDayIndex.call(gantt, obj.end_date);

			// GS-2100. Correct bar position considering hidden cells
			let hiddenCells = 0;
			const scaleCellsWidth = gantt.getScale().width;
			if (scaleCellsWidth.indexOf(0) > -1) {
				let i = 0;
				for (i; i < copy.$start; i++) {
					if (!scaleCellsWidth[i]) {
						hiddenCells++;
					}
				}
				copy.$start -= hiddenCells;

				for (i; i < copy.$end; i++) {
					if (!scaleCellsWidth[i]) {
						hiddenCells++;
					}
				}
				copy.$end -= hiddenCells;
			}

			copy.$level = obj.$level;
			copy.$type = obj.$rendered_type;

			const tmps = gantt.templates;
			copy.$text = tmps.task_text(obj.start, obj.end_date, obj);
			copy.$left = tmps.leftside_text ? tmps.leftside_text(obj.start, obj.end_date, obj) : "";
			copy.$right = tmps.rightside_text ? tmps.rightside_text(obj.start, obj.end_date, obj) : "";

			return copy;
		},

		_copyObjectColors(obj) {
			const copy = gantt.ext.export_api._copyObjectTable(obj);

			const node = gantt.getTaskNode(obj.id);
			if (node && node.firstChild) {
				let color = gantt.ext.export_api._getColor((gantt._no_progress_colors ? node : node.firstChild), "backgroundColor");
				if (color === "363636"){
					color = gantt.ext.export_api._getColor(node, "backgroundColor");
				}

				copy.$color = color;
			} else if (obj.color){
				copy.$color = obj.color;
			}

			return copy;
		},

		_copyObjectColumns(obj, copy) {
			for (let i = 0; i < gantt.config.columns.length; i++) {
				const ct = gantt.config.columns[i].template;
				if (ct) {
					let val = ct(obj);
					if (val instanceof Date){
						val = gantt.templates.date_grid(val, obj);
					}
					copy["_" + i] = val;
				}
			}
			return copy;
		},

		_copyObjectAll(obj) {
			const copy = gantt.ext.export_api._copyObjectBase(obj);

			const templates = [
				"leftside_text",
				"rightside_text",
				"task_text",
				"progress_text",
				"task_class"
			];

			// serialize all text templates
			for (let i = 0; i < templates.length; i++) {
				const template = gantt.templates[templates[i]];
				if (template){
					copy["$" + i] = template(obj.start_date, obj.end_date, obj);
				}
			}

			gantt.ext.export_api._copyObjectColumns(obj, copy);
			copy.open = obj.$open;
			return copy;
		},


		_serializeHtml() {
			const smartScales = gantt.config.smart_scales;
			const smartRendering = gantt.config.smart_rendering;
			if (smartScales || smartRendering) {
				gantt.config.smart_rendering = false;
				gantt.config.smart_scales = false;
				gantt.render();
			}

			const html = gantt.$container.parentNode.innerHTML;

			if (smartScales || smartRendering) {
				gantt.config.smart_scales = smartScales;
				gantt.config.smart_rendering = smartRendering;
				gantt.render();
			}

			return html;
		},

		_serializeAll() {
			gantt.json._copyObject = gantt.ext.export_api._copyObjectAll;
			const data = gantt.ext.export_api._exportSerialize();
			gantt.json._copyObject = gantt.ext.export_api._originalCopyObject;
			return data;
		},

		_serializePlain() {
			const oldXmlFormat = gantt.templates.xml_format;
			const oldFormatDate = gantt.templates.format_date;
			gantt.templates.xml_format = gantt.date.date_to_str("%Y%m%dT%H%i%s", true);
			gantt.templates.format_date = gantt.date.date_to_str("%Y%m%dT%H%i%s", true);
			gantt.json._copyObject = gantt.ext.export_api._copyObjectPlain;

			const data = gantt.ext.export_api._exportSerialize();

			gantt.templates.xml_format = oldXmlFormat;
			gantt.templates.format_date = oldFormatDate;
			gantt.json._copyObject = gantt.ext.export_api._originalCopyObject;

			delete data.links;
			return data;
		},

		_getRaw() {
			// support Gantt < 5.0
			if (gantt._scale_helpers) {
				const scales = gantt._get_scales();
				const	minWidth = gantt.config.min_column_width;
				const	autosizeMinWidth = gantt._get_resize_options().x ? Math.max(gantt.config.autosize_min_width, 0) : gantt.config.$task.offsetWidth;
				const	height = gantt.config.config.scale_height - 1;
				return gantt._scale_helpers.prepareConfigs(scales, minWidth, autosizeMinWidth, height);
			} else { // Gantt >= 5.0
				const timeline = gantt.$ui.getView("timeline");
				if (timeline) {
					let availWidth = timeline.$config.width;
					if (gantt.config.autosize === "x" || gantt.config.autosize === "xy") {
						availWidth = Math.max(gantt.config.autosize_min_width, 0);
					}
					const state = gantt.getState();
					const	scales = timeline._getScales();
					const	minWidth = gantt.config.min_column_width;
					const	height = gantt.config.scale_height - 1;
					const	rtl = gantt.config.rtl;
					return timeline.$scaleHelper.prepareConfigs(scales, minWidth, availWidth, height, state.min_date, state.max_date, rtl);
				}
			}
		},

		_serializeTable(config) {
			gantt.json._copyObject = config.visual ? gantt.ext.export_api._copyObjectColors : gantt.ext.export_api._copyObjectTable;
			const data = gantt.ext.export_api._exportSerialize();
			gantt.json._copyObject = gantt.ext.export_api._originalCopyObject;

			delete data.links;

			if (config.cellColors) {
				const css = gantt.templates.timeline_cell_class || gantt.templates.task_cell_class;
				if (css) {
					const raw = gantt.ext.export_api._getRaw();
					let steps = raw[0].trace_x;
					for (let i = 1; i < raw.length; i++){
						if (raw[i].trace_x.length > steps.length){
							steps = raw[i].trace_x;
						}
					}

					for (let i = 0; i < data.data.length; i++) {
						data.data[i].styles = [];
						const task = gantt.getTask(data.data[i].id);
						for (let j = 0; j < steps.length; j++) {
							const date = steps[j];
							const cellCss = css(task, date);
							if (cellCss){
								data.data[i].styles.push({ index: j, styles: gantt.ext.export_api._getStyles(cellCss) });
							}
						}
					}
				}
			}
			return data;
		},

		_serializeScales(config) {
			const scales = [];
			const raw = gantt.ext.export_api._getRaw();

			let min = Infinity;
			let max = 0;
			for (let i = 0; i < raw.length; i++) {
				min = Math.min(min, raw[i].col_width);
			}

			for (let i = 0; i < raw.length; i++) {
				let start = 0;
				let end = 0;
				const row = [];

				scales.push(row);
				const step = raw[i];
				max = Math.max(max, step.trace_x.length);
				const template = step.format || step.template || (step.date ? gantt.date.date_to_str(step.date) : gantt.config.date_scale);

				for (let j = 0; j < step.trace_x.length; j++) {
					const date = step.trace_x[j];
					end = start + Math.round(step.width[j] / min);

					const scaleCell = { text: template(date), start, end, styles: "" };

					if (config.cellColors) {
						const css = step.css || gantt.templates.scaleCell_class;
						if (css) {
							const scaleCss = css(date);
							if (scaleCss){
								scaleCell.styles = gantt.ext.export_api._getStyles(scaleCss);
							}
						}
					}

					row.push(scaleCell);
					start = end;
				}
			}

			return { width: max, height: scales.length, data: scales };
		},

		_serializeColumns(config) {
			gantt.exportMode = true;

			const columns = [];
			const cols = gantt.config.columns;

			let ccount = 0;
			for (let i = 0; i < cols.length; i++) {
				if (cols[i].name === "add" || cols[i].name === "buttons") {
					continue;
				}

				columns[ccount] = {
					id: ((cols[i].template) ? ("_" + i) : cols[i].name),
					header: cols[i].label || gantt.locale.labels["column_" + cols[i].name],
					width: (cols[i].width ? Math.floor(cols[i].width / 4) : "")
				};

				if (cols[i].name === "duration"){
					columns[ccount].type = "number";
				}
				if (cols[i].name === "start_date" || cols[i].name === "end_date") {
					columns[ccount].type = "date";
					if (config && config.rawDates){
						columns[ccount].id = cols[i].name;
					}
				}

				ccount++;
			}

			gantt.exportMode = false;
			return columns;
		},

		_exportSerialize() {
			gantt.exportMode = true;

			const xmlFormat = gantt.templates.xml_format;
			const formatDate = gantt.templates.format_date;

			// use configuration date format for serialization so date could be parsed on the export
			// required when custom format date function is defined
			gantt.templates.xml_format =
				gantt.templates.format_date =
				gantt.date.date_to_str(gantt.config.date_format || gantt.config.xml_date);

			const data = gantt.serialize();

			gantt.templates.xml_format = xmlFormat;
			gantt.templates.format_date = formatDate;
			gantt.exportMode = false;
			return data;
		},


		_setLevel(data) {
			for (let i = 0; i < data.length; i++) {
				// tslint:disable-next-line triple-equals
				if (data[i].parent == 0) {
					data[i]._lvl = 1;
				}
				for (let j = i + 1; j < data.length; j++) {
					// tslint:disable-next-line triple-equals
					if (data[i].id == data[j].parent) {
						data[j]._lvl = data[i]._lvl + 1;
					}
				}
			}
		},

		_clearLevel(data) {
			for (let i = 0; i < data.length; i++) {
				delete data[i]._lvl;
			}
		},

		_clearRecLinks(data) {
			gantt.ext.export_api._setLevel(data.data);
			const tasks = {};
			for (let i = 0; i < data.data.length; i++) {
				tasks[data.data[i].id] = data.data[i];
			}

			const links = {};

			for (let i = 0; i < data.links.length; i++) {
				const link = data.links[i];
				if (gantt.isTaskExists(link.source) && gantt.isTaskExists(link.target) &&
					tasks[link.source] && tasks[link.target]) {
					links[link.id] = link;
				}
			}

			for (const j in links) {
				gantt.ext.export_api._makeLinksSameLevel(links[j], tasks);
			}

			const skippedLinks = {};
			for (const j in tasks) {
				gantt.ext.export_api._clearCircDependencies(tasks[j], links, tasks, {}, skippedLinks, null);
			}

			if (Object.keys(links)) {
				gantt.ext.export_api._clearLinksSameLevel(links, tasks);
			}

			for (let i = 0; i < data.links.length; i++) {
				if (!links[data.links[i].id]) {
					data.links.splice(i, 1);
					i--;
				}
			}

			gantt.ext.export_api._clearLevel(data.data);
		},

		_clearCircDependencies(task, links, tasks, usedTasks, skippedLinks, prevLink) {
			const sources = task.$_source;
			if (!sources) {
				return;
			}

			if (usedTasks[task.id]) {
				gantt.ext.export_api._onCircDependencyFind(prevLink, links, usedTasks, skippedLinks);
			}

			usedTasks[task.id] = true;

			const targets = {};

			for (let i = 0; i < sources.length; i++) {
				if (skippedLinks[sources[i]]) {
					continue;
				}
				const curLink = links[sources[i]];
				const targetTask = tasks[curLink._target];
				if (targets[targetTask.id]) { // two link from one task to another
					gantt.ext.export_api._onCircDependencyFind(curLink, links, usedTasks, skippedLinks);
				}
				targets[targetTask.id] = true;
				gantt.ext.export_api._clearCircDependencies(targetTask, links, tasks, usedTasks, skippedLinks, curLink);
			}
			usedTasks[task.id] = false;
		},

		_onCircDependencyFind(link, links, usedTasks, skippedLinks) {
			if (link) {
				if (gantt.callEvent("onExportCircularDependency", [link.id, link])) {
					delete links[link.id];
				}

				delete usedTasks[link._source];
				delete usedTasks[link._target];
				skippedLinks[link.id] = true;
			}
		},

		_makeLinksSameLevel(link, tasks) {
			let task;
			let targetLvl;
			const linkT = {
				target: tasks[link.target],
				source: tasks[link.source]
			};
			// tslint:disable-next-line triple-equals
			if (linkT.target._lvl != linkT.source._lvl) {
				if (linkT.target._lvl < linkT.source._lvl) {
					task = "source";
					targetLvl = linkT.target._lvl;
				} else {
					task = "target";
					targetLvl = linkT.source._lvl;
				}

				do {
					const parent = tasks[linkT[task].parent];
					if (!parent) {
						break;
					}
					linkT[task] = parent;
				} while (linkT[task]._lvl < targetLvl);

				let sourceParent = tasks[linkT.source.parent];
				let	targetParent = tasks[linkT.target.parent];
				// tslint:disable-next-line triple-equals
				while (sourceParent && targetParent && sourceParent.id != targetParent.id) {
					linkT.source = sourceParent;
					linkT.target = targetParent;
					sourceParent = tasks[linkT.source.parent];
					targetParent = tasks[linkT.target.parent];
				}
			}

			link._target = linkT.target.id;
			link._source = linkT.source.id;

			if (!linkT.target.$_target){
				linkT.target.$_target = [];
			}
			linkT.target.$_target.push(link.id);

			if (!linkT.source.$_source){
				linkT.source.$_source = [];
			}
			linkT.source.$_source.push(link.id);
		},

		_clearLinksSameLevel(links, tasks) {
			for (const link in links) {
				delete links[link]._target;
				delete links[link]._source;
			}

			for (const task in tasks) {
				delete tasks[task].$_source;
				delete tasks[task].$_target;
			}
		},


		_customProjectProperties(data, config) {
			if (config && config.project) {
				for (const i in config.project) {
					if (!gantt.config.$custom_data){
						gantt.config.$custom_data = {};
					}
					gantt.config.$custom_data[i] = typeof config.project[i] === "function" ? config.project[i](gantt.config) : config.project[i];
				}
				delete config.project;
			}
		},

		_customTaskProperties(data, config) {
			if (config && config.tasks) {
				data.data.forEach(function(el) {
					for (const i in config.tasks) {
						if (!el.$custom_data){
							el.$custom_data = {};
						}
						el.$custom_data[i] = typeof config.tasks[i] === "function" ? config.tasks[i](el, gantt.config) : config.tasks[i];
					}
				});
				delete config.tasks;
			}
		},

		_exportConfig(data, config) {
			const projectName = config.name || "gantt.xml";
			delete config.name;

			gantt.config.custom = config;

			const time = gantt.ext.export_api._getWorktimeSettings();

			const projectDates = gantt.getSubtaskDates();
			if (projectDates.start_date && projectDates.end_date) {
				const formatDate = gantt.templates.format_date || gantt.templates.xml_format;
				gantt.config.start_end = {
					start_date: formatDate(projectDates.start_date),
					end_date: formatDate(projectDates.end_date)
				};
			}

			const manual = config.auto_scheduling === undefined ? false : !!config.auto_scheduling;

			const res = {
				callback: config.callback || null,
				config: gantt.config,
				data,
				manual,
				name: projectName,
				worktime: time
			};
			for (const i in config) {
				res[i] = config[i];
			}
			return res;
		},


		_sendImportAjaxMSP(config) {
			const url = config.server || gantt.ext.export_api._apiUrl;
			const store = config.store || 0;
			const formData = config.data;
			const callback = config.callback;

			const settings = {
				durationUnit: config.durationUnit || undefined,
				projectProperties: config.projectProperties || undefined,
				taskProperties: config.taskProperties || undefined,
			};

			formData.append("type", config.type || "msproject-parse");
			formData.append("data", JSON.stringify(settings));

			if (store){
				formData.append("store", store);
			}

			const xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function(e) {
				if (xhr.readyState === 4 && xhr.status === 0) {// network error
					if (callback) {
						callback(null);
					}
				}
			};

			xhr.onload = function(){
				const fail = xhr.status > 400;
				let info = null;

				if (!fail) {
					try {
						info = JSON.parse(xhr.responseText);
					} catch (e) { }
				}

				if (callback) {
					callback(info);
				}
			};

			xhr.open("POST", url, true);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.send(formData);
		}

	};


	gantt.exportToPDF = gantt.ext.export_api.exportToPDF;
	gantt.exportToPNG = gantt.ext.export_api.exportToPNG;
	gantt.exportToICal = gantt.ext.export_api.exportToICal;
	gantt.exportToExcel = gantt.ext.export_api.exportToExcel;
	gantt.exportToJSON = gantt.ext.export_api.exportToJSON;
	gantt.importFromExcel = gantt.ext.export_api.importFromExcel;
	gantt.importFromMSProject = gantt.ext.export_api.importFromMSProject;
	gantt.exportToMSProject = gantt.ext.export_api.exportToMSProject;
	gantt.importFromPrimaveraP6 = gantt.ext.export_api.importFromPrimaveraP6;
	gantt.exportToPrimaveraP6 = gantt.ext.export_api.exportToPrimaveraP6;


}
