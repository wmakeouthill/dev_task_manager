using DevTaskManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DevTaskManager.Infrastructure.Data.Configurations;

public class WorkspaceConfiguration : IEntityTypeConfiguration<Workspace>
{
    public void Configure(EntityTypeBuilder<Workspace> builder)
    {
        builder.ToTable("workspaces");
        builder.HasKey(w => w.Id);
        builder.Property(w => w.Nome).IsRequired().HasMaxLength(200);
        builder.Property(w => w.OwnerId).IsRequired().HasMaxLength(100);
        builder.Property(w => w.CreatedAt).IsRequired();
        builder.HasIndex(w => w.OwnerId);
    }
}
