import React, { useRef } from 'react';

const MODES = ['stretch', 'bounce', 'wiggle', 'wave', 'pop', 'swing', 'explode', 'fall'];

const LogoAnimated = ({ className = "" }) => {
  const stackRef = useRef(null);
  const topRef = useRef(null);
  const midRef = useRef(null);
  const baseRef = useRef(null);
  const shadowRef = useRef(null);
  const modeIndexRef = useRef(0);

  const trigger = () => {
    const stack = stackRef.current;
    const topEl = topRef.current;
    const midEl = midRef.current;
    const baseEl = baseRef.current;
    const shadow = shadowRef.current;

    if (!stack) return;

    // Cycle through animations
    modeIndexRef.current = (modeIndexRef.current + 1) % MODES.length;
    const mode = MODES[modeIndexRef.current];
    stack.setAttribute('data-mode', mode);

    const elements = [stack, topEl, midEl, baseEl, shadow];
    elements.forEach(el => {
      if (!el) return;
      el.classList.remove('go');
      void el.getBoundingClientRect();
      el.classList.add('go');
    });

    setTimeout(() => {
      elements.forEach(el => el && el.classList.remove('go'));
    }, 2400);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      trigger();
    }
  };

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 230" role="img" aria-labelledby="title desc" className={className}>
      <title>Galets pastel — animations fluides multi-modes</title>
      <desc>Au clic: alternance entre différentes animations fluides et amusantes.</desc>

      <defs>
        <style>
          {`
          :root {
            --dur-base: 1.0s;
            --ease: cubic-bezier(.22,.7,.25,1);
            --ease-bounce: cubic-bezier(.68,-0.55,.27,1.55);
            --ease-elastic: cubic-bezier(.2,.8,.16,1.1);
            --ease-smooth: cubic-bezier(.25,.46,.45,.94);
          }

          .st0, .st1, .st2, .st3 { stroke:#1d1d1b; stroke-miterlimit:10; }
          .st0 { fill:#f7f6f2; }
          .st2 { fill:#b8ddd1; }
          .st3 { fill:#f7b186; }

          #stack, #top, #mid, #base, #shadow { 
            will-change: transform, opacity; 
            transform: translateZ(0); 
          }

          #shadow { transform-origin:115px 176px; opacity:.16; }
          #stack { transform-origin:115px 115px; cursor:pointer; }
          #top   { transform-box: fill-box; transform-origin: 50% 60%; }
          #mid   { transform-box: fill-box; transform-origin: 50% 50%; }
          #base  { transform-box: fill-box; transform-origin: 50% 40%; }

          /* Idle animation */
          @keyframes idle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }
          #stack:not(.go) { animation: idle 6s ease-in-out infinite; }

          /* ========= MODE 1: STRETCH (élastique - conservé) ========= */
          @keyframes stretch-top {
            0%   { transform: translateY(0) scale(1,1) rotate(0deg); }
            25%  { transform: translateY(10px) scale(1.08,.92) rotate(-6deg); }
            55%  { transform: translateY(-4px) scale(.94,1.08) rotate(4deg); }
            100% { transform: translateY(0) scale(1,1) rotate(0deg); }
          }
          @keyframes stretch-mid {
            0%   { transform: scale(1,1); }
            25%  { transform: scale(1.18,.86); }
            55%  { transform: scale(.90,1.12); }
            100% { transform: scale(1,1); }
          }
          @keyframes stretch-base {
            0%   { transform: translateY(0) scale(1,1); }
            25%  { transform: translateY(-10px) scale(.94,1.06); }
            55%  { transform: translateY(4px) scale(1.06,.94); }
            100% { transform: translateY(0) scale(1,1); }
          }
          @keyframes stretch-shadow {
            0%   { transform: scaleX(1); opacity:.16; }
            50%  { transform: scaleX(1.25); opacity:.10; }
            100% { transform: scaleX(1); opacity:.16; }
          }
          @keyframes stretch-tilt {
            0%   { transform: rotate(0deg); }
            45%  { transform: rotate(-5deg); }
            100% { transform: rotate(0deg); }
          }

          /* ========= MODE 2: BOUNCE (rebond joyeux) ========= */
          @keyframes bounce-stack {
            0%   { transform: translateY(0) rotate(0deg); }
            15%  { transform: translateY(-30px) rotate(-8deg); }
            30%  { transform: translateY(0) rotate(0deg); }
            45%  { transform: translateY(-15px) rotate(5deg); }
            60%  { transform: translateY(0) rotate(0deg); }
            75%  { transform: translateY(-5px) rotate(-2deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }
          @keyframes bounce-top {
            0%, 100% { transform: scale(1,1); }
            15% { transform: scale(.9,1.15); }
            30% { transform: scale(1.1,.9); }
            45% { transform: scale(.95,1.08); }
            60% { transform: scale(1.05,.95); }
          }
          @keyframes bounce-shadow {
            0%, 100% { transform: scaleX(1); opacity:.16; }
            15% { transform: scaleX(1.4); opacity:.08; }
            30% { transform: scaleX(1); opacity:.18; }
            45% { transform: scaleX(1.2); opacity:.12; }
          }

          /* ========= MODE 3: WIGGLE (tremblement drôle) ========= */
          @keyframes wiggle-stack {
            0%, 100% { transform: rotate(0deg); }
            10% { transform: rotate(-8deg); }
            20% { transform: rotate(8deg); }
            30% { transform: rotate(-6deg); }
            40% { transform: rotate(6deg); }
            50% { transform: rotate(-4deg); }
            60% { transform: rotate(4deg); }
            70% { transform: rotate(-2deg); }
            80% { transform: rotate(2deg); }
            90% { transform: rotate(-1deg); }
          }
          @keyframes wiggle-top {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            12% { transform: translateX(-3px) rotate(5deg); }
            25% { transform: translateX(3px) rotate(-5deg); }
            37% { transform: translateX(-2px) rotate(3deg); }
            50% { transform: translateX(2px) rotate(-3deg); }
            62% { transform: translateX(-1px) rotate(2deg); }
            75% { transform: translateX(1px) rotate(-2deg); }
          }
          @keyframes wiggle-mid {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            15% { transform: translateX(2px) rotate(-4deg); }
            30% { transform: translateX(-2px) rotate(4deg); }
            45% { transform: translateX(1.5px) rotate(-3deg); }
            60% { transform: translateX(-1.5px) rotate(3deg); }
            75% { transform: translateX(1px) rotate(-2deg); }
          }
          @keyframes wiggle-base {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            18% { transform: translateX(1px) rotate(3deg); }
            36% { transform: translateX(-1px) rotate(-3deg); }
            54% { transform: translateX(1px) rotate(2deg); }
            72% { transform: translateX(-1px) rotate(-2deg); }
          }

          /* ========= MODE 4: WAVE (vague fluide) ========= */
          @keyframes wave-top {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            15% { transform: translateY(-8px) rotate(-12deg); }
            30% { transform: translateY(4px) rotate(8deg); }
            50% { transform: translateY(-4px) rotate(-6deg); }
            70% { transform: translateY(2px) rotate(4deg); }
            85% { transform: translateY(-1px) rotate(-2deg); }
          }
          @keyframes wave-mid {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            20% { transform: translateY(-6px) rotate(-8deg); }
            40% { transform: translateY(3px) rotate(6deg); }
            60% { transform: translateY(-3px) rotate(-4deg); }
            80% { transform: translateY(1px) rotate(2deg); }
          }
          @keyframes wave-base {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-4px) rotate(-5deg); }
            50% { transform: translateY(2px) rotate(4deg); }
            75% { transform: translateY(-1px) rotate(-2deg); }
          }
          @keyframes wave-shadow {
            0%, 100% { transform: scaleX(1) translateX(0); opacity:.16; }
            25% { transform: scaleX(1.15) translateX(-5px); opacity:.12; }
            50% { transform: scaleX(1.25) translateX(3px); opacity:.10; }
            75% { transform: scaleX(1.1) translateX(-2px); opacity:.14; }
          }

          /* ========= MODE 5: POP (explosion de joie) ========= */
          @keyframes pop-stack {
            0% { transform: scale(1) rotate(0deg); }
            5% { transform: scale(0.85) rotate(-5deg); }
            15% { transform: scale(1.15) rotate(5deg); }
            25% { transform: scale(0.95) rotate(-3deg); }
            35% { transform: scale(1.05) rotate(2deg); }
            45% { transform: scale(0.98) rotate(-1deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          @keyframes pop-top {
            0%, 100% { transform: translate(0,0) scale(1) rotate(0deg); }
            10% { transform: translate(0px,-2px) scale(0.9) rotate(-10deg); }
            20% { transform: translate(-8px,-15px) scale(1.1) rotate(15deg); }
            40% { transform: translate(6px,-8px) scale(1.05) rotate(-8deg); }
            60% { transform: translate(-3px,-4px) scale(1.02) rotate(4deg); }
            80% { transform: translate(1px,-1px) scale(1) rotate(-2deg); }
          }
          @keyframes pop-mid {
            0%, 100% { transform: translate(0,0) scale(1) rotate(0deg); }
            10% { transform: translate(0px,2px) scale(0.92) rotate(8deg); }
            22% { transform: translate(12px,8px) scale(1.08) rotate(-12deg); }
            42% { transform: translate(-4px,5px) scale(1.04) rotate(6deg); }
            62% { transform: translate(2px,2px) scale(1.01) rotate(-3deg); }
          }
          @keyframes pop-base {
            0%, 100% { transform: scale(1) rotate(0deg); }
            10% { transform: scale(0.95) rotate(-6deg); }
            24% { transform: scale(1.06) rotate(10deg); }
            44% { transform: scale(1.02) rotate(-4deg); }
            64% { transform: scale(1.01) rotate(2deg); }
          }
          @keyframes pop-shadow {
            0%, 100% { transform: scaleX(1); opacity:.16; }
            10% { transform: scaleX(1.1); opacity:.18; }
            20% { transform: scaleX(1.5); opacity:.08; }
            40% { transform: scaleX(1.3); opacity:.10; }
            60% { transform: scaleX(1.15); opacity:.14; }
          }

          /* ========= MODE 6: SWING (balancier) ========= */
          @keyframes swing-stack {
            0% { transform: rotate(0deg); }
            15% { transform: rotate(25deg); }
            30% { transform: rotate(-20deg); }
            45% { transform: rotate(15deg); }
            60% { transform: rotate(-10deg); }
            75% { transform: rotate(5deg); }
            90% { transform: rotate(-2deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes swing-top {
            0%, 100% { transform: scale(1); }
            15% { transform: scale(1.05,.95); }
            30% { transform: scale(.95,1.05); }
            45% { transform: scale(1.03,.97); }
            60% { transform: scale(.97,1.03); }
          }
          @keyframes swing-mid {
            0%, 100% { transform: scale(1); }
            20% { transform: scale(1.04,.96); }
            40% { transform: scale(.96,1.04); }
            60% { transform: scale(1.02,.98); }
            80% { transform: scale(.98,1.02); }
          }
          @keyframes swing-shadow {
            0%, 100% { transform: scaleX(1) translateX(0); opacity:.16; }
            15% { transform: scaleX(1.3) translateX(12px); opacity:.10; }
            30% { transform: scaleX(1.3) translateX(-10px); opacity:.10; }
            50% { transform: scaleX(1.2) translateX(8px); opacity:.12; }
            70% { transform: scaleX(1.15) translateX(-6px); opacity:.14; }
          }

          /* ========= MODE 7: EXPLODE (explosion fluide et organique) ========= */
          @keyframes explode-stack {
            0% { transform: scale(1) rotate(0deg); }
            3% { transform: scale(0.88) rotate(-2deg); }
            10% { transform: scale(1.12) rotate(3deg); }
            25% { transform: scale(1.02) rotate(-1deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          @keyframes explode-top {
            0% { transform: translate(0,0) scale(1) rotate(0deg); opacity: 1; }
            3% { transform: translate(-2px,-3px) scale(0.96) rotate(-5deg); opacity: 1; }
            10% { transform: translate(-55px,-70px) scale(0.9) rotate(-120deg); opacity: 1; }
            25% { transform: translate(-60px,-75px) scale(0.88) rotate(-160deg); opacity: 0.95; }
            40% { transform: translate(20px,12px) scale(0.92) rotate(-260deg); opacity: 0.85; }
            55% { transform: translate(8px,5px) scale(0.96) rotate(-320deg); opacity: 0.9; }
            68% { transform: translate(3px,2px) scale(0.98) rotate(-350deg); opacity: 0.95; }
            82% { transform: translate(1px,0.5px) scale(0.99) rotate(-362deg); opacity: 0.98; }
            92% { transform: translate(0px,0px) scale(1) rotate(-365deg); opacity: 1; }
            100% { transform: translate(0,0) scale(1) rotate(-360deg); opacity: 1; }
          }
          @keyframes explode-mid {
            0% { transform: translate(0,0) scale(1) rotate(0deg); opacity: 1; }
            3% { transform: translate(2px,-2px) scale(0.96) rotate(5deg); opacity: 1; }
            10% { transform: translate(65px,-35px) scale(0.88) rotate(140deg); opacity: 1; }
            25% { transform: translate(70px,-40px) scale(0.86) rotate(180deg); opacity: 0.95; }
            40% { transform: translate(-18px,8px) scale(0.9) rotate(280deg); opacity: 0.85; }
            55% { transform: translate(-7px,3px) scale(0.95) rotate(340deg); opacity: 0.9; }
            68% { transform: translate(-2px,1px) scale(0.98) rotate(358deg); opacity: 0.95; }
            82% { transform: translate(-0.5px,0px) scale(0.99) rotate(362deg); opacity: 0.98; }
            92% { transform: translate(0px,0px) scale(1) rotate(365deg); opacity: 1; }
            100% { transform: translate(0,0) scale(1) rotate(360deg); opacity: 1; }
          }
          @keyframes explode-base {
            0% { transform: translate(0,0) scale(1) rotate(0deg); opacity: 1; }
            3% { transform: translate(0px,2px) scale(0.96) rotate(0deg); opacity: 1; }
            10% { transform: translate(-30px,60px) scale(0.94) rotate(-100deg); opacity: 1; }
            25% { transform: translate(-35px,65px) scale(0.92) rotate(-130deg); opacity: 0.95; }
            45% { transform: translate(-25px,45px) scale(0.94) rotate(-90deg); opacity: 0.88; }
            60% { transform: translate(-12px,22px) scale(0.97) rotate(-45deg); opacity: 0.92; }
            73% { transform: translate(-4px,8px) scale(0.99) rotate(-15deg); opacity: 0.96; }
            85% { transform: translate(-1px,2px) scale(0.995) rotate(-4deg); opacity: 0.98; }
            94% { transform: translate(0px,0px) scale(1) rotate(-1deg); opacity: 1; }
            100% { transform: translate(0,0) scale(1) rotate(0deg); opacity: 1; }
          }
          @keyframes explode-shadow {
            0%, 100% { transform: scaleX(1); opacity:.16; }
            3% { transform: scaleX(0.85); opacity:.2; }
            10% { transform: scaleX(2.5); opacity:.02; }
            25% { transform: scaleX(2.8); opacity:.015; }
            45% { transform: scaleX(2.2); opacity:.04; }
            60% { transform: scaleX(1.7); opacity:.08; }
            73% { transform: scaleX(1.4); opacity:.11; }
            85% { transform: scaleX(1.2); opacity:.14; }
            94% { transform: scaleX(1.05); opacity:.155; }
          }

          /* ========= MODE 8: FALL (tout s'écroule puis se remet en place avec difficulté) ========= */
          @keyframes fall-tilt {
            0% { transform: rotate(0deg); }
            15% { transform: rotate(-6deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes fall-shadow {
            0% { transform: scaleX(1); opacity:.16; }
            35% { transform: scaleX(1.8); opacity:.06; }
            60% { transform: scaleX(1.4); opacity:.10; }
            85% { transform: scaleX(1.1); opacity:.13; }
            100% { transform: scaleX(1); opacity:.16; }
          }
          /* chaque galet tombe puis remonte en luttant (secousses) */
          @keyframes fall-top {
            0%   { transform: translateY(0) rotate(0deg); }
            35%  { transform: translateY(140px) rotate(-35deg); }
            60%  { transform: translateY(-18px) rotate(8deg); }
            75%  { transform: translateY(10px) rotate(-4deg); }
            88%  { transform: translateY(-6px) rotate(2deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }
          @keyframes fall-mid {
            0%   { transform: translateY(0) rotate(0deg); }
            35%  { transform: translateY(120px) rotate(28deg); }
            60%  { transform: translateY(-14px) rotate(-6deg); }
            75%  { transform: translateY(8px) rotate(3deg); }
            88%  { transform: translateY(-5px) rotate(-1.5deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }
          @keyframes fall-base {
            0%   { transform: translateY(0) rotate(0deg); }
            35%  { transform: translateY(90px) rotate(-18deg); }
            60%  { transform: translateY(-10px) rotate(4deg); }
            75%  { transform: translateY(6px) rotate(-2deg); }
            88%  { transform: translateY(-3px) rotate(1deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }

          /* Application des animations */
          /* STRETCH */
          #stack[data-mode="stretch"].go { animation: stretch-tilt var(--dur-base) var(--ease) both; }
          #stack[data-mode="stretch"].go #top  { animation: stretch-top var(--dur-base) var(--ease-elastic) both; }
          #stack[data-mode="stretch"].go #mid  { animation: stretch-mid var(--dur-base) var(--ease-elastic) both; }
          #stack[data-mode="stretch"].go #base { animation: stretch-base var(--dur-base) var(--ease-elastic) both; }
          #stack[data-mode="stretch"].go ~ #shadow { animation: stretch-shadow var(--dur-base) var(--ease) both; }

          /* BOUNCE */
          #stack[data-mode="bounce"].go { animation: bounce-stack 1.2s var(--ease-bounce) both; }
          #stack[data-mode="bounce"].go #top,
          #stack[data-mode="bounce"].go #mid,
          #stack[data-mode="bounce"].go #base { animation: bounce-top 1.2s var(--ease-bounce) both; }
          #stack[data-mode="bounce"].go ~ #shadow { animation: bounce-shadow 1.2s var(--ease-bounce) both; }

          /* WIGGLE */
          #stack[data-mode="wiggle"].go { animation: wiggle-stack 0.8s var(--ease) both; }
          #stack[data-mode="wiggle"].go #top  { animation: wiggle-top 0.8s var(--ease) both; }
          #stack[data-mode="wiggle"].go #mid  { animation: wiggle-mid 0.8s var(--ease) both; }
          #stack[data-mode="wiggle"].go #base { animation: wiggle-base 0.8s var(--ease) both; }

          /* WAVE */
          #stack[data-mode="wave"].go #top  { animation: wave-top 1.3s var(--ease-smooth) both; }
          #stack[data-mode="wave"].go #mid  { animation: wave-mid 1.3s var(--ease-smooth) both; animation-delay: 0.05s; }
          #stack[data-mode="wave"].go #base { animation: wave-base 1.3s var(--ease-smooth) both; animation-delay: 0.1s; }
          #stack[data-mode="wave"].go ~ #shadow { animation: wave-shadow 1.3s var(--ease-smooth) both; }

          /* POP */
          #stack[data-mode="pop"].go { animation: pop-stack 1.1s var(--ease-bounce) both; }
          #stack[data-mode="pop"].go #top  { animation: pop-top 1.1s var(--ease-bounce) both; }
          #stack[data-mode="pop"].go #mid  { animation: pop-mid 1.1s var(--ease-bounce) both; }
          #stack[data-mode="pop"].go #base { animation: pop-base 1.1s var(--ease-bounce) both; }
          #stack[data-mode="pop"].go ~ #shadow { animation: pop-shadow 1.1s var(--ease-bounce) both; }

          /* SWING */
          #stack[data-mode="swing"].go { animation: swing-stack 1.4s var(--ease-smooth) both; }
          #stack[data-mode="swing"].go #top  { animation: swing-top 1.4s var(--ease-smooth) both; }
          #stack[data-mode="swing"].go #mid  { animation: swing-mid 1.4s var(--ease-smooth) both; }
          #stack[data-mode="swing"].go ~ #shadow { animation: swing-shadow 1.4s var(--ease-smooth) both; }

          /* EXPLODE */
          #stack[data-mode="explode"].go { animation: explode-stack 2.2s cubic-bezier(.16,.8,.3,.98) both; }
          #stack[data-mode="explode"].go #top  { animation: explode-top 2.2s cubic-bezier(.34,.46,.14,.98) both; }
          #stack[data-mode="explode"].go #mid  { animation: explode-mid 2.2s cubic-bezier(.34,.46,.14,.98) both; animation-delay: 0.02s; }
          #stack[data-mode="explode"].go #base { animation: explode-base 2.2s cubic-bezier(.34,.46,.14,.98) both; animation-delay: 0.04s; }
          #stack[data-mode="explode"].go ~ #shadow { animation: explode-shadow 2.2s cubic-bezier(.16,.8,.3,.98) both; }

          /* FALL */
          #stack[data-mode="fall"].go { animation: fall-tilt 1.9s var(--ease-smooth) both; }
          #stack[data-mode="fall"].go #top  { animation: fall-top 1.9s var(--ease-smooth) both; }
          #stack[data-mode="fall"].go #mid  { animation: fall-mid 1.9s var(--ease-smooth) both; animation-delay: .03s; }
          #stack[data-mode="fall"].go #base { animation: fall-base 1.9s var(--ease-smooth) both; animation-delay: .06s; }
          #stack[data-mode="fall"].go ~ #shadow { animation: fall-shadow 1.9s var(--ease-smooth) both; }

          /* Reduced motion */
          @media (prefers-reduced-motion: reduce) {
            #stack, #top, #mid, #base, #shadow { 
              animation: none !important; 
              transition: none !important; 
            }
          }
          `}
        </style>
      </defs>

      <ellipse id="shadow" ref={shadowRef} cx="115" cy="176" rx="62" ry="10" fill="#1d1d1b" />

      <g
        id="stack"
        ref={stackRef}
        tabIndex="0"
        role="button"
        aria-label="Animer les galets"
        data-mode="stretch"
        onClick={trigger}
        onKeyDown={onKeyDown}
      >
        <path id="base" ref={baseRef} className="st2" d="M66.2,128.2c14.2-10.4,82-12.7,93.9,4.6,50.8,73.6-152.4,49.5-93.9-4.6Z" />
        <path id="mid" ref={midRef} className="st3" d="M151.7,89.4c-16-18-55-22.1-75.2-8.4-18.9,12.6-6.2,37.2,13.4,35.3,15-1.5,27.2,2.6,49.7-.5,14.1-2,23.2-14.4,12.2-26.2h-.1c0-.1,0-.1,0-.1Z" />
        <path id="top" ref={topRef} className="st0" d="M132.1,53.9c8.6,15.9-5.1,17.4-24.1,15-24.3-3-30.9-15-23.4-23.6,10.5-12,25.9-19.9,47.4,8.5h0Z" />
      </g>
    </svg>
  );
};

export default LogoAnimated;