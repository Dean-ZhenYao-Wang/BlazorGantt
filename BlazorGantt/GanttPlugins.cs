using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BlazorGantt
{
    public class GanttPlugins
    {
        public bool click_drag { get; set; }
        public bool auto_scheduling { get; set; }
        public bool critical_path { get; set; }
        public bool drag_timeline { get; set; }
        public bool overlay { get; set; }
        public bool export_api { get; set; }
        public bool fullscreen { get; set; }
        public bool grouping { get; set; }
        public bool keyboard_navigation { get; set; }
        public bool multiselect { get; set; }
        public bool quick_info { get; set; }
        public bool tooltip { get; set; }
        public bool undo { get; set; }
        public bool marker { get; set; }
    }
}
