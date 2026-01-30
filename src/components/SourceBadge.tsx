import { PaperSource } from '@/types/paper';

interface SourceBadgeProps {
  source: PaperSource;
  size?: 'sm' | 'md';
}

export default function SourceBadge({ source, size = 'sm' }: SourceBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  const colorClasses = {
    arxiv: 'bg-blue-100 text-blue-800 border-blue-200',
    openreview: 'bg-green-100 text-green-800 border-green-200',
  };

  const displayNames = {
    arxiv: 'arXiv',
    openreview: 'OpenReview',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${sizeClasses[size]} ${colorClasses[source]}`}
    >
      {displayNames[source]}
    </span>
  );
}
