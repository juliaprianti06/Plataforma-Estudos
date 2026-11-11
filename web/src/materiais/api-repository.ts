import { api, storageBaseUrl } from '@/api/client'

export type Material = {
  id_material: number
  titulo: string
  descricao: string
  url_arquivo: string
  content_type: string
  tamanho_bytes: number
  data_upload: string
  tipo: string | null
  disciplina_id: number
  id_usuario: number
}

export type MaterialUpdate = { titulo: string; descricao: string | null; tipo: string | null }

export const materiaisRepository = {
  async list(disciplinaId?: number) {
    const path = disciplinaId ? `/materiais/?disciplina_id=${disciplinaId}` : '/materiais/'
    const { data } = await api.get<Material[]>(path)
    return data
  },
  async listTypes() {
    const materials = await this.list()
    return [...new Set(materials.map(material => material.tipo?.trim()).filter((tipo): tipo is string => Boolean(tipo)))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  },
  async update(id: number, input: MaterialUpdate) {
    await api.put(`/materiais/${id}`, input)
  },
  async upload(file: File, titulo: string, disciplinaId: number, descricao?: string, tipo?: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('titulo', titulo)
    formData.append('disciplina_id', disciplinaId.toString())
    if (descricao) formData.append('descricao', descricao)
    if (tipo) formData.append('tipo', tipo)
    await api.post('/materiais/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  async remove(id: number) {
    await api.delete(`/materiais/${id}`)
  },
  async download(material: Pick<Material, 'url_arquivo' | 'titulo' | 'content_type'>) {
    const { data } = await api.get<Blob>(`${storageBaseUrl}${material.url_arquivo}`, { responseType: 'blob' })
    const blobUrl = window.URL.createObjectURL(data)
    let extension = material.url_arquivo.split('.').pop() || ''
    if (!extension || extension.length > 5) extension = material.content_type.includes('pdf') ? 'pdf' : material.content_type.includes('image/jpeg') ? 'jpg' : material.content_type.includes('image/png') ? 'png' : 'bin'
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `${material.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  },
}
