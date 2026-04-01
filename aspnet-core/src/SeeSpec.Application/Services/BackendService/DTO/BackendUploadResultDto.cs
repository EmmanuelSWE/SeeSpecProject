using System;
using SeeSpec.Domains.ProjectManagement;

namespace SeeSpec.Services.BackendService.DTO
{
    public class BackendUploadResultDto
    {
        public Guid BackendId { get; set; }

        public string Name { get; set; }

        public BackendStatus Status { get; set; }

        public string NextAction { get; set; }
    }
}
