'use client';

import {
  Brain,
  Ear,
  Book,
  Mic,
  ArrowRight,
  CheckCircle2,
  ArrowDown,
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="pt-24">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl font-extrabold mb-6  bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-transparent bg-clip-text">
          Master Any Language Naturally
        </h1>
        <p className="text-xl md:text-2xl mb-12 text-gray-600 max-w-2xl mx-auto">
          Learn languages the way your brain was designed to - through
          simultaneous listening, reading, and speaking, just like you learned
          your first language when you were a child
        </p>

        <div className="flex flex-col md:flex-row flex-wrap items-center md:items-start justify-center gap-8 mb-32">
          <div className="flex items-center gap-3">
            <Ear className="md:w-8 md:h-8 w-12 h-12 text-purple-500" />
            <span className="text-lg font-medium">LISTEN</span>
          </div>
          <ArrowRight className="hidden md:block w-8 h-8 text-pink-500" />
          <ArrowDown className="block md:hidden w-8 h-8 text-pink-500" />

          <div className="flex items-center gap-3">
            <Book className="md:w-8 md:h-8 w-12 h-12 text-purple-500" />
            <span className="text-lg font-medium">READ</span>
          </div>
          <ArrowRight className="hidden md:block w-8 h-8 text-pink-500" />
          <ArrowDown className="block md:hidden w-8 h-8 text-pink-500" />

          <div className="flex items-center gap-3">
            <Mic className="md:w-8 md:h-8 w-12 h-12 text-purple-500" />
            <span className="text-lg font-medium">PRONOUNCE</span>
          </div>
        </div>

        <div className="my-12 font-bold text-lg  bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-transparent bg-clip-text">
          ROOT THE LANGUAGE IN YOUR BRAIN
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3 text-left">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-16 w-full">
        <h2 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-transparent bg-clip-text">
          The Science Behind It
        </h2>

        <div className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="relative">
              <Brain className="w-32 h-32 text-purple-500" />
            </div>

            <div className="">
              <h3 className="text-2xl text-center md:text-left font-semibold mb-6">
                Neural Networks Activation
              </h3>
              <div className="grid gap-4">
                {brainAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <p className="text-gray-700">
                      <span className="font-bold text-pink-500">
                        {area.name}:
                      </span>{' '}
                      {area.function}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const benefits = [
  {
    title: 'Natural Learning Process',
    description:
      'Learn exactly like you did as a child - through immersion and repetition',
  },
  {
    title: 'Perfect Pronunciation',
    description: 'Develop native-like accent by mimicking real speech patterns',
  },
  {
    title: 'Faster Progress',
    description:
      'Engage multiple brain areas simultaneously for better retention',
  },
];

const brainAreas = [
  {
    name: 'Auditory Cortex',
    function: 'Processes and understands speech sounds',
  },
  {
    name: 'Visual Cortex',
    function: 'Connects written words with their sounds',
  },
  {
    name: "Broca's Area",
    function: 'Controls speech production and imitation',
  },
  {
    name: 'Motor Cortex',
    function: 'Coordinates precise mouth movements',
  },
];
