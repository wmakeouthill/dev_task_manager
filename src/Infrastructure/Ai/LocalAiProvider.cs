using System.Diagnostics;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Infrastructure.Ai;

/// <summary>
/// Default AI provider that generates helpful responses without requiring an external API.
/// Can be replaced with OpenAiProvider or OllamaProvider when configured.
/// </summary>
public class LocalAiProvider : IAiProvider
{
    public string ProviderName => "local-builtin";

    public Task<AiResponse> ExecuteAsync(AiRequest request, CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        var content = request.Action.ToLowerInvariant() switch
        {
            "summarize" => GenerateSummary(request),
            "subtasks" => GenerateSubtasks(request),
            "clarify" => GenerateClarify(request),
            "risk" => GenerateRisk(request),
            "insights" => GenerateInsights(request),
            _ => $"Ação '{request.Action}' não reconhecida. Ações disponíveis: summarize, subtasks, clarify, risk, insights."
        };
        sw.Stop();

        return Task.FromResult(new AiResponse(content, ProviderName, sw.Elapsed));
    }

    private static string GenerateSummary(AiRequest r)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"## Resumo: {r.CardTitle}");
        sb.AppendLine();
        if (!string.IsNullOrWhiteSpace(r.CardDescription))
        {
            sb.AppendLine("### Descrição");
            sb.AppendLine(r.CardDescription.Length > 200
                ? r.CardDescription[..200] + "..."
                : r.CardDescription);
            sb.AppendLine();
        }
        sb.AppendLine($"**Status:** {r.CardStatus ?? "Não definido"}");
        if (r.ChecklistItems?.Count > 0)
        {
            var done = r.ChecklistItems.Count(i => i.StartsWith("[x]", StringComparison.Ordinal));
            sb.AppendLine($"**Progresso checklist:** {done}/{r.ChecklistItems.Count} itens concluídos");
        }
        return sb.ToString();
    }

    private static string GenerateSubtasks(AiRequest r)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"## Subtarefas sugeridas para: {r.CardTitle}");
        sb.AppendLine();
        sb.AppendLine("Com base no título e contexto, considere dividir em:");
        sb.AppendLine();
        sb.AppendLine("1. **Análise e planejamento** — Entender requisitos e definir critérios de aceite");
        sb.AppendLine("2. **Implementação base** — Desenvolver a funcionalidade principal");
        sb.AppendLine("3. **Testes** — Escrever testes unitários e de integração");
        sb.AppendLine("4. **Code review** — Revisar código e ajustar feedback");
        sb.AppendLine("5. **Documentação** — Atualizar docs se necessário");
        if (!string.IsNullOrWhiteSpace(r.CardDescription))
        {
            sb.AppendLine();
            sb.AppendLine("> 💡 Analise a descrição do card para refinar as subtarefas acima.");
        }
        return sb.ToString();
    }

    private static string GenerateClarify(AiRequest r)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"## Perguntas para esclarecer: {r.CardTitle}");
        sb.AppendLine();
        sb.AppendLine("Antes de começar, considere responder:");
        sb.AppendLine();
        sb.AppendLine("1. Qual é o critério de aceite principal desta tarefa?");
        sb.AppendLine("2. Existem dependências com outras tarefas ou sistemas?");
        sb.AppendLine("3. Qual o impacto se esta tarefa atrasar?");
        sb.AppendLine("4. Quem é o stakeholder/reviewer principal?");
        sb.AppendLine("5. Há restrições técnicas ou de performance a considerar?");
        return sb.ToString();
    }

    private static string GenerateRisk(AiRequest r)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"## Análise de risco: {r.CardTitle}");
        sb.AppendLine();
        sb.AppendLine("### Riscos potenciais identificados");
        sb.AppendLine();

        if (r.CardStatus == "InProgress" && r.ChecklistItems?.Count > 0)
        {
            var done = r.ChecklistItems.Count(i => i.StartsWith("[x]", StringComparison.Ordinal));
            var pct = (double)done / r.ChecklistItems.Count * 100;
            if (pct < 30)
                sb.AppendLine("⚠️ **Baixo progresso** — Menos de 30% dos itens concluídos, atenção ao prazo.");
        }

        sb.AppendLine("- 🔍 **Escopo indefinido** — Verifique se os requisitos estão claros");
        sb.AppendLine("- 🔗 **Dependências** — Identifique bloqueios externos");
        sb.AppendLine("- ⏱️ **Estimativa** — Valide se a estimativa é realista");
        sb.AppendLine("- 🧪 **Cobertura de testes** — Garanta testes adequados");
        return sb.ToString();
    }

    private static string GenerateInsights(AiRequest r)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("## 📊 Insights do dia");
        sb.AppendLine();
        sb.AppendLine("Bom dia, dev! Aqui estão seus insights:");
        sb.AppendLine();
        sb.AppendLine("- Foque nas tarefas **In Progress** antes de começar novas");
        sb.AppendLine("- Revise cards com **due date** próximo");
        sb.AppendLine("- Considere quebrar cards grandes em subtarefas menores");
        sb.AppendLine("- Não esqueça de atualizar o status dos cards concluídos");
        return sb.ToString();
    }
}
