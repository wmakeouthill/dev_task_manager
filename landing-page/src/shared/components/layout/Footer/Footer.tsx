import { Link } from 'react-router-dom';
import './Footer.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container container">
        <div className="footer-main">
          <div className="footer-brand">
            <span className="footer-logo">📋 Dev Task Manager</span>
            <p className="footer-description">
              Gerencie tarefas, boards e subtarefas com suporte a IA.
              Organize seu fluxo de desenvolvimento em um só lugar.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-section">
              <h4 className="footer-title">Links</h4>
              <ul className="footer-list">
                <li>
                  <Link to="/">Início</Link>
                </li>
                <li>
                  <Link to="/como-usar">Como Usar</Link>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-title">Projeto</h4>
              <ul className="footer-list">
                <li>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://drive.google.com/file/d/1syPq-8qyrMdS3HM1oMd6XleqpEkF5WZF/view?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} Dev Task Manager. Desenvolvido com ❤️ usando .NET e React.</p>
          <p className="footer-tech">
            <span>.NET</span>
            <span>•</span>
            <span>React</span>
            <span>•</span>
            <span>SQLite</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
