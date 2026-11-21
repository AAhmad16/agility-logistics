import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { DispatchLine } from "@/components/DispatchLine";
import { POSTS, fmtPostDate, getPost } from "@/lib/posts";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  return post ? { title: post.title, description: post.summary } : {};
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  return (
    <>
      <SiteNav />
      <article className="band blogpage">
        <div className="wrap post">
          <Link className="back" href="/blog">All posts</Link>
          <time dateTime={post.date}>{fmtPostDate(post.date)} · {post.read}</time>
          <h1>{post.title}</h1>
          {post.body.map((b, i) =>
            "h" in b ? <h2 key={i}>{b.h}</h2> : "p" in b ? <p key={i}>{b.p}</p> : <ul key={i}>{b.ul.map((li) => <li key={li}>{li}</li>)}</ul>,
          )}
          <div className="postcta">
            <b>Need something moved?</b>
            <span>Get a firm price in seconds, or talk to dispatch.</span>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <Link className="btn amber" href="/#quote">Price a shipment</Link>
              <Link className="btn ghost" href="/#contact">Contact dispatch</Link>
            </div>
          </div>
        </div>
      </article>
      <footer className="site">
        <div className="wrap"><span>Agility Logistics · Schaumburg, Illinois</span><span><DispatchLine /></span></div>
      </footer>
    </>
  );
}
