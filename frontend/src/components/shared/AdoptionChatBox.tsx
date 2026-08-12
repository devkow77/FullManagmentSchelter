import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import {
  ImageOff,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { shortFaqData } from "@/components/shared/ShortFaqList";
import { useAuth } from "@/context/AuthContext";
import {
  calculateAge,
  cn,
  formatAnimalEnergyLevel,
} from "@/lib/utils";

type ChatAnimal = {
  id: number;
  name: string;
  imageUrl: string[];
  dateOfBirth: string | Date;
  description: string;
  breed?: string;
  energyLevel?: string;
  reason?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  animals?: ChatAnimal[];
  isError?: boolean;
};

type ChatResponse = {
  category?: "FIND_ANIMAL" | "SHELTER_INFO" | "OTHER";
  message: string;
  animals: ChatAnimal[];
};

/** Krótka etykieta na chipie + pełna treść wysyłana do API */
const SUGGESTIONS = [
  {
    label: "Proces adopcji",
    message: shortFaqData[0].question,
  },
  {
    label: "Szczepienia i zdrowie",
    message: shortFaqData[1].question,
  },
  {
    label: "Adopcja w bloku",
    message: shortFaqData[2].question,
  },
  {
    label: "Czy adopcja jest płatna?",
    message: shortFaqData[3].question,
  },
  {
    label: "Poznać zwierzę wcześniej",
    message: shortFaqData[4].question,
  },
  {
    label: "Dobierz mi zwierzę",
    message:
      "Szukam zwierzęcia do adopcji — pomóż dobrać pupila do mojego stylu życia.",
  },
] as const;

const MAX_MESSAGE_LENGTH = 500;
const HISTORY_LIMIT = 10;
const STAFF_ROLES = new Set(["ADMINISTRATOR", "PRACOWNIK"]);

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Cześć! Mogę odpowiedzieć na pytania o schronisko albo dobrać zwierzę do adopcji. Napisz, w czym pomóc.",
};

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const toHistoryPayload = (messages: ChatMessage[]) =>
  messages
    .filter((message) => message.id !== "welcome" && !message.isError)
    .slice(-HISTORY_LIMIT)
    .map(({ role, content }) => ({
      role,
      content: content.slice(0, MAX_MESSAGE_LENGTH),
    }));

const getErrorMessage = (err: unknown) => {
  if (axios.isAxiosError(err) && err.response?.data?.msg) {
    return String(err.response.data.msg);
  }
  return "Nie udało się uzyskać odpowiedzi. Spróbuj ponownie.";
};

const ChatAnimalResult = ({ animal }: { animal: ChatAnimal }) => {
  const energyLabel = animal.energyLevel
    ? (formatAnimalEnergyLevel[animal.energyLevel] ?? animal.energyLevel)
    : null;

  return (
    <Link
      to={`/zwierzeta/${animal.id}`}
      className="flex gap-3 rounded-xl border border-gray-200 bg-white p-2 transition-colors hover:border-green-800/40 hover:bg-green-50/50"
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
        <p className="truncate text-sm font-semibold text-green-900">
          {animal.name} {calculateAge(animal.dateOfBirth)}
        </p>
        {(animal.breed || energyLabel) && (
          <p className="truncate text-[11px] text-green-800/80">
            {[animal.breed, energyLabel ? `energia: ${energyLabel}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <p className="line-clamp-2 text-xs leading-4 text-gray-600">
          {animal.reason || animal.description}
        </p>
      </div>
    </Link>
  );
};

const AdoptionChatBox = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const rootRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedInput = input.trim();
  const canSend = !loading && trimmedInput.length > 0;
  const hasConversation = messages.some((message) => message.role === "user");

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (user && STAFF_ROLES.has(user.role)) return null;

  const requestAssistant = async (
    text: string,
    priorMessages: ChatMessage[],
  ) => {
    const res = await axios.post<ChatResponse>("/api/chat/message", {
      message: text,
      history: toHistoryPayload(priorMessages),
    });
    return res.data;
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    const prior = messages.filter((message) => !message.isError);
    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: text,
    };
    setMessages([...prior, userMessage]);

    try {
      const data = await requestAssistant(text, prior);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: data.message,
          animals: data.animals ?? [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: getErrorMessage(err),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const retryLast = async () => {
    if (loading) return;

    const prior = messages.filter((message) => !message.isError);
    const lastUserIndex = prior.findLastIndex(
      (message) => message.role === "user",
    );
    if (lastUserIndex === -1) return;

    const lastUser = prior[lastUserIndex];
    const beforeUser = prior.slice(0, lastUserIndex);

    setLoading(true);
    setMessages([...beforeUser, lastUser]);

    try {
      const data = await requestAssistant(lastUser.content, beforeUser);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: data.message,
          animals: data.animals ?? [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: getErrorMessage(err),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    if (loading) return;
    setMessages([WELCOME_MESSAGE]);
    setInput("");
  };

  return (
    <div
      ref={rootRef}
      className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6"
    >
      {open && (
        <div className="flex h-[min(560px,calc(100dvh-6.5rem))] w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl shadow-xl">
          <div className="flex items-center justify-between gap-2 bg-green-800 px-4 py-3 text-white">
            <p className="text-sm leading-none font-semibold">
              Asystent adopcji
            </p>
            <div className="flex items-center gap-1">
              {hasConversation && (
                <button
                  type="button"
                  aria-label="Wyczyść rozmowę"
                  disabled={loading}
                  onClick={resetConversation}
                  className="cursor-pointer rounded p-1 transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  <RotateCcw className="size-4" />
                </button>
              )}
              <button
                type="button"
                aria-label="Zamknij chat"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded p-1 transition-colors hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-linear-to-b from-green-50 via-emerald-50/70 to-green-100/80 px-3 py-3">
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
                      ? "bg-green-800 text-white"
                      : message.isError
                        ? "border border-red-200 bg-red-50 text-red-800"
                        : "border border-gray-200 bg-white text-gray-800",
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.isError && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void retryLast()}
                      className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-red-700 underline-offset-2 hover:underline disabled:opacity-50"
                    >
                      <RotateCcw className="size-3" />
                      Spróbuj ponownie
                    </button>
                  )}
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

            {!hasConversation && !loading && (
              <div className="space-y-2">
                <p className="px-0.5 text-[11px] font-medium text-green-900/70">
                  Często zadawane pytania
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => void sendMessage(item.message)}
                      className="cursor-pointer rounded-full border border-green-800/20 bg-white/90 px-3 py-1.5 text-left text-[11px] leading-4 text-green-900 shadow-sm transition-colors hover:border-green-800/40 hover:bg-green-50 disabled:opacity-50"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
              ref={inputRef}
              value={input}
              onChange={(e) =>
                setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              placeholder="Napisz wiadomość…"
              disabled={loading}
              maxLength={MAX_MESSAGE_LENGTH}
              className="h-10 rounded-xl"
            />
            <div className="flex items-center justify-between gap-2">
              <p
                className={cn(
                  "text-[11px]",
                  input.length >= MAX_MESSAGE_LENGTH
                    ? "font-medium text-red-600"
                    : "text-gray-400",
                )}
              >
                {input.length}/{MAX_MESSAGE_LENGTH}
              </p>
              <Button
                variant="success"
                disabled={!canSend}
                onClick={() => void sendMessage(input)}
                className="min-w-28 justify-center gap-1.5 px-4 has-data-[icon=inline-start]:pl-4"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Wyślij
              </Button>
            </div>
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
