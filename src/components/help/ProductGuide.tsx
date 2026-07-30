import { BookOpen, CheckCircle2, ChevronRight, Expand, Lightbulb, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';

export type ProductGuideSection = {
  id: string;
  title: string;
  eyebrow: string;
  introduction: string;
  image?: string;
  imageAlt?: string;
  imageCaption?: string;
  steps?: string[];
  points?: string[];
  tip?: string;
};

export function ProductGuide({
  open,
  title,
  description,
  sections,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  sections: ProductGuideSection[];
  onClose: () => void;
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const [expandedImage, setExpandedImage] = useState<ProductGuideSection>();
  const active = sections.find((section) => section.id === activeId) ?? sections[0];

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (expandedImage) setExpandedImage(undefined);
      else onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [expandedImage, onClose, open]);

  if (!open || !active) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/45" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Fechar manual" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-5xl flex-col bg-slate-50 shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 gap-3">
            <span className="mt-0.5 rounded-xl bg-accent-soft p-2.5 text-accent-dark"><BookOpen className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Manual e boas práticas</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">{title}</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
            </div>
          </div>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" type="button" onClick={onClose} aria-label="Fechar manual"><X className="h-5 w-5" /></button>
        </header>

        <div className="grid min-h-0 flex-1 md:grid-cols-[240px_minmax(0,1fr)]">
          <nav className="overflow-x-auto border-b border-slate-200 bg-white p-3 md:overflow-y-auto md:border-b-0 md:border-r" aria-label="Tópicos do manual">
            <div className="flex gap-2 md:flex-col">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  className={`flex min-w-52 items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition md:min-w-0 ${active.id === section.id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  onClick={() => setActiveId(section.id)}
                  aria-current={active.id === section.id ? 'page' : undefined}
                >
                  <span><span className={`mr-2 text-xs ${active.id === section.id ? 'text-slate-300' : 'text-slate-400'}`}>{String(index + 1).padStart(2, '0')}</span>{section.title}</span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </button>
              ))}
            </div>
          </nav>

          <main className="overflow-y-auto p-5 sm:p-7">
            <article className="mx-auto max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">{active.eyebrow}</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-950">{active.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{active.introduction}</p>

              {active.image && (
                <figure className="mt-6">
                  <button className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" type="button" onClick={() => setExpandedImage(active)}>
                    <img className="aspect-[16/7] w-full object-cover object-top transition duration-300 group-hover:scale-[1.01]" src={active.image} alt={active.imageAlt ?? ''} />
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-lg bg-slate-950/85 px-3 py-2 text-xs font-bold text-white"><Expand className="h-4 w-4" />Ampliar imagem</span>
                  </button>
                  {active.imageCaption && <figcaption className="mt-2 text-xs text-slate-500">{active.imageCaption}</figcaption>}
                </figure>
              )}

              {active.steps && (
                <section className="mt-7">
                  <h4 className="font-bold text-slate-950">Como usar</h4>
                  <ol className="mt-3 space-y-3">
                    {active.steps.map((step, index) => (
                      <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {active.points && (
                <section className="mt-7">
                  <h4 className="font-bold text-slate-950">Pontos importantes</h4>
                  <ul className="mt-3 space-y-3">
                    {active.points.map((point) => (
                      <li key={point} className="flex gap-3 text-sm leading-6 text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {active.tip && (
                <div className="mt-7 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" />
                  <div><p className="text-sm font-bold">Dica de operação</p><p className="mt-1 text-sm leading-6 text-amber-800">{active.tip}</p></div>
                </div>
              )}

              <div className="mt-8 flex justify-between border-t border-slate-200 pt-5">
                <Button variant="ghost" disabled={sections.indexOf(active) === 0} onClick={() => setActiveId(sections[sections.indexOf(active) - 1]?.id)}>Anterior</Button>
                {sections.indexOf(active) === sections.length - 1
                  ? <Button onClick={onClose}>Concluir manual</Button>
                  : <Button onClick={() => setActiveId(sections[sections.indexOf(active) + 1]?.id)}>Próximo tópico</Button>}
              </div>
            </article>
          </main>
        </div>
      </aside>

      {expandedImage?.image && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-5" role="dialog" aria-modal="true" aria-label={`Imagem ampliada: ${expandedImage.title}`}>
          <button className="absolute inset-0 cursor-zoom-out" type="button" onClick={() => setExpandedImage(undefined)} aria-label="Fechar visualização ao clicar fora" />
          <div className="relative max-h-full max-w-full">
            <img className="max-h-[90vh] max-w-[94vw] rounded-lg bg-white object-contain shadow-2xl" src={expandedImage.image} alt={expandedImage.imageAlt ?? ''} />
            <button className="absolute right-3 top-3 rounded-lg bg-slate-950/80 p-2 text-white hover:bg-slate-950" type="button" onClick={() => setExpandedImage(undefined)} aria-label="Fechar imagem ampliada"><X className="h-5 w-5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
