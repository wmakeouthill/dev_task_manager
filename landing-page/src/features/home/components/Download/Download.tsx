import { Button, Card } from '@/shared/components/ui';
import './Download.css';

const DOWNLOAD_URL = 'https://drive.google.com/file/d/1syPq-8qyrMdS3HM1oMd6XleqpEkF5WZF/view?usp=drive_link';

export function Download() {
  const handleDownload = () => {
    window.open(DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="download" className="download section" aria-labelledby="download-title">
      <div className="container">
        <Card variant="glass" className="download-card">
          <div className="download-content">
            <div className="download-info">
              <h2 id="download-title" className="download-title">
                Pronto para <span className="text-gradient">Começar?</span>
              </h2>
              <p className="download-description">
                Baixe o aplicativo e organize suas tarefas com boards, cards e
                sugestões de IA. Backend .NET e frontend React.
              </p>

              <div className="download-details">
                <div className="detail">
                  <span className="detail-icon" aria-hidden>📦</span>
                  <div>
                    <strong>Versão 1.0</strong>
                    <span>Executável / instalador</span>
                  </div>
                </div>
                <div className="detail">
                  <span className="detail-icon" aria-hidden>💾</span>
                  <div>
                    <strong>SQLite</strong>
                    <span>Dados locais</span>
                  </div>
                </div>
                <div className="detail">
                  <span className="detail-icon" aria-hidden>🔒</span>
                  <div>
                    <strong>Open Source</strong>
                    <span>Código no GitHub</span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleDownload}
                className="download-btn"
              >
                🚀 Baixar Dev Task Manager
              </Button>

              <p className="download-note">
                💡 Google Drive — baixe e execute. Dados locais com SQLite.
              </p>
            </div>

            <div className="download-visual" aria-hidden>
              <div className="app-preview">
                <div className="preview-header">
                  <span className="preview-dot" />
                  <span className="preview-dot" />
                  <span className="preview-dot" />
                </div>
                <div className="preview-content">
                  <div className="preview-line" style={{ width: '70%' }} />
                  <div className="preview-line" style={{ width: '100%' }} />
                  <div className="preview-line" style={{ width: '85%' }} />
                  <div className="preview-line" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
