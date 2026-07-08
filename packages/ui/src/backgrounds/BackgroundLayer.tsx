import { useSkin } from "../SkinProvider.js";
import styles from "./BackgroundLayer.module.css";

/**
 * Full-viewport background behind the window chrome. Everything here is
 * CSS-only (gradients / repeating patterns / keyframe drift) so the app has
 * no binary art dependency yet — see `packages/assets/images/README.md` for
 * how to swap in real photos/pixel art later without touching this component.
 */
export function BackgroundLayer() {
  const skin = useSkin();

  return (
    <div className={styles.layer} data-skin={skin.id} aria-hidden="true">
      {skin.id === "vaporwave" ? (
        <>
          <div className={styles.vaporwaveGlow} />
          <div className={styles.moon}>
            <div className={styles.moonBite} />
          </div>
          <div className={styles.stars} />
          <div className={styles.scanlines} />
        </>
      ) : null}
      {skin.id === "gradient-glass" || skin.id === "neon-pink" ? (
        <>
          <div className={styles.blob} data-skin={skin.id} data-blob="1" />
          <div className={styles.blob} data-skin={skin.id} data-blob="2" />
          <div className={styles.blob} data-skin={skin.id} data-blob="3" />
        </>
      ) : null}
      {skin.id === "soft-glass" ? (
        <>
          <div className={styles.cloud} data-cloud="1" />
          <div className={styles.cloud} data-cloud="2" />
          <div className={styles.cloud} data-cloud="3" />
        </>
      ) : null}
    </div>
  );
}
