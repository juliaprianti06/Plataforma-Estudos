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
    // Both the button and the modal title will have 'Nova disciplina'
    expect(screen.getAllByText(/Nova disciplina/i).length).toBeGreaterThan(1);
  });
});
