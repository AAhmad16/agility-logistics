import { DISPATCH_PHONE, phoneHref } from "@/lib/format";

// "Call or text a real person" line. Renders nothing until NEXT_PUBLIC_DISPATCH_PHONE is set.
export function DispatchLine({ className }: { className?: string }) {
  if (!DISPATCH_PHONE) return null;
  return (
    <span className={className}>
      Dispatch, call or text: <a href={`sms:${phoneHref(DISPATCH_PHONE)}`} style={{ color: "inherit", fontWeight: 700 }}>{DISPATCH_PHONE}</a>
    </span>
  );
}
