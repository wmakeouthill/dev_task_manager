import './ImagePlaceholder.css';

export interface ImagePlaceholderProps {
  alt: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '3/4';
  className?: string;
  src?: string;
}

export function ImagePlaceholder({
  alt,
  aspectRatio = '16/9',
  className = '',
  src,
}: ImagePlaceholderProps) {
  if (src) {
    return (
      <div
        className={`image-container ${className}`}
        style={{ aspectRatio }}
      >
        <img src={src} alt={alt} className="image" loading="lazy" />
      </div>
    );
  }

  return (
    <div
      className={`image-placeholder ${className}`}
      style={{ aspectRatio }}
      role="img"
      aria-label={alt}
    >
      <div className="placeholder-content">
        <svg
          className="placeholder-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span className="placeholder-text">{alt}</span>
      </div>
    </div>
  );
}
