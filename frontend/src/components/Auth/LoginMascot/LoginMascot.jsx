import React from "react";
import m from "./LoginMascot.module.css";

/**
 * Mascotte SVG – squelette uniquement. 
 * Les couleurs, tailles, animations et états sont gérés dans LoginMascot.module.css
 * States possibles: "idle" | "username" | "password"
 */
export default function LoginMascot({ state = "idle" }) {
  return (
    <div className={`${m.mascot} ${m[state]}`} aria-hidden>
      <svg className={m.svg} viewBox="0 0 260 240" role="img" aria-label="Animated login mascot" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="headGrad" cx="48%" cy="40%" r="70%">
            <stop offset="0%" />
            <stop offset="100%" />
          </radialGradient>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" />
            <stop offset="100%" />
          </linearGradient>
        </defs>

        {/* Ombre portée / conteneur principal */}
        <g className={m.root}>
          {/* Corps (pebble) */}
          <g className={m.bodyGroup}>
            <ellipse cx="130" cy="192" rx="62" ry="26" className={m.bodyFill} />
          </g>

          {/* Tête */}
          <g className={m.headGroup}>
            <circle cx="130" cy="110" r="72" className={m.headFill} />

            {/* Joues */}
            <ellipse cx="103" cy="128" rx="13" ry="9" className={m.cheekLeft} />
            <ellipse cx="157" cy="128" rx="13" ry="9" className={m.cheekRight} />

            {/* Yeux ouverts */}
            <g className={m.eyesOpen}>
              <circle cx="110" cy="110" r="13" className={m.eyeLeft} />
              <circle cx="150" cy="110" r="13" className={m.eyeRight} />
              <circle cx="112" cy="110" r="6.5" className={m.pupilLeft} />
              <circle cx="152" cy="110" r="6.5" className={m.pupilRight} />
              <circle cx="114" cy="108" r="2.2" className={m.glintLeft} />
              <circle cx="154" cy="108" r="2.2" className={m.glintRight} />
            </g>

            {/* Paupières (yeux fermés) */}
            <g className={m.eyesClosed}>
              <path d="M96 110 Q110 118 124 110" className={m.lidLeft} />
              <path d="M136 110 Q150 118 164 110" className={m.lidRight} />
            </g>

            {/* Sourcils */}
            <path d="M95 86 Q112 78 125 86" className={m.browLeft} />
            <path d="M135 86 Q148 78 165 86" className={m.browRight} />

            {/* Bouches */}
            <path d="M105 140 Q130 162 155 140" className={m.mouthSmile} />
            <path d="M112 148 Q130 144 148 148" className={m.mouthNeutral} />
          </g>

          {/* Bras & mains */}
          <g className={m.handsGroup}>
            <path d="M82 174 Q90 170 96 176 Q102 170 110 174 Q112 184 110 194 Q102 204 96 200 Q90 204 82 194 Z" className={m.handLeft} />
            <path d="M150 174 Q158 170 164 176 Q170 170 178 174 Q180 184 178 194 Q170 204 164 200 Q158 204 150 194 Z" className={m.handRight} />
          </g>
        </g>
      </svg>
    </div>
  );
}