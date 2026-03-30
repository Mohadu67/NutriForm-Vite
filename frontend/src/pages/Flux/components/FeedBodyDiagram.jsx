import { useRef, useEffect } from 'react';
import styles from '../FluxPage.module.css';
import bodySvgMarkup from '../../../components/Exercice/DynamiChoice/BodyPicker/body.svg?raw';
import { FEED_ZONE_MAP, FEED_INACTIVE_FILL, FEED_INACTIVE_STROKE, MUSCLE_COLORS, getZoneName } from '../utils';

export default function FeedBodyDiagram({ muscles }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    host.innerHTML = bodySvgMarkup;
    const svg = host.querySelector('svg');
    if (!svg) return;

    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.style.width = '100%';
    svg.style.height = 'auto';
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const activeZones = new Set((muscles || []).map(m => FEED_ZONE_MAP[m] || getZoneName(m)).filter(Boolean));

    svg.querySelectorAll('[data-elem]').forEach(node => {
      const zone = getZoneName(node.getAttribute('data-elem') || '');
      if (zone && activeZones.has(zone)) {
        const color = Object.entries(FEED_ZONE_MAP).find(([, z]) => z === zone)?.[0];
        const hex = (color && MUSCLE_COLORS[color]) || '#E89A6F';
        node.style.setProperty('fill', hex + 'CC', 'important');
        node.style.setProperty('stroke', hex, 'important');
        node.style.setProperty('stroke-width', '1.5', 'important');
      } else {
        node.style.setProperty('fill', FEED_INACTIVE_FILL, 'important');
        node.style.setProperty('stroke', FEED_INACTIVE_STROKE, 'important');
        node.style.setProperty('stroke-width', '0.5', 'important');
      }
    });

    return () => { host.innerHTML = ''; };
  }, [muscles]);

  return (
    <div className={styles.bodyDiagram}>
      <div ref={containerRef} className={styles.bodySvg} />
    </div>
  );
}
