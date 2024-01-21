/*
 dhtmlxGantt Persian (Farsi, fa_IR) locale by Mohammad Shokri http://slashsbin.com/
 */

const locale = {
	date: {
		month_full: [
			"ژانویه",
			"فوریه",
			"مارس",
			"آوریل",
			"مه",
			"ژوئن",
			"ژوئیه",
			"اوت",
			"سپتامبر",
			"اکتبر",
			"نوامبر",
			"دسامبر"
		],
		month_short: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
		day_full: [
			"يکشنبه",
			"دوشنبه",
			"سه‌شنبه",
			"چهارشنبه",
			"پنجشنبه",
			"جمعه",
			"شنبه"
		],
		day_short: [
			"ی",
			"د",
			"س",
			"چ",
			"پ",
			"ج",
			"ش"
		]
	},
	labels: {
		new_task: "وظیفه جدید",
		icon_save: "ذخیره",
		icon_cancel: "لغو",
		icon_details: "جزییات",
		icon_edit: "ویرایش",
		icon_delete: "حذف",
		confirm_closing: "تغییرات شما ازدست خواهد رفت، آیا مطمئن هستید؟",
		confirm_deleting: "این مورد برای همیشه حذف خواهد شد، آیا مطمئن هستید؟",
		section_description: "توضیحات",
		section_time: "مدت زمان",
		section_type: "نوع",

		/* grid columns */

		column_wbs: "WBS",
		column_text: "عنوان",
		column_start_date: "زمان شروع",
		column_duration: "مدت",
		column_add: "",

		/* link confirmation */
		link: "ارتباط",
		confirm_link_deleting: "حذف خواهد شد",
		link_start: " (آغاز)",
		link_end: " (پایان)",

		type_task: "وظیفه",
		type_project: "پروژه",
		type_milestone: "نگارش",

		minutes: "دقایق",
		hours: "ساعات",
		days: "روزها",
		weeks: "هفته",
		months: "ماه‌ها",
		years: "سال‌ها",

		/* message popup */
		message_ok: "تایید",
		message_cancel: "لغو",

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
