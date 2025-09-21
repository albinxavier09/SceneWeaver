import { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Crown, Edit, Eye, Trash2, Clock, Search, User } from 'lucide-react';

interface TeamMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

interface Invitation {
  id: number;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface CollaborationPanelProps {
  projectId: number;
  userRole: string;
}

export default function CollaborationPanel({ projectId, userRole }: CollaborationPanelProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'editor', userId: null as number | null });
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, [projectId]);

  const fetchTeamData = async () => {
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/team`),
        fetch(`/api/projects/${projectId}/invitations`)
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }

      if (invitationsRes.ok) {
        const invitationsData = await invitationsRes.json();
        setInvitations(invitationsData.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const selectUser = (user: User) => {
    setInviteData({
      email: user.email,
      role: 'editor',
      userId: user.id
    });
    setSearchQuery(user.name);
    setShowUserSearch(false);
    setSearchResults([]);
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.email.trim()) return;

    setIsInviting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      });

      if (response.ok) {
        setInviteData({ email: '', role: 'editor', userId: null });
        setSearchQuery('');
        setShowInviteForm(false);
        setShowUserSearch(false);
        fetchTeamData();
      }
    } catch (error) {
      console.error('Error inviting user:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberUserId: number) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/team`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberUserId }),
      });

      if (response.ok) {
        fetchTeamData();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleUpdateRole = async (memberUserId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/team`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberUserId, role: newRole }),
      });

      if (response.ok) {
        fetchTeamData();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
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
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Team Collaboration</h3>
        </div>
        {userRole === 'owner' && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="bg-black text-white px-3 py-2 rounded-md hover:bg-gray-800 transition-colors inline-flex items-center text-sm"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Invite
          </button>
        )}
      </div>

      {/* Team Members */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Team Members</h4>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-gray-700">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                  {getRoleIcon(member.role)}
                  <span className="ml-1 capitalize">{member.role}</span>
                </span>
                {userRole === 'owner' && member.role !== 'owner' && (
                  <div className="flex items-center space-x-1">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Pending Invitations</h4>
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-xs text-gray-500">
                      Invited as {invitation.role} • {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(invitation.role)}`}>
                    {getRoleIcon(invitation.role)}
                    <span className="ml-1 capitalize">{invitation.role}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Expires {new Date(invitation.expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
            <form onSubmit={handleInviteUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users or Enter Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowUserSearch(true)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                    placeholder="Search by name or enter email..."
                    required
                  />
                  
                  {/* User Search Results */}
                  {showUserSearch && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => selectUser(user)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* No Results */}
                  {showUserSearch && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No users found. You can still enter an email address.
                      </div>
                    </div>
                  )}
                  
                  {/* Loading */}
                  {isSearching && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      <div className="px-4 py-3 text-sm text-gray-500 flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span>Searching...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Selected User Info */}
                {inviteData.userId && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        Selected: {searchQuery} ({inviteData.email})
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
                >
                  <option value="editor">Editor - Can create and edit scenes</option>
                  <option value="viewer">Viewer - Can only view scenes</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
