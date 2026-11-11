import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import DisciplinasPage from '../../src/pages/disciplinas/index';
import { api } from '../../src/api/client';

vi.mock('../../src/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

const mockDisciplinas = [
  {
    id: 1,
    nome: 'Matemática',
    professor: 'Carlos',
    descricao: 'Matemática básica',
    cor: 'bg-blue-500'
  },
];

const mockStats = {
  1: { concluida: 5, total: 10 }
};

test('DisciplinasPage renders disciplines and can open create modal', async () => {
  vi.mocked(api.get).mockImplementation(async (url) => {
    if (url === '/disciplinas/') return { data: mockDisciplinas };
    if (url.includes('/stats')) return { data: mockStats[1] || { concluida: 0, total: 0 } };
    return { data: [] };
  });

  render(<DisciplinasPage />);
  
  expect(api.get).toHaveBeenCalledWith('/disciplinas/');

  await waitFor(() => {
    expect(screen.getByText('Matemática')).toBeInTheDocument();
  });
  
  expect(screen.getByText('Carlos')).toBeInTheDocument();
  expect(screen.getByText('0 de 0 tarefas')).toBeInTheDocument();

  const newBtn = screen.getByRole('button', { name: /nova disciplina/i });
  fireEvent.click(newBtn);

  await waitFor(() => {
    expect(screen.getAllByText(/Nova disciplina/i).length).toBeGreaterThan(1);
  });
});

test('DisciplinasPage avisa quantas tarefas e materiais serão apagados', async () => {
  vi.mocked(api.get).mockImplementation(async (url) => {
    if (url === '/disciplinas/') return { data: mockDisciplinas };
    if (url === '/tarefas/disciplina/1') return { data: [{ status: 'concluido' }, { status: 'a_fazer' }] };
    if (url === '/materiais/') return { data: [{}, {}, {}] };
    return { data: [] };
  });

  render(<DisciplinasPage />);
  await waitFor(() => expect(screen.getByText('1 de 2 tarefas')).toBeInTheDocument());

  fireEvent.click(screen.getByRole('button', { name: 'Excluir Matemática' }));

  expect(api.get).toHaveBeenCalledWith('/materiais/', { params: { disciplina_id: 1 } });
  await waitFor(() => {
    expect(screen.getByText(/será excluída junto com 2 tarefas e 3 materiais enviados/)).toBeInTheDocument();
  });
  expect(screen.getByRole('button', { name: 'Excluir tudo' })).toBeInTheDocument();
});

test('DisciplinasPage mostra erro quando não consegue carregar', async () => {
  vi.mocked(api.get).mockRejectedValue(new Error('offline'));
  render(<DisciplinasPage />);
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar suas disciplinas.'));
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
});
