using System.Data.Common;
using Microsoft.EntityFrameworkCore;

namespace SeeSpec.EntityFrameworkCore
{
    public static class SeeSpecDbContextConfigurer
    {
        public static void Configure(DbContextOptionsBuilder<SeeSpecDbContext> builder, string connectionString)
        {
            builder.UseSqlServer(connectionString);
        }

        public static void Configure(DbContextOptionsBuilder<SeeSpecDbContext> builder, DbConnection connection)
        {
            builder.UseSqlServer(connection);
        }
    }
}
