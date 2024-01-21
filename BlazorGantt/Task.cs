using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BlazorGantt
{
    public class Task
    {
        /// <summary>
        /// 任务id，如果未设置则自动生成
        /// </summary>
        public string Id { get; set; } = Guid.NewGuid().ToString();
        /// <summary>
        /// 计划任务开始的日期。如果未指定，Gantt将根据end_date和duration属性进行计算。当设置unscheduled:true时，该属性变为可选属性。
        /// </summary>
        public DateTime StartDate { get; set; }
        /// <summary>
        /// 计划完成任务的日期。如果未指定，Gantt将根据start_date和duration属性进行计算。 当设置unscheduled:true时，该属性变为可选属性。
        /// </summary>
        public DateTime EndDate { get; set; }
        /// <summary>
        /// 任务持续时间。如果未指定，Gantt将根据start_date和end_date属性进行计算。
        /// </summary>
        public int Duration { get; set; }


        /// <summary>
        /// 定义gantt是否应执行任务的自动调度（true）或不执行（false）
        /// </summary>
        public bool auto_scheduling { get; set; }
        /// <summary>
        /// 设置任务的DOM元素在时间线区域中的高度
        /// </summary>
        public int bar_height { get; set; }
        /// <summary>
        /// 设置要分配给任务的自定义日历的id。属性的名称取决于calendar_perty选项的值
        /// </summary>
        public string calendar_id { get; set; }
        /// <summary>
        /// 设置时间线区域中任务的颜色（即为任务的gant_task_line元素设置背景色）
        /// </summary>
        public string color { get; set; }
        /// <summary>
        /// 任务约束的日期。当启用具有时间约束的自动调度时，它会添加到任务对象中。如果启用了auto_scheduling_compatibility，则不使用该属性。
        /// </summary>
        public DateTime constraint_date { get; set; }
        /// <summary>
        /// 任务约束的类型（“asap”、“alap”、”snet“、”snlt“、”fnet“、“fnlt”、”mso“、”mfo“）。当启用具有时间约束的自动调度时，它会添加到任务对象中。如果启用了auto_scheduling_compatibility，则不使用该属性。
        /// </summary>
        public string constraint_type { get; set; }
        /// <summary>
        /// 定义任务是否可以在只读甘特图中编辑。属性的名称取决于editable_property选项的值
        /// </summary>
        public bool editable { get; set; }
        /// <summary>
        /// 组的id。如果将用于对任务进行分组的属性（groupBy（）方法中的relation_property）指定为对象，则会将其添加到按某些条件分组的任务中。
        /// </summary>
        public string group_id { get; set; }
        /// <summary>
        /// 定义是任务（type:"task"）还是里程碑（type:"milestone"）
        /// 应该隐藏在时间线区域中
        /// </summary>
        public bool hide_bar { get; set; }
        /// <summary>
        /// 组的key。如果用于对任务进行分组的属性（groupBy（）方法中的relation_property）被指定为数组，则它将被添加到按某些标准分组的任务中。它也会添加到具有组名称的任务中（例如，如果您已按优先级对任务进行分组，则会添加到“High”、“Normal”和“Low”任务中。查看示例）。
        /// </summary>
        public string key { get; set; }
        /// <summary>
        /// 组的标签。它将添加到具有组名称的任务中（例如，如果您已按优先级对任务进行分组，则该属性将添加到名称为“High”、“Normal”和“Low”的任务中。查看示例）。
        /// </summary>
        public string label { get; set; }
        /// <summary>
        /// 指定最初是否打开任务分支（以显示子任务）。要在Gantt初始化后关闭/打开分支，请使用相关方法：close（）和open（）
        /// </summary>
        public bool open { get; set; }
        /// <summary>
        /// 父任务的id。如果指定的父级不存在，则任务将不会在甘特图中呈现。根任务的id由root_id配置指定。
        /// </summary>
        public string parent { get; set; }
        /// <summary>
        /// 任务的进度（从0到1）
        /// </summary>
        public decimal Progress { get; set; }
        /// <summary>
        /// 时间线区域中任务进度的颜色（即为任务进度的gant_task_progress元素设置背景色）
        /// </summary>
        public string progressColor { get; set; }
        /// <summary>
        /// 定义任务是否必须是只读的。属性的名称取决于readonly_property选项的值
        /// </summary>
        public bool Readonly{get;set;}
        /// <summary>
        /// 定义必须如何显示任务的子任务。值：“split”|“”。如果设置为“split”，则子任务将显示在一行中。此外，如果启用open_split_tasks属性，则只有当任务折叠时，子任务才会呈现在一行中。
        /// </summary>
        public string render {  get; set; }
        /// <summary>
        /// 具有分配给任务的资源的数组。从MS Project/Primavera导入数据时，它会添加到任务对象中
        /// </summary>
        public List<string> resource { get; set; }
        /// <summary>
        /// 指定是否应在父项目上显示任务（type：“task”）或里程碑（type：“milestone”）。
        /// </summary>
        public bool rollup { get; set; }
        /// <summary>
        /// 设置任务行的高度
        /// </summary>
        public int row_height { get; set; }
        /// <summary>
        /// 目标任务的id。该属性显示的值与$drop_target属性相同。只有在更新任务并将数据发送到服务器之后，启用了数据处理器，才会将属性添加到任务对象中。
        /// </summary>
        public string target { get; set; }
        /// <summary>
        /// 任务的名称。如有必要，您可以使用此属性的任何其他名称。该属性用于甘特不同部分的默认配置。
        /// </summary>
        public string? Text { get; set; }
        /// <summary>
        /// 时间线区域中任务文本的颜色（即为任务的gant_task_line元素设置颜色）
        /// </summary>
        public string textColor { get; set; }
        /// <summary>
        /// 任务类型。可用值存储在types对象中：
        /// “task”-常规任务（默认值）。<br/>
        /// “project”-当最早的子任务开始时开始，当最新的子任务结束时结束的任务。对于此类任务，将忽略start_date、end_date和duration属性。<br/>
        /// “milestone”-一个零工期的任务，用于标记项目的重要日期。对于此类任务，将忽略持续时间、进度和结束日期属性。
        /// </summary>
        public string Type { get; set; } = "task";
        /// <summary>
        /// 定义是否必须计划任务。默认情况下，未计划的任务不会显示在时间线区域中，空值显示在网格中，而不是开始和结束日期。
        /// </summary>
        public bool unscheduled { get; set; }
    }
    public class Link
    {
        public int Id { get; set; }
        public string? Type { get; set; }
        public int SourceTaskId { get; set; }
        public int TargetTaskId { get; set; }
    }
}
