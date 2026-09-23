import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, FileText, ChevronDown } from 'lucide-react';
import { api } from '../../api/client';

interface Disciplina {
  id: number;
  nome: string;
}

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  material?: { id_material: number; titulo: string; descricao?: string | null; tipo?: string | null; disciplina_id: number; } | null;
  disciplinaId?: number;
}

export default function ModalMateriais(props: MaterialModalProps) {
  if (!(props.isOpen ?? false)) return null;
  return <ModalMateriaisForm key={`${props.disciplinaId ?? "todas"}:${props.material?.id_material ?? "novo"}`} {...props} />;
}

function ModalMateriaisForm({
  onClose,
  onSuccess,
  material,
  disciplinaId,
}: MaterialModalProps) {
  const [titulo, setTitulo] = useState(material?.titulo ?? '');
  const [descricao, setDescricao] = useState(material?.descricao ?? '');
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<number | ''>(material?.disciplina_id ?? disciplinaId ?? '');
  const [tipo, setTipo] = useState(material?.tipo ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    api.get<Disciplina[]>('/disciplinas/')
      .then((res) => { if (active) setDisciplinas(res.data); })
      .catch((err) => { if (active) console.error('Erro ao carregar disciplinas', err); });
    return () => { active = false; };
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];

      if (droppedFile.size > 20 * 1024 * 1024) {
        alert('O arquivo não pode exceder 20MB.');
        return;
      }

      setFile(droppedFile);
    }
  };

  const handleChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (selectedFile.size > 20 * 1024 * 1024) {
        alert('O arquivo não pode exceder 20MB.');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!material && !file) {
      alert('Selecione um arquivo para enviar.');
      return;
    }

    if (!material && !selectedDisciplinaId) {
      alert('Selecione uma disciplina.');
      return;
    }

    setLoading(true);

    try {
      if (material) {
        await api.put(`/materiais/${material.id_material}`, {
          titulo,
          descricao: descricao || null,
          tipo: tipo || null,
        });
      } else {
        const formData = new FormData();

        formData.append('file', file!);
        formData.append('titulo', titulo);
        formData.append('disciplina_id', selectedDisciplinaId.toString());

        if (descricao) {
          formData.append('descricao', descricao);
        }

        if (tipo) {
          formData.append('tipo', tipo);
        }

        await api.post('/materiais/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      alert('Ocorreu um erro ao salvar o material.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
     <div className="bg-card w-full max-w-[420px] rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-primary">
              {material ? 'Editar material' : 'Enviar material'}
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              {material
                ? 'Atualize as informações do material'
                : 'Compartilhe arquivos com sua disciplina'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-2.5">
          {!material && (
            <div
              className={`border-2 border-dashed rounded-xl py-5 px-4 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/30 hover:bg-muted/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleChangeFile}
                className="hidden"
              />
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText className="w-8 h-8 text-primary mb-2" />
                  <p className="font-medium text-sm text-foreground truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-8 h-8 text-primary mb-1.5" />
                  <p className="font-medium text-sm text-foreground">
                    Arraste um arquivo ou clique
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, PPTX ou IMG (máx 20MB)
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="space-y-2.5">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Título
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Resumo de Álgebra Linear"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Descrição (opcional)
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o material..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[64px]"
              />
            </div>
            {!material && (
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Disciplina
                </label>
                <div className="relative">
                  <select
                    required
                    value={selectedDisciplinaId}
                    onChange={(e) => setSelectedDisciplinaId(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    <option value="" disabled className="text-sm bg-background text-muted-foreground">
                      Selecione a disciplina
                    </option>
                    {disciplinas.map(d => (
                      <option key={d.id} value={d.id} className="text-sm bg-background text-foreground">
                        {d.nome}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Tipo/Grupo (opcional)
              </label>
              <input
                type="text"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Ex: Provas, Resumos..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}