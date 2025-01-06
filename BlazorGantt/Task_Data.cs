using Microsoft.JSInterop;
using Microsoft.JSInterop.Implementation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace BlazorGantt
{
    public class Task_Data
    {
        [JsonPropertyName("$calculate_duration")]
        public bool calculate_duration { get; set; }
        [JsonPropertyName("$effective_calendar")]
        public string? effective_calendar { get; set; }
        [JsonPropertyName("$expanded_branch")]
        public bool expanded_branch { get; set; }
        [JsonPropertyName("$index")]
        public int index { get; set; }
        [JsonPropertyName("$level")]
        public int level { get; set; }
        [JsonPropertyName("$local_index")]
        public int local_index { get; set; }
        [JsonPropertyName("$no_end")]
        public bool no_end { get; set; }
        [JsonPropertyName("$no_start")]
        public bool no_start { get; set; }
        [JsonPropertyName("$rendered_parent")]
        public int rendered_parent { get; set; }
        [JsonPropertyName("$rendered_type")]
        public string? rendered_type { get; set; }
        [JsonPropertyName("$resourceAssignments")]
        public IJSObjectReference[]? resourceAssignments { get; set; }
        [JsonPropertyName("$source")]
        public string[]? source { get; set; }
        [JsonPropertyName("$target")]
        public string[]? target { get; set; }
        public int? duration { get; set; }
        public string? end_date { get; set; }
        public required string id { get; set; }
        public bool open { get; set; }
        public int order { get; set; }
        [JsonConverter(typeof(NumberToStringConverter))]
        public string? parent { get; set; }
        public double progress { get; set; }
        public string? start_date { get; set; }
        public string? text { get; set; }
        public string? type { get; set; }
    }
}
