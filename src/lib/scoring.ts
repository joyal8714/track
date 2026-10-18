export type RuleStatus = 'satisfied' | 'broken' | 'unknown';

export interface EvaluatedRule {
  id: 'followed_setups' | 'max_two_trades' | 'no_impulsive_risk' | 'stopped_as_planned';
  name: string;
  status: RuleStatus;
  description: string;
}

export interface DisciplineCalculation {
  disciplineScore: number | null; // 0 - 100 or null if no known rules
  scoreDisplay: string; // e.g. "75" or "Not enough data"
  knownRulesCount: number;
  satisfiedRulesCount: number;
  totalRulesCount: number;
  rules: EvaluatedRule[];
  rulesFollowed: string[];
  rulesBroken: string[];
}

export interface ScoringInput {
  trade_count?: number | null;
  followed_setups?: boolean | null;
  impulsive_risk_increase?: boolean | null;
  stopped_as_planned?: boolean | null;
}

/**
 * Deterministically calculates trading discipline score based on 4 fixed core rules:
 * 1. Followed planned setups (Yes)
 * 2. Took no more than two trades (trade_count <= 2)
 * 3. Did not increase risk impulsively (No impulsive risk)
 * 4. Stopped when planned (Yes)
 *
 * Each satisfied rule earns 25 points out of 100 when all 4 rules are known.
 * Missing / invalid answers are marked unknown rather than treated as automatic failures.
 * The percentage is calculated strictly from known rules.
 * If 0 rules are evaluable, score is null and display is "Not enough data".
 */
export function calculateDisciplineScore(input: ScoringInput): DisciplineCalculation {
  const rules: EvaluatedRule[] = [];
  const rulesFollowed: string[] = [];
  const rulesBroken: string[] = [];

  // Rule 1: Followed planned setups
  if (input.followed_setups === true) {
    rules.push({
      id: 'followed_setups',
      name: 'Followed planned setups',
      status: 'satisfied',
      description: 'Executed strictly according to pre-defined trading plan.',
    });
    rulesFollowed.push('Followed planned setups');
  } else if (input.followed_setups === false) {
    rules.push({
      id: 'followed_setups',
      name: 'Followed planned setups',
      status: 'broken',
      description: 'Deviated from planned setups or took unplanned entries.',
    });
    rulesBroken.push('Did not follow planned setups');
  } else {
    rules.push({
      id: 'followed_setups',
      name: 'Followed planned setups',
      status: 'unknown',
      description: 'Setup adherence status not recorded.',
    });
  }

  // Rule 2: Took no more than two trades (Fixed max-two-trades rule)
  if (typeof input.trade_count === 'number' && !isNaN(input.trade_count) && input.trade_count >= 0) {
    if (input.trade_count <= 2) {
      rules.push({
        id: 'max_two_trades',
        name: 'Maximum two trades rule',
        status: 'satisfied',
        description: `Kept daily trades to ${input.trade_count} (<= 2 target).`,
      });
      rulesFollowed.push(`Followed maximum-two-trades rule (${input.trade_count} trade${input.trade_count === 1 ? '' : 's'})`);
    } else {
      rules.push({
        id: 'max_two_trades',
        name: 'Maximum two trades rule',
        status: 'broken',
        description: `Exceeded trade limit with ${input.trade_count} trades (target is <= 2).`,
      });
      rulesBroken.push(`Over-traded: Took ${input.trade_count} trades (exceeded max 2)`);
    }
  } else {
    rules.push({
      id: 'max_two_trades',
      name: 'Maximum two trades rule',
      status: 'unknown',
      description: 'Trade count not provided.',
    });
  }

  // Rule 3: Did not increase risk impulsively
  if (input.impulsive_risk_increase === false) {
    rules.push({
      id: 'no_impulsive_risk',
      name: 'Controlled position sizing & risk',
      status: 'satisfied',
      description: 'Kept position sizing disciplined with no impulsive risk surges.',
    });
    rulesFollowed.push('Did not increase risk impulsively');
  } else if (input.impulsive_risk_increase === true) {
    rules.push({
      id: 'no_impulsive_risk',
      name: 'Controlled position sizing & risk',
      status: 'broken',
      description: 'Impulsively increased position size or risk exposure.',
    });
    rulesBroken.push('Increased risk impulsively');
  } else {
    rules.push({
      id: 'no_impulsive_risk',
      name: 'Controlled position sizing & risk',
      status: 'unknown',
      description: 'Risk increase status not recorded.',
    });
  }

  // Rule 4: Stopped when planned
  if (input.stopped_as_planned === true) {
    rules.push({
      id: 'stopped_as_planned',
      name: 'Stopped trading when planned',
      status: 'satisfied',
      description: 'Closed the terminal as planned without chasing further moves.',
    });
    rulesFollowed.push('Stopped trading when planned');
  } else if (input.stopped_as_planned === false) {
    rules.push({
      id: 'stopped_as_planned',
      name: 'Stopped trading when planned',
      status: 'broken',
      description: 'Continued screen time or trading past the designated stopping boundary.',
    });
    rulesBroken.push('Did not stop trading when planned');
  } else {
    rules.push({
      id: 'stopped_as_planned',
      name: 'Stopped trading when planned',
      status: 'unknown',
      description: 'Stopping plan adherence not recorded.',
    });
  }

  const knownRules = rules.filter(r => r.status !== 'unknown');
  const satisfiedRules = rules.filter(r => r.status === 'satisfied');
  const knownRulesCount = knownRules.length;
  const satisfiedRulesCount = satisfiedRules.length;

  if (knownRulesCount === 0) {
    return {
      disciplineScore: null,
      scoreDisplay: 'Not enough data',
      knownRulesCount: 0,
      satisfiedRulesCount: 0,
      totalRulesCount: 4,
      rules,
      rulesFollowed,
      rulesBroken,
    };
  }

  const score = Math.round((satisfiedRulesCount / knownRulesCount) * 100);

  return {
    disciplineScore: score,
    scoreDisplay: `${score}`,
    knownRulesCount,
    satisfiedRulesCount,
    totalRulesCount: 4,
    rules,
    rulesFollowed,
    rulesBroken,
  };
}
