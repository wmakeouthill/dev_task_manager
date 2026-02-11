using DevTaskManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DevTaskManager.Infrastructure.Data.Configurations;

public class ChecklistItemConfiguration : IEntityTypeConfiguration<ChecklistItem>
{
    public void Configure(EntityTypeBuilder<ChecklistItem> builder)
    {
        builder.ToTable("checklist_items");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.CardId).IsRequired();
        builder.Property(c => c.Texto).IsRequired().HasMaxLength(500);
        builder.Property(c => c.Concluido).IsRequired();
        builder.Property(c => c.Ordem).IsRequired();
        builder.Property(c => c.CreatedAt).IsRequired();
        builder.HasIndex(c => c.CardId);
    }
}
