import type { ReactNode } from "react";
import { useSkin } from "../SkinProvider.js";
import styles from "./WindowChrome.module.css";

export interface WindowChromeProps {
  title: string;
  children: ReactNode;
}

/**
 * The card/window wrapper around the player. Pixel skins get a titlebar with
 * decorative traffic-light buttons (evoking classic OS chrome); modern skins
 * get a plain glass/blur card with no titlebar.
 */
export function WindowChrome({ title, children }: WindowChromeProps) {
  const skin = useSkin();
  const showTitlebar = skin.mode === "pixel";

  return (
    <div className={styles.window} data-skin={skin.id}>
      {showTitlebar ? (
        <div className={styles.titlebar} data-skin={skin.id}>
          <span className={styles.title} data-skin={skin.id}>
            {title}
          </span>
          <div className={styles.dots} data-skin={skin.id} aria-hidden="true">
            <span className={styles.dot} data-skin={skin.id} />
            <span className={styles.dot} data-skin={skin.id} />
            <span className={styles.dot} data-skin={skin.id} />
          </div>
        </div>
      ) : null}
      <div className={styles.body} data-skin={skin.id}>
        {children}
      </div>
    </div>
  );
}
