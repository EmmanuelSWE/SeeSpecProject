using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using SeeSpec.Domains.ProjectManagement;
using SeeSpec.Services.NotesService.DTO;

namespace SeeSpec.Services.NotesService
{
    [AbpAuthorize]
    public class NotesAppService : AsyncCrudAppService<Note, NotesDto, Guid, PagedAndSortedResultRequestDto, NotesDto, NotesDto>, INotesAppService
    {
        public NotesAppService(IRepository<Note, Guid> repository)
            : base(repository)
        {
        }
    }
}

