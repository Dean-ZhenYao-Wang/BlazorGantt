const locale = {
	date: {
		month_full: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
		month_short: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"],
		day_full: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
		day_short: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
	},
	labels: {
		new_task: "Nouvelle tâche",
		icon_save: "Enregistrer",
		icon_cancel: "Annuler",
		icon_details: "Détails",
		icon_edit: "Modifier",
		icon_delete: "Effacer",
		confirm_closing: "",// Vos modifications seront perdus, êtes-vous sûr ?
		confirm_deleting: "L'événement sera effacé sans appel, êtes-vous sûr ?",

		section_description: "Description",
		section_time: "Période",
		section_type: "Type",

		/* grid columns */

		column_wbs: "OTP",
		column_text: "Nom de la tâche",
		column_start_date: "Date initiale",
		column_duration: "Durée",
		column_add: "",


		/* link confirmation */
		link: "Le lien",
		confirm_link_deleting: "sera supprimé",
		link_start: "(début)",
		link_end: "(fin)",

		type_task: "Task",
		type_project: "Project",
		type_milestone: "Milestone",


		minutes: "Minutes",
		hours: "Heures",
		days: "Jours",
		weeks: "Semaines",
		months: "Mois",
		years: "Années",

		/* message popup */
		message_ok: "OK",
		message_cancel: "Annuler",

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
