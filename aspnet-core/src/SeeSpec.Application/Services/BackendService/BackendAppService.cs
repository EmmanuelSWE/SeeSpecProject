using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Collections.Extensions;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.AspNetCore.Http;
using SeeSpec.Domains.ProjectManagement;
using SeeSpec.Services.BackendService.DTO;
using SeeSpec.Services.SpecService;

namespace SeeSpec.Services.BackendService
{
    [AbpAuthorize]
    public class BackendAppService : AsyncCrudAppService<Backend, BackendDto, Guid, PagedAndSortedResultRequestDto, BackendDto, BackendDto>, IBackendAppService
    {
        private readonly ISpecAppService _specAppService;
        private readonly IBackendImportService _backendImportService;

        public BackendAppService(
            IRepository<Backend, Guid> repository,
            ISpecAppService specAppService,
            IBackendImportService backendImportService)
            : base(repository)
        {
            _specAppService = specAppService;
            _backendImportService = backendImportService;
        }

        public async Task<BackendDto> GetBySlugAsync(GetBackendBySlugInputDto input)
        {
            if (input == null || string.IsNullOrWhiteSpace(input.Slug))
            {
                throw new UserFriendlyException("A backend slug is required.");
            }

            // Route-scoped pages must resolve the backend directly instead of depending on a paged list lookup.
            var backend = await AsyncQueryableExecuter.FirstOrDefaultAsync(
                Repository.GetAll().Where(x => x.Slug == input.Slug));

            return backend == null ? null : MapToEntityDto(backend);
        }

        public override async Task<BackendDto> CreateAsync(BackendDto input)
        {
            BackendDto backend = await base.CreateAsync(input);

            // Backend creation stops at Backend + Spec so overview authoring remains the explicit
            // semantic gate before any downstream sections or diagrams are introduced.
            await _specAppService.EnsureSpecAsync(new EntityDto<Guid>(backend.Id));

            return backend;
        }

        public async Task<BackendUploadResultDto> UploadAsync(IFormFile file, CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
            {
                throw new UserFriendlyException("A backend archive file is required.");
            }

            // The controller stays thin; upload orchestration lives in the backend service layer now.
            using (var readStream = file.OpenReadStream())
            {
                return await _backendImportService.ImportArchiveAsync(readStream, file.FileName, cancellationToken);
            }
        }

        public async Task<BackendUploadResultDto> ImportFolderAsync(BackendFolderImportInputDto input, CancellationToken cancellationToken)
        {
            if (input == null || string.IsNullOrWhiteSpace(input.FolderPath))
            {
                throw new UserFriendlyException("A backend folder path is required.");
            }

            // Folder imports follow the same backend service entry pattern as archive uploads.
            return await _backendImportService.ImportFolderAsync(input.FolderPath, cancellationToken);
        }

        public async Task<ListResultDto<AllowedGenerationFolderDto>> GetAllowedGenerationFoldersAsync(
            GetAllowedGenerationFoldersInputDto input,
            CancellationToken cancellationToken)
        {
            return new ListResultDto<AllowedGenerationFolderDto>(
                await _backendImportService.GetAllowedGenerationFoldersAsync(input, cancellationToken));
        }

        public Task<AllowedGenerationFolderDto> ValidateGenerationFolderAsync(
            ValidateGenerationFolderInputDto input,
            CancellationToken cancellationToken)
        {
            return _backendImportService.ValidateGenerationFolderAsync(input, cancellationToken);
        }

        protected override IQueryable<Backend> CreateFilteredQuery(PagedAndSortedResultRequestDto input)
        {
            var query = base.CreateFilteredQuery(input);

            if (AbpSession.TenantId.HasValue)
            {
                query = query.Where(x => x.TenantId == AbpSession.TenantId.Value);
            }

            return query;
        }
    }
}

