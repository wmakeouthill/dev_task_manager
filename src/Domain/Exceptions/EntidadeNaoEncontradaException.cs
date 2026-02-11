namespace DevTaskManager.Domain.Exceptions;

public class EntidadeNaoEncontradaException(string entidade, object id)
    : DomainException($"{entidade} não encontrado(a): {id}");
