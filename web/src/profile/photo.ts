export async function prepareProfilePhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error('Escolha uma imagem JPG ou PNG.')
  if (file.size > 5 * 1024 * 1024) throw new Error('A foto deve ter no máximo 5 MB.')
  const url = URL.createObjectURL(file)
  try {
    const photo = new Image()
    photo.src = url
    try { await photo.decode() } catch { throw new Error('Não foi possível abrir esta imagem. Escolha outro arquivo.') }
    if (!photo.naturalWidth || !photo.naturalHeight) throw new Error('A imagem está vazia.')
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 320
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar a foto.')
    const side = Math.min(photo.naturalWidth, photo.naturalHeight)
    context.drawImage(photo, (photo.naturalWidth - side) / 2, (photo.naturalHeight - side) / 2, side, side, 0, 0, 320, 320)
    return canvas.toDataURL('image/webp', 0.85)
  } finally { URL.revokeObjectURL(url) }
}
