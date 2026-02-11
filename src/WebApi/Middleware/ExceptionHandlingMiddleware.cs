using System.Net;
using System.Text.Json;
using DevTaskManager.Application.Exceptions;
using DevTaskManager.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace DevTaskManager.WebApi.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, response) = exception switch
        {
            EntidadeNaoEncontradaException e => (HttpStatusCode.NotFound,
                (object)new ProblemDetails { Title = "Não encontrado", Detail = e.Message }),
            RegraDeNegocioException e => (HttpStatusCode.UnprocessableEntity,
                new ProblemDetails { Title = "Regra de negócio violada", Detail = e.Message }),
            ValidacaoException e => (HttpStatusCode.BadRequest,
                new ValidationProblemDetails(
                    new Dictionary<string, string[]> { ["validation"] = e.Erros.ToArray() })),
            _ => (HttpStatusCode.InternalServerError,
                new ProblemDetails { Title = "Erro interno", Detail = "Ocorreu um erro inesperado." })
        };

        logger.LogError(exception, "Erro: {Message}", exception.Message);

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(response, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
    }
}
