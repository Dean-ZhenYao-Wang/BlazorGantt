/*
 * updated by @levkar at https://github.com/DHTMLX/gantt/pull/10
 */
const locale = {
	date: {
		month_full: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
		month_short: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
		day_full: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
		day_short: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
	},
	labels: {
		new_task: "Yeni görev",
		icon_save: "Kaydet",
		icon_cancel: "İptal",
		icon_details: "Detaylar",
		icon_edit: "Düzenle",
		icon_delete: "Sil",
		confirm_closing: "", // Your changes will be lost, are your sure ?
		confirm_deleting: "Görev silinecek, emin misiniz?",
		section_description: "Açıklama",
		section_time: "Zaman Aralığı",
		section_type: "Tip",
		/* grid columns */

		column_wbs: "WBS",
		column_text: "Görev Adı",
		column_start_date: "Başlangıç",
		column_duration: "Süre",
		column_add: "",

		/* link confirmation */
		link: "Bağlantı",
		confirm_link_deleting: "silinecek",
		link_start: " (başlangıç)",
		link_end: " (bitiş)",

		type_task: "Görev",
		type_project: "Proje",
		type_milestone: "Kilometretaşı",


		minutes: "Dakika",
		hours: "Saat",
		days: "Gün",
		weeks: "Hafta",
		months: "Ay",
		years: "Yıl",

		/* message popup */
		message_ok: "OK",
		message_cancel: "Ýptal",

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
