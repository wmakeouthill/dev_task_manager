using DevTaskManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DevTaskManager.Infrastructure.Data.Configurations;

public class BoardConfiguration : IEntityTypeConfiguration<Board>
{
    public void Configure(EntityTypeBuilder<Board> builder)
    {
        builder.ToTable("boards");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.WorkspaceId).IsRequired();
        builder.Property(b => b.Nome).IsRequired().HasMaxLength(200);
        builder.Property(b => b.CreatedAt).IsRequired();

        builder.HasMany(b => b.Columns)
            .WithOne()
            .HasForeignKey(c => c.BoardId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(b => b.Columns).UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasIndex(b => b.WorkspaceId);
    }
}
