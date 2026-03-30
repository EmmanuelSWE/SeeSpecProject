namespace SeeSpec.Domains.ProjectManagement
{
    public enum BackendStatus
    {
        Draft = 1,
        Active = 2,
        Archived = 3
    }

    public enum TaskStatus
    {
        Open = 1,
        InProgress = 2,
        Blocked = 3,
        Completed = 4,
        Cancelled = 5
    }

    public enum TaskPriority
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }

    public enum NoteType
    {
        Manual = 1,
        AutomaticGeneration = 2,
        Review = 3
    }
}
