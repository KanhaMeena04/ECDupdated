import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../utils/utils";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Search,
  Send,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Filter,
  Volume2,
  VolumeX,
  Store,
  Bike,
  Users,
  X,
  PlusCircle,
} from "lucide-react";

const LiveSupportChat = () => {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'resolved'
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Platform directory search states (Users, Restaurants, Riders)
  const [searchResults, setSearchResults] = useState([]);
  const [searchingEntities, setSearchingEntities] = useState(false);
  const [searchTab, setSearchTab] = useState("all"); // 'all' | 'customer' | 'restaurant' | 'rider'

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastMsgCountRef = useRef(0);
  const searchTimeoutRef = useRef(null);
  const replyInputRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Play gentle notification sound
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (_) {}
  };

  // Fetch all conversations list from MongoDB
  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setLoadingList(true);
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_BASE_URL}/api/support/admin/conversations`, {
        params: { status: statusFilter, search: searchQuery },
        headers,
        withCredentials: true,
      });

      if (res.data?.success) {
        const prevTotal = totalUnread;
        const newTotal = res.data.totalUnread || 0;
        setTotalUnread(newTotal);

        if (silent && newTotal > prevTotal) {
          playNotificationSound();
          toast("New Support Message Received!", { icon: "💬" });
        }

        setConversations(res.data.conversations || []);
      }
    } catch (err) {
      if (!silent) {
        console.error("fetchConversations error:", err);
        toast.error("Failed to load support conversations");
      }
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  // Search platform entities debounced (Users, Restaurants, Riders)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const q = searchQuery.trim();
    if (!q || q.length < 1) {
      setSearchResults([]);
      setSearchingEntities(false);
      return;
    }

    setSearchingEntities(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const headers = getAuthHeaders();
        const res = await axios.get(`${API_BASE_URL}/api/support/admin/search-entities`, {
          params: { query: q },
          headers,
          withCredentials: true,
        });

        if (res.data?.success) {
          setSearchResults(res.data.results || []);
        }
      } catch (err) {
        console.error("search-entities error:", err);
      } finally {
        setSearchingEntities(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Fetch specific conversation messages from MongoDB
  const fetchChatMessages = async (chatId, silent = false) => {
    try {
      if (!silent) setLoadingChat(true);
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_BASE_URL}/api/support/admin/conversations/${chatId}`, {
        headers,
        withCredentials: true,
      });

      if (res.data?.success) {
        const conv = res.data.conversation;
        setSelectedChat(conv);
        const newMsgs = conv.messages || [];

        if (silent && newMsgs.length > lastMsgCountRef.current) {
          const lastM = newMsgs[newMsgs.length - 1];
          if (lastM.sender === "user") {
            playNotificationSound();
          }
        }
        lastMsgCountRef.current = newMsgs.length;
        setMessages(newMsgs);
      }
    } catch (err) {
      if (!silent) {
        console.error("fetchChatMessages error:", err);
        toast.error("Failed to load chat messages");
      }
    } finally {
      if (!silent) setLoadingChat(false);
    }
  };

  // Select an existing chat
  const handleSelectChat = (conv) => {
    setSelectedChat(conv);
    lastMsgCountRef.current = 0;
    fetchChatMessages(conv._id);
    setTimeout(() => replyInputRef.current?.focus(), 150);
  };

  // Select/Initiate chat with an entity from Search (User, Restaurant, or Rider)
  const handleSelectEntity = async (entity) => {
    try {
      if (entity.hasExistingChat && entity.conversationId) {
        await fetchChatMessages(entity.conversationId);
        setSearchQuery("");
        setSearchResults([]);
        setTimeout(() => replyInputRef.current?.focus(), 150);
        return;
      }

      toast.loading(`Opening chat with ${entity.name}...`, { id: "init-chat" });
      const headers = getAuthHeaders();
      const res = await axios.post(
        `${API_BASE_URL}/api/support/admin/conversations/initiate`,
        {
          entityType: entity.entityType,
          entityId: entity.id,
          userId: entity.userId,
          name: entity.name,
          phone: entity.phone,
          email: entity.email,
        },
        { headers, withCredentials: true }
      );

      if (res.data?.success) {
        toast.success(`Chat opened with ${entity.name}`, { id: "init-chat" });
        const conv = res.data.conversation;
        setSelectedChat(conv);
        setMessages(conv.messages || []);
        lastMsgCountRef.current = (conv.messages || []).length;
        setSearchQuery("");
        setSearchResults([]);
        fetchConversations(true);
        setTimeout(() => replyInputRef.current?.focus(), 150);
      }
    } catch (err) {
      console.error("handleSelectEntity error:", err);
      toast.error("Failed to initiate chat", { id: "init-chat" });
    }
  };

  // Initial load & search/filter dependency
  useEffect(() => {
    fetchConversations();
  }, [statusFilter, searchQuery]);

  // Auto-select conversation if navigated from notification
  useEffect(() => {
    const targetId = location.state?.conversationId;
    if (targetId && (!selectedChat || selectedChat._id !== targetId)) {
      fetchChatMessages(targetId);
    }
  }, [location.state?.conversationId]);

  // Real-time polling engine (every 3s for chat messages, every 5s for conversations list)
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      fetchConversations(true);
      if (selectedChat?._id) {
        fetchChatMessages(selectedChat._id, true);
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedChat?._id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send admin reply
  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedChat?._id || sending) return;

    const textToSend = replyText.trim();
    setReplyText("");
    setSending(true);

    try {
      const headers = getAuthHeaders();
      const res = await axios.post(
        `${API_BASE_URL}/api/support/admin/conversations/${selectedChat._id}/reply`,
        { message: textToSend },
        { headers, withCredentials: true }
      );

      if (res.data?.success) {
        // Optimistic UI update
        const updatedMsgs = [...messages, res.data.message];
        setMessages(updatedMsgs);
        lastMsgCountRef.current = updatedMsgs.length;
        fetchConversations(true);
      }
    } catch (err) {
      console.error("handleSendReply error:", err);
      toast.error(err.response?.data?.message || "Failed to send reply");
      setReplyText(textToSend); // Restore text on failure
    } finally {
      setSending(false);
      setTimeout(() => replyInputRef.current?.focus(), 50);
    }
  };

  // Toggle status (Active / Resolved)
  const handleToggleStatus = async (newStatus) => {
    if (!selectedChat?._id) return;
    try {
      const headers = getAuthHeaders();
      const res = await axios.patch(
        `${API_BASE_URL}/api/support/admin/conversations/${selectedChat._id}/status`,
        { status: newStatus },
        { headers, withCredentials: true }
      );

      if (res.data?.success) {
        toast.success(`Chat marked as ${newStatus}`);
        fetchChatMessages(selectedChat._id);
        fetchConversations(true);
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Quick reply snippet buttons
  const quickReplies = [
    "Hello! How can I help you today?",
    "We are checking this for you right now, please allow 2 minutes.",
    "Your issue has been resolved. Thank you for choosing ECDKart!",
    "Could you please share your order number or registered phone?",
  ];

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return formatTime(dateStr);
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const renderRoleBadge = (userType) => {
    const isRest = userType === "restaurant_owner" || userType === "restaurant";
    const isRider = userType === "rider" || userType === "driver";
    if (isRest) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-800">
          <Store className="w-2.5 h-2.5" /> Restaurant
        </span>
      );
    }
    if (isRider) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-sky-100 text-sky-800">
          <Bike className="w-2.5 h-2.5" /> Rider
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
        <User className="w-2.5 h-2.5" /> Customer
      </span>
    );
  };

  const filteredSearchResults = searchResults.filter((item) => {
    if (searchTab === "all") return true;
    return item.entityType === searchTab;
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#173F35] to-[#248C70] rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
            <MessageSquare className="w-3.5 h-3.5" /> Live Platform Support
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Live Support Chat Center</h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl">
            Real-time two-way support chat connecting customers, restaurant partners, and riders with the ECDKart Admin team.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition backdrop-blur-sm"
            title={soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-300" />}
          </button>

          <button
            onClick={() => {
              fetchConversations();
              if (selectedChat?._id) fetchChatMessages(selectedChat._id);
            }}
            className="bg-white text-[#173F35] px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm shadow-lg hover:bg-gray-100 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-[#248C70]" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px] max-h-[750px]">
        {/* Left Column: Conversations List & Search (4 cols) */}
        <div className="md:col-span-4 border-r border-gray-200 flex flex-col h-full bg-gray-50/50">
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-gray-200 space-y-2.5 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Users, Restaurants, Riders, Phone..."
                className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#248C70]"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Tabs / Badges */}
            {searchQuery.trim().length > 0 ? (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
                {[
                  { key: "all", label: `All (${searchResults.length})` },
                  { key: "customer", label: `Users (${searchResults.filter((r) => r.entityType === "customer").length})` },
                  { key: "restaurant", label: `Restaurants (${searchResults.filter((r) => r.entityType === "restaurant").length})` },
                  { key: "rider", label: `Riders (${searchResults.filter((r) => r.entityType === "rider").length})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSearchTab(tab.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                      searchTab === tab.key
                        ? "bg-[#248C70] text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {["all", "active", "resolved"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition ${
                      statusFilter === st
                        ? "bg-[#248C70] text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}

                {totalUnread > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {totalUnread} Unread
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Left Panel Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {/* 1. Directory Search Results View (when user types search) */}
            {searchQuery.trim().length > 0 ? (
              <div className="divide-y divide-gray-100">
                <div className="px-3.5 py-2 bg-gray-100/80 text-[11px] font-bold text-gray-600 flex items-center justify-between">
                  <span>Platform Directory Results</span>
                  <span>{filteredSearchResults.length} found</span>
                </div>

                {searchingEntities ? (
                  <div className="p-8 text-center text-xs font-semibold text-gray-500">
                    Searching platform directory...
                  </div>
                ) : filteredSearchResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    No matching users, restaurants, or riders found.
                  </div>
                ) : (
                  filteredSearchResults.map((entity) => {
                    const isRest = entity.entityType === "restaurant";
                    const isRider = entity.entityType === "rider";
                    return (
                      <div
                        key={`${entity.entityType}-${entity.id}`}
                        onClick={() => handleSelectEntity(entity)}
                        className="p-3.5 cursor-pointer transition hover:bg-emerald-50/50 flex items-start gap-3"
                      >
                        {/* Icon Avatar */}
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                            isRest
                              ? "bg-amber-600 text-white"
                              : isRider
                              ? "bg-sky-600 text-white"
                              : "bg-[#173F35] text-white"
                          }`}
                        >
                          {isRest ? (
                            <Store className="w-5 h-5" />
                          ) : isRider ? (
                            <Bike className="w-5 h-5" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-gray-900 truncate">
                              {entity.name}
                            </h4>
                            {renderRoleBadge(entity.entityType)}
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
                            {entity.phone && <span>{entity.phone}</span>}
                            {entity.subtext && <span>• {entity.subtext}</span>}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            {entity.hasExistingChat ? (
                              <span className="text-[10px] font-bold text-[#248C70] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Existing Conversation
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                <PlusCircle className="w-3 h-3" /> Click to Start Chat
                              </span>
                            )}
                            <span className="text-[10px] font-black text-[#248C70] hover:underline">
                              {entity.hasExistingChat ? "Open →" : "Start →"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Also show matching active conversations */}
                {conversations.length > 0 && (
                  <>
                    <div className="px-3.5 py-2 bg-gray-100/80 text-[11px] font-bold text-gray-600">
                      Existing Chat Threads ({conversations.length})
                    </div>
                    {conversations.map((conv) => {
                      const isSelected = selectedChat?._id === conv._id;
                      const hasUnread = conv.unreadCountAdmin > 0;
                      return (
                        <div
                          key={conv._id}
                          onClick={() => handleSelectChat(conv)}
                          className={`p-3.5 cursor-pointer transition flex items-start gap-3 ${
                            isSelected
                              ? "bg-[#248C70]/10 border-l-4 border-[#248C70]"
                              : hasUnread
                              ? "bg-amber-50/50 hover:bg-amber-50"
                              : "hover:bg-gray-100/70"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-2xl bg-[#173F35] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm relative">
                            {conv.userName ? conv.userName[0].toUpperCase() : "C"}
                            {hasUnread && (
                              <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white absolute -top-1 -right-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-gray-900 truncate">
                                {conv.userName || "Customer"}
                              </h4>
                              <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-1">
                                {formatDate(conv.lastMessageAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
                              {conv.userPhone && <span>{conv.userPhone}</span>}
                              {conv.userType && renderRoleBadge(conv.userType)}
                            </div>
                            <p className={`text-xs truncate ${hasUnread ? "font-bold text-gray-900" : "text-gray-500"}`}>
                              {conv.lastMessage || "No messages yet"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            ) : (
              /* 2. Standard Inbox View (when no search query) */
              <>
                {loadingList ? (
                  <div className="p-8 text-center text-xs font-semibold text-gray-500">
                    Loading support chats...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500 space-y-1">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-gray-700">No Conversations Found</p>
                    <p>Chats from the User, Restaurant, or Rider Apps appear here in real time.</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = selectedChat?._id === conv._id;
                    const hasUnread = conv.unreadCountAdmin > 0;
                    return (
                      <div
                        key={conv._id}
                        onClick={() => handleSelectChat(conv)}
                        className={`p-3.5 cursor-pointer transition flex items-start gap-3 ${
                          isSelected
                            ? "bg-[#248C70]/10 border-l-4 border-[#248C70]"
                            : hasUnread
                            ? "bg-amber-50/50 hover:bg-amber-50"
                            : "hover:bg-gray-100/70"
                        }`}
                      >
                        {/* User Avatar */}
                        <div className="w-10 h-10 rounded-2xl bg-[#173F35] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm relative">
                          {conv.userName ? conv.userName[0].toUpperCase() : "C"}
                          {hasUnread && (
                            <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white absolute -top-1 -right-1" />
                          )}
                        </div>

                        {/* Chat Preview Details */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-gray-900 truncate">
                              {conv.userName || "Customer"}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-1">
                              {formatDate(conv.lastMessageAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
                            {conv.userPhone && <span>{conv.userPhone}</span>}
                            {conv.userType && renderRoleBadge(conv.userType)}
                          </div>

                          <p
                            className={`text-xs truncate ${
                              hasUnread ? "font-bold text-gray-900" : "text-gray-500"
                            }`}
                          >
                            {conv.lastMessage || "No messages yet"}
                          </p>
                        </div>

                        {/* Unread Counter Badge */}
                        {hasUnread && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shrink-0 self-center">
                            {conv.unreadCountAdmin}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Chat Stream & Message Sender (8 cols) */}
        <div className="md:col-span-8 flex flex-col h-full bg-white">
          {selectedChat ? (
            <>
              {/* Chat Stream Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#248C70] text-white flex items-center justify-center font-black text-sm">
                    {selectedChat.userName ? selectedChat.userName[0].toUpperCase() : "C"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-gray-900">
                        {selectedChat.userName || "Customer"}
                      </h3>
                      {renderRoleBadge(selectedChat.userType)}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          selectedChat.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {selectedChat.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                      {selectedChat.userPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" /> {selectedChat.userPhone}
                        </span>
                      )}
                      {selectedChat.userEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" /> {selectedChat.userEmail}
                        </span>
                      )}
                      {selectedChat.orderId && (
                        <span className="flex items-center gap-1 font-mono text-[#248C70] bg-[#248C70]/10 px-1.5 py-0.5 rounded">
                          <ShoppingBag className="w-3 h-3" /> #{selectedChat.orderId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Toggle Action */}
                <div className="flex items-center gap-2">
                  {selectedChat.status === "active" ? (
                    <button
                      onClick={() => handleToggleStatus("resolved")}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Resolved
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus("active")}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      Reopen Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Messages Stream Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#F8FAFC]">
                {loadingChat ? (
                  <div className="p-8 text-center text-xs font-semibold text-gray-500">
                    Loading conversation history...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No messages in this chat yet. Type a message below to start chatting!
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isUser = m.sender === "user";
                    const isSystem = m.sender === "system";

                    if (isSystem) {
                      return (
                        <div key={m._id || idx} className="flex justify-center my-2">
                          <div className="bg-gray-200/80 text-gray-600 text-[11px] font-medium px-3 py-1 rounded-full shadow-sm">
                            {m.message}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m._id || idx}
                        className={`flex flex-col ${isUser ? "items-start" : "items-end"} space-y-1`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-sm text-xs sm:text-sm font-medium ${
                            isUser
                              ? "bg-white text-gray-900 border border-gray-200 rounded-tl-sm"
                              : "bg-[#173F35] text-white rounded-tr-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-1 text-[10px] text-gray-400">
                          <span>{isUser ? selectedChat.userName || "Customer" : "You (Support)"}</span>
                          <span>•</span>
                          <span>{formatTime(m.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Snippets */}
              <div className="px-4 py-2 border-t border-gray-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold text-gray-400 shrink-0">Quick Reply:</span>
                {quickReplies.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setReplyText(q);
                      replyInputRef.current?.focus();
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 whitespace-nowrap transition shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Type reply to ${selectedChat.userName || "customer"} (Press Enter to send)...`}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#248C70]"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="px-5 py-3 bg-[#248C70] hover:bg-[#1f7860] disabled:bg-gray-300 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            /* Empty State when no chat is clicked */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-[#248C70]" />
              </div>
              <h3 className="text-base font-black text-gray-800">Select a Support Chat</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Choose any customer, restaurant, or rider from the left panel, or search by name/phone to initiate a live chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveSupportChat;
