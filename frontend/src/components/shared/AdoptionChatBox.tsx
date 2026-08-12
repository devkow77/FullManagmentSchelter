import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import {
  ImageOff,
  Loader2,
  MessageCircle,
  ChevronDown,
  Send,
  X,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { shortFaqData } from "@/components/shared/ShortFaqList";
import { calculateAge, cn } from "@/lib/utils";

type ChatAnimal = {
  id: number;
  name: string;
  imageUrl: string[];
  dateOfBirth: string | Date;
  description: string;
  reason?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  animals?: ChatAnimal[];
};

type ChatResponse = {
  category?: "FIND_ANIMAL" | "SHELTER_INFO" | "OTHER";
  message: string;
  animals: ChatAnimal[];
};

const FAQ_PROMPTS = shortFaqData.slice(0, 5);

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const ChatAnimalResult = ({ animal }: { animal: ChatAnimal }) => {
  return (
    <Link
      to={`/zwierzeta/${animal.id}`}
      className="flex gap-3 rounded-xl border border-gray-200 bg-white p-2 transition-colors hover:border-green-600/40 hover:bg-green-50/50"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {animal.imageUrl?.[0] ? (
          <img
            src={animal.imageUrl[0]}
            alt={animal.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <ImageOff className="size-5 text-gray-300" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-semibold text-green-600">
          {animal.name} {calculateAge(animal.dateOfBirth)}
        </p>
        {animal.reason ? (
          <p className="line-clamp-2 text-xs leading-4 text-gray-600">
            {animal.reason}
          </p>
        ) : (
          <p className="line-clamp-2 text-xs leading-4 text-gray-600">
            {animal.description}
          </p>
        )}
      </div>
    </Link>
  );
};

const AdoptionChatBox = () => {
  const [open, setOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Cześć! Mogę odpowiedzieć na pytania o schronisko albo dobrać zwierzę do adopcji. Napisz, w czym pomóc.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  const appendMessages = (...next: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...next]);
  };

  const handleFaqClick = (question: string) => {
    if (loading) return;
    void sendMessage(question);
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (text.length < 1 || loading) return;

    setInput("");
    appendMessages({ id: createId(), role: "user", content: text });
    setLoading(true);

    try {
      const res = await axios.post<ChatResponse>("/api/chat/message", {
        message: text,
      });

      appendMessages({
        id: createId(),
        role: "assistant",
        content: res.data.message,
        animals: res.data.animals ?? [],
      });
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.msg
          ? String(err.response.data.msg)
          : "Nie udało się uzyskać odpowiedzi. Spróbuj ponownie.";

      appendMessages({
        id: createId(),
        role: "assistant",
        content: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <div className="flex h-[min(560px,calc(100dvh-6.5rem))] w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl shadow-xl">
          <div className="flex items-center justify-between bg-green-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <p className="text-sm leading-none font-semibold">
                Asystent adopcji
              </p>
            </div>
            <button
              aria-label="Zamknij chat"
              onClick={() => setOpen(false)}
              className="cursor-pointer p-1"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="border-b border-gray-100 bg-white">
            <button
              type="button"
              onClick={() => setFaqOpen((prev) => !prev)}
              aria-expanded={faqOpen}
              className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-xs font-medium text-green-600 transition-colors hover:bg-green-50"
            >
              Popularne pytania
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  faqOpen && "rotate-180",
                )}
              />
            </button>
            {faqOpen && (
              <div className="space-y-1.5 px-3 pb-3">
                {FAQ_PROMPTS.map((item) => (
                  <button
                    key={item.question}
                    disabled={loading}
                    onClick={() => handleFaqClick(item.question)}
                    className="w-full cursor-pointer rounded-xl border border-green-600/20 bg-green-50 px-2.5 py-1.5 text-left text-[11px] leading-4 text-green-600 transition-colors hover:bg-green-100 disabled:opacity-50"
                  >
                    {item.question}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50 px-3 py-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[90%] space-y-2 rounded-2xl px-3 py-2 text-sm leading-5",
                    message.role === "user"
                      ? "bg-green-600 text-white"
                      : "border border-gray-200 bg-white text-gray-800",
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.animals && message.animals.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {message.animals.map((animal) => (
                        <ChatAnimalResult key={animal.id} animal={animal} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
                  <Loader2 className="size-4 animate-spin" />
                  Szukam odpowiedzi…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="space-y-2 border-t border-gray-100 bg-white p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              placeholder="Napisz wiadomość…"
              disabled={loading}
              className="h-10 rounded-xl"
            />
            <Button
              variant="success"
              disabled={loading || input.trim().length < 1}
              onClick={() => void sendMessage(input)}
              className="w-full"
            >
              {loading ? (
                <Loader2
                  className="size-4 animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <Send className="size-4" data-icon="inline-start" />
              )}
              Wyślij
            </Button>
          </div>
        </div>
      )}

      <Button
        variant="success"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={
          open ? "Zamknij asystenta adopcji" : "Otwórz asystenta adopcji"
        }
        className="size-14 rounded-full shadow-lg"
        size="icon-lg"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </div>
  );
};

export default AdoptionChatBox;
