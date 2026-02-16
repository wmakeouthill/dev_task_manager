import type { ReactNode } from 'react';
import './Card.css';

export interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'glass' | 'feature';
  className?: string;
  hover?: boolean;
}

export function Card({
  children,
  variant = 'default',
  className = '',
  hover = false,
}: CardProps) {
  const classes = [
    'card',
    `card-${variant}`,
    hover ? 'card-hover' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}
