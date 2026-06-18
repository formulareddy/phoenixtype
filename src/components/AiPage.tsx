import { createSignal, For, Show, createEffect } from "solid-js";
import { streamAIResponse, aiConfig } from "../lib/openrouter";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
}

const suggestions = [
  "What is the meaning of life?",
  "Explain quantum computing simply",
  "Give me a typing drill",
  "Write a poem about code",
];

const isConfigured = aiConfig.apiKey.length > 0;

export default function AiPage() {
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [input, setInput] = createSignal("");
  const [isTyping, setIsTyping] = createSignal(false);
  const [streamingContent, setStreamingContent] = createSignal("");
  const [error, setError] = createSignal("");

  let chatEndRef: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;

  const welcome = messages().length === 0 && !streamingContent() && !error();

  createEffect(() => {
    chatEndRef?.scrollIntoView({ behavior: "smooth" });
  });

  function sendMessage(content: string) {
    const text = content.trim();
    if (!text || isTyping()) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages(prev => [...prev, { role: "user", content: text, time }]);
    setInput("");
    setError("");
    setIsTyping(true);
    setStreamingContent("");

    streamAIResponse(
      text,
      messages(),
      (token) => setStreamingContent(prev => prev + token),
      (fullContent) => {
        if (fullContent) {
          const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setMessages(prev => [...prev, { role: "assistant", content: fullContent, time: replyTime }]);
        }
        setStreamingContent("");
        setIsTyping(false);
      },
      (err) => {
        setError(err);
        setIsTyping(false);
      },
    );
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input());
    }
  }

  function formatContent(content: string) {
    const lines = content.split("\n");
    const elements: any[] = [];
    let inCodeBlock = false;
    let codeContent = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("```")) {
        if (inCodeBlock) {
          elements.push(<pre class="ai-code-block"><code>{codeContent}</code></pre>);
          codeContent = "";
        }
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) {
        codeContent += (codeContent ? "\n" : "") + line;
        continue;
      }

      if (line.startsWith("**") && line.endsWith("**")) {
        elements.push(<p class="ai-msg-bold">{line.replace(/\*\*/g, "")}</p>);
        continue;
      }

      if (line.startsWith("•") || line.match(/^\d+\./)) {
        elements.push(<p class="ai-msg-li">{line}</p>);
        continue;
      }

      if (line === "") {
        elements.push(<div class="ai-msg-spacer" />);
        continue;
      }

      elements.push(<p class="ai-msg-p">{line}</p>);
    }

    if (codeContent) {
      elements.push(<pre class="ai-code-block"><code>{codeContent}</code></pre>);
    }

    return elements;
  }

  return (
    <div class="ai-page">
      <div class="ai-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7.5 4.50012C5.84315 4.50012 4.5 5.84327 4.5 7.50012C4.5 8.06878 4.65822 8.60049 4.93304 9.05362C3.54727 9.31868 2.5 10.5371 2.5 12.0001C2.5 13.4631 3.54727 14.6816 4.93304 14.9466M7.5 4.50012C7.5 3.11941 8.61929 2.00012 10 2.00012C11.3807 2.00012 12.5 3.11941 12.5 4.50012V6.00012M7.5 4.50012C7.5 5.31803 7.89278 6.0442 8.5 6.50031M4.93304 14.9466C4.65822 15.3998 4.5 15.9315 4.5 16.5001C4.5 18.157 5.84315 19.5001 7.5 19.5001C7.5 20.8808 8.61929 22.0001 10 22.0001C11.3807 22.0001 12.5 20.8808 12.5 19.5001V18.0001M4.93304 14.9466C5.28948 14.3589 5.84207 13.9034 6.5 13.6708" />
          <path d="M17.5 9H15.5C14.5572 9 14.0858 9 13.7929 9.29289C13.5 9.58579 13.5 10.0572 13.5 11V13C13.5 13.9428 13.5 14.4142 13.7929 14.7071C14.0858 15 14.5572 15 15.5 15H17.5C18.4428 15 18.9142 15 19.2071 14.7071C19.5 14.4142 19.5 13.9428 19.5 13V11C19.5 10.0572 19.5 9.58579 19.2071 9.29289C18.9142 9 18.4428 9 17.5 9Z" />
          <path d="M15 15V17M18 15V17M15 7V9M18 7V9M13.5 10.5H11.5M13.5 13.5H11.5M21.5 10.5H19.5M21.5 13.5H19.5" />
        </svg>
        <span>AI Assistant</span>
        <span class="ai-header-badge">help</span>
      </div>

      <div class="ai-chat">
        <Show when={welcome}>
          <Show when={isConfigured} fallback={
            <div class="ai-welcome">
              <div class="ai-welcome-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h2 class="ai-welcome-title">Not Configured</h2>
              <p class="ai-welcome-sub">
                Set <code>VITE_OPENROUTER_API_KEY</code> in <code>.env</code> and rebuild.
              </p>
            </div>
          }>
            <div class="ai-welcome">
              <div class="ai-welcome-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7.5 4.50012C5.84315 4.50012 4.5 5.84327 4.5 7.50012C4.5 8.06878 4.65822 8.60049 4.93304 9.05362C3.54727 9.31868 2.5 10.5371 2.5 12.0001C2.5 13.4631 3.54727 14.6816 4.93304 14.9466M7.5 4.50012C7.5 3.11941 8.61929 2.00012 10 2.00012C11.3807 2.00012 12.5 3.11941 12.5 4.50012V6.00012M7.5 4.50012C7.5 5.31803 7.89278 6.0442 8.5 6.50031M4.93304 14.9466C4.65822 15.3998 4.5 15.9315 4.5 16.5001C4.5 18.157 5.84315 19.5001 7.5 19.5001C7.5 20.8808 8.61929 22.0001 10 22.0001C11.3807 22.0001 12.5 20.8808 12.5 19.5001V18.0001M4.93304 14.9466C5.28948 14.3589 5.84207 13.9034 6.5 13.6708" />
                  <path d="M17.5 9H15.5C14.5572 9 14.0858 9 13.7929 9.29289C13.5 9.58579 13.5 10.0572 13.5 11V13C13.5 13.9428 13.5 14.4142 13.7929 14.7071C14.0858 15 14.5572 15 15.5 15H17.5C18.4428 15 18.9142 15 19.2071 14.7071C19.5 14.4142 19.5 13.9428 19.5 13V11C19.5 10.0572 19.5 9.58579 19.2071 9.29289C18.9142 9 18.4428 9 17.5 9Z" />
                  <path d="M15 15V17M18 15V17M15 7V9M18 7V9M13.5 10.5H11.5M13.5 13.5H11.5M21.5 10.5H19.5M21.5 13.5H19.5" />
                </svg>
              </div>
              <h2 class="ai-welcome-title">Ask me anything</h2>
              <p class="ai-welcome-sub">I'm an AI assistant powered by OpenRouter. Ask me anything — typing tips, coding help, general knowledge, or just chat.</p>
              <div class="ai-suggestions">
                <For each={suggestions}>
                  {(s) => (
                    <button class="ai-suggestion-btn" onClick={() => sendMessage(s)}>
                      {s}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </Show>

        <div class="ai-messages">
          <For each={messages()}>
            {(msg) => (
              <div class={`ai-msg ai-msg-${msg.role}`}>
                <div class="ai-msg-bubble">
                  <Show when={msg.role === "assistant"}>
                    <div class="ai-msg-avatar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7.5 4.50012C5.84315 4.50012 4.5 5.84327 4.5 7.50012C4.5 8.06878 4.65822 8.60049 4.93304 9.05362C3.54727 9.31868 2.5 10.5371 2.5 12.0001C2.5 13.4631 3.54727 14.6816 4.93304 14.9466M7.5 4.50012C7.5 3.11941 8.61929 2.00012 10 2.00012C11.3807 2.00012 12.5 3.11941 12.5 4.50012V6.00012M7.5 4.50012C7.5 5.31803 7.89278 6.0442 8.5 6.50031M4.93304 14.9466C4.65822 15.3998 4.5 15.9315 4.5 16.5001C4.5 18.157 5.84315 19.5001 7.5 19.5001C7.5 20.8808 8.61929 22.0001 10 22.0001C11.3807 22.0001 12.5 20.8808 12.5 19.5001V18.0001M4.93304 14.9466C5.28948 14.3589 5.84207 13.9034 6.5 13.6708" />
                        <path d="M17.5 9H15.5C14.5572 9 14.0858 9 13.7929 9.29289C13.5 9.58579 13.5 10.0572 13.5 11V13C13.5 13.9428 13.5 14.4142 13.7929 14.7071C14.0858 15 14.5572 15 15.5 15H17.5C18.4428 15 18.9142 15 19.2071 14.7071C19.5 14.4142 19.5 13.9428 19.5 13V11C19.5 10.0572 19.5 9.58579 19.2071 9.29289C18.9142 9 18.4428 9 17.5 9Z" />
                        <path d="M15 15V17M18 15V17M15 7V9M18 7V9M13.5 10.5H11.5M13.5 13.5H11.5M21.5 10.5H19.5M21.5 13.5H19.5" />
                      </svg>
                    </div>
                  </Show>
                  <div class="ai-msg-content">{formatContent(msg.content)}</div>
                  <div class="ai-msg-time">{msg.time}</div>
                </div>
              </div>
            )}
          </For>

          <Show when={streamingContent()}>
            <div class="ai-msg ai-msg-assistant">
              <div class="ai-msg-bubble">
                <div class="ai-msg-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7.5 4.50012C5.84315 4.50012 4.5 5.84327 4.5 7.50012C4.5 8.06878 4.65822 8.60049 4.93304 9.05362C3.54727 9.31868 2.5 10.5371 2.5 12.0001C2.5 13.4631 3.54727 14.6816 4.93304 14.9466M7.5 4.50012C7.5 3.11941 8.61929 2.00012 10 2.00012C11.3807 2.00012 12.5 3.11941 12.5 4.50012V6.00012M7.5 4.50012C7.5 5.31803 7.89278 6.0442 8.5 6.50031M4.93304 14.9466C4.65822 15.3998 4.5 15.9315 4.5 16.5001C4.5 18.157 5.84315 19.5001 7.5 19.5001C7.5 20.8808 8.61929 22.0001 10 22.0001C11.3807 22.0001 12.5 20.8808 12.5 19.5001V18.0001M4.93304 14.9466C5.28948 14.3589 5.84207 13.9034 6.5 13.6708" />
                    <path d="M17.5 9H15.5C14.5572 9 14.0858 9 13.7929 9.29289C13.5 9.58579 13.5 10.0572 13.5 11V13C13.5 13.9428 13.5 14.4142 13.7929 14.7071C14.0858 15 14.5572 15 15.5 15H17.5C18.4428 15 18.9142 15 19.2071 14.7071C19.5 14.4142 19.5 13.9428 19.5 13V11C19.5 10.0572 19.5 9.58579 19.2071 9.29289C18.9142 9 18.4428 9 17.5 9Z" />
                    <path d="M15 15V17M18 15V17M15 7V9M18 7V9M13.5 10.5H11.5M13.5 13.5H11.5M21.5 10.5H19.5M21.5 13.5H19.5" />
                  </svg>
                </div>
                <div class="ai-msg-content">{formatContent(streamingContent())}</div>
              </div>
            </div>
          </Show>

          <Show when={isTyping() && !streamingContent()}>
            <div class="ai-msg ai-msg-assistant">
              <div class="ai-msg-bubble">
                <div class="ai-msg-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7.5 4.50012C5.84315 4.50012 4.5 5.84327 4.5 7.50012C4.5 8.06878 4.65822 8.60049 4.93304 9.05362C3.54727 9.31868 2.5 10.5371 2.5 12.0001C2.5 13.4631 3.54727 14.6816 4.93304 14.9466M7.5 4.50012C7.5 3.11941 8.61929 2.00012 10 2.00012C11.3807 2.00012 12.5 3.11941 12.5 4.50012V6.00012M7.5 4.50012C7.5 5.31803 7.89278 6.0442 8.5 6.50031M4.93304 14.9466C4.65822 15.3998 4.5 15.9315 4.5 16.5001C4.5 18.157 5.84315 19.5001 7.5 19.5001C7.5 20.8808 8.61929 22.0001 10 22.0001C11.3807 22.0001 12.5 20.8808 12.5 19.5001V18.0001M4.93304 14.9466C5.28948 14.3589 5.84207 13.9034 6.5 13.6708" />
                    <path d="M17.5 9H15.5C14.5572 9 14.0858 9 13.7929 9.29289C13.5 9.58579 13.5 10.0572 13.5 11V13C13.5 13.9428 13.5 14.4142 13.7929 14.7071C14.0858 15 14.5572 15 15.5 15H17.5C18.4428 15 18.9142 15 19.2071 14.7071C19.5 14.4142 19.5 13.9428 19.5 13V11C19.5 10.0572 19.5 9.58579 19.2071 9.29289C18.9142 9 18.4428 9 17.5 9Z" />
                    <path d="M15 15V17M18 15V17M15 7V9M18 7V9M13.5 10.5H11.5M13.5 13.5H11.5M21.5 10.5H19.5M21.5 13.5H19.5" />
                  </svg>
                </div>
                <div class="ai-typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </Show>

          <Show when={error()}>
            <div class="ai-msg ai-msg-error">
              <div class="ai-msg-bubble">
                <div class="ai-msg-content">
                  <p class="ai-msg-p" style="color:var(--error-color, #f44336);">{error()}</p>
                  <button class="ai-retry-btn" onClick={() => {
                    const lastMsg = [...messages()].reverse().find(m => m.role === "user");
                    if (lastMsg) sendMessage(lastMsg.content);
                    else setError("");
                  }}>Retry</button>
                </div>
              </div>
            </div>
          </Show>

          <div ref={chatEndRef} />
        </div>
      </div>

      <Show when={isConfigured}>
        <div class="ai-input-bar">
          <Show when={messages().length > 0 && !isTyping() && !error()}>
            <div class="ai-suggestions-inline">
              <For each={["Tell me a joke", "Explain AI", "Typing tips", "Write code"]}>
                {(s) => (
                  <button class="ai-suggestion-chip" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                )}
              </For>
            </div>
          </Show>
          <div class="ai-input-row">
            <input
              ref={inputRef}
              class="ai-input"
              type="text"
              placeholder="Ask me anything..."
              value={input()}
              onInput={(e) => setInput(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping()}
            />
            <button
              class="ai-send-btn"
              onClick={() => sendMessage(input())}
              disabled={!input().trim() || isTyping()}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
