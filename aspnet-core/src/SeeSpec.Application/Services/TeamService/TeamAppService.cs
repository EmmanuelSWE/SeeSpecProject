using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using SeeSpec.Domains.ProjectManagement;
using SeeSpec.Services.TeamService.DTO;

namespace SeeSpec.Services.TeamService
{
    [AbpAuthorize]
    public class TeamAppService : AsyncCrudAppService<Team, TeamDto, Guid, PagedAndSortedResultRequestDto, TeamDto, TeamDto>, ITeamAppService
    {
        public TeamAppService(IRepository<Team, Guid> repository)
            : base(repository)
        {
        }
    }
}

