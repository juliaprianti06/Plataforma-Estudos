export const EXTENSOES_PERMITIDAS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.odt', '.odp', '.ods', '.txt', '.md', '.csv', '.png', '.jpg', '.jpeg', '.webp']

export const MENSAGEM_TIPO_NAO_PERMITIDO = 'Tipo de arquivo não permitido. Envie PDF, documentos do Office ou LibreOffice, TXT, MD, CSV ou imagens PNG, JPG ou WebP.'

export function arquivoPermitido(nome: string) {
  const ponto = nome.lastIndexOf('.')
  return ponto > 0 && EXTENSOES_PERMITIDAS.includes(nome.slice(ponto).toLowerCase())
}
