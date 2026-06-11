'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ── Knowledge base ────────────────────────────────────────────────────────
const KB = {
  contractor: [
    {
      patterns: ['how do i create', 'new requisition', 'submit request', 'place order', 'make a request'],
      answer: `To create a new material requisition:\n1. Click **New Requisition** on your dashboard or go to **My Requisitions → Create**.\n2. Select a hardware shop from the dropdown.\n3. Browse available products and click **+** to add items to your cart.\n4. Adjust quantities, add any notes, then click **Submit Requisition**.\n\nIf the total exceeds K5,000, your request will require admin approval before being assigned to a shop.`,
    },
    {
      patterns: ['quotation', 'quote', 'quoted', 'price quote'],
      answer: `After your requisition is assigned to a shop, the shop will review your items and send back a **quotation** with their prices.\n\nYou can view all received quotations under **Quoted Requests** in the navigation. Each quotation shows a full itemised breakdown including GST (10%) and can be downloaded as a PDF.`,
    },
    {
      patterns: ['cancel', 'withdraw', 'remove request'],
      answer: `You can cancel a requisition only while its status is **Pending**.\n\nGo to **My Requisitions**, open the requisition, and click **Cancel Requisition**. Once it has been approved or assigned, it can no longer be cancelled — contact your admin or the assigned shop instead.`,
    },
    {
      patterns: ['status', 'what does', 'pending', 'approved', 'fulfilled', 'rejected'],
      answer: `Requisition statuses:\n• **Pending** — Submitted, awaiting review\n• **Approved** — Admin approved, being assigned to a shop\n• **Quoted** — Shop has sent a price quotation\n• **Fulfilled** — Shop has completed and delivered your order\n• **Rejected** — Admin rejected the request\n• **Cancelled** — You cancelled the request`,
    },
    {
      patterns: ['approval', 'why need approval', 'k5000', '5000', 'threshold'],
      answer: `Requisitions totalling **more than K5,000** require admin approval before they are assigned to a shop.\n\nThis is a platform policy to ensure oversight on large purchases. Once an admin approves it, the requisition proceeds normally. You will receive a notification when it is approved or rejected.`,
    },
    {
      patterns: ['favourite', 'save product', 'saved', 'bookmark'],
      answer: `You can save any product to your **Favourites** for quick access later.\n\nOn the **Browse Products** page, click the ☆ button on any product card to save it. Access all saved products via **Favourites** in the navigation menu.`,
    },
    {
      patterns: ['find shop', 'locate shop', 'hardware shop', 'nearby shop'],
      answer: `Go to **Find Shops** in the navigation to browse all verified hardware shops on the platform.\n\nYou can filter by city. Each shop listing shows their location, average rating, and review count. Click **View Products** to see what a shop has in stock, or the message icon to send them a direct message.`,
    },
    {
      patterns: ['message', 'contact shop', 'chat with shop', 'send message'],
      answer: `You can message any hardware shop directly through the platform.\n\nGo to **Messages** in the navigation, or click the message icon on a shop profile or requisition detail page. Messages are real-time and tied to your account.`,
    },
    {
      patterns: ['invoice', 'payment', 'bill'],
      answer: `After a requisition is fulfilled, the shop may issue an **invoice**.\n\nYou can view all your invoices and mark them as paid once payment is made. Invoices include full itemisation with GST breakdown.`,
    },
    {
      patterns: ['review', 'rate', 'feedback', 'rating'],
      answer: `After a requisition is **Fulfilled**, you can leave a review for the hardware shop.\n\nOpen the completed requisition and click **Leave a Review**. Rate 1–5 stars and optionally add a comment. Reviews help other contractors choose reliable shops.`,
    },
    {
      patterns: ['profile', 'account', 'change name', 'update details', 'phone number'],
      answer: `Update your profile by clicking your avatar in the top-right corner and selecting **Profile Settings**.\n\nYou can update your full name, phone number, city, and address. Your email address cannot be changed after registration.`,
    },
    {
      patterns: ['dispute', 'complaint', 'problem with order', 'wrong items'],
      answer: `If you have an issue with a completed order, you can raise a **dispute**.\n\nOpen the requisition in question and look for the dispute option. Describe the issue clearly. An admin will investigate and respond. You can track dispute status under your account.`,
    },
    {
      patterns: ['pdf', 'download', 'print'],
      answer: `You can download a **PDF** of any requisition from the requisition detail page using the Download PDF button.\n\nFor quotations received from shops, go to **Quoted Requests** and click **Download PDF** on the relevant quotation. All PDFs include the MRS header, itemised breakdown, and signature blocks.`,
    },
    {
      patterns: ['template', 'reuse', 'repeat order', 'save template'],
      answer: `Frequently ordered materials? Save a requisition as a **template** to reuse it later.\n\nWhen viewing your past requisitions, you can save the items as a named template. Next time, start a new requisition and load the template to pre-fill the items list.`,
    },
  ],

  hardware_shop: [
    {
      patterns: ['how to add product', 'add item', 'list product', 'create product', 'new product'],
      answer: `To add a product to your inventory:\n1. Go to **Inventory** in the navigation.\n2. Click **Add Product**.\n3. Fill in the product name, description, category, unit, price, and stock quantity.\n4. Set a **Low Stock Threshold** — you'll get an alert when stock falls below this.\n5. Upload up to 5 product images.\n6. Click **Create Product**.\n\nYour product will immediately be visible to contractors browsing products.`,
    },
    {
      patterns: ['send quotation', 'quote', 'how to quote', 'respond to request', 'submit quotation'],
      answer: `When a requisition is assigned to your shop:\n1. Go to **Requisitions** in the navigation.\n2. Open the requisition and expand it.\n3. Review the contractor's requested items.\n4. Click **Send Quotation** and enter your prices for each item.\n5. GST (10%) is calculated automatically per PNG IRC requirements.\n6. Add notes or a validity date, then click **Send Quotation**.\n\nThe contractor will be notified and can download a PDF of your quotation.`,
    },
    {
      patterns: ['fulfil', 'fulfill', 'complete order', 'mark fulfilled', 'deliver'],
      answer: `To mark a requisition as fulfilled:\n1. Go to **Orders** or **Requisitions**.\n2. Open the assigned requisition.\n3. Click **Mark as Fulfilled** and add fulfilment notes if needed.\n\nThe contractor will be notified that their order is complete and can then leave a review.`,
    },
    {
      patterns: ['inventory', 'stock', 'update stock', 'restock', 'quantity'],
      answer: `Manage your stock levels on the **Inventory** page:\n\n• Edit any product and update the **Stock** field directly.\n• In the inventory table, you can inline-edit stock numbers.\n• Set a **Low Stock Threshold** on each product — you'll get an automatic alert when stock drops below that level.\n• Filter by In Stock, Low Stock, or Out of Stock to quickly identify what needs restocking.`,
    },
    {
      patterns: ['low stock', 'stock alert', 'restock alert', 'out of stock'],
      answer: `When a product's stock falls below its **Low Stock Threshold**, you'll receive:\n• A notification in the bell icon (top navigation)\n• An alert banner on your Shop Dashboard\n\nGo to **Inventory** and filter by **Low Stock** to see all items that need restocking. Edit any product to update the threshold or add new stock.`,
    },
    {
      patterns: ['analytics', 'revenue', 'sales report', 'performance', 'earnings'],
      answer: `Your **Shop Analytics** page shows:\n• Total products and low stock count\n• Pending and fulfilled requisitions\n• Total revenue from fulfilled orders\n• Average customer rating\n• Monthly revenue chart for the last 6 months\n• Recent orders table\n\nAccess it via **Analytics** in the navigation.`,
    },
    {
      patterns: ['verified', 'verification', 'account approved', 'account status'],
      answer: `Hardware Shop accounts require **admin verification** before contractors can send you requests.\n\nIf your account is not yet verified, contact the platform administrator. Once verified, your shop will appear in the Shops directory and contractors can assign requisitions to you.`,
    },
    {
      patterns: ['invoice', 'issue invoice', 'billing', 'payment'],
      answer: `After fulfilling a requisition, you can issue an **invoice** to the contractor.\n\nGo to the fulfilled requisition and click **Issue Invoice**. Enter the itemised amounts — GST is automatically calculated. The contractor will be notified and can mark the invoice as paid.`,
    },
    {
      patterns: ['message', 'contact contractor', 'chat'],
      answer: `You can message any contractor directly through the platform.\n\nGo to **Messages** in the navigation, or click the message icon on any requisition detail page. You can discuss requirements, delivery details, or pricing before submitting a quotation.`,
    },
    {
      patterns: ['delete product', 'remove product', 'deactivate product'],
      answer: `To remove a product:\n• Go to **Inventory**, find the product, and click **Delete**.\n• This permanently removes it from your inventory and from contractor searches.\n\nAlternatively, you can edit a product and set it to **Inactive** — this hides it from contractors without deleting it, useful for seasonal items.`,
    },
    {
      patterns: ['profile', 'business name', 'update shop', 'shop details'],
      answer: `Update your shop profile by clicking your avatar in the top-right and selecting **Profile Settings**.\n\nYou can update your business name, business registration number, phone, city, and address. Keeping your location up to date helps contractors find your shop.`,
    },
    {
      patterns: ['review', 'rating', 'feedback', 'customer rating'],
      answer: `Contractors can leave a **review and rating** (1–5 stars) after you fulfil their requisition.\n\nYour average rating is displayed on your shop profile and in the Shops directory. High ratings improve your visibility and attract more contractors. Reviews cannot be edited or removed once submitted.`,
    },
    {
      patterns: ['dispute', 'complaint', 'issue raised'],
      answer: `If a contractor raises a dispute about an order:\n• You'll receive a notification.\n• An admin will investigate and may contact both parties.\n• Provide any evidence or notes requested by the admin.\n\nDisputes are managed by platform administrators to ensure fairness.`,
    },
  ],

  common: [
    {
      patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings', 'start'],
      answer: `Hello! 👋 I'm the **MRS Assistant** — here to help you use the Material Requisition System.\n\nAsk me anything about creating requests, managing inventory, quotations, invoices, or how to navigate the platform.`,
    },
    {
      patterns: ['help', 'what can you do', 'what do you know', 'guide', 'support'],
      answer: `I can help you with:\n\n📋 **Requisitions** — creating, tracking, cancelling\n💬 **Quotations** — how to send or receive them\n📦 **Products & Inventory** — adding, managing, restocking\n📊 **Analytics** — understanding your dashboard\n👤 **Account** — profile, settings, verification\n💰 **Invoices & Payments** — issuing and tracking\n⭐ **Reviews** — leaving and receiving feedback\n\nJust type your question and I'll do my best to help!`,
    },
    {
      patterns: ['gst', 'tax', '10%', 'goods and services', 'irc'],
      answer: `All quotations on this platform include **GST at 10%** as required by the Papua New Guinea Internal Revenue Commission (PNG IRC).\n\nWhen a shop sends a quotation, GST is automatically calculated per line item and shown separately. The total displayed is always the GST-inclusive amount (total incl. GST).`,
    },
    {
      patterns: ['kina', 'k5000', 'currency', 'pgk'],
      answer: `The platform operates in **Papua New Guinea Kina (K / PGK)**.\n\nAll prices, totals, quotations, and invoices are denominated in Kina. The approval threshold for requisitions is **K5,000** — requests above this amount require admin approval.`,
    },
    {
      patterns: ['notification', 'alert', 'bell', 'updates'],
      answer: `Notifications appear in the **bell icon** at the top of every page.\n\nYou'll be notified when:\n• Your requisition status changes\n• A shop sends you a quotation\n• You receive a new message\n• A review is posted\n• A dispute is updated\n• Stock falls below threshold (shops)\n\nClick any notification to go directly to the relevant page.`,
    },
    {
      patterns: ['password', 'forgot password', 'reset password', 'change password'],
      answer: `To change your password:\n1. Go to **Profile Settings** (click your avatar → Profile Settings).\n2. Contact the administrator if you cannot access your account.\n\nFor a forgotten password, use the Supabase-powered reset link — contact your system administrator if you need assistance.`,
    },
    {
      patterns: ['logout', 'sign out', 'log out'],
      answer: `To sign out:\n1. Click your **avatar/initials** in the top-right corner.\n2. Click **Logout**.\n\nYou'll be redirected to the login page. Your session is securely ended.`,
    },
    {
      patterns: ['contact', 'admin', 'administrator', 'support team', 'who to contact'],
      answer: `For issues that require admin assistance (account verification, disputes, access problems), contact your **system administrator** directly.\n\nYou can also use the **Messages** feature to communicate with platform participants, or raise a **Dispute** if you have an issue with a specific transaction.`,
    },
    {
      patterns: ['thank', 'thanks', 'cheers', 'appreciated'],
      answer: `You're welcome! 😊 Happy to help. If you have any other questions about the Material Requisition System, just ask!`,
    },
    {
      patterns: ['bye', 'goodbye', 'see you', 'close'],
      answer: `Goodbye! 👋 Feel free to come back anytime you need help with the platform.`,
    },
  ],
};

function getAnswer(question, role) {
  const q = question.toLowerCase().trim();
  const sources = [
    ...(role === 'contractor' ? KB.contractor : role === 'hardware_shop' ? KB.hardware_shop : []),
    ...KB.common,
  ];
  for (const entry of sources) {
    if (entry.patterns.some((p) => q.includes(p))) {
      return entry.answer;
    }
  }
  return `I'm not sure about that specific question. Here are some things I can help with:\n\n${
    role === 'hardware_shop'
      ? '• How to add products or update inventory\n• Sending quotations to contractors\n• Fulfilling orders\n• Viewing your analytics\n• Managing your shop profile'
      : '• Creating a new requisition\n• Understanding requisition statuses\n• Finding hardware shops\n• Viewing quotations\n• Downloading PDFs'
  }\n\nTry rephrasing your question, or ask about any of the topics above.`;
}

function renderMessage(text) {
  // Bold **text**, line breaks, bullet points
  return text
    .split('\n')
    .map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className={`leading-relaxed ${line.startsWith('•') ? 'ml-2' : ''} ${i > 0 ? 'mt-1' : ''}`}>
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} className="font-semibold text-gray-900">{part}</strong>
              : <span key={j}>{part}</span>
          )}
        </p>
      );
    });
}

const SUGGESTED = {
  contractor: [
    'How do I create a requisition?',
    'What are the status meanings?',
    'How do I view my quotations?',
    'What is the K5,000 approval rule?',
  ],
  hardware_shop: [
    'How do I send a quotation?',
    'How do I add a new product?',
    'How do I fulfil an order?',
    'How do I view my analytics?',
  ],
};

export default function Chatbot({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const role = user?.app_metadata?.role || user?.user_metadata?.role;

  // Only show for contractor and hardware_shop roles
  if (role === 'admin' || !role) return null;

  const addBotMessage = useCallback((text, delay = 600) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), from: 'bot', text },
      ]);
    }, delay);
  }, []);

  const openChat = () => {
    setIsOpen(true);
    if (!hasGreeted) {
      setHasGreeted(true);
      const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
      const greeting = role === 'hardware_shop'
        ? `Hi ${name}! 👋 I'm your **MRS Assistant**.\n\nI can help you manage your shop — adding products, sending quotations, fulfilling orders, and more.\n\nWhat do you need help with today?`
        : `Hi ${name}! 👋 I'm your **MRS Assistant**.\n\nI can help you create requisitions, track your orders, find shops, understand quotations, and more.\n\nWhat would you like to know?`;
      setTimeout(() => addBotMessage(greeting, 300), 100);
    }
  };

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const handleSend = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setMessages((prev) => [...prev, { id: Date.now(), from: 'user', text: q }]);
    setInput('');
    const answer = getAnswer(q, role);
    addBotMessage(answer, Math.min(400 + q.length * 5, 1200));
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = SUGGESTED[role] || [];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => (isOpen ? setIsOpen(false) : openChat())}
        aria-label="Open assistant"
        className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300"
        style={{ background: 'linear-gradient(135deg, #1e40af, #1d4ed8)', marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-50 animate-ping" />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className="chatbot-window fixed bottom-24 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{
            width: 'min(384px, calc(100vw - 2rem))',
            height: 'min(520px, calc(100vh - 120px))',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #1e40af, #1d4ed8)' }}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.41 0-2.75-.36-3.92-1.01l-.28-.17-2.91.76.76-2.91-.17-.28C4.36 14.75 4 13.41 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">MRS Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-blue-100">Online · {role === 'hardware_shop' ? 'Shop Help' : 'Contractor Help'}</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="ml-auto text-blue-200 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
            {messages.length === 0 && !isTyping && (
              <div className="text-center py-8 animate-fade-in">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1e40af, #1d4ed8)' }}>
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">Loading assistant…</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.from === 'user' ? 'justify-end chatbot-message-user' : 'justify-start chatbot-message-bot'}`}
              >
                {msg.from === 'bot' && (
                  <div className="w-7 h-7 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #1e40af, #1d4ed8)' }}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.from === 'user'
                      ? 'bg-blue-700 text-white rounded-br-sm'
                      : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.from === 'bot' ? renderMessage(msg.text) : msg.text}
                </div>
                {msg.from === 'user' && (
                  <div className="w-7 h-7 rounded-full shrink-0 mt-0.5 bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                    {(user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-end chatbot-message-bot">
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1e40af, #1d4ed8)' }}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  </svg>
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                  <div className="chatbot-typing flex items-center gap-0.5">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && suggestions.length > 0 && (
            <div className="px-4 py-2 bg-white border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-xs px-2.5 py-1.5 rounded-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 bg-white border-t border-gray-100">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type your question…"
                rows={1}
                className="flex-1 resize-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
                style={{ maxHeight: '96px', overflowY: 'auto' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #1e40af, #1d4ed8)' }}
                aria-label="Send"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-gray-300 mt-2">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}
