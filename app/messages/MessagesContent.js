'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import Header from '@/app/components/shared/Header';

export default function MessagesContent() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get('with');

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      await fetchConversations(user);
      await fetchContacts(user);
      if (withUserId) {
        await fetchUserDetails(withUserId);
        await fetchMessages(withUserId);
      }
    };
    init();
  }, [router, withUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async (currentUser) => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      
      const userId = currentUser?.id || user?.id;
      if (!userId) return;

      // Group messages by conversation partner
      const convMap = new Map();
      data.messages?.forEach(msg => {
        const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const partner = msg.sender_id === userId ? msg.receiver : msg.sender;
        
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, {
            user: partner,
            lastMessage: msg,
            unreadCount: 0,
          });
        }
        
        if (!msg.read && msg.receiver_id === userId) {
          convMap.get(partnerId).unreadCount++;
        }
      });
      
      setConversations(Array.from(convMap.values()));
    } catch (error) {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (targetUserId) => {
    try {
      // Use Supabase client to look up the user's public profile
      const supabase = createClient();
      const { data } = await supabase
        .from('users')
        .select('id, email, full_name, role, business_name')
        .eq('id', targetUserId)
        .single();
      if (data) setSelectedUser(data);
    } catch (_) {
      // silently handle
    }
  };

  const fetchContacts = async (currentUser) => {
    try {
      // Load other users for the contacts panel via Supabase client
      const supabase = createClient();
      const { data } = await supabase
        .from('users')
        .select('id, email, full_name, role, business_name')
        .neq('id', currentUser.id)
        .order('full_name');
      setContacts(data || []);
    } catch (_) {
      // silently handle
    }
  };

  const fetchMessages = async (withUserId) => {
    try {
      const res = await fetch(`/api/messages?with=${withUserId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      // silently handle
    }
  };

  const uploadAttachment = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'attachments');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return res.json();
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    const allowed = files.filter(file => /^(image\/|application\/pdf)/.test(file.type));

    if (allowed.length === 0) return;

    const uploads = await Promise.all(allowed.map(async (file) => {
      const data = await uploadAttachment(file);
      return {
        name: file.name,
        type: file.type,
        url: data.url,
        path: data.path,
      };
    }));

    setAttachments(prev => [...prev, ...uploads]);
    event.target.value = '';
  };

  const removeAttachment = (path) => {
    setAttachments(prev => prev.filter(item => item.path !== path));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || !selectedUser) return;

    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: selectedUser.id,
          content: newMessage.trim(),
          attachments: attachments.map(file => ({
            name: file.name,
            type: file.type,
            url: file.url,
            path: file.path,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data.message]);
        setNewMessage('');
        setAttachments([]);
        fetchConversations();
      }
    } catch (error) {
      // silently handle
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedUser(conv.user);
    fetchMessages(conv.user.id);
    router.push(`/messages?with=${conv.user.id}`);
  };

  const handleStartConversation = (contact) => {
    setSelectedUser(contact);
    fetchMessages(contact.id);
    router.push(`/messages?with=${contact.id}`);
  };

  if (!user) return null;

  const showConversationList = !selectedUser;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          style={{ height: 'min(calc(100vh - 130px), 700px)' }}>
          <div className="h-full flex flex-col md:grid md:grid-cols-3">
            {/* Conversations List — hidden on mobile when a conversation is open */}
            <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} flex-col border-r border-gray-200 overflow-y-auto bg-gray-50 md:block`}>
              <div className="p-5 border-b border-gray-200 bg-white sticky top-0">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <p className="text-xs text-gray-600 mt-1">Recent conversations</p>
              </div>
              
              {loading ? (
                <div className="p-6 text-center text-gray-600">
                  <div className="animate-pulse">Loading...</div>
                </div>
              ) : (
                <>
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-600">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-gray-700">No conversations yet</p>
                    </div>
                  ) : (
                    <div>
                      {conversations.map((conv) => (
                        <button
                          key={conv.user.id}
                          onClick={() => handleSelectConversation(conv)}
                          className={`w-full p-4 border-b border-gray-200 text-left transition ${
                            selectedUser?.id === conv.user.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                                {conv.user.full_name?.charAt(0).toUpperCase() || conv.user.email?.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-3 flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                  {conv.user.full_name || conv.user.email}
                                </p>
                                <p className="text-xs text-gray-600 truncate">
                                  {conv.lastMessage.content || 'No messages'}
                                </p>
                              </div>
                            </div>
                            {conv.unreadCount > 0 && (
                              <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-semibold">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {contacts.length > 0 && (
                    <div className="pt-2 pb-4 border-t border-gray-200">
                      <div className="px-4 py-3">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Start conversation</h3>
                      </div>
                      {contacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => handleStartConversation(contact)}
                          className={`w-full p-4 border-b border-gray-200 text-left text-sm transition hover:bg-white ${
                            selectedUser?.id === contact.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-semibold shrink-0">
                              {contact.full_name?.charAt(0).toUpperCase() || contact.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {contact.business_name || contact.full_name || contact.email}
                              </p>
                              {contact.city && <p className="text-xs text-gray-600 truncate">{contact.city}</p>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Messages Area — full screen on mobile when conversation selected */}
            <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} md:col-span-2 flex-col bg-white`}>
              {selectedUser ? (
                <>
                  {/* Chat Header — includes back button for mobile */}
                  <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                      {/* Back button — mobile only */}
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="md:hidden p-2 -ml-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
                        aria-label="Back to conversations"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                        {selectedUser.full_name?.charAt(0).toUpperCase() || selectedUser.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedUser.full_name || selectedUser.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{selectedUser.role?.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                            isOwn ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-900 border border-gray-200'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap wrap-break-words">{msg.content}</p>
                            {msg.attachments?.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {msg.attachments.map((file) => (
                                  <div key={file.path || file.url} className={`rounded-lg p-2 ${isOwn ? 'bg-blue-700' : 'bg-gray-100'}`}>
                                    {file.type?.startsWith('image/') ? (
                                      <img src={file.url} alt={file.name} className="max-w-full rounded-md" />
                                    ) : (
                                      <a href={file.url} target="_blank" rel="noreferrer" className={`text-sm underline ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}>
                                        📎 {file.name || 'Download'}
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className={`text-xs mt-2 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="p-5 border-t border-gray-200 bg-white space-y-4">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm transition"
                        >
                          {sending ? '...' : '↑'}
                        </button>
                      </div>

                      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-600 cursor-pointer hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Attach</span>
                        {attachments.length > 0 && <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{attachments.length}</span>}
                      </label>

                      {attachments.length > 0 && (
                        <div className="space-y-2">
                          {attachments.map((file) => (
                            <div key={file.path} className="flex items-center justify-between gap-3 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs shrink-0">
                                  {file.type?.startsWith('image/') ? '🖼' : '📄'}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                                  <p className="truncate text-xs text-gray-500">{file.type}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(file.path)}
                                className="text-gray-400 hover:text-red-600 transition"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No conversation selected</h3>
                    <p className="text-sm text-gray-600 max-w-xs">Choose an existing conversation or start a new one from the list on the left</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
