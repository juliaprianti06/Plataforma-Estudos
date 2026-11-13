import assert from 'node:assert/strict'
import test from 'node:test'
import { arquivoPermitido } from '../../src/pages/materiais/tipos-permitidos.ts'

test('aceita documentos e imagens permitidos, sem diferenciar maiúsculas', () => {
  for (const nome of ['apostila.pdf', 'Slides.PPTX', 'notas.md', 'foto.jpeg', 'planilha.ods']) assert.equal(arquivoPermitido(nome), true, nome)
})

test('recusa páginas, scripts, SVG e arquivos sem extensão', () => {
  for (const nome of ['pagina.html', 'script.js', 'icone.svg', 'sem_extensao', '.pdf', 'arquivo.pdf.exe']) assert.equal(arquivoPermitido(nome), false, nome)
})
