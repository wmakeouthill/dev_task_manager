import { useInstructions } from '../hooks';
import { Card, ImagePlaceholder, Button } from '@/shared/components/ui';
import './InstructionsPage.css';

const DOWNLOAD_URL = 'https://drive.google.com/file/d/1syPq-8qyrMdS3HM1oMd6XleqpEkF5WZF/view?usp=drive_link';

export function InstructionsPage() {
  const { steps } = useInstructions();

  const handleDownload = () => {
    window.open(DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="instructions-page">
      <section className="instructions-header section">
        <div className="container">
          <h1 className="page-title">
            Como <span className="text-gradient">Usar</span>
          </h1>
          <p className="page-subtitle">
            Guia rápido para começar com o Dev Task Manager: boards, cards,
            subtarefas e sugestões de IA.
          </p>
        </div>
      </section>

      <section className="steps-section section" aria-labelledby="steps-heading">
        <div className="container">
          <h2 id="steps-heading" className="visually-hidden">
            Passos para usar o aplicativo
          </h2>
          <div className="steps-grid">
            {steps.map((step) => (
              <div key={step.id} className="step-item">
                <div className="step-number">
                  <span>{step.step}</span>
                </div>
                <div className="step-content">
                  <Card variant="glass" className="step-card">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-description">{step.description}</p>
                    <div className="step-media">
                      {step.mediaType === 'video' && step.imageSrc ? (
                        <video
                          className="step-video"
                          src={step.imageSrc}
                          autoPlay
                          loop
                          muted
                          playsInline
                          aria-label={step.imageAlt}
                        />
                      ) : step.imageSrc ? (
                        <img
                          className="step-image"
                          src={step.imageSrc}
                          alt={step.imageAlt}
                          loading="lazy"
                        />
                      ) : (
                        <ImagePlaceholder
                          alt={step.imageAlt}
                          aspectRatio="16/9"
                          src={step.imageSrc}
                        />
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tips-section section">
        <div className="container">
          <h2 className="section-title">
            💡 Dicas <span className="text-gradient">Rápidas</span>
          </h2>

          <div className="tips-grid">
            <Card variant="feature" hover className="tip-card">
              <div className="tip-icon" aria-hidden>📊</div>
              <h3 className="tip-title">Organize por projeto</h3>
              <ul className="tip-list">
                <li>Um board por projeto ou sprint</li>
                <li>Colunas refletindo seu fluxo real</li>
                <li>Arraste cards entre colunas para atualizar status</li>
              </ul>
            </Card>

            <Card variant="feature" hover className="tip-card">
              <div className="tip-icon" aria-hidden>📝</div>
              <h3 className="tip-title">Cards completos</h3>
              <ul className="tip-list">
                <li>Use descrição para contexto e critérios de aceite</li>
                <li>Quebre em subtarefas para acompanhar progresso</li>
                <li>Marque subtarefas concluídas para ver o avanço</li>
              </ul>
            </Card>

            <Card variant="feature" hover className="tip-card">
              <div className="tip-icon" aria-hidden>🤖</div>
              <h3 className="tip-title">Sugestões de IA</h3>
              <ul className="tip-list">
                <li>Ollama local para privacidade total</li>
                <li>Peça descrições ou listas de subtarefas</li>
                <li>Ajuste o texto sugerido antes de aplicar</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section className="cta-section section">
        <div className="container">
          <Card variant="glass" className="cta-card">
            <h2 className="cta-title">Pronto para começar?</h2>
            <p className="cta-description">
              Baixe o Dev Task Manager e organize suas tarefas com boards, cards
              e IA.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleDownload}
            >
              🚀 Download
            </Button>
          </Card>
        </div>
      </section>
    </main>
  );
}
