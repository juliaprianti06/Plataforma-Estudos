import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { ProfileForm } from '@/components/profile/profile-form'
import { prepareProfilePhoto } from '@/profile/photo'
import { defaultProfile } from '@/profile/store'

vi.mock('@/profile/photo', () => ({ prepareProfilePhoto: vi.fn() }))
const user = { id: '1', name: 'Ana Silva', email: 'ana@example.com' }
beforeEach(() => vi.clearAllMocks())

test('prepares a selected photo and publishes it to the profile draft', async () => {
  const avatar = 'data:image/webp;base64,AAAA'
  vi.mocked(prepareProfilePhoto).mockResolvedValue(avatar)
  const change = vi.fn()
  const busy = vi.fn()
  render(<ProfileForm draft={defaultProfile(user)} email={user.email} onChange={change} onPhotoBusy={busy} />)
  const file = new File(['photo'], 'foto.png', { type: 'image/png' })
  fireEvent.change(screen.getByLabelText('Selecionar foto de perfil'), { target: { files: [file] } })
  await waitFor(() => expect(change).toHaveBeenCalled())
  expect(change.mock.calls[0][0](defaultProfile(user)).avatar).toBe(avatar)
  expect(busy.mock.calls.map(([value]) => value)).toEqual([true, false])
})

test('a failed photo does not replace saved data and can be retried', async () => {
  vi.mocked(prepareProfilePhoto).mockRejectedValue(new Error('Imagem inválida'))
  const change = vi.fn()
  render(<ProfileForm draft={defaultProfile(user)} email={user.email} onChange={change} onPhotoBusy={() => {}} />)
  fireEvent.change(screen.getByLabelText('Selecionar foto de perfil'), { target: { files: [new File(['x'], 'foto.png')] } })
  expect(await screen.findByRole('alert')).toHaveTextContent('Imagem inválida')
  expect(change).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Alterar foto' })).toBeEnabled()
})

test('removing a photo preserves the other profile fields', () => {
  const draft = { ...defaultProfile(user), avatar: 'data:image/webp;base64,AAAA' }
  const change = vi.fn()
  render(<ProfileForm draft={draft} email={user.email} onChange={change} onPhotoBusy={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: 'Remover foto' }))
  expect(change).toHaveBeenCalledWith({ ...draft, avatar: null })
})
