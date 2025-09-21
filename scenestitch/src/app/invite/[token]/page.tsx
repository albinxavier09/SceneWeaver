'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';

interface Invitation {
  id: number;
  projectId: number;
  email: string;
  role: string;
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invite/${token}`);
      if (response.ok) {
        const data = await response.json();
        setInvitation(data.invitation);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid invitation');
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('Failed to load invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    setIsAccepting(true);
    try {
      const response = await fetch(`/api/invite/${token}`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/project/${invitation?.projectId}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h1>
          <p className="text-gray-600 mb-6">You've been added to the project. Redirecting...</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Not Found</h1>
          <p className="text-gray-600 mb-6">This invitation may have expired or been cancelled.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Invitation</h1>
          <p className="text-gray-600">You've been invited to collaborate on a storyboard project</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Project Role</label>
              <div className="mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(invitation.role)}`}>
                  {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                </span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Invitation Expires</label>
              <div className="mt-1 flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleAcceptInvitation}
            disabled={isAccepting}
            className="w-full bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAccepting ? 'Accepting...' : 'Accept Invitation'}
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors"
          >
            Decline
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By accepting this invitation, you'll be able to collaborate on this project
            {invitation.role === 'editor' && ' and edit scenes'}
            {invitation.role === 'viewer' && ' and view scenes'}.
          </p>
        </div>
      </div>
    </div>
  );
}
