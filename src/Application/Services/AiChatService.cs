using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

/// <summary>
/// Serviço de chat IA contextual para o card.
/// Monta contexto do card + cards referenciados e conversa com o provider de IA.
/// Detecta sugestões de descrição e subtarefas na resposta.
/// </summary>
public class AiChatService(ICardRepository cardRepo, IChecklistItemRepository checklistRepo, IBoardRepository boardRepo)
{
    private const int MaxAgentSteps = 3;
    private static readonly Regex ToolCallRegex = new(@"<<<TOOL_CALL>>>(.*?)<<<END_TOOL_CALL>>>", RegexOptions.Singleline | RegexOptions.Compiled);

    public async Task<AiChatResponse> ExecuteAsync(
        AiChatRequest request,
        IAiProvider aiProvider,
        CancellationToken ct = default)
    {
        var card = await cardRepo.GetByIdAsync(request.CardId, ct)
            ?? throw new EntidadeNaoEncontradaException("Card", request.CardId);

        // Buscar nome da coluna onde o card está
        var board = await boardRepo.GetByColumnIdAsync(card.ColumnId, ct);
        var columnName = board?.Columns?.FirstOrDefault(c => c.Id == card.ColumnId)?.Nome;

        var checklist = await checklistRepo.ListByCardAsync(request.CardId, ct);
        var checklistTexts = checklist.Select(c => $"[{(c.Concluido ? "x" : " ")}] {c.Texto}").ToList();

        // Buscar cards referenciados
        var referencedCards = new List<string>();
        if (request.ReferencedCardIds?.Count > 0)
        {
            foreach (var refId in request.ReferencedCardIds)
            {
                var refCard = await cardRepo.GetByIdAsync(refId, ct);
                if (refCard is not null)
                    referencedCards.Add($"- {refCard.Titulo} (Status: {refCard.Status}, Descrição: {refCard.Descricao ?? "N/A"})");
            }
        }

        var systemPrompt = BuildSystemPrompt(card.Titulo, card.Descricao, card.Status.ToString(), columnName, checklistTexts, referencedCards);

        // Montar histórico como parte do prompt
        var fullPrompt = new StringBuilder();
        fullPrompt.AppendLine(systemPrompt);
        fullPrompt.AppendLine();

        if (request.History?.Count > 0)
        {
            fullPrompt.AppendLine("--- Histórico da conversa ---");
            foreach (var msg in request.History)
                fullPrompt.AppendLine($"{msg.Role}: {msg.Content}");
            fullPrompt.AppendLine("--- Fim do histórico ---");
            fullPrompt.AppendLine();
        }

        fullPrompt.AppendLine($"Mensagem do usuário: {request.Message}");

        var aiRequest = new AiRequest(
            "chat",
            card.Titulo,
            fullPrompt.ToString(),
            card.Status.ToString(),
            checklistTexts);

        var sw = Stopwatch.StartNew();
        var response = await ExecuteAgenticChatAsync(
            aiProvider,
            aiRequest,
            card.Titulo,
            card.Descricao,
            card.Status.ToString(),
            columnName,
            checklistTexts,
            referencedCards,
            request.History,
            ct);
        sw.Stop();

        var responseContent = response.Content ?? string.Empty;

        // Detectar sugestões estruturadas na resposta
        var suggestions = DetectSuggestions(responseContent);

        // Limpar os delimitadores do texto exibido no chat
        var cleanReply = CleanDelimiters(responseContent);

        return new AiChatResponse(
            cleanReply,
            suggestions,
            response.Provider,
            sw.Elapsed.TotalMilliseconds);
    }

    private static async Task<AiResponse> ExecuteAgenticChatAsync(
        IAiProvider aiProvider,
        AiRequest baseRequest,
        string cardTitle,
        string? cardDescription,
        string cardStatus,
        string? columnName,
        IReadOnlyList<string> checklistItems,
        IReadOnlyList<string> referencedCards,
        IReadOnlyList<AiChatMessage>? history,
        CancellationToken ct)
    {
        var transcript = new StringBuilder();
        transcript.AppendLine(baseRequest.CardDescription ?? string.Empty);
        transcript.AppendLine();
        transcript.AppendLine("--- Modo Agente ---");
        transcript.AppendLine("Você pode solicitar UMA ferramenta por vez com o formato exato:");
        transcript.AppendLine("<<<TOOL_CALL>>>{\"tool\":\"nome_da_ferramenta\",\"input\":{}}<<<END_TOOL_CALL>>>");
        transcript.AppendLine("Ferramentas disponíveis:");
        transcript.AppendLine("- get_card_snapshot");
        transcript.AppendLine("- get_checklist_items");
        transcript.AppendLine("- get_referenced_cards");
        transcript.AppendLine("- get_conversation_history");
        transcript.AppendLine("Quando tiver contexto suficiente, responda diretamente para o usuário sem TOOL_CALL.");

        AiResponse? lastResponse = null;

        for (var step = 0; step < MaxAgentSteps; step++)
        {
            var stepRequest = baseRequest with { CardDescription = transcript.ToString() };
            lastResponse = await aiProvider.ExecuteAsync(stepRequest, ct);
            var responseContent = lastResponse.Content ?? string.Empty;

            if (!TryExtractToolCall(responseContent, out var toolCall))
                return lastResponse;

            var toolResult = ExecuteTool(
                toolCall,
                cardTitle,
                cardDescription,
                cardStatus,
                columnName,
                checklistItems,
                referencedCards,
                history);

            transcript.AppendLine();
            transcript.AppendLine($"--- Resultado da ferramenta (passo {step + 1}) ---");
            transcript.AppendLine(toolResult);
            transcript.AppendLine("Com base nisso, decida: ou chame outra ferramenta, ou responda diretamente ao usuário.");
        }

        return lastResponse ?? new AiResponse("Não foi possível concluir a resposta do agente.", aiProvider.ProviderName, TimeSpan.Zero);
    }

    private static bool TryExtractToolCall(string content, out AgentToolCall toolCall)
    {
        toolCall = new AgentToolCall(string.Empty, null);

        if (string.IsNullOrWhiteSpace(content))
            return false;

        var match = ToolCallRegex.Match(content);
        if (!match.Success)
            return false;

        var json = match.Groups[1].Value.Trim();
        try
        {
            using var doc = JsonDocument.Parse(json);
            var tool = doc.RootElement.TryGetProperty("tool", out var toolProp)
                ? toolProp.GetString()
                : null;

            JsonElement? input = null;
            if (doc.RootElement.TryGetProperty("input", out var inputProp))
                input = inputProp;

            if (string.IsNullOrWhiteSpace(tool))
                return false;

            toolCall = new AgentToolCall(tool!, input);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static string ExecuteTool(
        AgentToolCall call,
        string cardTitle,
        string? cardDescription,
        string cardStatus,
        string? columnName,
        IReadOnlyList<string> checklistItems,
        IReadOnlyList<string> referencedCards,
        IReadOnlyList<AiChatMessage>? history)
    {
        return call.Tool.ToLowerInvariant() switch
        {
            "get_card_snapshot" => JsonSerializer.Serialize(new
            {
                title = cardTitle,
                description = cardDescription,
                status = cardStatus,
                column = columnName
            }),
            "get_checklist_items" => JsonSerializer.Serialize(checklistItems),
            "get_referenced_cards" => JsonSerializer.Serialize(referencedCards),
            "get_conversation_history" => JsonSerializer.Serialize(history ?? []),
            _ => JsonSerializer.Serialize(new { error = $"Tool '{call.Tool}' não suportada." })
        };
    }

    private readonly record struct AgentToolCall(string Tool, JsonElement? Input);

    private static string BuildSystemPrompt(
        string titulo, string? descricao, string status, string? columnName,
        List<string> checklist, List<string> referencedCards)
    {
        var sb = new StringBuilder();

        // ── Persona ──
        sb.AppendLine("# Persona");
        sb.AppendLine("Você é o **DevTask AI**, um assistente especializado em gerenciamento de tarefas de desenvolvimento de software.");
        sb.AppendLine("Você atua dentro de um board Kanban e tem acesso ao contexto do card em que o usuário está trabalhando.");
        sb.AppendLine("Responda **sempre** em português brasileiro, de forma objetiva, técnica e útil.");
        sb.AppendLine();

        // ── Contexto do card ──
        sb.AppendLine("# Contexto do card atual");
        sb.AppendLine($"- **Título:** {titulo}");
        sb.AppendLine($"- **Status:** {status}");
        sb.AppendLine($"- **Coluna no board:** {(string.IsNullOrWhiteSpace(columnName) ? "(não identificada)" : columnName)}");
        if (!string.IsNullOrWhiteSpace(descricao))
            sb.AppendLine($"- **Descrição atual:** {descricao}");
        else
            sb.AppendLine("- **Descrição atual:** (vazia — o card ainda não tem descrição)");

        if (checklist.Count > 0)
        {
            sb.AppendLine("- **Subtarefas existentes:**");
            for (var i = 0; i < checklist.Count; i++)
                sb.AppendLine($"  {i + 1}. {checklist[i]}");
        }
        else
        {
            sb.AppendLine("- **Subtarefas:** (nenhuma cadastrada)");
        }

        if (referencedCards.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("# Cards referenciados pelo usuário (contexto adicional)");
            foreach (var rc in referencedCards)
                sb.AppendLine(rc);
        }

        // ── Capacidades ──
        sb.AppendLine();
        sb.AppendLine("# Suas capacidades");
        sb.AppendLine("Você pode ajudar o desenvolvedor com:");
        sb.AppendLine("- **Criar** uma descrição do zero quando o card ainda não tem descrição");
        sb.AppendLine("- **Editar/melhorar/reformatar** a descrição existente conforme o pedido do usuário (ex: \"melhore a descrição\", \"adicione critérios de aceite\", \"formate melhor\")");
        sb.AppendLine("- **Criar** subtarefas do zero (breakdown técnico, checklist de implementação)");
        sb.AppendLine("- **Complementar** subtarefas existentes com novas (sem repetir as que já existem)");
        sb.AppendLine("- Analisar a tarefa e dar **dicas de implementação**, riscos ou dependências");
        sb.AppendLine("- Comparar com cards referenciados para identificar relações ou duplicidades");
        sb.AppendLine("- Responder perguntas gerais sobre a tarefa, boas práticas ou arquitetura");
        sb.AppendLine();

        // ── Autonomia nas sugestões ──
        sb.AppendLine("# Autonomia nas sugestões");
        sb.AppendLine("Você deve usar os delimitadores de forma **autônoma e inteligente** conforme o pedido:");
        sb.AppendLine("- Se o usuário pedir APENAS subtarefas → use APENAS <<<SUBTAREFAS>>>, NÃO inclua <<<DESCRICAO>>>");
        sb.AppendLine("- Se o usuário pedir APENAS descrição → use APENAS <<<DESCRICAO>>>, NÃO inclua <<<SUBTAREFAS>>>");
        sb.AppendLine("- Se o usuário pedir AMBOS (ex: \"me ajude com descrição e subtarefas\") → inclua AMBOS os blocos");
        sb.AppendLine("- Se o pedido for ambíguo (ex: \"me ajude com esse card\") e faz sentido sugerir ambos, inclua ambos");
        sb.AppendLine("- Se o usuário pedir para EDITAR/MELHORAR algo que já existe, gere a versão melhorada completa dentro do delimitador apropriado");
        sb.AppendLine("- Quando editar uma descrição existente, envie a descrição COMPLETA (não apenas o diff) no bloco <<<DESCRICAO>>>");
        sb.AppendLine();

        // ── Regras de formatação (delimitadores) ──
        sb.AppendLine("# Regras de formatação de sugestões");
        sb.AppendLine("Quando sugerir conteúdo que o usuário pode **aceitar e aplicar diretamente** ao card, use os delimitadores abaixo.");
        sb.AppendLine("Você pode incluir AMBOS os blocos na mesma resposta se for relevante.");
        sb.AppendLine();
        sb.AppendLine("## Descrição sugerida");
        sb.AppendLine("Envolva a descrição sugerida (em markdown) com:");
        sb.AppendLine("```");
        sb.AppendLine("<<<DESCRICAO>>>");
        sb.AppendLine("(conteúdo da descrição em markdown)");
        sb.AppendLine("<<<FIM_DESCRICAO>>>");
        sb.AppendLine("```");
        sb.AppendLine();
        sb.AppendLine("## Subtarefas sugeridas");
        sb.AppendLine("Envolva a lista de subtarefas com:");
        sb.AppendLine("```");
        sb.AppendLine("<<<SUBTAREFAS>>>");
        sb.AppendLine("1. Item 1");
        sb.AppendLine("2. Item 2");
        sb.AppendLine("<<<FIM_SUBTAREFAS>>>");
        sb.AppendLine("```");
        sb.AppendLine();
        sb.AppendLine("## Referência por número");
        sb.AppendLine("- As subtarefas existentes e sugeridas são numeradas.");
        sb.AppendLine("- Quando o usuário mencionar um número (ex: \"altere a 3\", \"remova a subtarefa 2\", \"mude a tarefa 1\"), entenda que se refere à subtarefa pelo índice numérico.");
        sb.AppendLine("- Ao re-sugerir subtarefas editadas, numere-as novamente começando em 1.");
        sb.AppendLine();
        sb.AppendLine("## Regras importantes");
        sb.AppendLine("- Use os delimitadores SOMENTE quando estiver sugerindo conteúdo aplicável (descrição ou subtarefas).");
        sb.AppendLine("- Você PODE incluir ambos <<<DESCRICAO>>> e <<<SUBTAREFAS>>> na MESMA resposta quando fizer sentido.");
        sb.AppendLine("- Fora dos blocos delimitados, escreva normalmente explicando o que está sugerindo e por quê.");
        sb.AppendLine("- Se o usuário apenas fizer uma pergunta (sem pedir sugestão de conteúdo), converse normalmente SEM usar delimitadores.");
        sb.AppendLine("- Sempre leve em conta o contexto do card (título, descrição existente, subtarefas existentes, coluna) ao gerar sugestões.");
        sb.AppendLine("- Não repita subtarefas que já existem no card — adicione apenas novas.");
        sb.AppendLine("- Ao editar uma descrição existente, retorne a descrição COMPLETA reformulada (o sistema substitui a anterior).");
        sb.AppendLine("- Ao sugerir subtarefas complementares, liste apenas as NOVAS (o sistema adiciona às existentes).");

        return sb.ToString();
    }

    /// <summary>
    /// Detecta TODAS as sugestões estruturadas na resposta (descrição E subtarefas).
    /// </summary>
    private static List<AiSuggestion> DetectSuggestions(string content)
    {
        var suggestions = new List<AiSuggestion>();

        // Detectar bloco de descrição
        var descMatch = Regex.Match(content, @"<<<DESCRICAO>>>(.*?)<<<FIM_DESCRICAO>>>", RegexOptions.Singleline);
        if (descMatch.Success)
        {
            suggestions.Add(new AiSuggestion("description", descMatch.Groups[1].Value.Trim()));
        }

        // Detectar bloco de subtarefas
        var subtaskMatch = Regex.Match(content, @"<<<SUBTAREFAS>>>(.*?)<<<FIM_SUBTAREFAS>>>", RegexOptions.Singleline);
        if (subtaskMatch.Success)
        {
            var lines = subtaskMatch.Groups[1].Value.Trim()
                .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(l => Regex.Replace(l, @"^[\d]+[\.\)]\s*|^[-*]\s*|^\[[ x]?\]\s*", "").Trim())
                .Where(l => l.Length > 0)
                .ToList();

            foreach (var line in lines)
            {
                suggestions.Add(new AiSuggestion("subtasks", line, new[] { line }));
            }
        }

        return suggestions;
    }

    /// <summary>
    /// Remove os delimitadores <<<DESCRICAO>>>/<<<SUBTAREFAS>>> do texto exibido no chat,
    /// mantendo apenas o conteúdo conversacional.
    /// </summary>
    private static string CleanDelimiters(string content)
    {
        var withoutToolCalls = Regex.Replace(content, @"<<<TOOL_CALL>>>.*?<<<END_TOOL_CALL>>>", "", RegexOptions.Singleline);
        var cleaned = Regex.Replace(withoutToolCalls, @"<<<DESCRICAO>>>.*?<<<FIM_DESCRICAO>>>", "", RegexOptions.Singleline);
        cleaned = Regex.Replace(cleaned, @"<<<SUBTAREFAS>>>.*?<<<FIM_SUBTAREFAS>>>", "", RegexOptions.Singleline);
        // Remover linhas vazias excessivas resultantes
        cleaned = Regex.Replace(cleaned, @"\n{3,}", "\n\n");
        return cleaned.Trim();
    }
}
