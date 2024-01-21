const locale = {
	date: {
		month_full: [" Januar", " Februar", " März ", " April", " Mai", " Juni", " Juli", " August", " September ", " Oktober", " November ", " Dezember"],
		month_short: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
		day_full: ["Sonntag", "Montag", "Dienstag", " Mittwoch", " Donnerstag", "Freitag", "Samstag"],
		day_short: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
	},
	labels: {
		new_task: "Neue Aufgabe",
		icon_save: "Speichern",
		icon_cancel: "Abbrechen",
		icon_details: "Details",
		icon_edit: "Ändern",
		icon_delete: "Löschen",
		confirm_closing: "", // "Ihre Veränderungen werden verloren sein, wollen Sie ergänzen? "
		confirm_deleting: "Der Eintrag wird gelöscht",
		section_description: "Beschreibung",
		section_time: "Zeitspanne",
		section_type: "Type",
		/* grid columns */

		column_wbs: "PSP",
		column_text: "Task-Namen",
		column_start_date: "Startzeit",
		column_duration: "Dauer",
		column_add: "",

		/* link confirmation */
		link: "Link",
		confirm_link_deleting: "werden gelöscht",
		link_start: "(starten)",
		link_end: "(ende)",

		type_task: "Task",
		type_project: "Project",
		type_milestone: "Milestone",


		minutes: "Minuten",
		hours: "Stunden",
		days: "Tage",
		weeks: "Wochen",
		months: "Monate",
		years: "Jahre",

		/* message popup */
		message_ok: "OK",
		message_cancel: "Abbrechen",

		/* constraints */
		section_constraint: "Regel",
		constraint_type: "Regel",
		constraint_date: "Regel - Datum",
		asap: "So bald wie möglich",
		alap: "So spät wie möglich",
		snet: "Beginn nicht vor",
		snlt: "Beginn nicht später als",
		fnet: "Fertigstellung nicht vor",
		fnlt: "Fertigstellung nicht später als",
		mso: "Muss beginnen am",
		mfo: "Muss fertig sein am",

		/* resource control */
		resources_filter_placeholder: "type to filter",
		resources_filter_label: "hide empty",

		/* empty state screen */
		empty_state_text_link: "Click here",
		empty_state_text_description: "to create your first task"
	}
};

export default locale;
