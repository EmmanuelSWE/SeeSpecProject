namespace SeeSpec.Domains.CodingManagement
{
    public enum GenerationMode
    {
        Incremental = 1,
        Full = 2
    }

    public enum GenerationStatus
    {
        Queued = 1,
        Running = 2,
        Succeeded = 3,
        Failed = 4
    }
}
