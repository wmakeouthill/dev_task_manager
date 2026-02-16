import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, Footer } from '@/shared/components';
import { HomePage } from '@/features/home';
import { InstructionsPage } from '@/features/instructions';

import '@/styles/index.css';

function App() {
  return (
    <BrowserRouter basename="/dev_task_manager">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/como-usar" element={<InstructionsPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
