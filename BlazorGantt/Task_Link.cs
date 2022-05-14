using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BlazorGantt
{
    public class Task_Link
    {
        public string id { get; set; }
        public string source { get; set; }
        public string target { get; set; }
        public string type { get; set; }
    }
}
