import { useUseCases } from '../hooks';
import { Hero, Features, NotesShowcase, Download } from '../components';

export function HomePage() {
  const {
    currentUseCase,
    currentIndex,
    totalCases,
    nextCase,
    prevCase,
    goToCase,
    pause,
    resume,
  } = useUseCases();

  return (
    <>
      <Hero
        useCase={currentUseCase}
        currentIndex={currentIndex}
        totalCases={totalCases}
        onNext={nextCase}
        onPrev={prevCase}
        onGoTo={goToCase}
        onPause={pause}
        onResume={resume}
      />
      <Features />
      <NotesShowcase />
      <Download />
    </>
  );
}
