import { useSkin } from "@starplayer/ui";
import styles from "./LoadingOverlay.module.css";

export interface LoadingOverlayProps {
  open: boolean;
  message: string;
}

export function LoadingOverlay({ open, message }: LoadingOverlayProps) {
  const skin = useSkin();
  if (!open) return null;

  return (
    <div className={styles.backdrop} role="status" aria-live="polite">
      <div className={styles.card} data-skin={skin.id}>
        <span className={styles.spinner} data-skin={skin.id} aria-hidden="true" />
        <span>{message}</span>
      </div>
    </div>
  );
}
