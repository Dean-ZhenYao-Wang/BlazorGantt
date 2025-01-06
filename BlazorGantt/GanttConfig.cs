using Microsoft.AspNetCore.Components;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Resources;
using System.Text;
using System.Threading.Tasks;
using static System.Formats.Asn1.AsnWriter;

namespace BlazorGantt
{
    public class GanttConfig
    {
        //public bool auto_scheduling { get; set; } = false;
        //public bool auto_scheduling_compatibility { get; set; } = false;
        //public bool auto_scheduling_descendant_links { get; set; } = false;
        //public bool auto_scheduling_initial { get; set; } = true;
        //public bool auto_scheduling_move_projects { get; set; } = true;
        //public bool auto_scheduling_project_constraint { get; set; } = false;
        //public bool auto_scheduling_strict { get; set; } = false;
        //public bool auto_scheduling_use_progress { get; set; } = false;
        //public bool auto_types { get; set; } = false;
        //public bool autofit { get; set; } = false;
        //public bool autoscroll { get; set; } = true;
        //public int autoscroll_speed { get; set; } = 30;
        //public string autosize { get; set; } = "false";
        //public int autosize_min_width { get; set; } = 0;
        //public string bar_height { get; set; } = "full";
        //public int bar_height_padding { get; set; } = 9;
        //public BaseLines baselines { get; set; } = new BaseLines();
        //public bool branch_loading { get; set; } = false;
        //public string branch_loading_property { get; set; } = "$has_child";
        //public string[] buttons_left { get; set; } = ["gantt_save_btn", "gantt_cancel_btn"];
        //public string[] buttons_right { get; set; } = ["gantt_delete_btn"];
        //public string calendar_property { get; set; } = "calendar_id";
        //public bool cascade_delete { get; set; } = true;
        ////public ClickDrag click_drag { get; set; } = new ClickDrag();
        //public List<GridColumn> columns { get; set; } = new List<GridColumn>()
        //{
        //    new GridColumn() { name = "text",tree=true,width="176",resize=true},
        //    new GridColumn() { name = "start_date", align="center",width="100",resize=true},
        //    new GridColumn() { name = "duration",align="center",width="70" },
        //    new GridColumn() { name = "add",width="44",min_width=44,max_width=44}
        //};
        ////public object constraint_types { get; set; } = new object();
        //public string? container_resize_method { get; set; } = "timeout";
        //public int container_resize_timeout { get; set; } = 20;
        //public bool correct_work_time { get; set; } = false;
        //public string csp { get; set; } = "auto";
        //public string date_format { get; set; } = "%d-%m-%Y %H:%i";
        //public string date_grid { get; set; } = "%Y-%m-%d";
        //public bool deadlines { get; set; } = true;
        //public bool deepcopy_on_parse { get; set; } = false;
        //public bool details_on_create { get; set; } = true;
        //public bool drag_lightbox { get; set; } = true;
        //public bool drag_links { get; set; } = true;
        //public DragMode drag_mode { get; set; } = new DragMode();
        //public bool drag_move { get; set; } = true;
        //public bool drag_multiple { get; set; } = true;
        //public bool drag_progress { get; set; } = true;
        //public bool drag_project { get; set; } = false;
        //public bool drag_resize { get; set; } = true;
        //public DragTimeline drag_timeline { get; set; } = new DragTimeline();
        //public int duration_step { get; set; } = 1;
        //public string duration_unit { get; set; } = "day";
        //public bool dynamic_resource_calendars { get; set; } = false;
        //public string editable_property { get; set; } = "editable";
        ////public object editor_types { get; set; } = new { };
        //public DateTime? end_date { get; set; }
        ////public object external_render { get; set; } = new { };
        //public bool fit_tasks { get; set; } = false;
        //public bool grid_elastic_columns { get; set; } = false;
        //public string grid_resizer_column_attribute { get; set; } = "data-column-index";
        //public int grid_width { get; set; } = 390;
        //public bool highlight_critical_path { get; set; } = false;
        //public string horizontal_scroll_key { get; set; } = "shiftKey";
        //public bool inherit_calendar { get; set; } = false;
        //public bool inherit_scale_class { get; set; } = false;
        //public bool initial_scroll { get; set; } = true;
        //public string? inline_editors_date_processing { get; set; } = null;
        //public bool? inline_editors_multiselect_open { get; set; } = null;
        //public bool keep_grid_width { get; set; } = false;
        //public bool keyboard_navigation { get; set; } = true;
        //public bool keyboard_navigation_cells { get; set; } = false;
        //public string layer_attribute { get; set; } = "data-layer";
        //public Layout layout { get; set; } = new Layout()
        //{
        //    css = "gantt_container",
        //    rows = new LayoutRow[]
        //    {
        //        new LayoutRow()
        //        {
        //            cols=new LayoutRowCol[]{
        //                new LayoutRowCol()
        //                {
        //                    view="grid",
        //                    scrollX="scrollHor",
        //                    scrollY="scrollVer",
        //                },
        //                new LayoutRowCol()
        //                {
        //                    resizer=true,
        //                    width=1,
        //                },
        //                new LayoutRowCol()
        //                {
        //                    view="timeline",
        //                    scrollX="scrollHor",
        //                    scrollY="scrollVer",
        //                },
        //                new LayoutRowCol()
        //                {
        //                    view="scrollbar",
        //                    id="scrollVer",
        //                }
        //            }
        //        },
        //        new LayoutRow(){
        //            view="scrollbar",
        //            id="scrollHor",
        //            height=20
        //        }
        //    },
        //    id = "main"
        //};
        //public LightBox lightbox { get; set; } = new LightBox()
        //{
        //    sections = new LightBoxSection[]
        //    {
        //        new LightBoxSection()
        //        {
        //            name="description",
        //            height=70,
        //            map_to="text",
        //            type="textarea",
        //            focus=true
        //        },
        //        new LightBoxSection()
        //        {
        //            name="time",
        //            type="duration",
        //            map_to="auto"
        //        }
        //    },
        //    project_sections = new LightBoxSection[]
        //    {
        //        new LightBoxSection()
        //        {
        //            name="description",
        //            height=70,
        //            map_to="text",
        //            type="textarea",
        //            focus=true
        //        },
        //        new LightBoxSection()
        //        {
        //            name="type",
        //            type="typeselect",
        //            map_to="type"
        //        },
        //        new LightBoxSection()
        //        {
        //            name="time",
        //            type="duration",
        //            @readonly=true,
        //            map_to="auto"
        //        }
        //    },
        //    milestone_sections = new LightBoxSection[]
        //    {
        //        new LightBoxSection()
        //        {
        //            name="description",
        //            height=70,
        //            map_to="text",
        //            type="textarea",
        //            focus=true
        //        },
        //        new LightBoxSection()
        //        {
        //            name="type",
        //            type="typeselect",
        //            map_to="type"
        //        },
        //        new LightBoxSection()
        //        {
        //            name="time",
        //            type="duration",
        //            @readonly=true,
        //            map_to="auto"
        //        }
        //    }
        //};
        //public int link_arrow_size { get; set; } = 12;
        //public string link_attribute { get; set; } = "data-link-id";
        //public int link_line_width { get; set; } = 2;
        //public int link_radius { get; set; } = 4;
        //public int link_wrapper_width { get; set; } = 20;
        //public Link links { get; set; } = new Link
        //{
        //    finish_to_start="0",
        //    start_to_start="1",
        //    finish_to_finish="2",
        //    start_to_finish = "3"
        //};
        //public int min_column_width { get; set; } = 70;
        //public int min_duration { get; set; } = 3600000;
        //public int min_grid_column_width { get; set; } = 70;
        //public int min_task_grid_row_height { get; set; } = 30;
        //public bool multiselect { get; set; } = true;
        //public bool multiselect_one_level { get; set; } = false;
        //public bool open_split_tasks { get; set; } = true;
        //public bool open_tree_initially { get; set; } = false;
        //public string order_branch { get; set; } = "false";
        //public bool order_branch_free { get; set; } = false;
        //public bool placeholder_task { get; set; } = false;
        //public bool preserve_scroll { get; set; } = true;
        //public bool process_resource_assignments { get; set; } = true;
        //public DateTime? project_end { get; set; }
        //public DateTime? project_start { get; set; }
        //public bool quick_info_detached { get; set; } = true;
        //public string[] quickinfo_buttons { get; set; } = ["icon_delete", "icon_edit"];
        //public bool @readonly { get; set; } = false;
        //public string readonly_property { get; set; } = "readonly";
        //public bool redo { get; set; } = true;
        //public bool reorder_grid_columns { get; set; } = false;
        //public bool resize_rows { get; set; } = false;
        //public string resource_assignment_store { get; set; } = "resourceAssignments";
        //public string resource_attribute { get; set; } = "data-resource-id";
        ////public object resource_calendars { get; set; } = new { };
        //public string resource_property { get; set; } = "owner_id";
        //public bool resource_render_empty_cells { get; set; } = false;
        //public string resource_store { get; set; } = "resource";
        //public Resource resources { get; set; } = new Resource();
        //public string root_id { get; set; } = "0";
        //public bool round_dnd_dates { get; set; } = true;
        //public int row_height { get; set; } = 30;
        //public bool rtl { get; set; } = false;
        //public int scale_height { get; set; } = 36;
        //public bool scale_offset_minimal { get; set; } = true;
        //public Scale scales { get; set; } = new Scale();
        //public bool schedule_from_end { get; set; } = false;
        //public bool scroll_on_click { get; set; } = true;
        //public int scroll_size { get; set; } = 15;
        //public bool select_task { get; set; } = true;
        //public bool server_utc { get; set; } = false;
        //public bool show_chart { get; set; } = true;
        //public bool show_empty_state { get; set; } = false;
        //public bool show_errors { get; set; } = true;
        //public bool show_grid { get; set; } = true;
        //public bool show_links { get; set; } = true;
        //public bool show_markers { get; set; } = true;
        //public bool show_progress { get; set; } = true;
        //public bool show_quick_info { get; set; } = true;
        //public bool show_task_cells { get; set; } = true;
        //public bool show_tasks_outside_timescale { get; set; } = false;
        //public bool show_unscheduled { get; set; } = true;
        //public bool skip_off_time { get; set; } = false;
        //public bool smart_rendering { get; set; } = true;
        //public bool smart_scales { get; set; } = true;
        //public bool sort { get; set; } = false;
        //public DateTime? start_date { get; set; } = null;
        //public bool start_on_monday { get; set; } = true;
        //public bool static_background { get; set; } = false;
        //public bool static_background_cells { get; set; } = true;
        //public string task_attribute { get; set; } = "data-task-id";
        //public string task_date { get; set; } = "%d %F %Y";
        //public string task_grid_row_resizer_attribute { get; set; } = "data-row-index";
        //public int task_scroll_offset { get; set; } = 100;
        //public string time_picker { get; set; } = "%H:%i";
        //public int time_step { get; set; } = 60;
        //public bool timeline_placeholder { get; set; } = false;
        //public int tooltip_hide_timeout { get; set; } = 5000;
        //public int tooltip_offset_x { get; set; } = 10;
        //public int tooltip_offset_y { get; set; } = 20;
        //public int tooltip_timeout { get; set; } = 30;
        //public string touch { get; set; } = "false";
        //public int touch_drag { get; set; } = 75;
        //public bool touch_feedback { get; set; } = true;
        //public int touch_feedback_duration { get; set; } = 1;
        ////public object type_renderers { get; set; } = new { };
        //public Types types { get; set; } = new Types();
        //public bool undo { get; set; } = true;
        ////public object undo_actions { get; set; } = new { };
        //public int undo_steps { get; set; } = 10;
        ////public object undo_types { get; set; } = new { };
        //public bool wai_aria_attributes { get; set; } = true;
        ////public object? wheel_scroll_sensitivity { get; set; } = null;
        //public bool wide_form { get; set; } = true;
        //public bool work_time { get; set; } = false;
    }
    public class BaseLines
    {
        public string datastore { get; set; } = "baselines";
        public string? render_model { get; set; } = "false";
        public bool dataprocessor_baselines { get; set; } = false;
        public int row_height { get; set; } = 16;
        public int bar_height { get; set; } = 8;
    }
    public class GridColumn
    {
        public string align { get; set; } = "left";
        public bool hide { get; set; }
        public string label { get; set; } = string.Empty;
        public int max_width { get; set; }
        public int min_width { get; set; }
        public string name { get; set; } = string.Empty;
        public bool resize { get; set; }
        public bool sort { get; set; } = true;
        public bool tree { get; set; } = true;
        public string width { get; set; } = "*";
        public GridEditor? editor { get; set; }
    }
    public class GridEditor
    {
        public string type { get; set; }
        public string map_to { get; set; }
        public DateTime min { get; set; }
        public DateTime max { get; set; }
        //public List<object> options { get; set; }
    }

    public class DragMode
    {
        public string resize { get; set; } = "resize";
        public string progress { get; set; } = "progress";
        public string move { get; set; } = "move";
        public string ignore { get; set; } = "ignore";
    }
    public class DragTimeline
    {
        public string ignore { get; set; } = ".gantt_task_line, .gantt_task_link";
        public bool useKey { get; set; } = false;
        public bool render { get; set; } = false;
    }
    public class Layout
    {
        public string css { get; set; } = "gantt_container";
        public LayoutRow[] rows { get; set; } = [];
        public string id { get; set; } = "main";
    }
    public class LayoutRow
    {
        public string? view { get; set; }
        public string? id { get; set; }
        public int? height { get; set; }
        public LayoutRowCol[]? cols { get; set; }
    }
    public class LayoutRowCol
    {
        public string? view { get; set; }
        public string? scrollX { get; set; }
        public string? scrollY { get; set; }
        public bool? resizer { get; set; }
        public int? width { get; set; }
        public string? id { get; set; }
    }
    public class LightBox
    {
        public LightBoxSection[] sections { get; set; }
        public LightBoxSection[] project_sections { get; set; }
        public LightBoxSection[] milestone_sections { get; set; }
    }
    public class LightBoxSection
    {
        public string name { get; set; }
        public int? height { get; set; }
        public string map_to { get; set; }
        public string type { get; set; }
        public bool? focus { get; set; }
        public bool? @readonly { get; set; }
    }
    public class Config_Link
    {
        public string finish_to_start { get; set; }
        public string start_to_start { get; set; }
        public string finish_to_finish { get; set; }
        public string start_to_finish { get; set; }
    }
    public class Resource
    {
        public bool dataprocessor_assignments { get; set; }
        public bool dataprocessor_resources { get; set; }
        public bool editable_resource_diagram { get; set; }
        public ResourceStore resource_store { get; set; } = new ResourceStore();
    }
    public class ResourceStore
    {
        public string type { get; set; } = "treeDatastore";
        public bool fetchTasks { get; set; } = false;
    }
    public class Scale
    {
        public string unit { get; set; } = "day";
        public int step { get; set; } = 1;
        public string date { get; set; } = "%d %M";
    }
    public class Types
    {
        public string task { get; set; } = "task";
        public string project { get; set; } = "project";
        public string milestone { get; set; } = "milestone";
        public string placeholder { get; set; } = "placeholder";
    }
}
