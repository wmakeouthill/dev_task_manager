import { useState, useEffect, useCallback, useRef } from 'react';
import type { UseCase } from '../types';

const USE_CASES: UseCase[] = [
  {
    id: '1',
    icon: '📋',
    title: 'Boards e Colunas',
    description:
      'Organize seu trabalho em boards estilo Kanban. Crie colunas personalizadas e arraste cards entre elas conforme o progresso.',
  },
  {
    id: '2',
    icon: '📌',
    title: 'Cards e Subtarefas',
    description:
      'Cada card pode ter subtarefas, descrição e detalhes. Quebre tarefas grandes em passos menores e acompanhe o progresso.',
  },
  {
    id: '3',
    icon: '🤖',
    title: 'Sugestões com IA',
    description:
      'Use sugestões de IA para descrever tarefas, gerar subtarefas e enriquecer seus cards. Integração com modelos locais (Ollama) ou APIs.',
  },
];

const AUTO_INTERVAL = 6000;
const MANUAL_DELAY = 15000;

export function useUseCases() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [delay, setDelay] = useState(AUTO_INTERVAL);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(
    (customDelay?: number) => {
      clearTimer();
      const nextDelay = customDelay ?? delay;
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % USE_CASES.length);
        setDelay(AUTO_INTERVAL);
      }, nextDelay);
    },
    [delay, clearTimer]
  );

  useEffect(() => {
    if (isPaused) {
      clearTimer();
      return;
    }
    scheduleNext();
    return () => clearTimer();
  }, [isPaused, currentIndex, scheduleNext, clearTimer]);

  const nextCase = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % USE_CASES.length);
    setDelay(MANUAL_DELAY);
  }, []);

  const prevCase = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + USE_CASES.length) % USE_CASES.length);
    setDelay(MANUAL_DELAY);
  }, []);

  const goToCase = useCallback((index: number) => {
    setCurrentIndex(index);
    setDelay(MANUAL_DELAY);
  }, []);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  return {
    useCases: USE_CASES,
    currentUseCase: USE_CASES[currentIndex],
    currentIndex,
    totalCases: USE_CASES.length,
    nextCase,
    prevCase,
    goToCase,
    pause,
    resume,
    isPaused,
  };
}
