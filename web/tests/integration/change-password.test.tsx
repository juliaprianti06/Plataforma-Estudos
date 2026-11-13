import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { ChangePassword } from '../../src/components/profile/change-password';
import type { AuthSession } from '../../src/auth/types';

const request = vi.fn();
let falha: Error | null = null;
vi.mock('../../src/api/session-request', () => ({
  createSessionRequest: () => async (...args: unknown[]) => {
    request(...args);
    if (falha) throw falha;
  },
}));

const session: AuthSession = { mode: 'api', accessToken: 'token', expiresAt: Date.now() + 60000, user: { id: '1', name: 'Ana', email: 'ana@example.com' } };

function preencher(atual: string, nova: string, confirmacao: string) {
  fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: atual } });
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: nova } });
  fireEvent.change(screen.getByLabelText('Confirmar nova senha'), { target: { value: confirmacao } });
  fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));
}

beforeEach(() => { request.mockReset(); falha = null; });

test('valida a confirmação antes de chamar a API', () => {
  render(<ChangePassword session={session} />);
  preencher('senha-atual', 'nova-senha-1', 'outra-senha');
  expect(screen.getByRole('alert')).toHaveTextContent('A confirmação não é igual à nova senha.');
  expect(request).not.toHaveBeenCalled();
});

test('envia a alteração, limpa os campos e avisa sobre as outras sessões', async () => {
  render(<ChangePassword session={session} />);
  preencher('senha-atual', 'nova-senha-1', 'nova-senha-1');
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('As outras sessões foram encerradas.'));
  expect(request).toHaveBeenCalledWith('post', '/auth/password', { currentPassword: 'senha-atual', newPassword: 'nova-senha-1' });
  expect(screen.getByLabelText('Senha atual')).toHaveValue('');
});

test('mostra a mensagem do servidor quando a senha atual está errada', async () => {
  falha = new Error('A senha atual está incorreta.');
  render(<ChangePassword session={session} />);
  preencher('errada', 'nova-senha-1', 'nova-senha-1');
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('A senha atual está incorreta.'));
});
