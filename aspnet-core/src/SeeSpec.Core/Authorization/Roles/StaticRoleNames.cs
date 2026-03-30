namespace SeeSpec.Authorization.Roles
{
    public static class StaticRoleNames
    {
        public static class Host
        {
            public const string Admin = "Host Admin";
        }

        public static class Tenants
        {
            public const string Admin = "Tenant Admin";
            public const string ProjectLead = "Project Lead";
            public const string BusinessAnalyst = "Business Analyst";
            public const string SystemArchitect = "System Architect";
        }
    }
}
