export const groupCategories = ['Programação', 'Design', 'Matemática'] as const
export type GroupCategory = typeof groupCategories[number]
export const groupIcons = ['react', 'pencil', 'laptop', 'math', 'phone', 'robot'] as const
export type GroupIcon = typeof groupIcons[number]

export type StudyGroup = {
  id: string
  inviteCode: string
  name: string
  category: GroupCategory
  description: string
  icon: GroupIcon
  members: number
  role: 'admin' | 'member'
}
export type GroupInput = Pick<StudyGroup, 'name' | 'category' | 'description' | 'icon'>

export const initialGroups: StudyGroup[] = [
  { id: 'react', inviteCode: 'REACT8', name: 'React Avançado', category: 'Programação', description: 'Estudos aprofundados sobre hooks, context API e padrões de projeto em React.', icon: 'react', members: 8, role: 'admin' },
  { id: 'ux', inviteCode: 'UXLAB2', name: 'UX Research Lab', category: 'Design', description: 'Grupo focado em metodologias de pesquisa com usuários e testes de usabilidade.', icon: 'pencil', members: 12, role: 'member' },
  { id: 'algorithms', inviteCode: 'ALGO6X', name: 'Algoritmos & Estruturas', category: 'Programação', description: 'Preparação para entrevistas técnicas com foco em algoritmos e complexidade.', icon: 'laptop', members: 6, role: 'admin' },
  { id: 'calculus', inviteCode: 'CALC3X', name: 'Cálculo III', category: 'Matemática', description: 'Grupo de estudos para revisão de integrais triplas e séries ordinárias.', icon: 'math', members: 5, role: 'member' },
  { id: 'product', inviteCode: 'PROD9X', name: 'Product Design', category: 'Design', description: 'Discussões sobre design de produto, design systems e ferramentas de prototipagem.', icon: 'phone', members: 10, role: 'member' },
  { id: 'ml', inviteCode: 'MLAB7X', name: 'Machine Learning', category: 'Programação', description: 'Estudo de redes neurais artificiais, processamento de linguagem natural e modelos preditivos.', icon: 'robot', members: 7, role: 'admin' },
]

export const discoverGroups: StudyGroup[] = [
  { id: 'python', inviteCode: 'PYTH4N', name: 'Python na Prática', category: 'Programação', description: 'Pequenos projetos, desafios semanais e boas práticas para aprender Python em comunidade.', icon: 'laptop', members: 14, role: 'member' },
  { id: 'interfaces', inviteCode: 'DESG8N', name: 'Interfaces & Acessibilidade', category: 'Design', description: 'Vamos construir interfaces mais inclusivas e compartilhar referências de design.', icon: 'pencil', members: 9, role: 'member' },
  { id: 'algebra', inviteCode: 'ALGB6X', name: 'Álgebra Linear', category: 'Matemática', description: 'Matrizes, vetores e exercícios resolvidos juntos, um passo de cada vez.', icon: 'math', members: 6, role: 'member' },
]

export function matchesGroup(group: StudyGroup, query: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
  return normalize(`${group.name} ${group.category} ${group.description}`).includes(normalize(query.trim()))
}
