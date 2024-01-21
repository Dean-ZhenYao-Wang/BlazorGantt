const locale = {
	date: {
		month_full: ["Январь", "Февраль", "Март", "Апрель", "Maй", "Июнь", "Июль", "Август", "Сентябрь", "Oктябрь", "Ноябрь", "Декабрь"],
		month_short: ["Янв", "Фев", "Maр", "Aпр", "Maй", "Июн", "Июл", "Aвг", "Сен", "Окт", "Ноя", "Дек"],
		day_full: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
		day_short: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
	},
	labels: {
		new_task: "Новое задание",
		icon_save: "Сохранить",
		icon_cancel: "Отменить",
		icon_details: "Детали",
		icon_edit: "Изменить",
		icon_delete: "Удалить",
		confirm_closing: "", // Ваши изменения будут потеряны, продолжить?
		confirm_deleting: "Событие будет удалено безвозвратно, продолжить?",
		section_description: "Описание",
		section_time: "Период времени",
		section_type: "Тип",
		/* grid columns */

		column_wbs: "ИСР",
		column_text: "Задача",
		column_start_date: "Начало",
		column_duration: "Длительность",
		column_add: "",

		/* link confirmation */
		link: "Связь",
		confirm_link_deleting: "будет удалена",
		link_start: " (начало)",
		link_end: " (конец)",

		type_task: "Task",
		type_project: "Project",
		type_milestone: "Milestone",


		minutes: "Минута",
		hours: "Час",
		days: "День",
		weeks: "Неделя",
		months: "Месяц",
		years: "Год",

		/* message popup */
		message_ok: "OK",
		message_cancel: "Отменить",

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
		resources_filter_placeholder: "начните вводить слово для фильтрации",
		resources_filter_label: "спрятать не установленные",

		/* empty state screen */
		empty_state_text_link: "Click here",
		empty_state_text_description: "to create your first task"
	}
};

export default locale;
