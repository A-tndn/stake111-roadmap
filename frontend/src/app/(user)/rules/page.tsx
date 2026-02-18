'use client';

import { ScrollText } from 'lucide-react';

const rules = [
  {
    title: 'General Rules',
    items: [
      'All bets are subject to the rules and regulations of the platform.',
      'Users must be of legal age to participate in betting.',
      'The platform reserves the right to void any bet at its discretion.',
      'All results are final once officially confirmed.',
    ],
  },
  {
    title: 'Cricket Betting Rules',
    items: [
      'Match Winner bets are settled based on the official match result.',
      'If a match is abandoned or cancelled, all bets are voided and stakes refunded.',
      'For limited-overs matches, minimum overs must be bowled for bets to stand.',
      'Live (in-play) bets are accepted at the current odds at the time of placement.',
      'Back bets win if the selection wins. Lay bets win if the selection loses.',
    ],
  },
  {
    title: 'Casino Rules',
    items: [
      'All casino games use a provably fair system.',
      'Casino bets are settled instantly after each round.',
      'Minimum and maximum bet limits apply per game.',
      'The house edge varies by game type.',
    ],
  },
  {
    title: 'Account & Financial Rules',
    items: [
      'Deposits are credited after admin approval.',
      'Withdrawals are processed within 24-48 hours after approval.',
      'Maximum 3 pending withdrawal requests at a time.',
      'Your balance must be sufficient before placing any bet.',
      'Credit limits are set by your agent and cannot be exceeded.',
    ],
  },
  {
    title: 'Fair Play Policy',
    items: [
      'Multiple accounts per user are not allowed.',
      'Any form of match-fixing or manipulation will result in account suspension.',
      'The platform uses automated systems to detect suspicious activity.',
      'Violation of terms may result in forfeiture of funds.',
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-3 py-3">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-brand-teal" />
          Rules & Regulations
        </h1>
      </div>

      <div className="px-3 pb-4 space-y-3">
        {rules.map((section, idx) => (
          <div key={idx} className="bg-card rounded-lg border overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b">
              <h2 className="text-sm font-bold text-foreground">{section.title}</h2>
            </div>
            <ul className="p-4 space-y-2">
              {section.items.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-brand-teal mt-0.5">&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
