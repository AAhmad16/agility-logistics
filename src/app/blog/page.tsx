import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { DispatchLine } from "@/components/DispatchLine";
import { POSTS, fmtPostDate } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Practical notes on rush delivery from the Agility Logistics team in Schaumburg, Illinois.",
};

export default function BlogIndex() {
  return (
    <>
      <SiteNav />
      <section className="band blogpage">
        <div className="wrap">
          <h1 className="sec">Blog</h1>
          <p className="intro">Practical notes on moving urgent shipments, from the people who dispatch them.</p>
          <div className="postlist">
            {POSTS.map((p) => (
              <article key={p.slug}>
                <time dateTime={p.date}>{fmtPostDate(p.date)} · {p.read}</time>
                <h2><Link href={`/blog/${p.slug}`}>{p.title}</Link></h2>
                <p>{p.summary}</p>
                <Link className="more" href={`/blog/${p.slug}`}>Read the post</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <footer className="site">
        <div className="wrap"><span>Agility Logistics · Schaumburg, Illinois</span><span><DispatchLine /></span></div>
      </footer>
    </>
  );
}
