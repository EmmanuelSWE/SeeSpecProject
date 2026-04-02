using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Domain.Repositories;
using SeeSpec.Authorization;
using SeeSpec.Domains.ProjectManagement;
using SeeSpec.Services.TeamService.DTO;

namespace SeeSpec.Services.TeamService
{
    public class TeamAppService : AsyncCrudAppService<Team, TeamDto, Guid, PagedAndSortedResultRequestDto, TeamDto, TeamDto>, ITeamAppService
    {
        public TeamAppService(IRepository<Team, Guid> repository)
            : base(repository)
        {
            GetPermissionName = PermissionNames.Pages_Team_View;
            GetAllPermissionName = PermissionNames.Pages_Team_ViewAll;
            CreatePermissionName = PermissionNames.Pages_Team_AddPeople;
            UpdatePermissionName = PermissionNames.Pages_Team_EditPeople;
            DeletePermissionName = PermissionNames.Pages_Team_RemovePeople;
        }
    }
}

