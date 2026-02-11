using DevTaskManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DevTaskManager.Infrastructure.Data.Configurations;

public class CardConfiguration : IEntityTypeConfiguration<Card>
{
    public void Configure(EntityTypeBuilder<Card> builder)
    {
        builder.ToTable("cards");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.BoardId).IsRequired();
        builder.Property(c => c.ColumnId).IsRequired();
        builder.Property(c => c.Titulo).IsRequired().HasMaxLength(500);
        builder.Property(c => c.Descricao).HasMaxLength(4000);
        builder.Property(c => c.Status).IsRequired().HasConversion<string>();
        builder.Property(c => c.Ordem).IsRequired();
        builder.Property(c => c.DueDate);
        builder.Property(c => c.CreatedAt).IsRequired();
        builder.HasIndex(c => c.BoardId);
        builder.HasIndex(c => c.ColumnId);
    }
}
