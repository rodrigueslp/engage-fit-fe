import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Dumbbell,
  FileSpreadsheet,
  Gift,
  Mail,
  MessageCircle,
  Play,
  RefreshCw,
  ShieldCheck,
  Target,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ElementType, TouchEvent } from 'react';

const slides = [
  'Abertura',
  'Problema',
  'Fluxo',
  'Campanhas',
  'Comunicacao',
  'Automação',
  'Gestao',
  'Fechamento',
];

const journey = [
  { label: 'Importar', icon: Upload, detail: 'Wellhub e TotalPass entram no mesmo painel.' },
  { label: 'Calcular', icon: Target, detail: 'Metas por campanha sao recalculadas em segundos.' },
  { label: 'Engajar', icon: MessageCircle, detail: 'WhatsApp e e-mail falam com cada aluno no momento certo.' },
  { label: 'Entregar', icon: Gift, detail: 'Brindes pendentes viram uma lista operacional clara.' },
];

const modules = [
  { label: 'Dashboard', icon: Activity, copy: 'Indicadores, alunos próximos da meta, risco de abandono e entregas pendentes.' },
  { label: 'Campanhas', icon: Target, copy: 'Metas por plataforma, periodo, premios e progresso individual.' },
  { label: 'Alunos', icon: Users, copy: 'Base consolidada com origem, contato e status de acompanhamento.' },
  { label: 'Relatórios', icon: Dumbbell, copy: 'Exportacoes para elegíveis, frequência mensal e brindes.' },
];

const automationRows = [
  ['08:00', 'Importação validada', '2.148 registros'],
  ['08:01', 'Campanhas recalculadas', '3 campanhas'],
  ['08:02', 'Alunos segmentados', '42 falta pouco'],
  ['08:03', 'Mensagens enviadas', '39 sucesso'],
];

export function ShowcasePage() {
  const [current, setCurrent] = useState(0);
  const [activeJourney, setActiveJourney] = useState(0);
  const touchStart = useRef<number | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);

  const progress = useMemo(() => ((current + 1) / slides.length) * 100, [current]);

  function goTo(index: number) {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    setCurrent(next);
    slideRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) {
        event.preventDefault();
        goTo(current + 1);
      }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        goTo(current - 1);
      }
      if (event.key === 'Home') goTo(0);
      if (event.key === 'End') goTo(slides.length - 1);
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.slideIndex);
            setCurrent(index);
          }
        });
      },
      { threshold: 0.65 },
    );

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide);
    });

    return () => observer.disconnect();
  }, []);

  function handleTouchStart(event: TouchEvent) {
    touchStart.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchEnd(event: TouchEvent) {
    if (touchStart.current === null) return;
    const delta = touchStart.current - (event.changedTouches[0]?.clientY ?? touchStart.current);
    if (Math.abs(delta) > 48) {
      goTo(current + (delta > 0 ? 1 : -1));
    }
    touchStart.current = null;
  }

  return (
    <main className="showcase-root" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <style>{showcaseCss}</style>
      <div className="showcase-progress" style={{ width: `${progress}%` }} />
      <nav className="showcase-dots" aria-label="Navegacao da apresentacao">
        {slides.map((slide, index) => (
          <button
            key={slide}
            type="button"
            className={index === current ? 'active' : ''}
            onClick={() => goTo(index)}
            aria-label={`Ir para ${slide}`}
            aria-current={index === current ? 'step' : undefined}
          />
        ))}
      </nav>

      <section className="showcase-slide hero-slide" data-slide-index="0" ref={(node) => { slideRefs.current[0] = node; }}>
        <div className="slide-content hero-grid">
          <div className="hero-copy reveal">
            <img src="/engagefit-logo-cropped.png" alt="EngageFit" className="hero-logo" />
            <p className="eyebrow">Sistema de engajamento para boxes e studios</p>
            <h1>Transforme check-ins em recorrencia, relacionamento e premios.</h1>
            <p className="hero-text">
              O EngageFit centraliza check-ins de parceiros, acompanha metas, identifica alunos em risco e dispara comunicacoes personalizadas.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary-action" onClick={() => goTo(2)}>
                <Play className="h-4 w-4" />
                Ver fluxo
              </button>
              <button type="button" className="secondary-action" onClick={() => goTo(5)}>
                <RefreshCw className="h-4 w-4" />
                Automação
              </button>
            </div>
          </div>
          <div className="product-window reveal">
            <div className="window-top">
              <span />
              <span />
              <span />
            </div>
            <div className="metric-strip">
              <Metric label="Alunos" value="1.284" icon={Users} />
              <Metric label="Check-ins" value="18.920" icon={Activity} />
              <Metric label="Próximos" value="76" icon={Target} />
            </div>
            <div className="dashboard-preview">
              <div>
                <p className="preview-title">Próximos da meta</p>
                <PreviewRow name="Ana Martins" value="92%" tone="orange" />
                <PreviewRow name="Bruno Lima" value="88%" tone="green" />
                <PreviewRow name="Carla Souza" value="84%" tone="slate" />
              </div>
              <div>
                <p className="preview-title">Brindes pendentes</p>
                <PreviewRow name="Camisa Engage" value="18" tone="green" />
                <PreviewRow name="Shakeira" value="9" tone="orange" />
                <PreviewRow name="Voucher" value="6" tone="slate" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="showcase-slide" data-slide-index="1" ref={(node) => { slideRefs.current[1] = node; }}>
        <div className="slide-content two-column">
          <div className="reveal">
            <p className="eyebrow">O problema operacional</p>
            <h2>Sem sistema, a campanha depende de planilha, memoria e tempo manual.</h2>
          </div>
          <div className="pain-grid reveal">
            <Pain title="Dados espalhados" icon={FileSpreadsheet} copy="Wellhub e TotalPass chegam em arquivos separados e precisam virar uma leitura unica." />
            <Pain title="Alunos esquecidos" icon={Clock} copy="Quem esta perto da meta ou parado ha dias costuma ser percebido tarde demais." />
            <Pain title="Premios sem controle" icon={Gift} copy="A entrega vira uma lista manual sem auditoria clara do que ficou pendente." />
            <Pain title="Disparo repetitivo" icon={MessageCircle} copy="Cada campanha exige copiar mensagens, filtrar publico e conferir falhas." />
          </div>
        </div>
      </section>

      <section className="showcase-slide" data-slide-index="2" ref={(node) => { slideRefs.current[2] = node; }}>
        <div className="slide-content">
          <div className="section-heading reveal">
            <p className="eyebrow">Como usar no dia a dia</p>
            <h2>Um fluxo simples para operar campanhas de frequência.</h2>
          </div>
          <div className="journey-layout reveal">
            <div className="journey-tabs">
              {journey.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={index === activeJourney ? 'journey-tab active' : 'journey-tab'}
                    onClick={() => setActiveJourney(index)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="journey-stage">
              <div className="stage-number">0{activeJourney + 1}</div>
              <h3>{journey[activeJourney].label}</h3>
              <p>{journey[activeJourney].detail}</p>
              <div className="stage-flow">
                {journey.map((item, index) => (
                  <span key={item.label} className={index <= activeJourney ? 'done' : ''} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="showcase-slide" data-slide-index="3" ref={(node) => { slideRefs.current[3] = node; }}>
        <div className="slide-content campaign-layout">
          <div className="reveal">
            <p className="eyebrow">Campanhas com meta e recompensa</p>
            <h2>Crie a regra uma vez. O sistema acompanha cada aluno.</h2>
            <p className="body-copy">Periodo, metas por plataforma, brinde e quantidade ficam amarrados na campanha.</p>
          </div>
          <div className="campaign-card reveal">
            <div className="campaign-header">
              <div>
                <p className="preview-title">Desafio Junho Forte</p>
                <span>01/06 até 30/06</span>
              </div>
              <span className="status-pill">Ativa</span>
            </div>
            <div className="goal-bars">
              <Goal label="Wellhub" value={78} />
              <Goal label="TotalPass" value={64} />
              <Goal label="Meta atingida" value={31} />
            </div>
            <div className="reward-line">
              <Gift className="h-5 w-5" />
              <span>Brinde: Camisa exclusiva - 100 unidades</span>
            </div>
          </div>
        </div>
      </section>

      <section className="showcase-slide" data-slide-index="4" ref={(node) => { slideRefs.current[4] = node; }}>
        <div className="slide-content communication-grid">
          <div className="reveal">
            <p className="eyebrow">Comunicacao segmentada</p>
            <h2>Mensagens diferentes para quem esta perto, atingiu ou sumiu.</h2>
          </div>
          <div className="message-phone reveal">
            <div className="phone-top">WhatsApp</div>
            <div className="bubble">Olá, Ana! Faltam 2 check-ins para garantir sua camisa no EngageFit.</div>
            <div className="bubble alt">Treino de hoje já deixa voce quase la.</div>
            <div className="send-line">
              <MessageCircle className="h-4 w-4" />
              Preview antes do envio
            </div>
          </div>
          <div className="email-panel reveal">
            <Mail className="h-6 w-6 text-orange-600" />
            <h3>E-mail tambem entra no fluxo</h3>
            <p>Templates com variaveis, campanhas por publico e auditoria de destinatários enviados ou com falha.</p>
          </div>
        </div>
      </section>

      <section className="showcase-slide" data-slide-index="5" ref={(node) => { slideRefs.current[5] = node; }}>
        <div className="slide-content automation-layout">
          <div className="reveal">
            <p className="eyebrow">Rotina automatica</p>
            <h2>O EngageFit roda o trabalho repetitivo no horario combinado.</h2>
          </div>
          <div className="automation-table reveal">
            {automationRows.map(([time, title, value]) => (
              <div className="automation-row" key={title}>
                <span>{time}</span>
                <strong>{title}</strong>
                <em>{value}</em>
              </div>
            ))}
          </div>
          <div className="automation-note reveal">
            <Zap className="h-5 w-5" />
            <span>Modos para recalcular, enviar "falta pouco", enviar "meta atingida" ou acionar alunos inativos.</span>
          </div>
        </div>
      </section>

      <section className="showcase-slide" data-slide-index="6" ref={(node) => { slideRefs.current[6] = node; }}>
        <div className="slide-content">
          <div className="section-heading reveal">
            <p className="eyebrow">Visao de gestao</p>
            <h2>O cliente enxerga operação, relacionamento e resultado no mesmo lugar.</h2>
          </div>
          <div className="module-grid reveal">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <article className="module-card" key={module.label}>
                  <Icon className="h-6 w-6" />
                  <h3>{module.label}</h3>
                  <p>{module.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="showcase-slide closing-slide" data-slide-index="7" ref={(node) => { slideRefs.current[7] = node; }}>
        <div className="slide-content closing-content">
          <div className="reveal">
            <p className="eyebrow">Proposta para a demo</p>
            <h2>Mostrar menos tela solta. Mostrar uma operação funcionando.</h2>
            <p className="hero-text">A apresentacao prepara o contexto; depois voce abre o sistema real e executa o fluxo com dados de exemplo.</p>
          </div>
          <div className="closing-actions reveal">
            <button type="button" className="primary-action" onClick={() => { window.location.hash = 'dashboard'; }}>
              <ShieldCheck className="h-4 w-4" />
              Abrir sistema
            </button>
            <button type="button" className="secondary-action" onClick={() => goTo(0)}>
              <RefreshCw className="h-4 w-4" />
              Recomecar
            </button>
          </div>
        </div>
      </section>

      <div className="showcase-controls" aria-label="Controles da apresentacao">
        <button type="button" onClick={() => goTo(current - 1)} disabled={current === 0} aria-label="Slide anterior">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span>{current + 1}/{slides.length}</span>
        <button type="button" onClick={() => goTo(current + 1)} disabled={current === slides.length - 1} aria-label="Próximo slide">
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: ElementType }) {
  return (
    <div className="metric-card">
      <Icon className="h-5 w-5" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PreviewRow({ name, value, tone }: { name: string; value: string; tone: 'orange' | 'green' | 'slate' }) {
  return (
    <div className={`preview-row ${tone}`}>
      <span>{name}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Pain({ title, copy, icon: Icon }: { title: string; copy: string; icon: ElementType }) {
  return (
    <article className="pain-card">
      <Icon className="h-6 w-6" />
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}

function Goal({ label, value }: { label: string; value: number }) {
  return (
    <div className="goal-row">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="goal-track">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

const showcaseCss = `
  :root {
    --showcase-bg: #f8fafc;
    --showcase-ink: #0f172a;
    --showcase-muted: #64748b;
    --showcase-line: #e2e8f0;
    --showcase-orange: #f97316;
    --showcase-orange-dark: #c2410c;
    --showcase-orange-soft: #fff7ed;
    --showcase-green: #059669;
    --showcase-green-soft: #ecfdf5;
    --showcase-panel: #ffffff;
    --showcase-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
    --title-size: clamp(2rem, 6vw, 5rem);
    --h2-size: clamp(1.5rem, 4.2vw, 3.25rem);
    --h3-size: clamp(1rem, 2vw, 1.35rem);
    --body-size: clamp(0.84rem, 1.45vw, 1.08rem);
    --small-size: clamp(0.7rem, 1vw, 0.86rem);
    --slide-padding: clamp(1rem, 4vw, 4rem);
    --content-gap: clamp(0.8rem, 2vw, 1.75rem);
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  }

  html,
  body {
    height: 100%;
    overflow-x: hidden;
  }

  html {
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
  }

  .showcase-root {
    min-width: 320px;
    background:
      linear-gradient(90deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px),
      linear-gradient(rgba(15, 23, 42, 0.035) 1px, transparent 1px),
      var(--showcase-bg);
    background-size: 44px 44px;
    color: var(--showcase-ink);
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  }

  .showcase-slide {
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .slide-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-height: 100%;
    overflow: hidden;
    padding: var(--slide-padding);
    gap: var(--content-gap);
  }

  .hero-slide {
    background:
      linear-gradient(135deg, rgba(255, 247, 237, 0.94), rgba(248, 250, 252, 0.92) 48%, rgba(236, 253, 245, 0.78)),
      var(--showcase-bg);
  }

  .hero-grid,
  .two-column,
  .campaign-layout,
  .automation-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.94fr) minmax(320px, 1.06fr);
    align-items: center;
  }

  .hero-copy,
  .section-heading {
    max-width: min(920px, 92vw);
  }

  .hero-logo {
    width: clamp(9rem, 18vw, 16rem);
    height: auto;
    margin-bottom: clamp(0.8rem, 2vh, 1.4rem);
  }

  .eyebrow {
    color: var(--showcase-orange-dark);
    font-size: var(--small-size);
    font-weight: 900;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3,
  p {
    margin: 0;
  }

  h1 {
    font-size: var(--title-size);
    line-height: 0.94;
    letter-spacing: 0;
    max-width: 11ch;
  }

  h2 {
    font-size: var(--h2-size);
    line-height: 1;
    letter-spacing: 0;
    max-width: 14ch;
  }

  h3 {
    font-size: var(--h3-size);
    line-height: 1.16;
    letter-spacing: 0;
  }

  .hero-text,
  .body-copy {
    color: var(--showcase-muted);
    font-size: var(--body-size);
    line-height: 1.55;
    max-width: 56ch;
  }

  .hero-actions,
  .closing-actions {
    display: flex;
    flex-wrap: wrap;
    gap: clamp(0.6rem, 1.4vw, 0.9rem);
    margin-top: clamp(0.4rem, 1vh, 1rem);
  }

  .primary-action,
  .secondary-action,
  .journey-tab,
  .showcase-controls button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    border: 0;
    border-radius: 0.5rem;
    font-weight: 900;
    cursor: pointer;
    transition: transform 220ms var(--ease-out), box-shadow 220ms var(--ease-out), background 220ms var(--ease-out);
  }

  .primary-action {
    min-height: 2.75rem;
    padding: 0 1rem;
    background: var(--showcase-orange);
    color: white;
    box-shadow: 0 12px 28px rgba(249, 115, 22, 0.28);
  }

  .secondary-action {
    min-height: 2.75rem;
    padding: 0 1rem;
    border: 1px solid var(--showcase-line);
    background: white;
    color: var(--showcase-ink);
  }

  .primary-action:hover,
  .secondary-action:hover,
  .journey-tab:hover,
  .showcase-controls button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .product-window,
  .campaign-card,
  .message-phone,
  .email-panel,
  .automation-table,
  .automation-note {
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: var(--showcase-shadow);
  }

  .product-window {
    overflow: hidden;
  }

  .window-top {
    display: flex;
    gap: 0.42rem;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--showcase-line);
    background: #f1f5f9;
  }

  .window-top span {
    width: 0.68rem;
    height: 0.68rem;
    border-radius: 999px;
    background: #cbd5e1;
  }

  .window-top span:first-child {
    background: var(--showcase-orange);
  }

  .metric-strip,
  .dashboard-preview {
    display: grid;
    gap: clamp(0.6rem, 1.4vw, 1rem);
    padding: clamp(0.85rem, 2vw, 1.35rem);
  }

  .metric-strip {
    grid-template-columns: repeat(3, 1fr);
  }

  .metric-card {
    border-radius: 0.5rem;
    background: #f8fafc;
    padding: clamp(0.7rem, 1.4vw, 1rem);
    display: grid;
    gap: 0.25rem;
  }

  .metric-card svg {
    color: var(--showcase-orange);
  }

  .metric-card span,
  .preview-title,
  .campaign-header span,
  .goal-row span,
  .automation-row span,
  .automation-row em {
    color: var(--showcase-muted);
    font-size: var(--small-size);
    font-weight: 800;
  }

  .metric-card strong {
    font-size: clamp(1.1rem, 2.6vw, 1.8rem);
  }

  .dashboard-preview {
    grid-template-columns: 1fr 1fr;
  }

  .preview-row,
  .automation-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 0.5rem;
    border-radius: 0.45rem;
    padding: 0.7rem 0.85rem;
    background: #f8fafc;
  }

  .preview-row.orange {
    background: var(--showcase-orange-soft);
    color: var(--showcase-orange-dark);
  }

  .preview-row.green {
    background: var(--showcase-green-soft);
    color: var(--showcase-green);
  }

  .preview-row.slate {
    color: #475569;
  }

  .pain-grid,
  .module-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(0.65rem, 1.4vw, 1rem);
  }

  .pain-card,
  .module-card {
    border: 1px solid var(--showcase-line);
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.88);
    padding: clamp(0.85rem, 1.8vw, 1.35rem);
    min-height: 0;
  }

  .pain-card svg,
  .module-card svg {
    color: var(--showcase-orange);
    margin-bottom: 0.7rem;
  }

  .pain-card p,
  .module-card p,
  .email-panel p,
  .journey-stage p {
    color: var(--showcase-muted);
    font-size: var(--body-size);
    line-height: 1.45;
    margin-top: 0.45rem;
  }

  .journey-layout {
    display: grid;
    grid-template-columns: minmax(220px, 0.7fr) minmax(320px, 1.3fr);
    gap: clamp(0.8rem, 2vw, 1.4rem);
    align-items: stretch;
  }

  .journey-tabs {
    display: grid;
    gap: 0.65rem;
  }

  .journey-tab {
    min-height: 3.5rem;
    justify-content: flex-start;
    border: 1px solid var(--showcase-line);
    background: white;
    color: #475569;
    padding: 0 1rem;
  }

  .journey-tab.active {
    border-color: rgba(249, 115, 22, 0.5);
    background: var(--showcase-orange-soft);
    color: var(--showcase-orange-dark);
  }

  .journey-stage {
    border-radius: 0.5rem;
    background: #111827;
    color: white;
    padding: clamp(1.2rem, 3vw, 2rem);
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 18rem;
    overflow: hidden;
  }

  .stage-number {
    color: var(--showcase-orange);
    font-size: clamp(2.5rem, 8vw, 6rem);
    font-weight: 950;
    line-height: 0.9;
  }

  .stage-flow {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin-top: clamp(1rem, 3vh, 2rem);
  }

  .stage-flow span {
    height: 0.45rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
  }

  .stage-flow span.done {
    background: var(--showcase-orange);
  }

  .campaign-card {
    padding: clamp(1rem, 2.4vw, 1.6rem);
  }

  .campaign-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .status-pill {
    align-self: flex-start;
    border-radius: 999px;
    background: var(--showcase-green-soft);
    color: var(--showcase-green) !important;
    padding: 0.35rem 0.7rem;
  }

  .goal-bars {
    display: grid;
    gap: 0.85rem;
  }

  .goal-row > div:first-child {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.35rem;
  }

  .goal-track {
    height: 0.7rem;
    border-radius: 999px;
    background: #e2e8f0;
    overflow: hidden;
  }

  .goal-track span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--showcase-orange), #16a34a);
  }

  .reward-line,
  .automation-note,
  .send-line {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: #334155;
    font-size: var(--body-size);
    font-weight: 800;
  }

  .reward-line {
    margin-top: 1.2rem;
    border-top: 1px solid var(--showcase-line);
    padding-top: 1rem;
  }

  .reward-line svg,
  .automation-note svg,
  .send-line svg {
    color: var(--showcase-orange);
    flex: 0 0 auto;
  }

  .communication-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(250px, 0.55fr) minmax(260px, 0.65fr);
    align-items: center;
  }

  .message-phone {
    padding: 1rem;
    background: #0f172a;
    color: white;
  }

  .phone-top {
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    padding-bottom: 0.8rem;
    color: #cbd5e1;
    font-size: var(--small-size);
    font-weight: 900;
  }

  .bubble {
    margin-top: 0.9rem;
    border-radius: 0.5rem;
    background: var(--showcase-green);
    padding: 0.8rem;
    font-size: var(--body-size);
    line-height: 1.4;
  }

  .bubble.alt {
    width: 82%;
    background: rgba(255, 255, 255, 0.12);
  }

  .send-line {
    color: #e2e8f0;
    margin-top: 1rem;
  }

  .email-panel {
    padding: clamp(1rem, 2vw, 1.4rem);
  }

  .automation-layout {
    grid-template-columns: minmax(0, 0.9fr) minmax(320px, 1.1fr);
  }

  .automation-table {
    padding: clamp(0.75rem, 1.4vw, 1rem);
  }

  .automation-row {
    margin-top: 0;
    margin-bottom: 0.55rem;
  }

  .automation-row:last-child {
    margin-bottom: 0;
  }

  .automation-row strong {
    color: var(--showcase-ink);
  }

  .automation-row em {
    font-style: normal;
  }

  .automation-note {
    grid-column: 2;
    padding: 1rem;
    box-shadow: none;
  }

  .closing-slide {
    background:
      linear-gradient(135deg, #111827, #1f2937 52%, #7c2d12);
    color: white;
  }

  .closing-content {
    align-items: flex-start;
  }

  .closing-content h2 {
    max-width: 13ch;
  }

  .closing-content .hero-text {
    color: #cbd5e1;
  }

  .showcase-progress {
    position: fixed;
    z-index: 30;
    left: 0;
    top: 0;
    height: 4px;
    background: var(--showcase-orange);
    transition: width 220ms var(--ease-out);
  }

  .showcase-dots {
    position: fixed;
    z-index: 30;
    right: clamp(0.6rem, 1.5vw, 1.2rem);
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    gap: 0.55rem;
  }

  .showcase-dots button {
    width: 0.7rem;
    height: 0.7rem;
    border: 1px solid rgba(15, 23, 42, 0.25);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    cursor: pointer;
  }

  .showcase-dots button.active {
    background: var(--showcase-orange);
    border-color: var(--showcase-orange);
  }

  .showcase-controls {
    position: fixed;
    z-index: 30;
    right: clamp(0.8rem, 2vw, 1.25rem);
    bottom: clamp(0.8rem, 2vw, 1.25rem);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid rgba(226, 232, 240, 0.85);
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
    padding: 0.4rem;
    backdrop-filter: blur(10px);
  }

  .showcase-controls button {
    width: 2.25rem;
    height: 2.25rem;
    color: var(--showcase-ink);
    background: white;
  }

  .showcase-controls button:disabled {
    cursor: not-allowed;
    color: #cbd5e1;
  }

  .showcase-controls span {
    min-width: 3rem;
    text-align: center;
    color: #475569;
    font-size: var(--small-size);
    font-weight: 900;
  }

  .reveal {
    opacity: 0;
    transform: translateY(22px);
    animation: revealIn 680ms var(--ease-out) forwards;
  }

  .reveal:nth-child(2) {
    animation-delay: 120ms;
  }

  .reveal:nth-child(3) {
    animation-delay: 220ms;
  }

  @keyframes revealIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 980px) {
    .hero-grid,
    .two-column,
    .campaign-layout,
    .automation-layout,
    .communication-grid,
    .journey-layout {
      grid-template-columns: 1fr;
    }

    .product-window,
    .campaign-card,
    .automation-table,
    .message-phone,
    .email-panel {
      max-height: 42vh;
      overflow: hidden;
    }

    .automation-note {
      grid-column: auto;
    }

    h1,
    h2 {
      max-width: 16ch;
    }
  }

  @media (max-width: 680px) {
    .metric-strip,
    .dashboard-preview,
    .pain-grid,
    .module-grid {
      grid-template-columns: 1fr;
    }

    .pain-card,
    .module-card {
      padding: 0.8rem;
    }

    .showcase-dots {
      display: none;
    }
  }

  @media (max-height: 700px) {
    :root {
      --slide-padding: clamp(0.75rem, 3vw, 2rem);
      --content-gap: clamp(0.5rem, 1.4vw, 1rem);
      --title-size: clamp(1.55rem, 4.8vw, 3.2rem);
      --h2-size: clamp(1.25rem, 3.5vw, 2.35rem);
      --body-size: clamp(0.74rem, 1.1vw, 0.95rem);
    }

    .hero-logo {
      width: clamp(7rem, 14vw, 11rem);
      margin-bottom: 0.55rem;
    }

    .journey-stage {
      min-height: 13rem;
    }
  }

  @media (max-height: 600px) {
    :root {
      --slide-padding: clamp(0.55rem, 2.5vw, 1.4rem);
      --content-gap: clamp(0.35rem, 1vw, 0.75rem);
      --title-size: clamp(1.25rem, 4vw, 2.35rem);
      --h2-size: clamp(1.05rem, 3vw, 1.8rem);
      --body-size: clamp(0.68rem, 1vw, 0.85rem);
    }

    .showcase-controls,
    .showcase-dots {
      display: none;
    }

    .metric-strip,
    .dashboard-preview,
    .goal-bars,
    .journey-tabs {
      gap: 0.4rem;
    }
  }

  @media (max-height: 500px) {
    :root {
      --slide-padding: clamp(0.45rem, 2vw, 1rem);
      --title-size: clamp(1.05rem, 3.5vw, 1.6rem);
      --h2-size: clamp(0.95rem, 2.5vw, 1.35rem);
      --body-size: clamp(0.62rem, 0.95vw, 0.78rem);
    }

    .product-window,
    .campaign-card,
    .automation-table,
    .message-phone,
    .email-panel {
      max-height: 52vh;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.2s !important;
      scroll-behavior: auto !important;
    }

    .reveal {
      transform: none;
    }
  }
`;
