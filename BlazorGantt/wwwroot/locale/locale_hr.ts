/*
  Translation by Davor
 http://docs.dhtmlx.com/gantt/desktop__localization.html#comment-2569116291
 */

const locale = {
	date: {
		month_full: ["Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj", "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac"],
		month_short: ["Sij", "Velj", "Ožu", "Tra", "Svi", "Lip", "Srp", "Kol", "Ruj", "Lis", "Stu", "Pro"],
		day_full: ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"],
		day_short: ["Ned", "Pon", "Uto", "Sri", "Čet", "Pet", "Sub"]
	},
	labels: {
		new_task: "Novi Zadatak",
		icon_save: "Spremi",
		icon_cancel: "Odustani",
		icon_details: "Detalji",
		icon_edit: "Izmjeni",
		icon_delete: "Obriši",
		confirm_closing: "",
		confirm_deleting: "Zadatak će biti trajno izbrisan, jeste li sigurni?",
		section_description: "Opis",
		section_time: "Vremenski Period",
		section_type: "Tip",

		/* grid columns */
		column_wbs: "WBS",
		column_text: "Naziv Zadatka",
		column_start_date: "Početno Vrijeme",
		column_duration: "Trajanje",
		column_add: "",

		/* link confirmation */
		link: "Poveznica",
		confirm_link_deleting: "će biti izbrisan",
		link_start: " (početak)",
		link_end: " (kraj)",

		type_task: "Zadatak",
		type_project: "Projekt",
		type_milestone: "Milestone",

		minutes: "Minute",
		hours: "Sati",
		days: "Dani",
		weeks: "Tjedni",
		months: "Mjeseci",
		years: "Godine",

		/* message popup */
		message_ok: "OK",
		message_cancel: "Odustani",

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
