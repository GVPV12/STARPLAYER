import { useEffect, useRef, useState } from "react";
import type { PlaylistCarouselItem } from "@starplayer/core";
import { useSkin } from "../SkinProvider.js";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons/Icons.js";
import styles from "./PlaylistCarousel.module.css";

export interface PlaylistCarouselProps {
  items: PlaylistCarouselItem[];
  /** Ids of playlists the currently-playing track belongs to. */
  activeIds: ReadonlySet<string>;
  onToggle: (item: PlaylistCarouselItem) => void;
}

const SCROLL_STEP = 120;
/** Small tolerance so sub-pixel scroll positions don't flicker the arrows. */
const OVERFLOW_EPSILON = 2;

export function PlaylistCarousel({ items, activeIds, onToggle }: PlaylistCarouselProps) {
  const skin = useSkin();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function updateScrollState() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > OVERFLOW_EPSILON);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - OVERFLOW_EPSILON);
    }

    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    el.addEventListener("scroll", updateScrollState);
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [items.length]);

  function scrollBy(delta: number) {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  const hasOverflow = canScrollLeft || canScrollRight;

  return (
    <div className={styles.wrap} data-skin={skin.id}>
      {canScrollLeft ? (
        <button
          type="button"
          className={styles.chevron}
          data-skin={skin.id}
          onClick={() => scrollBy(-SCROLL_STEP)}
          aria-label="Scroll playlists left"
        >
          <ChevronLeftIcon size={14} />
        </button>
      ) : null}
      <div className={styles.scroller} data-skin={skin.id} data-overflow={hasOverflow} ref={scrollerRef}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.chip}
            data-skin={skin.id}
            data-active={activeIds.has(item.id)}
            data-auto={item.isAuto}
            title={item.name}
            aria-label={item.isAuto ? `${item.name} (auto playlist)` : `Toggle "${item.name}"`}
            aria-pressed={activeIds.has(item.id)}
            onClick={() => onToggle(item)}
          >
            <span className={styles.emoji} aria-hidden="true">
              {item.emoji}
            </span>
            <span className={styles.tooltip} data-skin={skin.id}>
              {item.name}
            </span>
          </button>
        ))}
      </div>
      {canScrollRight ? (
        <button
          type="button"
          className={styles.chevron}
          data-skin={skin.id}
          onClick={() => scrollBy(SCROLL_STEP)}
          aria-label="Scroll playlists right"
        >
          <ChevronRightIcon size={14} />
        </button>
      ) : null}
    </div>
  );
}
