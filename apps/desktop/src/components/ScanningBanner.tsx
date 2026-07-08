import { useTranslation } from "react-i18next";
import { useSkin } from "@starplayer/ui";
import { useScanStore } from "../store/scanStore.js";
import styles from "./ScanningBanner.module.css";

/** Persistent scan-progress indicator, visible on whichever screen is active. */
export function ScanningBanner() {
  const { t } = useTranslation();
  const skin = useSkin();
  const isScanning = useScanStore((s) => s.isScanning);
  const scanned = useScanStore((s) => s.scanned);
  const total = useScanStore((s) => s.total);

  if (!isScanning) return null;

  return (
    <div className={styles.banner} data-skin={skin.id} role="status" aria-live="polite">
      <span className={styles.spinner} data-skin={skin.id} aria-hidden="true" />
      <span>
        {t("player.scanning")} {total ? `${scanned}/${total}` : ""}
      </span>
    </div>
  );
}
