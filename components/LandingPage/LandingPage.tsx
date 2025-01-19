'use client';
import { Hero } from './Hero';
import { Video } from './Video';
import { Benefits } from './Benefits';
import { FC } from 'react';

// import { WhatsNext } from './WhatsNext';
// import { Footer } from './Footer';

export const LandingPage: FC = () => {
  return (
    <div className="w-full flex flex-col gap-8">
      <Hero />
      <Video
        src="/landing/LingvoMonkeys.mp4"
        poster="/landing/video-cover.png"
      />
      {/* <Benefits /> */}
      {/* <Video />
      <WhatsNext />
      <Footer /> */}
    </div>
  );
};
