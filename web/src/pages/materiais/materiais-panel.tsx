import { useState, useEffect } from 'react';
import { Pencil, Trash2, Download} from 'lucide-react';
import ConfirmDialog from '../../components/ui/confirm-dialog';
import ModalMateriais from './modal-materiais';
import { api, storageBaseUrl } from '../../api/client';

interface Material {
  id_material: number;
  titulo: string;
  descricao: string;
  url_arquivo: string;
  content_type: string;
  tamanho_bytes: number;
  data_upload: string;
  tipo: string | null;
  disciplina_id: number;
  id_usuario: number;
}

interface Disciplina {
  id: number;
  nome: string;
  cor: string;
}

interface MateriaisPanelProps {
  disciplinaId?: number;
  disciplinas?: Disciplina[]; 
  searchTerm?: string;
  filtroDisciplinaId?: string;
  filtroGrupo?: string;
  onMaterialsChange?: () => void;
}

export function MateriaisPanel({ 
  disciplinaId, 
  disciplinas = [],
  searchTerm = '',
  filtroDisciplinaId = '',
  filtroGrupo = '',
  onMaterialsChange,
}: MateriaisPanelProps) {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const requestKey = `${disciplinaId ?? "todas"}:${refresh}`;
  const loading = loadedKey !== requestKey;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materialEditando, setMaterialEditando] = useState<Material | null>(null);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [materialParaExcluir, setMaterialParaExcluir] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const carregarMateriais = () => {
    setRefresh((value) => value + 1);
  };

  useEffect(() => {
    let active = true;
    api.get<Material[]>(disciplinaId ? `/materiais/?disciplina_id=${disciplinaId}` : '/materiais/')
      .then((response) => { if (active) setMateriais(response.data); })
      .catch((error) => { if (active) { setMateriais([]); console.error('Erro ao buscar materiais:', error); } })
      .finally(() => { if (active) setLoadedKey(requestKey); });
    return () => { active = false; };
  }, [disciplinaId, requestKey]);

  const handleExcluir = async () => {
    if (materialParaExcluir === null) return;
    setIsDeleting(true);
    try {
      await api.delete(`/materiais/${materialParaExcluir}`);
      carregarMateriais();
      onMaterialsChange?.();
    } catch (error) {
      console.error('Erro ao excluir material:', error);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
      setMaterialParaExcluir(null);
    }
  };

  const handleDownload = async (url_arquivo: string, titulo: string, content_type: string) => {
    try {
      const response = await fetch(`${storageBaseUrl}${url_arquivo}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      let ext = url_arquivo.split('.').pop() || '';
      if (!ext || ext.length > 5) {
        if (content_type.includes('pdf')) ext = 'pdf';
        else if (content_type.includes('image/jpeg')) ext = 'jpg';
        else if (content_type.includes('image/png')) ext = 'png';
        else ext = 'bin';
      }

      const filename = `${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Erro ao baixar o arquivo:', error);
      alert('Não foi possível baixar o arquivo.');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getDisciplina = (id: number) => {
    return disciplinas.find(d => d.id === id) || { nome: 'Desconhecida', cor: 'bg-muted' };
  };

  const getFileIconType = (contentType: string) => {
    if (contentType.includes('pdf')) return 'PDF';
    if (contentType.includes('word') || contentType.includes('docx')) return 'DOC';
    if (contentType.includes('presentation') || contentType.includes('pptx')) return 'PPT';
    if (contentType.includes('image')) return 'IMG';
    return 'FILE';
  };

  const materiaisFiltrados = (loading ? [] : materiais).filter(material => {
    const normalizar = (valor: string) => valor.trim().toLocaleLowerCase('pt-BR');
    const buscaNormalizada = normalizar(searchTerm);
    if (buscaNormalizada &&
      !normalizar(material.titulo).includes(buscaNormalizada) &&
      !normalizar(material.descricao || '').includes(buscaNormalizada)) {
      return false;
    }
    if (filtroDisciplinaId && material.disciplina_id.toString() !== filtroDisciplinaId) {
      return false;
    }
    if (filtroGrupo && normalizar(material.tipo || '') !== normalizar(filtroGrupo)) {
      return false;
    }
    return true;
  });

  return (
    <>
      <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden border border-border">
        {!loading && materiaisFiltrados.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum material encontrado.
          </p>
        )}   
        {materiaisFiltrados.length > 0 && (
          <div className="w-full">
            <div className="w-full">
              <div className="hidden md:flex items-center justify-between py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50 bg-muted/20 rounded-t-xl">
                <div className="w-[30%]">Arquivo</div>
                {!disciplinaId && <div className="w-[20%]">Disciplina</div>}
                <div className={`${!disciplinaId ? 'w-[15%]' : 'w-[25%]'} text-center`}>Grupo/Tipo</div>
                <div className={`${!disciplinaId ? 'w-[15%]' : 'w-[20%]'} text-center`}>Data</div>
                <div className={`${!disciplinaId ? 'w-[10%]' : 'w-[15%]'} text-center`}>Tamanho</div>
                <div className="w-[10%] text-right pr-4">Ações</div>
              </div>
              <div className="space-y-1 mt-1">
                {materiaisFiltrados.map((material) => {
                  const disc = getDisciplina(material.disciplina_id);
                  return (
                    <div
                      key={material.id_material}
                      className="flex flex-col md:flex-row md:items-center justify-between py-3 px-4 border-b border-border/50 hover:bg-muted/30 rounded-lg transition-colors group gap-4 md:gap-0"
                    >
                      <div className="w-full md:w-[30%] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-muted-foreground">
                            {getFileIconType(material.content_type)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-primary truncate" title={material.titulo}>{material.titulo}</p>
                          {material.descricao && (
                            <p className="text-xs text-muted-foreground truncate" title={material.descricao}>{material.descricao}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:w-[70%] gap-3 md:gap-0 pl-13 md:pl-0">
                        {!disciplinaId && (
                          <div className="w-1/2 md:w-[28.5%] flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${disc.cor}`} />
                            <span className="text-sm text-muted-foreground truncate">{disc.nome}</span>
                          </div>
                        )}
                        <div className={`w-1/2 flex md:justify-center ${!disciplinaId ? 'md:w-[21.5%]' : 'md:w-[35%]'}`}>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground truncate max-w-[100px]">
                            {material.tipo || '-'}
                          </span>
                        </div>
                        <div className={`w-1/2 md:text-center ${!disciplinaId ? 'md:w-[21.5%]' : 'md:w-[30%]'}`}>
                          <span className="text-sm text-muted-foreground">
                            {new Date(material.data_upload).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className={`w-1/2 md:text-center ${!disciplinaId ? 'md:w-[14.2%]' : 'md:w-[20%]'}`}>
                          <span className="text-sm text-muted-foreground font-medium">
                            {formatSize(material.tamanho_bytes)}
                          </span>
                        </div>
                        <div className={`w-full mt-2 md:mt-0 flex justify-end gap-3 pr-2 transition-opacity ${!disciplinaId ? 'md:w-[14.2%]' : 'md:w-[15%]'}`}>
                          <button
                            onClick={() => handleDownload(material.url_arquivo, material.titulo, material.content_type)}
                            className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Baixar Arquivo"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setMaterialEditando(material); setIsModalOpen(true); }}
                            className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setMaterialParaExcluir(material.id_material); setConfirmOpen(true); }}
                            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalMateriais
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setMaterialEditando(null); }}
        onSuccess={carregarMateriais}
        material={materialEditando}
        disciplinaId={disciplinaId}
      />
      
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleExcluir}
        title="Excluir material"
        description="Deseja realmente excluir este material? Esta ação não pode ser desfeita e o arquivo será apagado do servidor."
        isLoading={isDeleting}
      />
    </>
  );
}
