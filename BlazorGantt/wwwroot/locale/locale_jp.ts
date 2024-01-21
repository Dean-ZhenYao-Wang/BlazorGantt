/*
 Translation by Genexus Japan Inc.
 */

const locale = {
	date: {
		month_full: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
		month_short: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
		day_full: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"],
		day_short: ["日", "月", "火", "水", "木", "金", "土"]
	},
	labels: {
		new_task: "新しい仕事",
		icon_save: "保存",
		icon_cancel: "キャンセル",
		icon_details: "詳細",
		icon_edit: "編集",
		icon_delete: "削除",
		confirm_closing: "", // 変更が取り消されます、宜しいですか？
		confirm_deleting: "イベント完全に削除されます、宜しいですか？",
		section_description: "デスクリプション",
		section_time: "期間",
		section_type: "Type",
		/* grid columns */

		column_wbs: "WBS",
		column_text: "Task name",
		column_start_date: "Start time",
		column_duration: "Duration",
		column_add: "",

		/* link confirmation */
		link: "Link",
		confirm_link_deleting: "will be deleted",
		link_start: " (start)",
		link_end: " (end)",

		type_task: "Task",
		type_project: "Project",
		type_milestone: "Milestone",


		minutes: "Minutes",
		hours: "Hours",
		days: "Days",
		weeks: "Week",
		months: "Months",
		years: "Years",

		/* message popup */
		message_ok: "OK",
		message_cancel: "キャンセル",

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
