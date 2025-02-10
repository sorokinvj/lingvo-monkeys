'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { X } from 'lucide-react';
import Image from 'next/image';
const SignUpConfirmation: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [firstSignIn, setFirstSignIn] = useLocalStorage('firstSignIn', true);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (firstSignIn && searchParams.get('firstSignIn')) {
      setShowModal(true);
      setFirstSignIn(false);
    }
  }, [firstSignIn, searchParams]);

  if (!showModal) return null;

  return (
    <div className={`fixed inset-0 z-50 ${showModal ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black opacity-50"></div>
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg text-center relative flex flex-col items-center">
          <div className="absolute top-4 right-4">
            <X
              onClick={() => setShowModal(false)}
              className="w-6 h-6 text-black"
            />
          </div>
          <h2 className="text-2xl font-bold mt-4">Классно, что ты с нами!</h2>
          <p className="text-gray-600 my-2">
            Аккаунт подтвержден, доступны все функции.
          </p>
          <Image
            src="/landing/Monkey_UpsideDown.jpg"
            width={545}
            height={551}
            alt="Monkey upside down"
            className="w-24 mt-4"
          />
        </div>
      </div>
    </div>
  );
};

export default SignUpConfirmation;
