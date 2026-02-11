using DevTaskManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DevTaskManager.Infrastructure.Data.Configurations;

public class ColumnConfiguration : IEntityTypeConfiguration<Column>
{
    public void Configure(EntityTypeBuilder<Column> builder)
    {
        builder.ToTable("columns");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.BoardId).IsRequired();
        builder.Property(c => c.Nome).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Ordem).IsRequired();
        builder.Property(c => c.WipLimit);
        builder.HasIndex(c => c.BoardId);
    }
}
