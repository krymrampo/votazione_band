'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { STAR_RATINGS } from '@/lib/constants';

interface StarRatingProps {
  currentRating?: number;
  onRate: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  currentRating = 0,
  onRate,
  size = 'md',
  disabled = false,
}) => {
  const sizeClasses = {
    sm: 'h-[18px] w-[18px]',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const starValues = [1, 2, 3, 4];

  return (
    <div className="flex items-center gap-1.5">
      {starValues.map((star) => {
        const isFilled = currentRating >= star;
        const info = STAR_RATINGS.find((r) => r.stars === star);

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onRate(star);
            }}
            title={info?.label}
            aria-label={`Vota ${star} stelle: ${info?.label}`}
            aria-pressed={isFilled}
            className={`group flex h-10 w-10 items-center justify-center rounded-[10px] transition-all duration-150 active:scale-[0.94] sm:h-11 sm:w-11 ${
              isFilled
                ? 'bg-[#fff4dd] text-[#ffb21a] hover:bg-[#ffedc7]'
                : 'bg-[#f4f6fa] text-[#8c9aaf] hover:bg-[#eaf0f7] hover:text-[#718099]'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <Star
              className={`${sizeClasses[size]} transition-all duration-150 ${
                isFilled
                  ? 'fill-[#ffb21a] text-[#ffb21a]'
                  : 'fill-[#8c9aaf] text-[#8c9aaf] group-hover:text-[#718099]'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
