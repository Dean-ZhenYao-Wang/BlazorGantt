/*
	Translated by cjkim@dbvalley.com
*/

const locale = {
	date: {
		month_full: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
		month_short: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
		day_full: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
		day_short: ["일", "월", "화", "수", "목", "금", "토"]
	},
	labels: {
		new_task: "이름없는 작업",
		icon_save: "저장",
		icon_cancel: "취소",
		icon_details: "세부 사항",
		icon_edit: "수정",
		icon_delete: "삭제",
		confirm_closing: "",
		confirm_deleting: "작업을 삭제하시겠습니까?",
		section_description: "설명",
		section_time: "기간",
		section_type: "Type",
		column_wbs: "WBS",
		column_text: "작업명",
		column_start_date: "시작일",
		column_duration: "기간",
		column_add: "",
		link: "전제",
		confirm_link_deleting: "삭제 하시겠습니까?",
		link_start: " (start)",
		link_end: " (end)",
		type_task: "작업",
		type_project: "프로젝트",
		type_milestone: "마일스톤",
		minutes: "분",
		hours: "시간",
		days: "일",
		weeks: "주",
		months: "달",
		years: "년",

		/* message popup */
		message_ok: "OK",
		message_cancel: "취소",

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
