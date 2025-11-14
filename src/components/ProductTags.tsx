
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ProductTag {
  id: string;
  name: string;
  color: string;
  text_color: string;
  sort_order: number;
}

interface ProductTagsProps {
  tags: ProductTag[];
  className?: string;
}

const ProductTags = ({ tags, className = '' }: ProductTagsProps) => {
  if (!tags || tags.length === 0) return null;

  // Sort tags by sort_order
  const sortedTags = [...tags].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {sortedTags.map((tag) => (
        <Badge 
          key={tag.id}
          style={{ 
            backgroundColor: tag.color, 
            color: tag.text_color,
            border: 'none'
          }}
          className="font-medium"
        >
          {tag.name}
        </Badge>
      ))}
    </div>
  );
};

export default ProductTags;
