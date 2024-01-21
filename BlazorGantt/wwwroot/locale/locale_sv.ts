/*
	Translation by Peter Eriksson
 */
const locale = {
	date: {
		month_full: ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"],
		month_short: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
		day_full: ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"],
		day_short: ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"]
	},
	labels: {
		new_task: "Ny uppgift",
		icon_save: "Spara",
		icon_cancel: "Avbryt",
		icon_details: "Detajer",
		icon_edit: "Ändra",
		icon_delete: "Ta bort",
		confirm_closing: "",
		confirm_deleting: "Är du säker på att du vill ta bort händelsen permanent?",
		section_description: "Beskrivning",
		section_time: "Tid",
		section_type: "Typ",

		/* grid columns */

		column_wbs: "WBS",
		column_text: "Uppgiftsnamn",
		column_start_date: "Starttid",
		column_duration: "Varaktighet",
		column_add: "",

		/* link confirmation */

		link: "Länk",
		confirm_link_deleting: "kommer tas bort",
		link_start: " (start)",
		link_end: " (slut)",
		type_task: "Uppgift",
		type_project: "Projekt",
		type_milestone: "Milstolpe",

		minutes: "Minuter",
		hours: "Timmar",
		days: "Dagar",
		weeks: "Veckor",
		months: "Månader",
		years: "År",

		/* message popup */
		message_ok: "OK",
		message_cancel: "Avbryt",

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
