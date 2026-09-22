import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { TarefasPanel } from '../../src/pages/tarefas/index';
import { api } from '../../src/api/client';

vi.mock('../../src/api/client', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

const mockDisciplina = {
  id: 1,
  nome: 'Física',
  professor: 'Einstein',
  cor: 'bg-blue-500'
};

const mockTarefas = [
  {
    id: 1,
    nome: 'Fazer exercícios do capítulo 1',
    prioridade: 'Alta',
    data_vencimento: '2026-09-25T10:00:00Z',
    status: 'a_fazer',
    disciplina_id: 1,
  },
];

test('TarefasPanel renders tasks and handles toggle status', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: mockTarefas });
  vi.mocked(api.put).mockResolvedValue({ data: { ...mockTarefas[0], status: 'concluido' } });

  render(
    <TarefasPanel disciplina={mockDisciplina} />
  );

  expect(api.get).toHaveBeenCalledWith('/tarefas/disciplina/1');

  await waitFor(() => {
    expect(screen.getByText('Fazer exercícios do capítulo 1')).toBeInTheDocument();
  });
  
  expect(screen.getByText('Alta')).toBeInTheDocument();

  const buttons = screen.getAllByRole('button');
  const checkBtn = buttons.find(b => b.innerHTML.includes('lucide-check'));
  
  if (checkBtn) {
    fireEvent.click(checkBtn);
  }

  await waitFor(() => {
    expect(api.put).toHaveBeenCalledWith('/tarefas/1', { status: 'concluido' });
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
