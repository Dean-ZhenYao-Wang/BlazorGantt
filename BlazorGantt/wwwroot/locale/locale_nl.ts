const locale = {
	date: {
		month_full: ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"],
		month_short: ["Jan", "Feb", "mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
		day_full: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
		day_short: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"]
	},
	labels: {
		new_task: "Nieuwe taak",
		icon_save: "Opslaan",
		icon_cancel: "Annuleren",
		icon_details: "Details",
		icon_edit: "Bewerken",
		icon_delete: "Verwijderen",
		confirm_closing: "", // Your changes will be lost, are your sure ?
		confirm_deleting: "Item zal permanent worden verwijderd, doorgaan?",
		section_description: "Beschrijving",
		section_time: "Tijd periode",
		section_type: "Type",
		/* grid columns */

		column_wbs: "WBS",
		column_text: "Taak omschrijving",
		column_start_date: "Startdatum",
		column_duration: "Duur",
		column_add: "",

		/* link confirmation */
		link: "Koppeling",
		confirm_link_deleting: "zal worden verwijderd",
		link_start: " (start)",
		link_end: " (eind)",

		type_task: "Task",
		type_project: "Project",
		type_milestone: "Milestone",


		minutes: "minuten",
		hours: "uren",
		days: "dagen",
		weeks: "weken",
		months: "maanden",
		years: "jaren",

		/* message popup */
		message_ok: "OK",
		message_cancel: "Annuleren",

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
