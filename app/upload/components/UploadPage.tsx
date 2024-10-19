'use client';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import FileList from './FileList';

const UploadPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('File uploaded successfully:', result);
      // Here you can update the UI or state to reflect the successful upload
    } catch (error) {
      const errorData = error as { message: string };
      setError(errorData.message);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB max size
  });

  return (
    <div className="p-4 w-full h-full">
      <h1 className="text-2xl font-bold mb-4">Upload MP3 File</h1>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the MP3 file here...</p>
        ) : (
          <p>Drag and drop an MP3 file here, or click to select a file</p>
        )}
        {error && (
          <p className="text-red-500 text-center max-w-prose mx-auto">
            {error}
          </p>
        )}
      </div>
      <div className="mt-4">
        <FileList />
      </div>
    </div>
  );
};

export default UploadPage;
