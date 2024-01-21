const locale = {
	date: {
		month_full: ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
		month_short: ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"],
		day_full: ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"],
		day_short: ["Nie", "Pon", "Wto", "Śro", "Czw", "Pią", "Sob"]
	},
	labels: {
		new_task: "Nowe zadanie",
		icon_save: "Zapisz",
		icon_cancel: "Anuluj",
		icon_details: "Szczegóły",
		icon_edit: "Edytuj",
		icon_delete: "Usuń",
		confirm_closing: "", // Zmiany zostaną usunięte, jesteś pewien?
		confirm_deleting: "Zdarzenie zostanie usunięte na zawsze, kontynuować?",
		section_description: "Opis",
		section_time: "Okres czasu",
		section_type: "Typ",
		/* grid columns */

		column_wbs: "WBS",
		column_text: "Nazwa zadania",
		column_start_date: "Początek",
		column_duration: "Czas trwania",
		column_add: "",

		/* link confirmation */
		link: "Link",
		confirm_link_deleting: "zostanie usunięty",
		link_start: " (początek)",
		link_end: " (koniec)",

		type_task: "Zadanie",
		type_project: "Projekt",
		type_milestone: "Milestone",


		minutes: "Minuty",
		hours: "Godziny",
		days: "Dni",
		weeks: "Tydzień",
		months: "Miesiące",
		years: "Lata",

		/* message popup */
		message_ok: "OK",
		message_cancel: "Anuluj",

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
