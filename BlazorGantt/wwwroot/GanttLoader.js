import "./analytics.js"
import "./raven.min.js"
import "./gantt.js"

export function set_config_date_format(date_format) {
    gantt.config.date_format = date_format;
}