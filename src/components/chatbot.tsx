"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, ArrowRight, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// WhatsApp number for State-ImmoCom
const WHATSAPP_NUMBER = "2250103081065";

// Chat message type
interface ChatMessage {
  id: string;
  type: "bot" | "user";
  text: string;
  options?: ChatOption[];
  timestamp: Date;
}

interface ChatOption {
  label: string;
  value: string;
  icon?: string;
}

// Conversation flow steps
type ConversationStep =
  | "welcome"
  | "ask_need"
  | "buy_flow"
  | "rent_flow"
  | "invest_flow"
  | "short_stay_flow"
  | "budget"
  | "location"
  | "schedule_visit"
  | "whatsapp_redirect"
  | "contact_form"
  | "ended";

// Generate unique IDs
const uid = () => Math.random().toString(36).substring(2, 9);

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentStep, setCurrentStep] = useState<ConversationStep>("welcome");
  const [userData, setUserData] = useState({
    need: "",
    propertyType: "",
    budget: "",
    location: "",
    name: "",
  });
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentStep]);

  // Add a bot message
  const addBotMessage = useCallback((text: string, options?: ChatOption[]) => {
    const msg: ChatMessage = {
      id: uid(),
      type: "bot",
      text,
      options,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Add a user message
  const addUserMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: uid(),
      type: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Start the conversation
  const startConversation = useCallback(() => {
    if (hasGreeted) return;
    setHasGreeted(true);
    setCurrentStep("welcome");
    addBotMessage(
      "Welcome to State-ImmoCom! I'm your virtual assistant. I can help you find the perfect property in Accra. What are you looking for today?",
      [
        { label: "Buy a Property", value: "buy", icon: "🏠" },
        { label: "Rent a Property", value: "rent", icon: "🔑" },
        { label: "Invest in Real Estate", value: "invest", icon: "📈" },
        { label: "Short-Stay / Hotels", value: "short_stay", icon: "🏨" },
      ]
    );
  }, [hasGreeted, addBotMessage]);

  // Handle user selection
  const handleOptionClick = useCallback(
    (option: ChatOption) => {
      addUserMessage(option.label);

      switch (option.value) {
        case "buy":
          setUserData((prev) => ({ ...prev, need: "buy" }));
          setCurrentStep("buy_flow");
          addBotMessage(
            "Great choice! Buying a property is a wonderful investment. What type of property are you interested in purchasing?",
            [
              { label: "House / Villa", value: "house", icon: "🏡" },
              { label: "Apartment / Flat", value: "apartment", icon: "🏢" },
              { label: "Land / Plot", value: "land", icon: "🌍" },
              { label: "Commercial Property", value: "commercial", icon: "🏬" },
            ]
          );
          break;

        case "rent":
          setUserData((prev) => ({ ...prev, need: "rent" }));
          setCurrentStep("rent_flow");
          addBotMessage(
            "Looking to rent? We have excellent rental options across Accra! What type of rental property do you need?",
            [
              { label: "House / Villa", value: "house", icon: "🏡" },
              { label: "Apartment / Flat", value: "apartment", icon: "🏢" },
              { label: "Single Room / Chamber", value: "room", icon: "🛏️" },
              { label: "Office Space", value: "office", icon: "💼" },
            ]
          );
          break;

        case "invest":
          setUserData((prev) => ({ ...prev, need: "invest" }));
          setCurrentStep("invest_flow");
          addBotMessage(
            "Smart move! Real estate investment in Accra offers excellent returns. What kind of investment interests you?",
            [
              { label: "Residential Development", value: "residential_dev", icon: "🏗️" },
              { label: "Commercial Development", value: "commercial_dev", icon: "🏢" },
              { label: "Land Banking", value: "land_banking", icon: "🏦" },
              { label: "Rental Income", value: "rental_income", icon: "💰" },
            ]
          );
          break;

        case "short_stay":
          setUserData((prev) => ({ ...prev, need: "short_stay" }));
          setCurrentStep("short_stay_flow");
          addBotMessage(
            "Need a short-stay? We have comfortable options for your temporary accommodation in Accra! What type of short-stay are you looking for?",
            [
              { label: "Hotel Room", value: "hotel", icon: "🏨" },
              { label: "Hostel", value: "hostel", icon: "🛏️" },
              { label: "Serviced Apartment", value: "serviced", icon: "🛋️" },
              { label: "Guest House", value: "guesthouse", icon: "🏠" },
            ]
          );
          break;

        // Property type selections
        case "house":
        case "apartment":
        case "land":
        case "commercial":
        case "room":
        case "office":
        case "residential_dev":
        case "commercial_dev":
        case "land_banking":
        case "rental_income":
        case "hotel":
        case "hostel":
        case "serviced":
        case "guesthouse":
          setUserData((prev) => ({ ...prev, propertyType: option.label }));
          setCurrentStep("budget");
          addBotMessage(
            `Excellent! ${option.label} is a great choice. What's your budget range?`,
            [
              { label: "Under GHS 1,000/month", value: "budget_low" },
              { label: "GHS 1,000 - 5,000/month", value: "budget_mid" },
              { label: "GHS 5,000 - 15,000/month", value: "budget_high" },
              { label: "Above GHS 15,000/month", value: "budget_premium" },
            ]
          );
          break;

        // Budget selections
        case "budget_low":
        case "budget_mid":
        case "budget_high":
        case "budget_premium":
          setUserData((prev) => ({ ...prev, budget: option.label }));
          setCurrentStep("location");
          addBotMessage(
            "Got it! Which area in Accra are you most interested in?",
            [
              { label: "East Legon", value: "east_legon" },
              { label: "Cantonments", value: "cantonments" },
              { label: "Osu", value: "osu" },
              { label: "Airport Area", value: "airport" },
              { label: "Haatso / Madina", value: "haatso" },
              { label: "Other Areas", value: "other" },
            ]
          );
          break;

        // Location selections
        case "east_legon":
        case "cantonments":
        case "osu":
        case "airport":
        case "haatso":
        case "other":
          setUserData((prev) => ({ ...prev, location: option.label }));
          setCurrentStep("schedule_visit");
          addBotMessage(
            "Perfect! I have all the details I need. Would you like to:",
            [
              { label: "Chat on WhatsApp Now", value: "go_whatsapp", icon: "💬" },
              { label: "Schedule a Visit", value: "schedule", icon: "📅" },
              { label: "Send via Contact Form", value: "contact_form", icon: "✉️" },
            ]
          );
          break;

        case "go_whatsapp":
        case "schedule":
          setCurrentStep("whatsapp_redirect");
          generateWhatsAppRedirect();
          break;

        case "contact_form":
          setCurrentStep("contact_form");
          addBotMessage(
            "You can send us your details through our contact form. Your information will be sent directly to our team, and we'll get back to you promptly!",
            [
              { label: "Go to Contact Page", value: "goto_contact", icon: "✉️" },
              { label: "Chat on WhatsApp Instead", value: "go_whatsapp", icon: "💬" },
            ]
          );
          break;

        case "goto_contact":
          window.open("/contact", "_blank");
          setCurrentStep("ended");
          addBotMessage(
            "I've opened the contact page for you. Is there anything else I can help with?",
            [
              { label: "Start Over", value: "restart" },
              { label: "No, I'm Good", value: "close" },
            ]
          );
          break;

        case "restart":
          setHasGreeted(false);
          setUserData({ need: "", propertyType: "", budget: "", location: "", name: "" });
          setMessages([]);
          startConversation();
          break;

        case "close":
          setCurrentStep("ended");
          addBotMessage(
            "Thank you for visiting State-ImmoCom! Feel free to come back anytime. Have a great day!"
          );
          break;
      }
    },
    [addBotMessage, addUserMessage, startConversation]
  );

  // Generate WhatsApp redirect link
  const generateWhatsAppRedirect = useCallback(() => {
    const needLabels: Record<string, string> = {
      buy: "Buying",
      rent: "Renting",
      invest: "Investing in",
      short_stay: "Short-Stay",
    };

    const text = `Hello State-ImmoCom! 👋

I'm interested in *${needLabels[userData.need] || userData.need}* a property.

📌 *Type:* ${userData.propertyType || "Not specified"}
💰 *Budget:* ${userData.budget || "Not specified"}
📍 *Location:* ${userData.location || "Not specified"}

I'd like to get more information and schedule a visit. Thank you!`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;

    addBotMessage(
      "I'm redirecting you to WhatsApp where our team will assist you personally with all the details you've provided. Click the button below to continue!",
      [
        { label: "Open WhatsApp Now", value: "__whatsapp_link__", icon: "💬" },
      ]
    );

    // Store the WhatsApp URL for the button click
    (window as any).__whatsapp_url__ = whatsappUrl;
  }, [userData, addBotMessage]);

  // Handle option click with special WhatsApp link handling
  const onOptionClick = useCallback(
    (option: ChatOption) => {
      if (option.value === "__whatsapp_link__") {
        const url = (window as any).__whatsapp_url__;
        if (url) {
          window.open(url, "_blank");
        }
        setCurrentStep("ended");
        setTimeout(() => {
          addBotMessage(
            "Your WhatsApp chat has been opened! Is there anything else I can help with?",
            [
              { label: "Start Over", value: "restart" },
              { label: "No, I'm Good", value: "close" },
            ]
          );
        }, 500);
        return;
      }
      handleOptionClick(option);
    },
    [handleOptionClick, addBotMessage]
  );

  // Handle free text input
  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;

    addUserMessage(text);
    setInputValue("");

    // Simple AI-like response for free text
    setTimeout(() => {
      const lowerText = text.toLowerCase();

      if (lowerText.includes("buy") || lowerText.includes("purchase") || lowerText.includes("own")) {
        handleOptionClick({ label: text, value: "buy" });
      } else if (lowerText.includes("rent") || lowerText.includes("lease")) {
        handleOptionClick({ label: text, value: "rent" });
      } else if (lowerText.includes("invest")) {
        handleOptionClick({ label: text, value: "invest" });
      } else if (lowerText.includes("short") || lowerText.includes("hotel") || lowerText.includes("hostel") || lowerText.includes("stay")) {
        handleOptionClick({ label: text, value: "short_stay" });
      } else if (lowerText.includes("price") || lowerText.includes("cost") || lowerText.includes("how much")) {
        addBotMessage(
          "Our properties range from affordable to premium. To give you the most accurate pricing, could you tell me what you're looking for?",
          [
            { label: "Buy a Property", value: "buy" },
            { label: "Rent a Property", value: "rent" },
            { label: "Short-Stay", value: "short_stay" },
          ]
        );
      } else if (lowerText.includes("location") || lowerText.includes("area") || lowerText.includes("where")) {
        addBotMessage(
          "We have properties across Accra! Popular areas include East Legon, Cantonments, Osu, Airport Area, and more. What type of property are you interested in?",
          [
            { label: "Buy a Property", value: "buy" },
            { label: "Rent a Property", value: "rent" },
            { label: "Invest", value: "invest" },
          ]
        );
      } else if (lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("hey")) {
        addBotMessage(
          "Hello! Welcome to State-ImmoCom! How can I assist you today?",
          [
            { label: "Buy a Property", value: "buy" },
            { label: "Rent a Property", value: "rent" },
            { label: "Invest in Real Estate", value: "invest" },
            { label: "Short-Stay / Hotels", value: "short_stay" },
          ]
        );
      } else if (lowerText.includes("whatsapp") || lowerText.includes("chat") || lowerText.includes("agent")) {
        addBotMessage(
          "You can chat directly with our team on WhatsApp! Let me prepare a summary for you.",
          [
            { label: "Chat on WhatsApp", value: "go_whatsapp", icon: "💬" },
          ]
        );
      } else {
        addBotMessage(
          "Thanks for your message! To better assist you, could you tell me what you're looking for?",
          [
            { label: "Buy a Property", value: "buy" },
            { label: "Rent a Property", value: "rent" },
            { label: "Invest in Real Estate", value: "invest" },
            { label: "Short-Stay / Hotels", value: "short_stay" },
            { label: "Chat on WhatsApp", value: "go_whatsapp", icon: "💬" },
          ]
        );
      }
    }, 400);
  }, [inputValue, addUserMessage, addBotMessage, handleOptionClick]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            if (!hasGreeted) {
              setTimeout(startConversation, 300);
            }
          }}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl group"
          style={{
            background: "linear-gradient(135deg, #2E8B57, #3CB371)",
          }}
          aria-label="Open chat assistant"
        >
          <MessageCircle className="h-6 w-6 text-white group-hover:animate-pulse" />
          {/* Pulse ring */}
          <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: "#2E8B57" }} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-gray-200"
          style={{
            width: "380px",
            maxWidth: "calc(100vw - 48px)",
            height: "560px",
            maxHeight: "calc(100vh - 100px)",
            animation: "slideInUp 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              background: "linear-gradient(135deg, #2E8B57, #3CB371)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">State-ImmoCom</h3>
                <p className="text-[11px] text-white/80">Virtual Assistant • Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2", msg.type === "user" ? "justify-end" : "justify-start")}>
                {msg.type === "bot" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#2E8B57" }}>
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[280px] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.type === "bot"
                      ? "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm"
                      : "text-white rounded-tr-sm"
                  )}
                  style={msg.type === "user" ? { backgroundColor: "#2E8B57" } : undefined}
                >
                  <p>{msg.text}</p>
                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => onOptionClick(opt)}
                          className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:shadow-md hover:scale-[1.02] active:scale-95"
                          style={{
                            borderColor: "#2E8B57",
                            color: "#2E8B57",
                            backgroundColor: "rgba(46, 139, 87, 0.05)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#2E8B57";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(46, 139, 87, 0.05)";
                            e.currentTarget.style.color = "#2E8B57";
                          }}
                        >
                          {opt.icon && <span>{opt.icon}</span>}
                          {opt.label}
                          {opt.value === "__whatsapp_link__" && <ArrowRight className="h-3 w-3 ml-0.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {msg.type === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-300">
                    <User className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="shrink-0 border-t bg-white px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 h-9 text-sm rounded-full border-gray-200 focus:border-primary"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="h-9 w-9 rounded-full shrink-0"
                style={{ backgroundColor: "#2E8B57" }}
                disabled={!inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              Powered by State-ImmoCom • <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" className="underline hover:text-gray-600">WhatsApp</a>
            </p>
          </div>

          {/* Inline CSS for animation */}
          <style jsx>{`
            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
