import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/shared/components/ui';
import './Header.css';

const NAV_ITEMS = [
  { path: '/', label: 'Início' },
  { path: '/como-usar', label: 'Como Usar' },
];

const DOWNLOAD_URL = 'https://drive.google.com/file/d/1syPq-8qyrMdS3HM1oMd6XleqpEkF5WZF/view?usp=drive_link';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleDownload = () => {
    window.open(DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="header glass">
      <div className="header-container container">
        <Link to="/" className="logo">
          <img
            src="/favicon.ico"
            alt=""
            className="logo-icon-img"
            width={28}
            height={28}
          />
          <span className="logo-text">Dev Task Manager</span>
        </Link>

        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`} aria-label="Principal">
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'nav-link-active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-actions">
          <span className="header-badge">v1.0</span>
          <Button variant="primary" size="sm" onClick={handleDownload}>
            Download
          </Button>

          <button
            type="button"
            className="menu-toggle"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
          >
            <span className={`hamburger ${isMenuOpen ? 'hamburger-open' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
