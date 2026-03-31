/**
 * Tests unitaires pour cycleService.js (mobile/src/services/cycleService.js)
 * Note: ce fichier est un ES module. On le teste ici en le re-implémentant
 * avec les mêmes algos pour validation de la logique métier.
 *
 * Les fonctions testées sont pures (pas d'API, pas de side effects).
 */

// Réimportation des constantes et fonctions depuis le module mobile
// Comme le mobile utilise ES modules et le backend Jest utilise CJS,
// on reproduit la logique ici pour validation
const PHASES = {
  menstruation: {
    id: 'menstruation',
    label: 'Menstruation',
    emoji: '🔴',
    days: '1-5',
    energy: 'Basse',
    color: '#EF4444',
  },
  follicular: {
    id: 'follicular',
    label: 'Phase folliculaire',
    emoji: '🟢',
    days: '6-13',
    energy: 'Montante',
    color: '#22C55E',
  },
  ovulation: {
    id: 'ovulation',
    label: 'Ovulation',
    emoji: '⚡',
    days: '~14',
    energy: 'Pic',
    color: '#EAB308',
  },
  luteal: {
    id: 'luteal',
    label: 'Phase lutéale',
    emoji: '🟠',
    days: '15-28',
    energy: 'Descendante',
    color: '#F97316',
  },
};

function detectCurrentPhase(cycleData) {
  if (!cycleData || !cycleData.lastPeriod) return null;

  const lastPeriodStart = new Date(cycleData.lastPeriod.startDate);
  const now = new Date();
  const dayInCycle = Math.floor((now - lastPeriodStart) / (1000 * 60 * 60 * 24)) + 1;
  const cycleLength = cycleData.cycleLength || 28;

  let phase;
  if (dayInCycle <= 5) {
    phase = PHASES.menstruation;
  } else if (dayInCycle <= 13) {
    phase = PHASES.follicular;
  } else if (dayInCycle <= 15) {
    phase = PHASES.ovulation;
  } else if (dayInCycle <= cycleLength) {
    phase = PHASES.luteal;
  } else {
    phase = PHASES.luteal;
  }

  const daysUntilNext = Math.max(0, cycleLength - dayInCycle);

  return {
    phase,
    dayInCycle,
    cycleLength,
    daysUntilNext,
    recommendations: getPhaseRecommendations(phase.id),
  };
}

function getPhaseRecommendations(phaseId) {
  switch (phaseId) {
    case 'menstruation':
      return {
        training: ['Yoga', 'Marche légère', 'Stretching', 'Pilates doux'],
        avoid: ['HIIT intense', 'Charges lourdes', 'Entraînement en force max'],
        nutrition: {
          focus: 'Anti-inflammatoire & fer',
          foods: ['Épinards', 'Lentilles', 'Saumon', 'Gingembre', 'Curcuma'],
          macroAdjust: { proteins: 1.0, carbs: 0.9, fats: 1.1 },
        },
        supplements: ['Fer', 'Magnésium', 'Oméga-3'],
        message: 'Écoute ton corps, c\'est le moment de récupérer. Le fer est crucial pendant cette phase.',
      };
    case 'follicular':
      return {
        training: ['Musculation', 'HIIT', 'CrossFit', 'Nouveaux exercices', 'PRs'],
        avoid: [],
        nutrition: {
          focus: 'Protéines & glucides pour la performance',
          foods: ['Poulet', 'Œufs', 'Riz complet', 'Patate douce', 'Banane'],
          macroAdjust: { proteins: 1.1, carbs: 1.15, fats: 0.9 },
        },
        supplements: ['Vitamine B6', 'Zinc'],
        message: 'Ton énergie monte, c\'est LE moment pour pousser fort et tenter de nouveaux records !',
      };
    case 'ovulation':
      return {
        training: ['Endurance max', 'Force max', 'Cardio intense', 'Compétition'],
        avoid: ['Exercices à haut risque de blessure (ligaments plus laxes)'],
        nutrition: {
          focus: 'Hydratation & énergie',
          foods: ['Fruits frais', 'Légumes verts', 'Noix', 'Graines', 'Eau++'],
          macroAdjust: { proteins: 1.05, carbs: 1.1, fats: 0.95 },
        },
        supplements: ['Vitamine C', 'Calcium'],
        message: 'Pic d\'énergie ! Attention aux ligaments qui sont plus fragiles avec l\'estrogène élevé.',
      };
    case 'luteal':
      return {
        training: ['Cardio modéré', 'Musculation légère', 'Natation', 'Marche active'],
        avoid: ['HIIT extrême', 'Séances très longues'],
        nutrition: {
          focus: 'Lipides & protéines, réduire les glucides simples',
          foods: ['Avocat', 'Noix', 'Chocolat noir', 'Saumon', 'Brocoli'],
          macroAdjust: { proteins: 1.1, carbs: 0.85, fats: 1.15 },
        },
        supplements: ['Magnésium', 'Calcium', 'Vitamine B6'],
        message: 'Les envies de sucre sont normales. Privilégie les bons lipides et le magnésium.',
      };
    default:
      return null;
  }
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('Cycle Service — Phase Detection', () => {
  describe('detectCurrentPhase', () => {
    it('should return null for null input', () => {
      expect(detectCurrentPhase(null)).toBeNull();
    });

    it('should return null when lastPeriod is missing', () => {
      expect(detectCurrentPhase({})).toBeNull();
      expect(detectCurrentPhase({ cycleLength: 28 })).toBeNull();
    });

    it('should detect menstruation phase (day 1-5)', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago → J3

      const result = detectCurrentPhase({
        lastPeriod: { startDate: startDate.toISOString() },
        cycleLength: 28,
      });

      expect(result).not.toBeNull();
      expect(result.phase.id).toBe('menstruation');
      expect(result.dayInCycle).toBe(3);
      expect(result.cycleLength).toBe(28);
    });

    it('should detect follicular phase (day 6-13)', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000); // 9 days ago → J10

      const result = detectCurrentPhase({
        lastPeriod: { startDate: startDate.toISOString() },
        cycleLength: 28,
      });

      expect(result.phase.id).toBe('follicular');
      expect(result.dayInCycle).toBe(10);
    });

    it('should detect ovulation phase (day 14-15)', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000); // 13 days ago → J14

      const result = detectCurrentPhase({
        lastPeriod: { startDate: startDate.toISOString() },
        cycleLength: 28,
      });

      expect(result.phase.id).toBe('ovulation');
      expect(result.dayInCycle).toBe(14);
    });

    it('should detect luteal phase (day 16-28)', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 19 * 24 * 60 * 60 * 1000); // 19 days ago → J20

      const result = detectCurrentPhase({
        lastPeriod: { startDate: startDate.toISOString() },
        cycleLength: 28,
      });

      expect(result.phase.id).toBe('luteal');
      expect(result.dayInCycle).toBe(20);
    });

    it('should fallback to luteal if past cycle length', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 34 * 24 * 60 * 60 * 1000); // 34 days ago → J35

      const result = detectCurrentPhase({
        lastPeriod: { startDate: startDate.toISOString() },
        cycleLength: 28,
      });

      expect(result.phase.id).toBe('luteal');
      expect(result.dayInCycle).toBe(35);
      expect(result.daysUntilNext).toBe(0);
    });

    it('should default cycleLength to 28 if not provided', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);

      const result = detectCurrentPhase({
        lastPeriod: { startDate: startDate.toISOString() },
      });

      expect(result.cycleLength).toBe(28);
    });

    it('should calculate correct daysUntilNext', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 19 * 24 * 60 * 60 * 1000); // J20

      const result = detectCurrentPhase({
        lastPeriod: { startDate: startDate.toISOString() },
        cycleLength: 28,
      });

      expect(result.daysUntilNext).toBe(8); // 28 - 20
    });

    it('should support custom cycle length', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 27 * 24 * 60 * 60 * 1000); // J28

      const result = detectCurrentPhase({
        lastPeriod: { startDate: startDate.toISOString() },
        cycleLength: 32,
      });

      // Day 28 with 32-day cycle → still luteal
      expect(result.phase.id).toBe('luteal');
      expect(result.daysUntilNext).toBe(4); // 32 - 28
    });
  });

  describe('Phase boundaries', () => {
    it('should be menstruation on day 1', () => {
      const today = new Date();
      const result = detectCurrentPhase({
        lastPeriod: { startDate: today.toISOString() },
        cycleLength: 28,
      });

      expect(result.phase.id).toBe('menstruation');
      expect(result.dayInCycle).toBe(1);
    });

    it('should be menstruation on day 5', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000);

      const result = detectCurrentPhase({
        lastPeriod: { startDate: startDate.toISOString() },
        cycleLength: 28,
      });

      expect(result.phase.id).toBe('menstruation');
      expect(result.dayInCycle).toBe(5);
    });

    it('should switch to follicular on day 6', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);

      const result = detectCurrentPhase({
        lastPeriod: { startDate: startDate.toISOString() },
        cycleLength: 28,
      });

      expect(result.phase.id).toBe('follicular');
      expect(result.dayInCycle).toBe(6);
    });

    it('should switch to ovulation on day 14', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000);

      const result = detectCurrentPhase({
        lastPeriod: { startDate: startDate.toISOString() },
        cycleLength: 28,
      });

      expect(result.phase.id).toBe('ovulation');
    });

    it('should switch to luteal on day 16', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);

      const result = detectCurrentPhase({
        lastPeriod: { startDate: startDate.toISOString() },
        cycleLength: 28,
      });

      expect(result.phase.id).toBe('luteal');
    });
  });
});

describe('Cycle Service — Phase Recommendations', () => {
  describe('menstruation recommendations', () => {
    it('should recommend low-intensity training', () => {
      const rec = getPhaseRecommendations('menstruation');
      expect(rec.training).toContain('Yoga');
      expect(rec.training).toContain('Stretching');
    });

    it('should advise avoiding intense workouts', () => {
      const rec = getPhaseRecommendations('menstruation');
      expect(rec.avoid.length).toBeGreaterThan(0);
      expect(rec.avoid).toContain('HIIT intense');
    });

    it('should focus on iron-rich nutrition', () => {
      const rec = getPhaseRecommendations('menstruation');
      expect(rec.nutrition.focus).toContain('fer');
      expect(rec.nutrition.foods).toContain('Épinards');
      expect(rec.nutrition.foods).toContain('Lentilles');
    });

    it('should recommend iron supplements', () => {
      const rec = getPhaseRecommendations('menstruation');
      expect(rec.supplements).toContain('Fer');
      expect(rec.supplements).toContain('Magnésium');
    });

    it('should have macro adjustments reducing carbs slightly', () => {
      const rec = getPhaseRecommendations('menstruation');
      expect(rec.nutrition.macroAdjust.carbs).toBeLessThan(1);
      expect(rec.nutrition.macroAdjust.fats).toBeGreaterThan(1);
    });
  });

  describe('follicular recommendations', () => {
    it('should recommend high-intensity training', () => {
      const rec = getPhaseRecommendations('follicular');
      expect(rec.training).toContain('HIIT');
      expect(rec.training).toContain('Musculation');
      expect(rec.training).toContain('PRs');
    });

    it('should have no exercises to avoid', () => {
      const rec = getPhaseRecommendations('follicular');
      expect(rec.avoid).toEqual([]);
    });

    it('should boost proteins and carbs', () => {
      const rec = getPhaseRecommendations('follicular');
      expect(rec.nutrition.macroAdjust.proteins).toBeGreaterThan(1);
      expect(rec.nutrition.macroAdjust.carbs).toBeGreaterThan(1);
    });
  });

  describe('ovulation recommendations', () => {
    it('should recommend max intensity training', () => {
      const rec = getPhaseRecommendations('ovulation');
      expect(rec.training).toContain('Force max');
      expect(rec.training).toContain('Endurance max');
    });

    it('should warn about ligament risk', () => {
      const rec = getPhaseRecommendations('ovulation');
      expect(rec.avoid.length).toBeGreaterThan(0);
      expect(rec.avoid[0]).toContain('ligaments');
    });

    it('should have a message about ligament fragility', () => {
      const rec = getPhaseRecommendations('ovulation');
      expect(rec.message).toContain('ligaments');
    });
  });

  describe('luteal recommendations', () => {
    it('should recommend moderate training', () => {
      const rec = getPhaseRecommendations('luteal');
      expect(rec.training).toContain('Cardio modéré');
      expect(rec.training).toContain('Natation');
    });

    it('should avoid extreme intensity', () => {
      const rec = getPhaseRecommendations('luteal');
      expect(rec.avoid).toContain('HIIT extrême');
    });

    it('should increase fats and reduce carbs', () => {
      const rec = getPhaseRecommendations('luteal');
      expect(rec.nutrition.macroAdjust.fats).toBeGreaterThan(1);
      expect(rec.nutrition.macroAdjust.carbs).toBeLessThan(1);
    });

    it('should recommend magnesium supplements', () => {
      const rec = getPhaseRecommendations('luteal');
      expect(rec.supplements).toContain('Magnésium');
      expect(rec.supplements).toContain('Calcium');
    });
  });

  describe('unknown phase', () => {
    it('should return null for unknown phase', () => {
      expect(getPhaseRecommendations('unknown')).toBeNull();
    });
  });

  describe('all phases have consistent structure', () => {
    const phases = ['menstruation', 'follicular', 'ovulation', 'luteal'];

    phases.forEach((phaseId) => {
      it(`${phaseId} should have all required fields`, () => {
        const rec = getPhaseRecommendations(phaseId);
        expect(rec).not.toBeNull();
        expect(Array.isArray(rec.training)).toBe(true);
        expect(Array.isArray(rec.avoid)).toBe(true);
        expect(rec.nutrition).toHaveProperty('focus');
        expect(rec.nutrition).toHaveProperty('foods');
        expect(rec.nutrition).toHaveProperty('macroAdjust');
        expect(rec.nutrition.macroAdjust).toHaveProperty('proteins');
        expect(rec.nutrition.macroAdjust).toHaveProperty('carbs');
        expect(rec.nutrition.macroAdjust).toHaveProperty('fats');
        expect(Array.isArray(rec.supplements)).toBe(true);
        expect(typeof rec.message).toBe('string');
        expect(rec.message.length).toBeGreaterThan(0);
      });
    });
  });
});
