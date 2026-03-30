using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.TeamService.DTO;

namespace SeeSpec.Services.TeamService
{
    public interface ITeamAppService : IAsyncCrudAppService<TeamDto, Guid, PagedAndSortedResultRequestDto, TeamDto, TeamDto>
    {
    }
}

