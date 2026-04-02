using System;
using System.Collections.Generic;

namespace SeeSpec.Services.BackendService.DTO
{
    public class BackendWorkflowReadinessDto
    {
        public Guid BackendId { get; set; }

        public Guid? SpecId { get; set; }

        public bool HasOverview { get; set; }

        public bool IsOverviewAccepted { get; set; }

        public bool HasRoles { get; set; }

        public bool CanCreateRequirements { get; set; }

        public bool HasRequirements { get; set; }

        public bool EveryRequirementHasUseCaseDiagram { get; set; }

        public bool HasDomainModel { get; set; }

        public bool HasDomainEntities { get; set; }

        public bool EveryUseCaseHasActivityDiagram { get; set; }

        public bool IsCodeGenerationReady { get; set; }

        public int RoleCount { get; set; }

        public int RequirementCount { get; set; }

        public int UseCaseDiagramCount { get; set; }

        public int DomainEntityCount { get; set; }

        public int ActivityDiagramCount { get; set; }

        public List<string> MissingItems { get; set; } = new List<string>();

        public List<string> MissingActivityDiagramUseCases { get; set; } = new List<string>();
    }
}
