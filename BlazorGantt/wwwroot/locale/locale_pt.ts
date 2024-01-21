/*

 TRANSLATION BY MATTHEUS PIROVANI RORIZ GONЗALVES

 mattheusroriz@hotmail.com / mattheus.pirovani@gmail.com /

 www.atrixian.com.br


 Updated by Jorge Albernaz Martins

 jorgefox@hotmail.com

 www.redfox.inf.br

 JorgeFox

*/

const locale = {
	date: {
		month_full: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
		month_short: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
		day_full: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
		day_short: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
	},
	labels: {
		new_task: "Nova tarefa",
		icon_save: "Salvar",
		icon_cancel: "Cancelar",
		icon_details: "Detalhes",
		icon_edit: "Editar",
		icon_delete: "Excluir",
		confirm_closing: "",// Suas alterações serão perdidas, confirme?
		confirm_deleting: "As tarefas serão excluidas permanentemente, confirme?",
		section_description: "Descrição",
		section_time: "Período",
		section_type: "Tipo",
		/* grid columns */

		column_wbs: "EAP",
		column_text: "Nome tarefa",
		column_start_date: "Data início",
		column_duration: "Duração",
		column_add: "",

		/* link confirmation */
		link: "Link",
		confirm_link_deleting: "Será excluído!",
		link_start: " (início)",
		link_end: " (fim)",

		type_task: "Task",
		type_project: "Projeto",
		type_milestone: "Marco",


		minutes: "Minutos",
		hours: "Horas",
		days: "Dias",
		weeks: "Semanas",
		months: "Meses",
		years: "Anos",

		/* message popup */
		message_ok: "OK",
		message_cancel: "Cancelar",

		/* constraints */
		section_constraint: "Restrição",
		constraint_type: "Tipo Restrição",
		constraint_date: "Data restrição",
		asap: "Mais breve possível",
		alap: "Mais tarde possível",
		snet: "Não começar antes de",
		snlt: "Não começar depois de",
		fnet: "Não terminar antes de",
		fnlt: "Não terminar depois de",
		mso: "Precisa começar em",
		mfo: "Precisa terminar em",

		/* resource control */
		resources_filter_placeholder: "Tipo de filtros",
		resources_filter_label: "Ocultar vazios",

		/* empty state screen */
		empty_state_text_link: "Click here",
		empty_state_text_description: "to create your first task"
	}
};

export default locale;
