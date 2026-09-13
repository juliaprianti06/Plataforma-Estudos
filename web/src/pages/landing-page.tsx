import { Users, BookOpen, Calendar, MessageCircle, TrendingUp, Globe, UserPlus, Users2, Share2, LineChart } from 'lucide-react';
import { LoginDialog, SignUpDialog } from '@/components/login-dialog';

export default function MindSpaceLanding() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <div className="relative z-0 overflow-hidden">
        <div className="absolute -top-50 left-16 w-80 h-80 bg-primary rounded-full -z-10 hidden sm:block"></div>
        <div className="absolute top-32 -left-12 w-48 h-48 bg-secondary rounded-full -z-10 hidden sm:block"></div>
        <div className="absolute top-10 left-10 w-8 h-8 bg-muted-foreground rounded-full -z-10 hidden sm:block"></div>

        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] bg-secondary rounded-full -z-10 max-lg:-bottom-56 max-lg:-right-24 hidden lg:block"></div>
        <div className="absolute bottom-70 right-64 w-40 h-40 bg-primary rounded-full -z-10 hidden lg:block"></div>
        <div className="absolute bottom-85 right-36 w-8 h-8 bg-muted-foreground rounded-full -z-10 hidden lg:block"></div>

        <header className="relative z-10 flex justify-end items-center p-8 pr-12 md:pr-24 space-x-8 max-sm:p-4 max-sm:pr-6 max-sm:space-x-4">
          <a href="#sobre" className="text-muted-foreground hover:text-primary font-medium text-lg transition-colors max-sm:text-base">
            Sobre
          </a>
          <LoginDialog />
        </header>

        <main className="relative z-10 flex-1 flex flex-col justify-center px-10 pl-16 md:pl-20 lg:pl-50 pr-10 md:pr-12 lg:pr-32 max-w-7xl pb-20 mt-28 md:mt-35 max-sm:px-6 max-sm:mt-16 max-sm:pb-10">

          <h1 className="text-6xl md:text-7xl font-bold text-primary tracking-tight max-sm:text-5xl">
            MindSpace
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-muted-foreground mt-2 leading-tight max-w-2xl max-sm:text-2xl">
            Aprenda junto e <br className="hidden md:block" /> evolua com a comunidade.
          </h2>

          <div className="mt-12 max-sm:mt-8">
            <p className="text-sm text-muted-foreground ml-2 max-sm:mb-2">Primeiro acesso?</p>
            <SignUpDialog />
          </div>

          <div className="h-[2px] w-full max-w-xl bg-border my-10 max-sm:my-8"></div>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl font-medium max-sm:text-base">
            Compartilhe conhecimento, participe de grupos de estudo e acompanhe seu progresso ao lado de outras pessoas na mesma jornada.
          </p>

        </main>
      </div>
      <section className="relative z-10 bg-primary py-32 md:py-30 px-10 md:px-24 lg:px-32">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6 text-center tracking-tight">
            Como funciona?
          </h3>
          <p className="text-primary-foreground/70 text-center max-w-xl mx-auto mb-20 md:mb-24 text-lg md:text-xl">
            Do cadastro ao primeiro grupo de estudo, em quatro passos simples.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-6">
                <UserPlus className="w-8 h-8 text-primary-foreground" strokeWidth={1.5} />
              </div>
              <span className="text-primary-foreground/50 text-sm font-bold mb-2 tracking-wider">PASSO 1</span>
              <h4 className="text-primary-foreground font-bold text-xl mb-3">Crie sua conta</h4>
              <p className="text-primary-foreground/70 text-base leading-relaxed">Cadastro rápido com e-mail e senha.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-6">
                <Users2 className="w-8 h-8 text-primary-foreground" strokeWidth={1.5} />
              </div>
              <span className="text-primary-foreground/50 text-sm font-bold mb-2 tracking-wider">PASSO 2</span>
              <h4 className="text-primary-foreground font-bold text-xl mb-3">Entre num grupo</h4>
              <p className="text-primary-foreground/70 text-base leading-relaxed">Participe de um grupo existente ou crie o seu.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-6">
                <Share2 className="w-8 h-8 text-primary-foreground" strokeWidth={1.5} />
              </div>
              <span className="text-primary-foreground/50 text-sm font-bold mb-2 tracking-wider">PASSO 3</span>
              <h4 className="text-primary-foreground font-bold text-xl mb-3">Compartilhe e organize</h4>
              <p className="text-primary-foreground/70 text-base leading-relaxed">Envie materiais e organize suas tarefas no Kanban.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-6">
                <LineChart className="w-8 h-8 text-primary-foreground" strokeWidth={1.5} />
              </div>
              <span className="text-primary-foreground/50 text-sm font-bold mb-2 tracking-wider">PASSO 4</span>
              <h4 className="text-primary-foreground font-bold text-xl mb-3">Acompanhe seu progresso</h4>
              <p className="text-primary-foreground/70 text-base leading-relaxed">Veja sua evolução com métricas e gráficos.</p>
            </div>
          </div>
        </div>
      </section>
      <section id="sobre" className="relative z-0 w-full py-24 max-sm:py-16 overflow-hidden">
        <div className="absolute -top-50 left-16 w-80 h-80 bg-secondary rounded-full -z-10 hidden sm:block"></div>
        <div className="absolute top-32 -left-12 w-48 h-48 bg-primary rounded-full -z-10 hidden sm:block"></div>
        <div className="absolute top-10 left-10 w-8 h-8 bg-muted-foreground rounded-full -z-10 hidden sm:block"></div>
        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] bg-primary rounded-full -z-10 hidden sm:block"></div>
        <div className="absolute bottom-85 right-36 w-8 h-8 bg-muted-foreground rounded-full -z-10 hidden sm:block"></div>

        <div className="px-10 md:px-24 lg:px-32 max-w-7xl mx-auto max-sm:px-6">
          <h3 className="text-4xl font-bold text-primary mb-12 max-sm:text-3xl max-sm:mb-8 text-center sm:text-left">Sobre</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-sm:gap-6">
            <div className="bg-secondary p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-md hover:shadow-lg transition-all hover:scale-105 min-h-[220px]">
              <BookOpen className="w-12 h-12 text-secondary-foreground/90 mb-3" strokeWidth={1.5} />
              <h4 className="text-lg font-bold text-secondary-foreground mb-2">Material Rico</h4>
              <p className="text-sm text-secondary-foreground/80">Compartilhe e acesse resumos, mapas mentais e anotações.</p>
            </div>
            <div className="bg-secondary p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-md hover:shadow-lg transition-all hover:scale-105 min-h-[220px]">
              <Users className="w-12 h-12 text-secondary-foreground/90 mb-3" strokeWidth={1.5} />
              <h4 className="text-lg font-bold text-secondary-foreground mb-2">Grupos de Estudo</h4>
              <p className="text-sm text-secondary-foreground/80">Conecte-se com outras pessoas que estão aprendendo o mesmo assunto.</p>
            </div>
            <div className="bg-secondary p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-md hover:shadow-lg transition-all hover:scale-105 min-h-[220px]">
              <MessageCircle className="w-12 h-12 text-secondary-foreground/90 mb-3" strokeWidth={1.5} />
              <h4 className="text-lg font-bold text-secondary-foreground mb-2">Fóruns Ativos</h4>
              <p className="text-sm text-secondary-foreground/80">Tire suas dúvidas e debata soluções com toda a comunidade.</p>
            </div>
            <div className="bg-secondary p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-md hover:shadow-lg transition-all hover:scale-105 min-h-[220px]">
              <TrendingUp className="w-12 h-12 text-secondary-foreground/90 mb-3" strokeWidth={1.5} />
              <h4 className="text-lg font-bold text-secondary-foreground mb-2">Evolução Constante</h4>
              <p className="text-sm text-secondary-foreground/80">Acompanhe seu progresso e se mantenha motivado todos os dias.</p>
            </div>
            <div className="bg-secondary p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-md hover:shadow-lg transition-all hover:scale-105 min-h-[220px]">
              <Calendar className="w-12 h-12 text-secondary-foreground/90 mb-3" strokeWidth={1.5} />
              <h4 className="text-lg font-bold text-secondary-foreground mb-2">Calendário</h4>
              <p className="text-sm text-secondary-foreground/80">Acompanhe cronogramas de estudos, aulas e datas importantes da comunidade.</p>
            </div>
            <div className="bg-secondary p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-md hover:shadow-lg transition-all hover:scale-105 min-h-[220px]">
              <Globe className="w-12 h-12 text-secondary-foreground/90 mb-3" strokeWidth={1.5} />
              <h4 className="text-lg font-bold text-secondary-foreground mb-2">Acesso Global</h4>
              <p className="text-sm text-secondary-foreground/80">Estude a qualquer hora, de qualquer lugar, com pessoas do mundo todo.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
