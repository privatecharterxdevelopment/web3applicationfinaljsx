import React from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: 'fade-in' | 'slide-left' | 'slide-right' | 'slide-up' | 'scale-in';
  delay?: number;
  className?: string;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  animation = 'fade-in',
  delay = 0,
  className = ''
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const getAnimationClass = () => {
    const baseClass = 'transition-all duration-700 ease-out';

    if (!isVisible) {
      switch (animation) {
        case 'slide-left':
          return `${baseClass} opacity-0 transform -translate-x-8`;
        case 'slide-right':
          return `${baseClass} opacity-0 transform translate-x-8`;
        case 'slide-up':
          return `${baseClass} opacity-0 transform translate-y-8`;
        case 'scale-in':
          return `${baseClass} opacity-0 transform scale-95`;
        default:
          return `${baseClass} opacity-0`;
      }
    }

    return `${baseClass} opacity-100 transform translate-x-0 translate-y-0 scale-100`;
  };

  return (
    <div
      ref={ref}
      className={`${getAnimationClass()} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;