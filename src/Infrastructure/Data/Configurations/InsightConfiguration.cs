using DevTaskManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DevTaskManager.Infrastructure.Data.Configurations;

public class InsightConfiguration : IEntityTypeConfiguration<Insight>
{
    public void Configure(EntityTypeBuilder<Insight> builder)
    {
        builder.ToTable("insights");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.CardId).IsRequired();
        builder.Property(i => i.CardTitle).IsRequired().HasMaxLength(200);
        builder.Property(i => i.Status).IsRequired().HasMaxLength(50);
        builder.Property(i => i.Content).IsRequired();
        builder.Property(i => i.Provider).IsRequired().HasMaxLength(100);
        builder.Property(i => i.Action).IsRequired().HasMaxLength(100);
        builder.Property(i => i.DurationMs).IsRequired();
        builder.Property(i => i.CreatedAt).IsRequired();
        builder.HasIndex(i => i.CardId);
    }
}
