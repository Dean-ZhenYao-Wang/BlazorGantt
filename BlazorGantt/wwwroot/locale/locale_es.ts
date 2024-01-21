/*
 @Autor Manuel Fernandez Panzuela - www.mfernandez.es

 Update 30/10/2015:
 Translation of new labels by Jorge Macias
 https://disqus.com/by/disqus_bTuZk1voC7/
 */

const locale = {
	date: {
		month_full: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
		month_short: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
		day_full: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
		day_short: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
	},
	labels: {
		new_task: "Nueva tarea",
		icon_save: "Guardar",
		icon_cancel: "Cancelar",
		icon_details: "Detalles",
		icon_edit: "Editar",
		icon_delete: "Eliminar",
		confirm_closing: "", // "Sus cambios se perderán, continuar ?"
		confirm_deleting: "El evento se borrará definitivamente, ¿continuar?",
		section_description: "Descripción",
		section_time: "Período",
		section_type: "Tipo",
		/* grid columns */

		column_wbs: "EDT",
		column_text: "Tarea",
		column_start_date: "Inicio",
		column_duration: "Duración",
		column_add: "",

		/* link confirmation */
		link: "Enlace",
		confirm_link_deleting: "será borrada",
		link_start: " (inicio)",
		link_end: " (fin)",

		type_task: "Tarea",
		type_project: "Proyecto",
		type_milestone: "Hito",


		minutes: "Minutos",
		hours: "Horas",
		days: "Días",
		weeks: "Semanas",
		months: "Meses",
		years: "Años",

		/* message popup */
		message_ok: "OK",
		message_cancel: "Cancelar",

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
