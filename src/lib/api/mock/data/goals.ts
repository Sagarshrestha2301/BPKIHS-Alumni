import type { DonationGoal, FundsBreakdownItem } from '@/lib/api/types';
import { rupees } from '@/lib/format/money';

/** The general fund comes first; a donation with no goalId counts toward it. */
export const goalsSeed: DonationGoal[] = [
  {
    id: 'general-fund',
    title: 'General fund',
    description:
      'Gives the Association room to respond where help is needed most: student support, events and the work that keeps the alumni network running.',
    targetMinor: rupees(2_000_000),
    raisedMinor: rupees(865_000),
    currency: 'NPR',
    placeholder: true,
  },
  {
    id: 'goal-scholarship',
    title: 'Scholarship fund for first-year students',
    description:
      'Covers tuition and hostel costs for talented first-year students who could not otherwise afford to begin their studies.',
    targetMinor: rupees(1_000_000),
    raisedMinor: rupees(420_000),
    currency: 'NPR',
    deadline: '2027-03-31T18:15:00.000Z',
    placeholder: true,
  },
  {
    id: 'goal-library',
    title: 'Digital library and study space',
    description:
      'Fits out a quiet study hall with computers, reliable internet and access to online journals for students and residents.',
    targetMinor: rupees(600_000),
    raisedMinor: rupees(245_000),
    currency: 'NPR',
    deadline: '2027-01-31T18:15:00.000Z',
    placeholder: true,
  },
  {
    id: 'goal-rural-camps',
    title: 'Rural health camps',
    description:
      'Sends teams of alumni doctors, nurses and technologists to free screening camps in remote villages of eastern Nepal.',
    targetMinor: rupees(800_000),
    raisedMinor: rupees(310_000),
    currency: 'NPR',
    deadline: '2026-12-31T18:15:00.000Z',
    placeholder: true,
  },
  {
    id: 'goal-emergency-aid',
    title: 'Student emergency aid',
    description:
      'A small reserve for students facing sudden hardship, such as a family emergency or an unexpected medical bill.',
    targetMinor: rupees(300_000),
    raisedMinor: rupees(285_000),
    currency: 'NPR',
    placeholder: true,
  },
  {
    id: 'goal-skills-lab',
    title: 'Skills lab simulation equipment',
    description:
      'Buys mannequins and simulators so students can practise emergency and surgical skills before they meet real patients.',
    targetMinor: rupees(1_500_000),
    raisedMinor: rupees(520_000),
    currency: 'NPR',
    deadline: '2027-06-30T18:15:00.000Z',
    placeholder: true,
  },
];

const totalRaisedMinor = goalsSeed.reduce((sum, goal) => sum + goal.raisedMinor, 0);

const shares = [
  ['Scholarships and student aid', 40],
  ['Equipment and learning spaces', 25],
  ['Events and outreach', 20],
  ['Operations', 15],
] as const;

/** Amounts always add up to the total raised; the last row absorbs rounding. */
export const fundsBreakdownSeed: FundsBreakdownItem[] = (() => {
  let allocated = 0;
  return shares.map(([category, sharePercent], index) => {
    const amountMinor =
      index === shares.length - 1
        ? totalRaisedMinor - allocated
        : Math.round((totalRaisedMinor * sharePercent) / 100);
    allocated += amountMinor;
    return { category, sharePercent, amountMinor };
  });
})();
