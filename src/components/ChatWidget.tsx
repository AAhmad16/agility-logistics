"use client";

import { useEffect, useRef, useState } from "react";
import type { Loc, Rate } from "@/lib/types";
import { DISPATCH_PHONE, LATE_CREDIT_PCT, money, phoneHref } from "@/lib/format";

type Action = { label: string; href: string };
type Msg = { from: "bot" | "me"; text: string; actions?: Action[] };
type Reply = { text: string; actions?: Action[] };

const CHIPS = ["Get a price", "Delivery speeds", "Where do you deliver?", "Track a delivery", "Talk to a person"];

export function ChatWidget({ rates, hubs }: { rates: Rate[]; hubs: Loc[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Hi, I'm Agility's automated assistant. I can answer basic questions about prices, delivery times and coverage. What would you like to know?" },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const phone = DISPATCH_PHONE;
  const callActions: Action[] = phone
    ? [{ label: `Call ${phone}`, href: `tel:${phoneHref(phone)}` }, { label: "Send a text", href: `sms:${phoneHref(phone)}` }]
    : [];
  const hubNames = hubs.map((h) => h.name).join(", ");
  const priceList = rates.map((r) => `${r.name} from ${money(r.base_cents).replace(".00", "")}`).join(", ");

  function answer(q: string): Reply {
    const t = q.toLowerCase();
    const has = (re: RegExp) => re.test(t);
    const talk: Action[] = [{ label: "Request a quote", href: "#contact" }, ...callActions];

    if (has(/\b(human|person|agent|dispatcher|dispatch|speak|talk to|call|phone|text|contact|email)\b/))
      return { text: phone ? `A dispatcher in Schaumburg can help. Call or text ${phone}, or leave a request and we will get back to you.` : "Leave a request and a dispatcher will get back to you.", actions: talk };
    if (has(/\b(track|where is|status|waybill|follow)\b/))
      return { text: "Enter your waybill number in the tracking box on this page. If someone sent you a tracking link, open it to see the driver on a map.", actions: [{ label: "Go to tracking", href: "#track" }] };
    if (has(/\b(late|guarantee|on.?time|credit|refund|miss(ed)?)\b/))
      return { text: `Every booking gets a promised delivery time. If we deliver after it, ${LATE_CREDIT_PCT}% comes off your invoice automatically, with no claim form.` };
    if (has(/\b(proof|signature|signed|photo|pod)\b/))
      return { text: "On every delivery the driver records the recipient's name, a signature and a photo of the package. You can see them with the delivery time on the shipment page." };
    if (has(/\b(pay|payment|invoice|billing|bill|card|net 15|terms)\b/))
      return { text: "You are invoiced after each delivery on net 15 terms, and you can pay the invoice online." };
    if (has(/\b(driver|drivers|job|jobs|hiring|hire|apply|work for)\b/))
      return { text: "We are always interested in good drivers. Ask dispatch for an invite to the driver app.", actions: talk };
    if (has(/\b(medical|specimen|specimens|lab|device|devices|temperature|cold|refrigerat\w*|stat)\b/))
      return { text: "Our STAT service is for lab specimens, devices and time-sensitive medical supplies, with a signed handoff. If your shipment has temperature or special handling needs, call dispatch before you book.", actions: callActions.length ? callActions : talk };
    if (has(/\b(where|area|coverage|cover|serve|suburb|suburbs|chicago|ship(ping)? to|international|airport|o.?hare|midway|nationwide|state|city|cities|deliver to|zip)\b/))
      return { text: `We deliver across Chicagoland. Our hubs are ${hubNames || "listed in the booking form"}. For another address, call or text dispatch and we will tell you if we can do it.`, actions: [{ label: "Price a shipment", href: "#quote" }, ...callActions] };
    if (has(/\b(hours|open|close|closed|weekend|saturday|sunday|night|overnight|24|holiday|holidays|after.?hours)\b/))
      return { text: "I don't have posted hours to share. Call or text dispatch to confirm availability for the time you need.", actions: talk };
    if (has(/\b(price|prices|pricing|cost|costs|how much|rate|rates|quote|fee|fees|cheap|expensive)\b/))
      return { text: `Prices are firm and shown before you book: ${priceList}. The final price depends on distance, and you can see it instantly in the quote box.`, actions: [{ label: "Get a price now", href: "#quote" }] };
    if (has(/\b(weight|heavy|lb|lbs|pound|pounds|size|big|large|pallet|fit|dimension\w*)\b/))
      return { text: "We carry one driver's load, up to 150 lb. Weights from 1 to 10 lb are the standard box, and the price is the same for every weight up to 25 lb. For anything bulky or unusual, call dispatch first.", actions: [{ label: "Price a shipment", href: "#quote" }, ...callActions] };
    if (has(/\b(fast|speeds?|how long|delivery time|eta|arrive|window|same.?day|sprint|rush|urgent|next flight|nfo|service|services|options|levels)\b/))
      return {
        text: "Four service levels: " + rates.map((r) => `${r.name} (${r.window_text.toLowerCase()})`).join(", ") + ". Every booking shows a promised delivery time.",
        actions: [{ label: "See services", href: "#services" }, { label: "Get a price", href: "#quote" }],
      };
    if (has(/\b(book|order|schedule|account|sign ?up|register|create|start|ship|send)\b/))
      return { text: "Pick a route and service in the quote box to see your price, then create a free client account to book. It takes a minute.", actions: [{ label: "Get a price", href: "#quote" }, { label: "Create an account", href: "/signup" }] };
    if (has(/\b(carry|carrying|prohibited|hazmat|dangerous|hazardous|allowed|what can|parts|documents)\b/))
      return { text: "We move parts, documents, specimens, samples and similar packages. For hazardous, regulated or unusual items, call dispatch before you book.", actions: callActions.length ? callActions : talk };
    if (has(/\b(who|about|company|agility|schaumburg)\b/))
      return { text: "Agility Logistics is a time-critical delivery service based in Schaumburg, Illinois. Our own drivers handle every job, from pickup to signature." };
    if (has(/\b(thanks|thank you|thx|great|perfect)\b/)) return { text: "You're welcome. Anything else I can help with?" };
    if (has(/\b(hi|hello|hey|good morning|good afternoon)\b/)) return { text: "Hello. What can I help you with today?" };
    return { text: "I'm not sure about that one. I can help with prices, delivery speeds, coverage, tracking and booking, or you can reach a person.", actions: talk };
  }

  const TAGS: Record<string, Action | "call"> = {
    quote: { label: "Get a price", href: "#quote" },
    contact: { label: "Request a quote", href: "#contact" },
    track: { label: "Go to tracking", href: "#track" },
    signup: { label: "Create an account", href: "/signup" },
    services: { label: "See services", href: "#services" },
    call: "call",
  };

  // Turn [[tag]] markers from the AI reply into buttons.
  function parseReply(raw: string): Reply {
    const actions: Action[] = [];
    const text = raw.replace(/\[\[(\w+)\]\]/g, (_, tag: string) => {
      const a = TAGS[tag];
      if (a === "call") actions.push(...callActions);
      else if (a) actions.push(a);
      return "";
    }).replace(/\s+/g, " ").trim();
    return { text: text || "Sorry, I could not answer that. Please contact dispatch.", actions: actions.length ? actions : undefined };
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history = [...msgs, { from: "me" as const, text: q }];
    setMsgs(history);
    setInput("");
    setBusy(true);
    let reply: Reply | null = null;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history.map((m) => ({ role: m.from === "me" ? "user" : "assistant", content: m.text })) }),
      });
      const data = (await res.json()) as { reply?: string };
      if (data.reply) reply = parseReply(data.reply);
    } catch {
      /* fall through to the built-in answers */
    }
    setMsgs((m) => [...m, { from: "bot", ...(reply ?? answer(q)) }]);
    setBusy(false);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, open, busy]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <>
      {open && (
        <div className="chat" role="dialog" aria-label="Chat with Agility" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
          <div className="chathead">
            <div><b>Agility assistant</b><small>Automated · answers basic questions</small></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
          </div>
          <div className="chatlog" role="log" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`bubble ${m.from}`}>
                <p>{m.text}</p>
                {m.actions && (
                  <div className="bactions">
                    {m.actions.map((a) => (
                      <a key={a.label} href={a.href} onClick={() => a.href.startsWith("#") && setOpen(false)}>{a.label}</a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="bubble bot typing" aria-label="Typing"><span /><span /><span /></div>}
            <div ref={endRef} />
          </div>
          <div className="chips">
            {CHIPS.map((c) => (
              <button type="button" key={c} onClick={() => void send(c)}>{c}</button>
            ))}
          </div>
          <form className="chatform" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question" aria-label="Your message" maxLength={300} />
            <button type="submit" className="btn amber sm" disabled={busy}>Send</button>
          </form>
        </div>
      )}
      <button type="button" className="chatfab" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Close chat" : "Chat with us"}>
        {open ? "×" : <><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v12H8l-4 4z" fill="currentColor" /></svg><span>Chat</span></>}
      </button>
    </>
  );
}
