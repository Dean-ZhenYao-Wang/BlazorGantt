const locale = {
	date: {
		month_full: ["Студзень", "Люты", "Сакавік", "Красавік", "Maй", "Чэрвень", "Ліпень", "Жнівень", "Верасень", "Кастрычнік", "Лістапад", "Снежань"],
		month_short: ["Студз", "Лют", "Сак", "Крас", "Maй", "Чэр", "Ліп", "Жнів", "Вер", "Каст", "Ліст", "Снеж"],
		day_full: ["Нядзеля", "Панядзелак", "Аўторак", "Серада", "Чацвер", "Пятніца", "Субота"],
		day_short: ["Нд", "Пн", "Аўт", "Ср", "Чцв", "Пт", "Сб"]
	},
	labels: {
		new_task: "Новае заданне",
		icon_save: "Захаваць",
		icon_cancel: "Адмяніць",
		icon_details: "Дэталі",
		icon_edit: "Змяніць",
		icon_delete: "Выдаліць",
		confirm_closing: "", // Унесеныя змены будуць страчаны, працягнуць?
		confirm_deleting: "Падзея будзе выдалена незваротна, працягнуць?",
		section_description: "Апісанне",
		section_time: "Перыяд часу",
		section_type: "Тып",
		/* grid columns */

		column_wbs: "ІСР",
		column_text: "Задача",
		column_start_date: "Пачатак",
		column_duration: "Працяг",
		column_add: "",

		/* link confirmation */
		link: "Сувязь",
		confirm_link_deleting: "будзе выдалена",
		link_start: "(пачатак)",
		link_end: "(канец)",

		type_task: "Task",
		type_project: "Project",
		type_milestone: "Milestone",


		minutes: "Хвiлiна",
		hours: "Гадзiна",
		days: "Дзень",
		weeks: "Тыдзень",
		months: "Месяц",
		years: "Год",

		/* message popup */
		message_ok: "OK",
		message_cancel: "Адмяніць",

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
