import type { UseCase } from '@/features/home/types';
import { Button } from '@/shared/components/ui';
import './Hero.css';

const DOWNLOAD_URL = 'https://drive.google.com/file/d/1syPq-8qyrMdS3HM1oMd6XleqpEkF5WZF/view?usp=drive_link';

interface HeroProps {
  useCase: UseCase;
  currentIndex: number;
  totalCases: number;
  onNext: () => void;
  onPrev: () => void;
  onGoTo: (index: number) => void;
  onPause: () => void;
  onResume: () => void;
}

export function Hero({
  useCase,
  currentIndex,
  totalCases,
  onNext,
  onPrev,
  onGoTo,
  onPause,
  onResume,
}: HeroProps) {
  const handleDownload = () => {
    window.open(DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
  };

  const handleConhecer = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="hero"
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      aria-label="Apresentação"
    >
      <div className="hero-bg" aria-hidden>
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
      </div>

      <div className="hero-content container">
        <div className="hero-split">
          <div className="hero-text">
            <h1 className="hero-title animate-fade-in">
              <span className="text-gradient">Dev Task</span>
              <br />
              Manager
            </h1>

            <p className="hero-subtitle animate-fade-in">
              Gerencie tarefas, boards e subtarefas com suporte a IA.
              Organize seu fluxo de desenvolvimento em um só lugar.
            </p>

            <div className="hero-actions animate-fade-in">
              <Button variant="primary" size="lg" onClick={handleDownload}>
                🚀 Download
              </Button>
              <Button variant="outline" size="lg" onClick={handleConhecer}>
                Conhecer Recursos
              </Button>
            </div>

            <div className="hero-platforms animate-fade-in">
              <span>Disponível para:</span>
              <div className="platforms">
                <span className="platform">🪟 Windows</span>
                <span className="platform">🍎 macOS</span>
                <span className="platform">🐧 Linux</span>
              </div>
            </div>
          </div>

          <div className="hero-carousel">
            <div className="carousel animate-fade-in">
              <button
                type="button"
                className="carousel-btn carousel-prev"
                onClick={onPrev}
                aria-label="Caso de uso anterior"
              >
                ‹
              </button>

              <div className="carousel-content glass-light">
                <div className="carousel-icon" aria-hidden>
                  {useCase.icon}
                </div>
                <h3 className="carousel-title">{useCase.title}</h3>
                <p className="carousel-description">{useCase.description}</p>
              </div>

              <button
                type="button"
                className="carousel-btn carousel-next"
                onClick={onNext}
                aria-label="Próximo caso de uso"
              >
                ›
              </button>
            </div>

            <div className="carousel-indicators" role="tablist" aria-label="Slides">
              {Array.from({ length: totalCases }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === currentIndex}
                  aria-label={`Ir para slide ${i + 1}`}
                  className={`indicator ${i === currentIndex ? 'indicator-active' : ''}`}
                  onClick={() => onGoTo(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
