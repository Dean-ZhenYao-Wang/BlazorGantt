import "./gantt.js"

window.BlazorGantt = {
    getGanttInstance: function (dotNet, id) {
        let gantt = Gantt.getGanttInstance();
        this.add_to_dictionary(id, dotNet);
        return gantt;
    },
    plugins: function (gantt, plugins) {
        gantt.plugins(plugins);
    },
    init: function (gantt, element) {
        gantt.init(element);
    },
    init3: function (gantt, element, startDate, endDate) {
        gantt.init(element, startDate, endDate);
    },
    parse: function (gantt, tasks) {
        gantt.parse(tasks);
    },
    attachEvent: function (gantt, name, funcStr) {
        switch (name) {
            case 'onAjaxError':
                gantt.attachEvent(name, new Function('request', funcStr));
                break;
            case 'onBeforeTaskAdd':
                gantt.attachEvent(name, new Function('id', 'task', funcStr));
                break;
            case 'onLinkClick':
                gantt.attachEvent(name, new Function('id', funcStr));
                break;
            case 'onAfterTaskAdd':
                gantt.attachEvent(name, new Function('id','item', funcStr));
                break;
            case 'onAfterTaskDelete':
                gantt.attachEvent(name, new Function('id', 'item', funcStr));
                break;
            case 'onLightboxSave':
                gantt.attachEvent(name, new Function('id', 'item', 'is_new', funcStr));
                break;
        }
    },
    templates_rightside_text: function (gantt, funcStr) {
        gantt.templates.rightside_text = new Function('start', 'end', 'task', funcStr);
    },
    templates_scale_cell_class: function (gantt, funcStr) {
        gantt.templates.scale_cell_class = new Function('date', funcStr);
    },
    templates_timeline_cell_class: function (gantt, funcStr) {
        gantt.templates.timeline_cell_class = new Function('item', 'date', funcStr);
    },
    templates_date_grid: function (gantt, funcStr) {
        gantt.templates.date_grid = new Function('date', 'task',funcStr);
    },
    templates_grid_date_format: function (gant, date) {
        gant.templates.grid_date_format(new Date(date));
    },
    load2: function (gantt, url, type) {
        gantt.load(url, type);
    },
    load1: function (gantt, url) {
        gantt.load(url);
    },
    messageObj: function (gantt, message) {
        gantt.message(message);
    },
    message: function (gantt, message) {
        gantt.message(message);
    },
    createDataProcessor: function (gantt, url, mode) {
        return gantt.createDataProcessor({
            url: url,
            mode: mode
        });
    },
    setSkin: function (gantt, skin) {
        gantt.setSkin(skin);
    },
    render: function (gantt) {
        gantt.render();
    },
    getLink: function (gantt, id) {
        return gantt.getLink(id);
    },
    getTask: function (gantt, id) {
        return gantt.getTask(id);
    },
    i18n_setLocale: function (gantt, lang) {
        gantt.i18n.setLocale(lang);
    },

    destructor: function (gantt, element, id) {
        gantt.destructor();
        element.innerHTML = "";
        this.remove_from_dictionary(id);
    },
    get_config: function (gantt) {
        return gantt.config;
    },
    get_property: function (gantt, propertyName) {
        // 将属性名按点分割成数组
        var properties = propertyName.split('.');

        // 递归函数来遍历属性
        function recursiveGetProperty(obj, props) {
            // 如果属性数组为空或对象为null/undefined，则返回undefined
            if (props.length === 0 || obj == null) {
                return undefined;
            }

            // 获取当前属性名
            var prop = props.shift();

            // 如果当前属性存在于对象中，且还有更多属性要遍历，则递归调用
            if (obj.hasOwnProperty(prop)) {
                return props.length === 0 ? obj[prop] : recursiveGetProperty(obj[prop], props);
            } else {
                // 如果属性不存在，返回undefined
                return undefined;
            }
        }

        // 从gantt对象开始递归获取属性
        return recursiveGetProperty(gantt, properties);
    },
    set_property: function (gantt, propertyName, value) {
        // 将属性名按点分割成数组
        var properties = propertyName.split('.');

        // 递归函数来遍历属性
        function recursiveGetProperty(obj, props,val) {
            // 如果属性数组为空或对象为null/undefined，则返回undefined
            if (props.length === 0 || obj == null) {
                return undefined;
            }

            // 获取当前属性名
            var prop = props.shift();

            // 如果当前属性存在于对象中，且还有更多属性要遍历，则递归调用
            if (obj.hasOwnProperty(prop)) {
                if (props.length === 0) {
                    obj[prop] = val;
                } else {
                    recursiveGetProperty(obj[prop], props, val);
                }
            }
        }

        // 从gantt对象开始递归设置属性
        recursiveGetProperty(gantt, properties, value);
    },
    set_config: function (gantt, config) {
        gantt.config = this.deepMerge(gantt.config, config);
    },
    dictionary: {},
    // 方法用于向字典添加键值对
    add_to_dictionary: function (key, value) {
        this.dictionary[key] = value;
    },
    // 方法用于从字典获取值
    get_from_dictionary: function (key) {
        return this.dictionary[key];
    },
    // 方法用于检查字典中是否包含某个键
    contains_key: function (key) {
        return key in this.dictionary;
    },
    // 方法用于移除字典中的键值对
    remove_from_dictionary: function (key) {
        delete this.dictionary[key];
    },
    deepMerge: function (obj1, obj2) {
        for (const key in obj2) {
            if (obj2.hasOwnProperty(key)) {
                switch (obj2[key]) {
                    case "true":
                        obj2[key] = true;
                        break;
                    case "false":
                        obj2[key] = false;
                        break;
                }
                if (typeof obj2[key] === 'object' && typeof obj1[key] === 'object') {
                    obj1[key] = this.deepMerge(obj1[key], obj2[key]);
                } else {
                    obj1[key] = obj2[key];
                }
            }
        }
        return obj1;
    }
}