import React, { useState } from 'react';

export interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
  fallbackImage?: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Andrei Baranov',
    role: 'Design Chief',
    description:
      'Andrei sets the visual direction of every project. He turns rough ideas into clear, confident design languages that feel effortless yet leave a lasting impression.',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=2000&q=85',
  },
  {
    name: 'Daria Lebedeva',
    role: 'Interface Expert',
    description:
      'Daria crafts interfaces people understand at first glance. Every screen she designs balances clarity and character, making complex products feel simple and warm.',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=2000&q=85',
  },
  {
    name: 'Ivan Sorokin',
    role: 'Concept Chief',
    description:
      'Ivan shapes the ideas behind the work. He digs into every brief until the core story emerges, then builds concepts that give each project its reason to exist.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=2000&q=85',
  },
  {
    name: 'Anna Fedorova',
    role: 'Brand Consultant',
    description:
      'Anna helps brands find their voice. From positioning to tone, she builds identities that stay consistent everywhere and grow stronger with every appearance.',
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=2000&q=85',
  },
  {
    name: 'Pavel Smirnov',
    role: 'Movement Artist',
    description:
      'Pavel brings stillness to life. His motion work adds rhythm and personality to every product, guiding attention with transitions that feel natural and precise.',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=2000&q=85',
  },
  {
    name: 'Olga Kravtsova',
    role: 'UX Specialist',
    description:
      'Olga studies how people actually use what we make. Her research keeps every decision grounded in real behavior, so the work serves users and not assumptions.',
    image:
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=2000&q=85',
  },
  {
    name: 'Igor Zakharenko',
    role: 'Graphic Creator',
    description:
      'Igor gives every project its finishing touch. From typography to illustration, he sweats the visual details that separate good work from unforgettable work.',
    image:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=2000&q=85',
  },
  {
    name: 'Ksenia Romanova',
    role: 'Studio Head',
    description:
      'Ksenia keeps the studio moving as one. She connects people, plans, and priorities so every project ships on time without losing the craft it deserves.',
    image:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=2000&q=85',
  },
];

export const Hero: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const currentMember = TEAM_MEMBERS[activeIndex];

  return (
    <section className="relative h-screen w-full overflow-hidden font-geist text-white select-none bg-black">
      {/* Background stacked portraits using <img> object-cover and object-position */}
      {TEAM_MEMBERS.map((member, index) => (
        <img
          key={member.name}
          src={member.image}
          alt={member.name}
          className={`absolute inset-0 w-full h-full object-cover object-[center_20%] transition-opacity duration-700 ease-out ${
            index === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          loading={index === 0 ? 'eager' : 'lazy'}
        />
      ))}

      {/* Light dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70 pointer-events-none" />

      {/* Content layer */}
      <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-6 pt-10 sm:px-10 sm:pb-8 sm:pt-14 lg:px-16">
        {/* Top zone — headline + bio */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-16">
          <h1 className="max-w-xl text-3xl font-normal leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl">
            Kollektiva is the talent you build with each&nbsp;day
          </h1>

          <p
            key={currentMember.name}
            className="max-w-xs text-sm font-medium leading-relaxed text-white/80 sm:text-base md:pt-2 animate-[fadeIn_0.5s_ease]"
          >
            {currentMember.description}
          </p>
        </div>

        {/* Bottom zone — avatar picker + meta footer */}
        <div className="flex flex-col gap-8">
          {/* Avatar picker row */}
          <div className="flex items-end gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 sm:gap-3 sm:overflow-visible sm:pb-0">
            {TEAM_MEMBERS.map((member, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={member.name}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show ${member.name}`}
                  className="flex shrink-0 flex-col items-center gap-2 cursor-pointer focus:outline-none"
                >
                  {/* Active indicator dot */}
                  <span
                    className={`h-1 w-1 rounded-full bg-white transition-opacity duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {/* Circular thumbnail */}
                  <span className="block h-10 w-10 overflow-hidden rounded-full sm:h-14 sm:w-14">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Meta footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-5 text-sm font-medium">
            <span
              key={currentMember.name}
              className="text-white animate-[fadeIn_0.5s_ease]"
            >
              {currentMember.name}
            </span>

            <span
              key={currentMember.role}
              className="hidden text-white/70 sm:inline"
            >
              {currentMember.role}
            </span>

            <span className="hidden text-white/70 md:inline">
              In the business since 2020
            </span>

            <a
              href="#"
              className="underline underline-offset-4 transition-colors hover:text-white/70"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
