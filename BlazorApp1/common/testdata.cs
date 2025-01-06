using BlazorGantt;
using System.Threading.Tasks;

namespace BlazorApp1.common
{
    public class testdata
    {
        public static Tasks demo_tasks = new Tasks
        {
            data = new List<Task_Data>()
            {
                new Task_Data { id = "11", text = "Project #1", start_date = "28-03-2023", duration = 11, progress = 0.6, open = true },
                new Task_Data { id = "1", text = "Project #2", start_date = "01-04-2023", duration = 18, progress = 0.4, open = true },
                new Task_Data { id = "2", text = "Task #1", start_date = "02-04-2023", duration = 8, parent = "1", progress = 0.5, open = true },
                new Task_Data { id = "3", text = "Task #2", start_date = "11-04-2023", duration = 8, parent = "1", progress = 0.6, open = true },
                new Task_Data { id = "4", text = "Task #3", start_date = "13-04-2023", duration = 6, parent = "1", progress = 0.5, open = true },
                new Task_Data { id = "5", text = "Task #1.1", start_date = "02-04-2023", duration = 7, parent = "2", progress = 0.6, open = true },
                new Task_Data { id = "6", text = "Task #1.2", start_date = "03-04-2023", duration = 7, parent = "2", progress = 0.6, open = true },
                new Task_Data { id = "7", text = "Task #2.1", start_date = "11-04-2023", duration = 8, parent = "3", progress = 0.6, open = true },
                new Task_Data { id = "8", text = "Task #3.1", start_date = "14-04-2023", duration = 5, parent = "4", progress = 0.5, open = true },
                new Task_Data { id = "9", text = "Task #3.2", start_date = "14-04-2023", duration = 4, parent = "4", progress = 0.5, open = true },
                new Task_Data { id = "10", text = "Task #3.3", start_date = "14-04-2023", duration = 3, parent = "4", progress = 0.5, open = true },
                new Task_Data { id = "12", text = "Task #1", start_date = "03-04-2023", duration = 5, parent = "11", progress = 1, open = true },
                new Task_Data { id = "13", text = "Task #2", start_date = "02-04-2023", duration = 7, parent = "11", progress = 0.5, open = true },
                new Task_Data { id = "14", text = "Task #3", start_date = "02-04-2023", duration = 6, parent = "11", progress = 0.8, open = true },
                new Task_Data { id = "15", text = "Task #4", start_date = "02-04-2023", duration = 5, parent = "11", progress = 0, open = true },
                        new Task_Data { id = "16", text = "Task #5", start_date = "02-04-2023", duration = 7, parent = "11", progress = 0, open = true },
                new Task_Data { id = "17", text = "Task #2.1", start_date = "03-04-2023", duration = 2, parent = "13", progress = 1, open = true },
                new Task_Data { id = "18", text = "Task #2.2", start_date = "06-04-2023", duration = 3, parent = "13", progress = 0.8, open = true },
                new Task_Data { id = "19", text = "Task #2.3", start_date = "10-04-2023", duration = 4, parent = "13", progress = 0.2, open = true },
                new Task_Data { id = "20", text = "Task #2.4", start_date = "10-04-2023", duration = 4, parent = "13", progress = 0, open = true },
                new Task_Data { id = "21", text = "Task #4.1", start_date = "03-04-2023", duration = 4, parent = "15", progress = 0.5, open = true },
                new Task_Data { id = "22", text = "Task #4.2", start_date = "03-04-2023", duration = 4, parent = "15", progress = 0.1, open = true },
                new Task_Data { id = "23", text = "Task #4.3", start_date = "03-04-2023", duration = 5, parent = "15", progress = 0, open = true }
            },
            links = new List<Task_Link>
            {
                new Task_Link { id = "1", source = "1", target = "2", type = "1" },
                new Task_Link { id = "2", source = "2", target = "3", type = "0" },
                new Task_Link { id = "3", source = "3", target = "4", type = "0" },
                new Task_Link { id = "4", source = "2", target = "5", type = "2" },
                new Task_Link { id = "5", source = "2", target = "6", type = "2" },
                new Task_Link { id = "6", source = "3", target = "7", type = "2" },
                new Task_Link { id = "7", source = "4", target = "8", type = "2" },
                new Task_Link { id = "8", source = "4", target = "9", type = "2" },
                new Task_Link { id = "9", source = "4", target = "10", type = "2" },
                new Task_Link { id = "10", source = "11", target = "12", type = "1" },
                new Task_Link { id = "11", source = "11", target = "13", type = "1" },
                new Task_Link { id = "12", source = "11", target = "14", type = "1" },
                new Task_Link { id = "13", source = "11", target = "15", type = "1" },
                new Task_Link { id = "14", source = "11", target = "16", type = "1" },
                new Task_Link { id = "15", source = "13", target = "17", type = "1" },
                new Task_Link { id = "16", source = "17", target = "18", type = "0" },
                new Task_Link { id = "17", source = "18", target = "19", type = "0" },
                new Task_Link { id = "18", source = "19", target = "20", type = "0" },
                new Task_Link { id = "19", source = "15", target = "21", type = "2" },
                new Task_Link { id = "20", source = "15", target = "22", type = "2" },
                new Task_Link { id = "21", source = "15", target = "23", type = "2" }
            }
        };
        public static object projects_with_milestones = new
        {
            tasks = new List<Task_Data>
            {
                new Task_Data {id="11", text="Project #1", type="project", progress= 0.6, open= true},
                new Task_Data {id="12", text="Task #1", start_date="03-04-2023", duration=5, parent="11", progress= 1, open= true},
                new Task_Data {id="13", text="Task #2", start_date="03-04-2023", type="project", parent="11", progress= 0.5, open= true},
                new Task_Data {id="14", text="Task #3", start_date="02-04-2023", duration=6, parent="11", progress= 0.8, open= true},
                new Task_Data {id="15", text="Task #4", type= "project", parent="11", progress= 0.2, open= true},
                new Task_Data {id="16", text="Final milestone", start_date="15-04-2023", type= "milestone", parent="11", progress= 0, open= true},
                new Task_Data {id="17", text="Task #2.1", start_date="03-04-2023", duration=2, parent="13", progress= 1, open= true},
                new Task_Data {id="18", text="Task #2.2", start_date="06-04-2023", duration=3, parent="13", progress= 0.8, open= true},
                new Task_Data {id="19", text="Task #2.3", start_date="10-04-2023", duration=4, parent="13", progress= 0.2, open= true},
                new Task_Data {id="20", text="Task #2.4", start_date="10-04-2023", duration=4, parent="13", progress= 0, open= true},
                new Task_Data {id="21", text="Task #4.1", start_date="03-04-2023", duration=4, parent="15", progress= 0.5, open= true},
                new Task_Data {id="22", text="Task #4.2", start_date="03-04-2023", duration=4, parent="15", progress= 0.1, open= true},
                new Task_Data {id="23", text="Mediate milestone", start_date="14-04-2023", type= "milestone", parent="15", progress= 0, open= true}
            },
            links = new List<Task_Link>
            {
                new Task_Link { id = "10", source = "11", target = "12", type = "1" },
                new Task_Link { id = "11", source = "11", target = "13", type = "1" },
                new Task_Link { id = "12", source = "11", target = "14", type = "1" },
                new Task_Link { id = "13", source = "11", target = "15", type = "1" },
                new Task_Link { id = "14", source = "23", target = "16", type = "0" },
                new Task_Link { id = "15", source = "13", target = "17", type = "1" },
                new Task_Link { id = "16", source = "17", target = "18", type = "0" },
                new Task_Link { id = "17", source = "18", target = "19", type = "0" },
                new Task_Link { id = "18", source = "19", target = "20", type = "0" },
                new Task_Link { id = "19", source = "15", target = "21", type = "2" },
                new Task_Link { id = "20", source = "15", target = "22", type = "2" },
                new Task_Link { id = "21", source = "15", target = "23", type = "0" }
            }
        };
        public static object data_end_dates = new
        {
            data = new object[]
            {
                new{
                    id= 1,
                    end_date= "2025-04-01 00:00:00",
                    text= "Project #1",
                    progress= 0.8,
                    sortorder= 20,
                    parent= 0,
                    open= true,
                    duration= 5
                  }, 
                new{
                    id= 2,
                    end_date= "2025-04-06 00:00:00",
                    duration= 4,
                    text= "Task #1",
                    progress= 0.5,
                    sortorder= 10,
                    parent= 1,
                    open= true
                  }, 
                new{
                    id= 3,
                    end_date= "2025-04-05 00:00:00",
                    duration= 6,
                    text= "Task #2",
                    progress= 0.7,
                    sortorder= 20,
                    parent= 1,
                    open= true
                  }, 
                new{
                    id= 4,
                    end_date= "2025-04-07 00:00:00",
                    duration= 2,
                    text= "Task #3",
                    progress= 0,
                    sortorder= 30,
                    parent= 1,
                    open= true
                  }, 
                new{
                    id= 5,
                    end_date= "2025-04-05 00:00:00",
                    duration= 5,
                    text= "Task #1.1",
                    progress= 0.34,
                    sortorder= 10,
                    parent= 2,
                    open= true
                  }, 
                new{
                    id= 6,
                    end_date= "2025-04-11 13:22:17",
                    duration= 4,
                    text= "Task #1.2",
                    progress= 0.491477,
                    sortorder= 20,
                    parent= 2,
                    open= true
                  }, 
                new{
                    id= 7,
                    end_date= "2025-04-07 00:00:00",
                    duration= 5,
                    text= "Task #2.1",
                    progress= 0.2,
                    sortorder= 10,
                    parent= 3,
                    open= true
                  }, 
                new{
                    id= 8,
                    end_date= "2025-04-06 00:00:00",
                    duration= 4,
                    text= "Task #2.2",
                    progress= 0.9,
                    sortorder= 20,
                    parent= 3,
                    open= true
                  }, 
                new{
                    id= 9,
                    end_date= "2025-04-06 00:00:00",
                    duration= 5,
                    text= "Task #3.1",
                    progress= 1,
                    sortorder= 10,
                    parent= 4,
                    open= true
                  }, 
                new{
                    id= 10,
                    end_date= "2025-04-06 00:00:00",
                    duration= 3,
                    text= "Task #3.2",
                    progress= 0,
                    sortorder= 20,
                    parent= 4,
                    open= true
                  }, 
                new{
                    id= 11,
                    end_date= "2025-04-06 00:00:00",
                    duration= 4,
                    text= "Task #3.3",
                    progress= 0.33,
                    sortorder= 30,
                    parent= 4,
                    open= true
                  }, 
                new{
                    id= 12,
                    end_date= "2025-04-02 08:34:17",
                    duration= 18,
                    text= "Project #2",
                    progress= 0,
                    sortorder= 10,
                    parent= 0,
                    open= true
                  }, 
                new{
                    id= 13,
                    end_date= "2025-04-02 08:13:42",
                    duration= 10,
                    text= "Task #1",
                    progress= 0.2,
                    sortorder= 15,
                    parent= 12,
                    open= true
                  }, 
                new{
                    id= 14,
                    end_date= "2025-04-04 00:00:00",
                    duration= 4,
                    text= "Task #2",
                    progress= 0.9,
                    sortorder= 20,
                    parent= 12,
                    open= true
                  }, 
                new{
                    id= 15,
                    end_date= "2025-04-05 00:00:00",
                    duration= 3,
                    text= "Task #3",
                    progress= 0.6,
                    sortorder= 30,
                    parent= 12,
                    open= true
                  }, 
                new{
                    id= 16,
                    end_date= "2025-04-01 00:00:00",
                    duration= 3,
                    text= "Task #4",
                    progress= 0.214286,
                    sortorder= 40,
                    parent= 12,
                    open= true
                  }, 
                new{
                    id= 17,
                    end_date= "2025-04-06 00:00:00",
                    duration= 6,
                    text= "Task #5",
                    progress= 0.5,
                    sortorder= 50,
                    parent= 12,
                    open= true
                  }, 
                new{
                    id= 18,
                    end_date= "2025-04-05 00:00:00",
                    duration= 5,
                    text= "Task #2.1",
                    progress= 0.3,
                    sortorder= 39.999999994179,
                    parent= 14,
                    open= true
                  }, 
                new{
                    id= 19,
                    end_date= "2025-04-05 00:00:00",
                    duration= 6,
                    text= "Task #2.2",
                    progress= 0.6,
                    sortorder= 29.999999995343,
                    parent= 14,
                    open= true
                  }, 
                new{
                    id= 20,
                    end_date= "2025-04-05 00:00:00",
                    duration= 4,
                    text= "Task #2.3",
                    progress= 0.512605,
                    sortorder= 39.999999995343,
                    parent= 14,
                    open= true
                  }, 
                new{
                    id= 21,
                    end_date= "2025-04-05 00:00:00",
                    duration= 6,
                    text= "Task #2.4",
                    progress= 0.7,
                    sortorder= 39.999999993015,
                    parent= 14,
                    open= true
                  }, 
                new{
                    id= 22,
                    end_date= "2025-04-05 00:00:00",
                    duration= 7,
                    text= "Task #4.1",
                    progress= 1,
                    sortorder= 10,
                    parent= 16,
                    open= true
                  }, 
                new{
                    id= 23,
                    end_date= "2025-04-05 00:00:00",
                    duration= 5,
                    text= "Task #4.2",
                    progress= 1,
                    sortorder= 20,
                    parent= 16,
                    open= true
                  }, 
                new{
                    id= 24,
                    end_date= "2025-04-05 00:00:00",
                    duration= 5,
                    text= "Task #4.3",
                    progress= 0,
                    sortorder= 30,
                    parent= 16,
                    open= true
                  }
            },
            collections = new
            {
                links=new object[]
                {
                    new{
                      id= 1,
                      source= 1,
                      target= 2,
                      type= "0"
                    }, 
                    new{
                      id= 2,
                      source= 1,
                      target= 3,
                      type= "0"
                    }, 
                    new{
                      id= 3,
                      source= 1,
                      target= 4,
                      type= "0"
                    }, 
                    new{
                      id= 4,
                      source= 2,
                      target= 6,
                      type= "0"
                    } 
                }
            }
        };
    }
}
