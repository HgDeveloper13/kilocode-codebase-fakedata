using System.ComponentModel;

namespace CSharpTestProject.Models;

public enum TaskStatus
{
    [Description("Not Started")]
    NotStarted = 0,
    
    [Description("In Progress")]
    InProgress = 1,
    
    [Description("Completed")]
    Completed = 2,
    
    [Description("Blocked")]
    Blocked = 3
}