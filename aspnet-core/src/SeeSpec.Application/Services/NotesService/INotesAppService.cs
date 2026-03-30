using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.NotesService.DTO;

namespace SeeSpec.Services.NotesService
{
    public interface INotesAppService : IAsyncCrudAppService<NotesDto, Guid, PagedAndSortedResultRequestDto, NotesDto, NotesDto>
    {
    }
}

