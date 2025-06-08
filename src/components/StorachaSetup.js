'use client';

import { useState } from 'react';

export default function StorachaSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupDone, setSetupDone] = useState(false);

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/setup-storacha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rs@ds2.de' })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('📧 Check your email (rs@ds2.de) and click the verification link!');
        setSetupDone(true);
      } else {
        alert('Setup failed: ' + result.error);
      }
    } catch (error) {
      alert('Setup error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (setupDone) {
    return (
      <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
        <p className="text-green-800 dark:text-green-200">
          ✅ Setup initiated! Please verify your email, then try creating a campaign.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg mb-4">
      <p className="text-yellow-800 dark:text-yellow-200 mb-2">
        🔧 Backend IPFS storage needs setup (one-time only)
      </p>
      <button
        onClick={handleSetup}
        disabled={isLoading}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {isLoading ? 'Setting up...' : 'Setup IPFS Backend'}
      </button>
    </div>
  );
}