'use client';

export default function WelcomeBanner({ message }: { message?: string }) {
  const text = message || 'Welcome to CricBet! Place your bets on live cricket matches. Enjoy fair odds and instant payouts.';

  return (
    <div className="bg-brand-orange text-white overflow-hidden py-1.5">
      <div className="animate-marquee whitespace-nowrap text-xs font-medium">
        {text}
      </div>
    </div>
  );
}
