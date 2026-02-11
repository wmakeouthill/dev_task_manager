/**
 * Retorna a posição (em coordenadas de viewport) do cursor no textarea
 * na posição de caractere `offset`. Usado para posicionar o menu slash
 * logo abaixo da linha em que o usuário está digitando.
 */
export function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  offset: number
): { top: number; left: number } {
  const style = getComputedStyle(textarea)
  const textareaRect = textarea.getBoundingClientRect()
  const div = document.createElement('div')
  div.style.position = 'fixed'
  div.style.visibility = 'hidden'
  div.style.whiteSpace = 'pre-wrap'
  div.style.overflowWrap = 'break-word'
  div.style.top = `${textareaRect.top - textarea.scrollTop}px`
  div.style.left = `${textareaRect.left - textarea.scrollLeft}px`
  div.style.width = `${textarea.offsetWidth}px`
  div.style.fontFamily = style.fontFamily
  div.style.fontSize = style.fontSize
  div.style.fontWeight = style.fontWeight
  div.style.lineHeight = style.lineHeight
  div.style.letterSpacing = style.letterSpacing
  div.style.padding = style.padding
  div.style.border = style.border
  div.style.boxSizing = style.boxSizing
  document.body.appendChild(div)

  const text = textarea.value.substring(0, offset)
  const span = document.createElement('span')
  span.innerHTML = '&#8203;' // zero-width space para ter uma posição
  span.dataset.caret = '1'
  div.textContent = text
  div.appendChild(span)

  const spanRect = span.getBoundingClientRect()
  div.remove()

  return {
    top: spanRect.bottom + 2,
    left: spanRect.left,
  }
}
