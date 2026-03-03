using DevTaskManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DevTaskManager.Infrastructure.Data.Configurations;

public class StickyNoteConfiguration : IEntityTypeConfiguration<StickyNote>
{
    public void Configure(EntityTypeBuilder<StickyNote> builder)
    {
        builder.ToTable("sticky_notes");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Title).HasMaxLength(200);
        builder.Property(n => n.Content).HasMaxLength(10000);
        builder.Property(n => n.Color).IsRequired().HasMaxLength(50).HasDefaultValue("yellow");
        builder.Property(n => n.PositionX).IsRequired().HasDefaultValue(0.0);
        builder.Property(n => n.PositionY).IsRequired().HasDefaultValue(0.0);
        builder.Property(n => n.Width).IsRequired().HasDefaultValue(280.0);
        builder.Property(n => n.Height).IsRequired().HasDefaultValue(220.0);
        builder.Property(n => n.ZIndex).IsRequired().HasDefaultValue(0);
        builder.Property(n => n.CreatedAt).IsRequired();
        builder.Property(n => n.UpdatedAt).IsRequired();
    }
}
