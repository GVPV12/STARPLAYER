import type { Rating } from "@starplayer/core";
import { ratingLabel } from "@starplayer/core";
import { useSkin } from "../SkinProvider.js";
import { StarIcon } from "../icons/Icons.js";
import styles from "./RatingStars.module.css";

export interface RatingStarsProps {
  rating: Rating;
  onChange?: (rating: Rating) => void;
  readOnly?: boolean;
}

const STAR_VALUES: Exclude<Rating, 0>[] = [1, 2, 3, 4, 5];

export function RatingStars({ rating, onChange, readOnly = false }: RatingStarsProps) {
  const skin = useSkin();

  return (
    <div
      className={styles.stars}
      data-skin={skin.id}
      role="radiogroup"
      aria-label="Rate this track"
    >
      {STAR_VALUES.map((value) => {
        const filled = value <= rating;
        return (
          <button
            key={value}
            type="button"
            className={styles.star}
            data-skin={skin.id}
            data-filled={filled}
            disabled={readOnly}
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value > 1 ? "s" : ""} — ${ratingLabel(value)}`}
            title={ratingLabel(value)}
            onClick={() => onChange?.(rating === value ? 0 : value)}
          >
            <StarIcon filled={filled} size={15} />
          </button>
        );
      })}
    </div>
  );
}
