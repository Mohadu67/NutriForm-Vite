import { useEffect, useRef, useCallback } from 'react';
import styles from './LiquidBlob.module.css';

export default function LiquidBlob({ targetRef, isActive }) {
  const blobRef = useRef(null);

  const updateBlobPosition = useCallback(() => {
    if (!targetRef?.current || !blobRef.current) return;

    const target = targetRef.current;
    const blob = blobRef.current;
    const parentRect = target.offsetParent?.getBoundingClientRect();

    if (!parentRect) return;

    const targetRect = target.getBoundingClientRect();
    const x = targetRect.left - parentRect.left;
    const width = targetRect.width;

    // Update CSS custom properties for smooth animation
    blob.style.setProperty('--blob-x', `${x}px`);
    blob.style.setProperty('--blob-width', `${width}px`);
  }, [targetRef]);

  useEffect(() => {
    updateBlobPosition();
  }, [updateBlobPosition, isActive]);

  return (
    <div ref={blobRef} className={styles.liquidBlob} role="presentation">
      <svg
        viewBox="0 0 200 60"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.blobSvg}
        aria-hidden="true"
      >
        <defs>
          <filter id="gooey-effect">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
          <linearGradient id="blob-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f7b186" stopOpacity="1" />
            <stop offset="100%" stopColor="#f59f6c" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          className={styles.blobPath}
          d="M 20,30 Q 20,10 40,10 L 160,10 Q 180,10 180,30 Q 180,50 160,50 L 40,50 Q 20,50 20,30 Z"
          fill="url(#blob-gradient)"
          filter="url(#gooey-effect)"
        />
      </svg>
    </div>
  );
}
