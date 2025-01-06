using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BlazorGantt
{
    public class MessageObject
    {
        public string? id { get; set; }
        public string text { get; set; }
        public string? type { get; set; }
        public int? expire { get; set; }
    }
}
