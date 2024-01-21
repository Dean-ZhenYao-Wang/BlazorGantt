/*
 Update 29/12/2015:
 New labels translation by ARCANGELI CLAUDIO

 */

const locale = {
	date: {
		month_full: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
		month_short: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"],
		day_full: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
		day_short: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"]
	},
	labels: {
		new_task: "Nuovo compito",
		icon_save: "Salva",
		icon_cancel: "Chiudi",
		icon_details: "Dettagli",
		icon_edit: "Modifica",
		icon_delete: "Elimina",
		confirm_closing: "",// "Sei sicuro di confermare la chiusura?",
		confirm_deleting: "Sei sicuro di confermare l'eliminazione?",
		section_description: "Descrizione",
		section_time: "Periodo di tempo",
		section_type: "Tipo",
		/* grid columns */

		column_wbs: "WBS",
		column_text: "Nome Attività",
		column_start_date: "Inizio",
		column_duration: "Durata",
		column_add: "",

		/* link confirmation */
		link: "Link",
		confirm_link_deleting: "sarà eliminato",
		link_start: " (inizio)",
		link_end: " (fine)",

		type_task: "Task",
		type_project: "Project",
		type_milestone: "Milestone",


		minutes: "Minuti",
		hours: "Ore",
		days: "Giorni",
		weeks: "Settimane",
		months: "Mesi",
		years: "Anni",

		/* message popup */
		message_ok: "OK",
		message_cancel: "Chiudi",

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
