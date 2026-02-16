import { useFeatures } from '@/features/home/hooks';
import { Card } from '@/shared/components/ui';
import './Features.css';

export function Features() {
  const { features } = useFeatures();

  return (
    <section id="features" className="features section" aria-labelledby="features-title">
      <div className="container">
        <div className="section-header">
          <h2 id="features-title" className="section-title">
            Recursos <span className="text-gradient">Poderosos</span>
          </h2>
          <p className="section-subtitle">
            Tudo que você precisa para organizar tarefas e desenvolvimento
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <Card
              key={feature.id}
              variant="feature"
              hover
              className="feature-card"
            >
              <div
                className="feature-icon"
                style={{ animationDelay: `${index * 0.1}s` }}
                aria-hidden
              >
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
