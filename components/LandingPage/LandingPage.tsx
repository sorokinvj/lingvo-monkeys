'use client';
import { Hero } from './Hero';
// import { Video } from './Video';
import { Benefits } from './Benefits';
import { FC } from 'react';
// import { WhatsNext } from './WhatsNext';
// import { Footer } from './Footer';

export const LandingPage: FC = () => {
  return (
    <div className="w-full flex flex-col">
      <Hero />
      {/* <Benefits /> */}
      {/* <Video />
      <WhatsNext />
      <Footer /> */}
    </div>
  );
};
