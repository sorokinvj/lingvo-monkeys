import { Fragment } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { XIcon } from 'lucide-react';

interface DrawerProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  duration?: 75 | 100 | 150 | 200 | 300 | 500 | 700 | 1000;
  width?: string;
  minWidth?: string;
  position?: 'left' | 'right';
  hasNoBackgroundOverlay?: boolean;
}

const durationClasses = {
  75: 'duration-75',
  100: 'duration-100',
  150: 'duration-150',
  200: 'duration-200',
  300: 'duration-300',
  500: 'duration-500',
  700: 'duration-700',
  1000: 'duration-1000',
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  title,
  duration = 200,
  width = 'w-1/2',
  minWidth = 'min-w-[600px]',
  position = 'right',
  hasNoBackgroundOverlay = true,
}) => {
  const durationClass = durationClasses[duration];

  const positionClasses = {
    left: 'left-0',
    right: 'right-0 pl-10',
  };

  const translateClasses = {
    left: {
      enter: 'translate-x-0',
      enterFrom: '-translate-x-full',
      enterTo: 'translate-x-0',
      leave: '-translate-x-full',
    },
    right: {
      enter: 'translate-x-0',
      enterFrom: 'translate-x-full',
      enterTo: 'translate-x-0',
      leave: 'translate-x-full',
    },
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter={`ease-in-out ${durationClass}`}
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave={`ease-in-out ${durationClass}`}
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {hasNoBackgroundOverlay ? (
            <div />
          ) : (
            <div className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/50 transition-opacity" />
          )}
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={`pointer-events-none fixed inset-y-0 ${positionClasses[position]} flex ${width} ${minWidth}`}
            >
              <TransitionChild
                as={Fragment}
                enter={`transform transition ease-in-out ${durationClass}`}
                enterFrom={translateClasses[position].enterFrom}
                enterTo={translateClasses[position].enterTo}
                leave={`transform transition ease-in-out ${durationClass}`}
                leaveFrom={translateClasses[position].enter}
                leaveTo={translateClasses[position].leave}
              >
                <DialogPanel className="pointer-events-auto max-w-1/2 w-full">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-800 shadow-xl">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between">
                        <DialogTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {title}
                        </DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            onClick={onClose}
                          >
                            <span className="sr-only">Close panel</span>
                            <XIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex-1 px-4 sm:px-6">
                      {children}
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
