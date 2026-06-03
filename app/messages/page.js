import { Suspense } from 'react';
import MessagesContent from './MessagesContent';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Loading messages...</div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MessagesContent />
    </Suspense>
  );
}
