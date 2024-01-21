/*
Translation by FreezeSoul

Update 26/10/2015:
Translation of new labels by zwh8800
 https://github.com/DHTMLX/gantt/pull/7

*/

const locale = {
	date: {
		month_full: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
		month_short: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
		day_full: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
		day_short: ["日", "一", "二", "三", "四", "五", "六"]
	},
	labels: {
		new_task: "新任務",
		icon_save: "保存",
		icon_cancel: "关闭",
		icon_details: "详细",
		icon_edit: "编辑",
		icon_delete: "删除",
		confirm_closing: "请确认是否撤销修改!", // Your changes will be lost, are your sure?
		confirm_deleting: "是否删除日程?",
		section_description: "描述",
		section_time: "时间范围",
		section_type: "类型",

		/* grid columns */

		column_wbs: "工作分解结构",
		column_text: "任务名",
		column_start_date: "开始时间",
		column_duration: "持续时间",
		column_add: "",

		/* link confirmation */

		link: "关联",
		confirm_link_deleting: "将被删除",
		link_start: " (开始)",
		link_end: " (结束)",

		type_task: "任务",
		type_project: "项目",
		type_milestone: "里程碑",

		minutes: "分钟",
		hours: "小时",
		days: "天",
		weeks: "周",
		months: "月",
		years: "年",

		/* message popup */
		message_ok: "OK",
		message_cancel: "关闭",

		/* constraints */
		section_constraint: "Constraint",
		constraint_type: "Constraint type",
		constraint_date: "Constraint date",
		asap: "As Soon As Possible",
		alap: "As Late As Possible",
		snet: "Start No Earlier Than",
		snlt: "Start No Later Than",
		fnet: "Finish No Earlier Than",
		fnlt: "Finish No Later Than",
		mso: "Must Start On",
		mfo: "Must Finish On",

		/* resource control */
		resources_filter_placeholder: "type to filter",
		resources_filter_label: "hide empty",

		/* empty state screen */
		empty_state_text_link: "Click here",
		empty_state_text_description: "to create your first task"
	}
};

export default locale;
