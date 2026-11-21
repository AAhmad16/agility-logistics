export type Post = {
  slug: string;
  title: string;
  date: string; // ISO
  summary: string;
  read: string;
  body: ({ h: string } | { p: string } | { ul: string[] })[];
};

// Blog posts live here. Add a new object at the top to publish a new post.
export const POSTS: Post[] = [
  {
    slug: "how-to-choose-a-delivery-service-level",
    title: "How to choose between Sprint, Same-day, Next Flight Out and STAT",
    date: "2026-11-21",
    read: "3 min read",
    summary: "A plain guide to matching the speed of the delivery to what is actually at stake.",
    body: [
      { p: "Paying for the fastest option every time wastes money. Paying for the slowest one when a line is down costs more. The right choice depends on what happens if the package is late." },
      { h: "Sprint: something is stopped right now" },
      { p: "Use Sprint when a machine, aircraft or production line is waiting on one part. The driver goes straight from pickup to delivery with nothing else on board." },
      { h: "Same-day: it has to be there today, not this minute" },
      { p: "Same-day suits replenishment, samples and documents with an end-of-day deadline. It costs less because the driver has more time to work with." },
      { h: "Next Flight Out: the package has to catch a plane" },
      { p: "When a part or document must reach another city, we get it to the airport in time for the flight. Tell dispatch the flight and cutoff so we can work back from it." },
      { h: "STAT: medical and time-sensitive supplies" },
      { p: "STAT is for lab specimens, devices and supplies where delay changes the outcome. Call dispatch if there are handling or temperature requirements." },
      { h: "A quick rule" },
      { ul: ["If work is stopped, choose Sprint.", "If there is a deadline today, choose Same-day.", "If it must fly, choose Next Flight Out.", "If it is medical and urgent, choose STAT."] },
      { p: "Every price is shown before you book, so you can compare the levels for your route in a few seconds." },
    ],
  },
  {
    slug: "what-an-on-time-guarantee-should-mean",
    title: "What an on-time guarantee should actually mean",
    date: "2026-11-14",
    read: "2 min read",
    summary: "Why we put a promised time on every booking and take money off the invoice when we miss it.",
    body: [
      { p: "Many couriers say they are fast. Few put a time in writing. We do, on every booking." },
      { h: "How it works at Agility" },
      { ul: ["When you book, you see a promised delivery time.", "If the delivery lands after that time, 25% comes off the invoice.", "There is no claim form. The credit is applied automatically.", "The driver is still paid in full, so the cost is ours, not theirs."] },
      { h: "Why we do it this way" },
      { p: "A promise with no consequence is a guess. Taking money off the invoice keeps us honest about the times we quote, and it tells you we plan to meet them." },
      { p: "You can see the promised time and whether the delivery was on time on the shipment page and on the tracking link." },
    ],
  },
  {
    slug: "how-to-prepare-a-rush-shipment",
    title: "Six things to have ready before a driver arrives",
    date: "2026-11-07",
    read: "2 min read",
    summary: "A short checklist that saves minutes at pickup and avoids delays at the other end.",
    body: [
      { p: "Most delays on rush jobs happen at the door, not on the road. A little preparation helps the driver leave faster." },
      { ul: ["Package the item so it is sealed, labelled and easy to carry.", "Have the pickup contact name and a phone number that is answered.", "Put the delivery contact name and phone number on the booking.", "Say if the recipient must sign or if there are building access steps.", "Tell us about size or weight that is unusual, up to 150 lb.", "Share the tracking link with the person waiting, so they know when to expect the driver."] },
      { p: "If the job has special handling needs, call or text dispatch before you book and we will tell you how to set it up." },
    ],
  },
  {
    slug: "proof-of-delivery-what-you-should-get",
    title: "Proof of delivery: what you should get every time",
    date: "2026-10-31",
    read: "2 min read",
    summary: "A signature alone is not much help in a dispute. Here is what we record on each delivery.",
    body: [
      { p: "When a delivery is questioned, you need to show what happened and when. We record that on every job." },
      { ul: ["The recipient's name.", "Their signature, captured on the driver's phone.", "A photo of the delivered package.", "The exact time of delivery, compared with the promised time."] },
      { p: "All of it appears on one page, along with the invoice. If you need to show a customer or a colleague, send them the link." },
    ],
  },
];

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

export function fmtPostDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
