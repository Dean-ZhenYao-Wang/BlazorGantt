using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BlazorGantt
{
    public class GanttData
    {
        public List<Task> data { get; set; }
        public List<Link> links { get; set; }
    }

}
