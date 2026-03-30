namespace SeeSpec.Domains.SpecManagement
{
    public enum SpecStatus
    {
        Draft = 1,
        InReview = 2,
        Approved = 3,
        Archived = 4
    }

    public enum SectionType
    {
        Requirement = 1,
        Architecture = 2,
        Domain = 3,
        Shared = 4
    }

    public enum SectionOwnerRole
    {
        ProjectLead = 1,
        BusinessAnalyst = 2,
        SystemArchitect = 3,
        Shared = 4
    }

    public enum SectionItemType
    {
        Paragraph = 1,
        Bullet = 2,
        TableRow = 3,
        ChecklistItem = 4
    }

    public enum SectionDependencyType
    {
        DependsOn = 1,
        Blocks = 2,
        RelatesTo = 3
    }

    public enum DiagramType
    {
        UseCase = 1,
        DomainModel = 2,
        Activity = 3
    }
}
