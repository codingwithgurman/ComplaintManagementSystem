import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Ticket #0001 · Est. response 48h</span>
            <h1>Every complaint gets a stub, a status, and a follow-through.</h1>
            <p className="lede">
              CampusDesk gives students one place to raise an issue — Wi-Fi, hostel, library, faculty —
              and gives admins one place to review, act, and resolve it. No more complaints lost in a WhatsApp group.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="btn btn-primary">File your first complaint</Link>
              <Link href="/track" className="btn btn-outline">Track a complaint</Link>
            </div>
          </div>
          <div className="ticket-stub">
            <div className="ticket-row">
              <span className="ticket-id mono">C102</span>
              <span className="pill resolved">Resolved</span>
            </div>
            <h3 style={{ marginTop: 14 }}>Library book renewal not reflecting</h3>
            <p style={{ fontSize: ".9rem" }}>Renewed online but due date still showed the old date on my account.</p>
            <div className="ticket-divider"></div>
            <div className="ticket-meta">
              <span>Dept: Library</span>
              <span>Filed 20 Jul 2026</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>From &quot;something&apos;s wrong&quot; to &quot;it&apos;s fixed&quot; — tracked at every step</h2>
            <p>Built for students and administrators, so nothing sits unanswered.</p>
          </div>
          <div className="feature-grid">
            <FeatureCard num="01" title="File it once" text="Pick a category and department, describe the issue, attach a photo if it helps, and set a priority." />
            <FeatureCard num="02" title="Watch it move" text="A live tracker shows Pending → In Progress → Resolved, so you always know where things stand." />
            <FeatureCard num="03" title="Get notified" text="The moment an admin updates or resolves your complaint, you'll see it in your notifications." />
            <FeatureCard num="04" title="Admins resolve fast" text="Admins see every open complaint sorted by department and priority, with one click to update status." />
            <FeatureCard num="05" title="Departments stay accountable" text="Every complaint is tied to a department, so resolution times are visible, not vague." />
            <FeatureCard num="06" title="Ask the AI help desk" text="Not sure who to contact? The built-in assistant can point you in the right direction instantly." />
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--surface-alt)" }} id="contact">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Contact</span>
            <h2>Reach the complaint desk directly</h2>
            <p>Prefer to talk to someone instead of filing online? Use any of the details below.</p>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">&#9993;</div>
              <h3>Email</h3>
              <p><a href="mailto:complaints@campusdesk.edu">complaints@campusdesk.edu</a></p>
              <span className="contact-note">Replies within 1 working day</span>
            </div>
            <div className="contact-card">
              <div className="contact-icon">&#9742;</div>
              <h3>Phone</h3>
              <p><a href="tel:+911234567890">+91 12345 67890</a></p>
              <span className="contact-note">Mon–Sat, 9:00 AM – 5:00 PM</span>
            </div>
            <div className="contact-card">
              <div className="contact-icon">&#8982;</div>
              <h3>Location on campus</h3>
              <p>Admin Block, Ground Floor<br />Room 12, Student Services Wing</p>
              <span className="contact-note">Near the main gate</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="get-started">
        <div className="container" style={{ textAlign: "center" }}>
          <span className="eyebrow">Get started</span>
          <h2>Have an issue on campus right now?</h2>
          <p style={{ maxWidth: "50ch", margin: "0 auto 24px" }}>
            Register with your roll number in under a minute, then file your first complaint.
          </p>
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <Link href="/register" className="btn btn-primary">Create student account</Link>
            <Link href="/login" className="btn btn-outline">I already have an account</Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          &copy; 2026 CampusDesk — College Complaint Management System.
        </div>
      </footer>
    </>
  );
}

function FeatureCard({ num, title, text }) {
  return (
    <div className="feature-card">
      <div className="feature-num">{num}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
