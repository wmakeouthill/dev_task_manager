using DevTaskManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DevTaskManager.Infrastructure.Data.Configurations;

public class ReminderConfiguration : IEntityTypeConfiguration<Reminder>
{
    public void Configure(EntityTypeBuilder<Reminder> builder)
    {
        builder.ToTable("reminders");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Titulo).IsRequired().HasMaxLength(200);
        builder.Property(r => r.Descricao).HasMaxLength(2000);
        builder.Property(r => r.ScheduleAt).IsRequired();
        builder.Property(r => r.Status).HasConversion<string>().IsRequired();
        builder.Property(r => r.Recurrence).HasConversion<string>().IsRequired();
        builder.Property(r => r.CreatedAt).IsRequired();
        builder.HasIndex(r => r.CardId);
        builder.HasIndex(r => new { r.Status, r.ScheduleAt });
    }
}
