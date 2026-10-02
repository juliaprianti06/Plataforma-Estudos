import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { MateriaisPanel } from '../../src/pages/materiais/materiais-panel';
import { api } from '../../src/api/client';

vi.mock('../../src/api/client', () => ({
  api: {
    get: vi.fn(),
    delete: vi.fn(),
  },
  storageBaseUrl: 'http://localhost:8000',
}));

const mockMateriais = [
  {
    id_material: 1,
    titulo: 'Resumo de Física',
    descricao: 'Cálculos de mecânica',
    url_arquivo: '/uploads/file1.pdf',
    content_type: 'application/pdf',
    tamanho_bytes: 1024 * 500,
    data_upload: '2026-09-21T10:00:00Z',
    tipo: 'PDF',
    disciplina_id: 1,
    id_usuario: 1,
  },
];

const mockDisciplinas = [
  { id: 1, nome: 'Física', cor: 'bg-blue-500' }
];

test('MateriaisPanel renders materials and handles delete interaction', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: mockMateriais });
  vi.mocked(api.delete).mockResolvedValue({ data: { mensagem: "Material deletado" } });

  render(
    <MateriaisPanel 
      disciplinaId={1} 
      disciplinas={mockDisciplinas} 
    />
  );

  expect(api.get).toHaveBeenCalledWith('/materiais/?disciplina_id=1');

  await waitFor(() => {
    expect(screen.getByText('Resumo de Física')).toBeInTheDocument();
  });
  
  expect(screen.getAllByText('500.0 KB')[0]).toBeInTheDocument();
  expect(screen.getAllByText('PDF')[0]).toBeInTheDocument();

  const buttons = screen.getAllByRole('button');
  const deleteBtn = buttons.find(b => b.innerHTML.includes('lucide-trash'));
  
  if (deleteBtn) {
    fireEvent.click(deleteBtn);
  }

  await waitFor(() => {
    expect(screen.getByText('Excluir material')).toBeInTheDocument();
  });

  const confirmBtn = screen.getByText('Excluir');
  fireEvent.click(confirmBtn);

  await waitFor(() => {
    expect(api.delete).toHaveBeenCalledWith('/materiais/1');
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
