import { useEffect, useRef, useState } from "react";

const COLORS = {
  primary: "#0F172A",
  accent: "#6366F1",
  accent2: "#22D3EE",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  surface: "#1E293B",
  surfaceLight: "#334155",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  border: "#334155",
};

const MOCK_APTITUDE = [
  { id: 1, q: "If a train travels 60 km in 45 minutes, what is its speed in km/h?", opts: ["70", "80", "75", "90"], ans: 1, cat: "Quantitative" },
  { id: 2, q: "Find the odd one out: 2, 5, 10, 17, 26, 37, 50, 64", opts: ["50", "64", "26", "37"], ans: 1, cat: "Logical" },
  { id: 3, q: "Choose the word most similar in meaning to 'EPHEMERAL':", opts: ["Eternal", "Transient", "Vivid", "Robust"], ans: 1, cat: "Verbal" },
  { id: 4, q: "A shopkeeper sells goods at 25% profit. If cost price is Rs.800, what is the selling price?", opts: ["Rs.900", "Rs.950", "Rs.1000", "Rs.1050"], ans: 2, cat: "Quantitative" },
  { id: 5, q: "In a series: 3, 9, 27, 81, __ what comes next?", opts: ["162", "243", "324", "216"], ans: 1, cat: "Logical" },
];

const MOCK_INTERVIEW = {
  HR: [
    "Tell me about yourself.",
    "What are your greatest strengths and weaknesses?",
    "Where do you see yourself in 5 years?",
    "Why do you want to work for our company?",
    "Describe a challenge you faced and how you overcame it.",
  ],
  Technical: [
    "Explain the difference between process and thread.",
    "What is polymorphism in OOP?",
    "Explain normalization in databases.",
    "What is the time complexity of binary search?",
    "What is the difference between TCP and UDP?",
  ],
  "Company-wise": {
    TCS: ["What is cloud computing?", "Explain Agile methodology.", "Difference between = and == in Python."],
    Infosys: ["What is SDLC?", "Explain recursion with an example.", "What is a foreign key?"],
    Wipro: ["What is Big Data?", "Explain MVC architecture.", "What is an API?"],
  },
};

const CODING_PROBLEMS = [
  { id: 1, title: "Reverse a String", difficulty: "Easy", desc: "Write a function that reverses a given string.", example: 'Input: "hello"\nOutput: "olleh"', starterPython: '# Write your code here\ndef reverse_string(s):\n    pass\n\nprint(reverse_string("hello"))', starterJava: "public class Main {\n  public static void main(String[] args) {\n    // Write your code here\n  }\n}", starterC: "#include <stdio.h>\nint main(){\n  // Write your code here\n  return 0;\n}" },
  { id: 2, title: "Find Factorial", difficulty: "Easy", desc: "Write a function to find the factorial of a given number.", example: "Input: 5\nOutput: 120", starterPython: "def factorial(n):\n    # Write your code here\n    pass\n\nprint(factorial(5))" },
  { id: 3, title: "Check Palindrome", difficulty: "Medium", desc: "Check if a given string is a palindrome.", example: 'Input: "racecar"\nOutput: True', starterPython: "def is_palindrome(s):\n    # Write your code here\n    pass\n\nprint(is_palindrome('racecar'))" },
];

const AI_SUGGESTIONS = [
  { icon: "AI", title: "AI Mock Interviewer", desc: "Practice HR and technical interviews with instant feedback on structure, confidence, and missing points.", module: "Interview Prep", impact: "High" },
  { icon: "AQ", title: "Adaptive Question Engine", desc: "Adjust aptitude difficulty based on student performance in each category.", module: "Aptitude Tests", impact: "High" },
  { icon: "CR", title: "AI Code Reviewer", desc: "Review logic, time complexity, readability, and edge cases beyond pass/fail output.", module: "Coding Tests", impact: "High" },
  { icon: "RA", title: "AI Resume Analyzer", desc: "Score resumes for ATS compatibility, grammar, keyword gaps, and weak project descriptions.", module: "Resume Builder", impact: "Medium" },
  { icon: "WP", title: "Weak Area Predictor", desc: "Analyze test history to predict topics the student should practice next.", module: "Progress Tracker", impact: "High" },
  { icon: "SC", title: "AI Study Chatbot", desc: "Answer doubts, explain concepts, and generate custom practice questions on demand.", module: "All Modules", impact: "Medium" },
];

const PROGRESS_DATA = {
  aptitude: { completed: 12, total: 20, score: 74 },
  coding: { completed: 5, total: 15, score: 60 },
  interview: { completed: 8, total: 12, score: 82 },
  resume: { completed: 1, total: 1, score: 90 },
};

const NAV_STUDENT = [
  { id: "dashboard", label: "Dashboard", icon: "Home" },
  { id: "aptitude", label: "Aptitude Tests", icon: "Quiz" },
  { id: "coding", label: "Coding Tests", icon: "Code" },
  { id: "interview", label: "Interview Prep", icon: "Talk" },
  { id: "resume", label: "Resume Builder", icon: "CV" },
  { id: "progress", label: "Progress Tracker", icon: "Stats" },
  { id: "ai", label: "AI Features", icon: "AI" },
];

const NAV_ADMIN = [
  { id: "admin-dashboard", label: "Admin Dashboard", icon: "Admin" },
  { id: "admin-questions", label: "Manage Questions", icon: "Q" },
  { id: "admin-users", label: "Manage Users", icon: "Users" },
  { id: "admin-reports", label: "Reports", icon: "Rpt" },
];

const Badge = ({ children, color = "accent" }) => {
  const colors = {
    accent: { bg: "#312E81", text: "#A5B4FC" },
    success: { bg: "#064E3B", text: "#6EE7B7" },
    warning: { bg: "#78350F", text: "#FCD34D" },
    danger: { bg: "#7F1D1D", text: "#FCA5A5" },
  };
  const c = colors[color] || colors.accent;
  return <span style={{ background: c.bg, color: c.text, fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{children}</span>;
};

const ProgressBar = ({ value, color = COLORS.accent, height = 6 }) => (
  <div style={{ background: COLORS.border, borderRadius: 99, height, overflow: "hidden" }}>
    <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
  </div>
);

const Card = ({ children, style = {}, onClick }) => (
  <div
    onClick={onClick}
    style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "1.25rem 1.5rem", cursor: onClick ? "pointer" : "default", transition: "border-color 0.2s, transform 0.2s", ...style }}
    onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.transform = "translateY(-2px)"; } }}
    onMouseLeave={(e) => { if (onClick) { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.transform = "translateY(0)"; } }}
  >
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", size = "md", disabled = false, style = {}, type = "button" }) => {
  const sizes = { sm: { padding: "6px 14px", fontSize: 13 }, md: { padding: "10px 22px", fontSize: 14 }, lg: { padding: "14px 32px", fontSize: 16 } };
  const variants = {
    primary: { background: COLORS.accent, color: "#fff" },
    secondary: { background: COLORS.surfaceLight, color: COLORS.text },
    outline: { background: "transparent", color: COLORS.accent, border: `1px solid ${COLORS.accent}` },
    success: { background: COLORS.success, color: "#fff" },
    danger: { background: COLORS.danger, color: "#fff" },
  };
  return <button type={type} disabled={disabled} onClick={onClick} style={{ border: "none", borderRadius: 8, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1, ...sizes[size], ...variants[variant], ...style }}>{children}</button>;
};

const Field = ({ label, children }) => (
  <label style={{ display: "block", marginBottom: "0.85rem" }}>
    <span style={{ fontSize: 13, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>{label}</span>
    {children}
  </label>
);

const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.primary, color: COLORS.text, fontSize: 14, outline: "none" };

function LandingPage({ onAuth }) {
  const stats = [
    { icon: "school", value: "10k+", label: "Students Placed", width: "85%" },
    { icon: "task_alt", value: "50k+", label: "Tests Completed", width: "92%" },
    { icon: "business_center", value: "500+", label: "Companies", width: "78%" },
  ];
  const avatars = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&q=80",
  ];

  return (
    <main className="landing-page">
      <nav className="lp-nav">
        <div className="lp-brand">PrepNexus</div>
        <div className="lp-links">
          <a href="#features">Features</a>
          <a href="#stats">Stats</a>
          <a href="#success">Success Stories</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="lp-actions">
          <button onClick={() => onAuth("login")}>Login</button>
          <button onClick={() => onAuth("register")}>Register</button>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-copy">
          <span>Engineered For Excellence</span>
          <h1>Placement Preparation <em>Portal</em></h1>
          <p>The ultimate destination for ambitious engineers. Master aptitude, ace coding challenges, and crush technical interviews with our data-driven curriculum.</p>
          <div className="lp-hero-buttons">
            <button onClick={() => onAuth("register")}>Get Started Free</button>
            <button onClick={() => onAuth("login")}><span className="material-symbols-outlined">play_circle</span> Watch Demo</button>
          </div>
          <div className="lp-social-proof">
            <div>
              {avatars.map((src) => <img key={src} src={src} alt="Student" />)}
            </div>
            <p>Joined by <strong>2,500+</strong> this week</p>
          </div>
        </div>

        <div className="lp-hero-visual">
          <div className="lp-dashboard-preview">
            <div className="lp-window-dots"><i /><i /><i /></div>
            <div className="lp-preview-grid">
              <section>
                <small>Readiness</small>
                <strong>87%</strong>
                <b />
              </section>
              <section>
                <small>Problems</small>
                <strong>312</strong>
                <b />
              </section>
              <section className="wide">
                <small>Weekly Coding Progress</small>
                <div className="lp-mini-bars">{[42, 68, 52, 88, 76, 48, 36].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>
              </section>
            </div>
            <div className="lp-floating-widget">
              <span className="material-symbols-outlined">verified</span>
              <div><small>Verified Skill</small><strong>Data Structures</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section id="stats" className="lp-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="lp-glass-card">
            <div className="lp-stat-icon"><span className="material-symbols-outlined">{stat.icon}</span></div>
            <strong>{stat.value}</strong>
            <p>{stat.label}</p>
            <i><b style={{ width: stat.width }} /></i>
          </div>
        ))}
      </section>

      <section id="features" className="lp-features">
        <div className="lp-section-title">
          <h2>Precision Preparation Tools</h2>
          <p>Our modular learning approach lets students focus on the exact pillars of modern recruitment.</p>
        </div>
        <div className="lp-feature-grid">
          <article className="lp-glass-card lp-code-feature">
            <div>
              <span className="material-symbols-outlined">code_blocks</span>
              <small>Technical Mastery</small>
            </div>
            <h3>Real-world Coding Assessments</h3>
            <p>Solve challenges inspired by top companies with instant feedback, language starters, and practice history.</p>
            <div className="lp-code-panel"><i /><i /><i /><span /><span /><span /><span /></div>
          </article>
          <article className="lp-glass-card">
            <span className="material-symbols-outlined lp-feature-icon">psychology</span>
            <h3>Aptitude Logic</h3>
            <p>Master quantitative, verbal, and logical reasoning with timed adaptive mock tests.</p>
            <button onClick={() => onAuth("register")}>Explore Topics <span className="material-symbols-outlined">arrow_forward</span></button>
          </article>
          <article className="lp-glass-card">
            <span className="material-symbols-outlined lp-feature-icon purple">video_chat</span>
            <h3>Mock Interviews</h3>
            <p>Practice HR and technical answers with AI-ready feedback for placement rounds.</p>
            <button onClick={() => onAuth("register")}>Try AI Interview <span className="material-symbols-outlined">arrow_forward</span></button>
          </article>
          <article className="lp-glass-card lp-resume-feature">
            <div>
              <h3>Resume Analyzer</h3>
              <p>Score resumes for ATS matching, keywords, grammar, and project clarity before applying.</p>
              <button onClick={() => onAuth("register")}>Upload Your Resume</button>
            </div>
            <div className="lp-upload-box"><span className="material-symbols-outlined">upload_file</span><small>Drop PDF Here</small></div>
          </article>
        </div>
      </section>

      <section className="lp-cta">
        <h2>Ready to Secure Your <em>Dream Career?</em></h2>
        <p>Join the students who are transforming their technical careers through focused placement preparation.</p>
        <div>
          <button onClick={() => onAuth("register")}>Register Now</button>
          <button onClick={() => onAuth("login")}>Login</button>
        </div>
      </section>

      <footer className="lp-footer">
        <div>
          <h3>PrepNexus</h3>
          <p>Elevating education for the digital generation through advanced technical prep tools.</p>
        </div>
        <div><h4>Platform</h4><a>Aptitude Module</a><a>Coding Challenges</a><a>Interview Prep</a></div>
        <div><h4>Resources</h4><a>Success Stories</a><a>Career Blog</a><a>Learning Path</a></div>
        <div><h4>Connect</h4><p>Subscribe to updates and placement tips.</p><div className="lp-subscribe"><input placeholder="Email" /><button><span className="material-symbols-outlined">send</span></button></div></div>
      </footer>
    </main>
  );
}

function AuthScreen({ onLogin, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.email || !form.password) return setError("Please fill all required fields.");
    if (mode === "register" && !form.name) return setError("Name is required.");
    const user = { name: form.name || form.email.split("@")[0], email: form.email, role: form.role, token: btoa(JSON.stringify({ email: form.email, role: form.role, iat: Date.now() })) };
    localStorage.setItem("placeprep_user", JSON.stringify(user));
    onLogin(user);
  };

  return (
    <main style={{ minHeight: "100vh", background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`, borderRadius: 8, margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900 }}>PP</div>
          <h1 style={{ color: COLORS.text, fontSize: 28, fontWeight: 900, margin: 0 }}>PlacePrep</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>Campus placement preparation portal</p>
        </div>
        <Card>
          <div style={{ display: "flex", gap: 4, background: COLORS.primary, borderRadius: 8, padding: 4, marginBottom: "1.5rem" }}>
            {["login", "register"].map((item) => (
              <button key={item} onClick={() => { setMode(item); setError(""); }} style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", fontWeight: 700, cursor: "pointer", background: mode === item ? COLORS.accent : "transparent", color: mode === item ? "#fff" : COLORS.textMuted }}>
                {item === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            {mode === "register" && <Field label="Full Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rahul Sharma" style={inputStyle} /></Field>}
            <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@college.edu" style={inputStyle} /></Field>
            <Field label="Password"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="password" style={inputStyle} /></Field>
            {mode === "register" && <Field label="Role"><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inputStyle}><option value="student">Student</option><option value="admin">Admin</option></select></Field>}
            {error && <p style={{ color: COLORS.danger, fontSize: 13 }}>{error}</p>}
            <Button type="submit" size="lg" style={{ width: "100%" }}>{mode === "login" ? "Sign In" : "Create Account"}</Button>
          </form>
          <p style={{ color: COLORS.textMuted, fontSize: 12, textAlign: "center", marginBottom: 0 }}>JWT authentication ready for backend connection</p>
        </Card>
      </div>
    </main>
  );
}

function Sidebar({ user, active, setActive, onLogout }) {
  const nav = user.role === "admin" ? NAV_ADMIN : NAV_STUDENT;
  return (
    <aside className="sidebar" style={{ width: 240, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 100 }}>
      <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900 }}>PP</div>
          <div><div style={{ color: COLORS.text, fontWeight: 900 }}>PlacePrep</div><div style={{ color: COLORS.textMuted, fontSize: 11 }}>Portal</div></div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "0.75rem", overflowY: "auto" }}>
        {nav.map((item) => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, background: active === item.id ? `${COLORS.accent}22` : "transparent", color: active === item.id ? COLORS.accent : COLORS.textMuted, fontWeight: active === item.id ? 800 : 500, fontSize: 14, textAlign: "left" }}>
            <span style={{ minWidth: 42, fontSize: 11, color: active === item.id ? COLORS.accent2 : COLORS.textMuted }}>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: "1rem 0.75rem", borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, background: COLORS.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>{user.name[0].toUpperCase()}</div>
          <div><div style={{ color: COLORS.text, fontSize: 13, fontWeight: 700 }}>{user.name}</div><div style={{ color: COLORS.textMuted, fontSize: 11 }}>{user.role}</div></div>
        </div>
        <Button onClick={onLogout} variant="secondary" size="sm" style={{ width: "100%" }}>Sign Out</Button>
      </div>
    </aside>
  );
}

function Dashboard({ user, setActive }) {
  const modules = [
    { id: "aptitude", icon: "calculate", label: "Aptitude Master", desc: "Master logical reasoning, quantitative analysis, and verbal ability.", count: "42 Modules", done: "80% Done", width: "80%", tone: "cyan" },
    { id: "coding", icon: "code", label: "Coding Arsenal", desc: "Practice data structures, algorithms, and company coding patterns.", count: "128 Challenges", done: "45% Done", width: "45%", tone: "purple" },
    { id: "interview", icon: "record_voice_over", label: "Interview Simulator", desc: "Prepare with HR, technical, and AI-assisted mock interview rounds.", count: "15 Sessions", done: "12% Done", width: "12%", tone: "silver" },
  ];
  const activity = [
    { day: "Mon", height: "40%", fill: "60%" },
    { day: "Tue", height: "70%", fill: "85%" },
    { day: "Wed", height: "55%", fill: "40%" },
    { day: "Thu", height: "90%", fill: "95%" },
    { day: "Fri", height: "65%", fill: "70%" },
    { day: "Sat", height: "40%", fill: "50%" },
    { day: "Sun", height: "30%", fill: "20%" },
  ];
  const tests = [
    { date: "24", month: "May", title: "Tech Giant Mock Drive", desc: "System design and problem solving" },
    { date: "28", month: "May", title: "HR Round Strategy", desc: "Behavioral workshop with mentors" },
  ];

  return (
    <section className="pn-dashboard">
      <div className="pn-topbar">
        <span>Dashboard / Overview</span>
        <div className="pn-top-actions">
          <span className="material-symbols-outlined">notifications</span>
          <span className="material-symbols-outlined">search</span>
        </div>
      </div>

      <div className="pn-hero">
        <div className="pn-hero-copy">
          <h1>Welcome back, {user.name}!</h1>
          <p>You're in the top 5% of your batch. Your dream placement is just 12 modules away. Keep the momentum going.</p>
          <div className="pn-hero-actions">
            <button onClick={() => setActive("coding")}>Resume Coding Practice</button>
            <button onClick={() => setActive("progress")}>View Daily Roadmap</button>
          </div>
        </div>
        <div className="pn-streak-card">
          <p>Current Streak</p>
          <strong>14</strong>
          <span>Days of non-stop growth</span>
          <div className="pn-spark">
            {[4, 6, 8, 10, 12, 10, 8].map((h, index) => <i key={index} style={{ height: `${h * 4}px` }} />)}
          </div>
        </div>
      </div>

      <div className="pn-analytics-grid">
        <div className="pn-glass-card pn-readiness">
          <div className="pn-ring" style={{ "--score": 75 }}>
            <div>
              <strong>75%</strong>
              <span>Course Readiness</span>
            </div>
          </div>
          <h3>Readiness Score</h3>
          <p>Your aptitude and coding scores are peaking this week.</p>
        </div>

        <div className="pn-glass-card pn-weekly">
          <div className="pn-section-head">
            <div>
              <h3>Weekly Activity</h3>
              <p>Problems solved per day</p>
            </div>
            <div className="pn-legend"><span />Practice <em />Mock Tests</div>
          </div>
          <div className="pn-bars">
            {activity.map((item) => (
              <div key={item.day} className="pn-bar-wrap">
                <div className="pn-bar-track" style={{ height: item.height }}>
                  <div style={{ height: item.fill }} />
                </div>
                <span>{item.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pn-feature-grid">
        {modules.map((m) => (
          <button key={m.id} className={`pn-feature-card pn-${m.tone}`} onClick={() => setActive(m.id)}>
            <span className="material-symbols-outlined">{m.icon}</span>
            <h4>{m.label}</h4>
            <p>{m.desc}</p>
            <div><strong>{m.count}</strong><span>{m.done}</span></div>
            <i><b style={{ width: m.width }} /></i>
          </button>
        ))}
      </div>

      <div className="pn-bento-grid">
        <div className="pn-glass-card">
          <h3>Upcoming Tests</h3>
          <div className="pn-test-list">
            {tests.map((test) => (
              <div key={test.title} className="pn-test-item">
                <div><strong>{test.date}</strong><span>{test.month}</span></div>
                <section><h4>{test.title}</h4><p>{test.desc}</p></section>
                <button>Remind me</button>
              </div>
            ))}
          </div>
        </div>

        <div className="pn-glass-card">
          <h3>Recent Badges</h3>
          <div className="pn-badges">
            {["auto_awesome", "terminal", "trophy", "military_tech"].map((icon, index) => (
              <div key={icon} className={index === 3 ? "locked" : ""}><span className="material-symbols-outlined">{icon}</span></div>
            ))}
          </div>
          <p className="pn-badge-copy">You've earned <strong>3 new badges</strong> this month. Complete the Red-Black Trees challenge to unlock the Coding Master badge.</p>
        </div>
      </div>
    </section>
  );
}

function ProgressRow({ name, value }) {
  const color = value.score >= 80 ? COLORS.success : value.score >= 60 ? COLORS.warning : COLORS.danger;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: COLORS.text, textTransform: "capitalize", fontWeight: 700 }}>{name}</span>
        <span style={{ color: COLORS.textMuted }}>{value.completed}/{value.total} | {value.score}%</span>
      </div>
      <ProgressBar value={value.score} color={color} />
    </div>
  );
}

function AptitudeModule() {
  const [phase, setPhase] = useState("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [timeLeft, setTimeLeft] = useState(300);
  const [category, setCategory] = useState("All");
  const timerRef = useRef(null);
  const filtered = category === "All" ? MOCK_APTITUDE : MOCK_APTITUDE.filter((q) => q.cat === category);
  const score = Object.entries(answers).filter(([idx, ans]) => filtered[+idx]?.ans === ans).length;

  useEffect(() => {
    if (phase !== "test") return undefined;
    timerRef.current = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          clearInterval(timerRef.current);
          setPhase("result");
          return 0;
        }
        return time - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  if (phase === "intro") return (
    <section className="aptitude-intro">
      <div className="aptitude-intro-hero">
        <span className="material-symbols-outlined">calculate</span>
        <div>
          <h2>Aptitude Test Module</h2>
          <p>Choose a category and begin a focused placement-style aptitude exam.</p>
        </div>
      </div>
      <div className="aptitude-config-card">
        <h3>Test Configuration</h3>
        <div className="aptitude-category-row">
          {["All", "Quantitative", "Logical", "Verbal"].map((cat) => <button key={cat} onClick={() => setCategory(cat)} className={category === cat ? "active" : ""}>{cat}</button>)}
        </div>
        <div className="aptitude-config-stats">
          {[["Questions", filtered.length], ["Time Limit", "5 min"], ["Marking", "+1 / 0"]].map(([k, v]) => <div key={k}><strong>{v}</strong><span>{k}</span></div>)}
        </div>
        <button className="aptitude-start" onClick={() => { setAnswers({}); setMarked({}); setCurrent(0); setTimeLeft(300); setPhase("test"); }}>Start Test</button>
      </div>
    </section>
  );

  if (phase === "result") {
    const percent = Math.round((score / filtered.length) * 100);
    return <section className="aptitude-result"><div className="aptitude-result-card"><h2>Test Results</h2><strong>{score}/{filtered.length}</strong><p>Score: {percent}%</p><ProgressBar value={percent} height={10} color={percent >= 80 ? COLORS.success : percent >= 60 ? COLORS.warning : COLORS.danger} /><button onClick={() => setPhase("intro")}>Try Again</button></div></section>;
  }

  const q = filtered[current];
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const answeredCount = Object.keys(answers).length;
  const progress = ((current + 1) / filtered.length) * 100;

  return (
    <section className="aptitude-exam">
      <header className="aptitude-exam-topbar">
        <div>
          <strong>PrepNexus</strong>
          <i />
          <span className={timeLeft < 60 ? "danger" : ""}><span className="material-symbols-outlined">timer</span>{mins}:{secs}</span>
        </div>
        <div className="aptitude-profile"><div><b>Student</b><small>Batch of 2024</small></div><span>P</span></div>
      </header>

      <main className="aptitude-exam-body">
        <section className="aptitude-question-area custom-scrollbar">
          <div className="aptitude-question-wrap">
            <div className="aptitude-progress-head">
              <div>
                <span>Aptitude Module</span>
                <h1>{category === "All" ? q.cat : category} Reasoning</h1>
              </div>
              <p>Question <strong>{current + 1}</strong> of {filtered.length}</p>
            </div>
            <div className="aptitude-progress-track"><div style={{ width: `${progress}%` }} /></div>

            <div className="aptitude-question-card">
              <p>{q.q}</p>
              <div className="aptitude-option-grid">
                {q.opts.map((opt, i) => {
                  const selectedAnswer = answers[current] === i;
                  return (
                    <button key={opt} onClick={() => setAnswers({ ...answers, [current]: i })} className={selectedAnswer ? "selected" : ""}>
                      <span>{String.fromCharCode(65 + i)}</span>
                      <b>{opt}</b>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="aptitude-actions">
              <div>
                <button onClick={() => setMarked({ ...marked, [current]: !marked[current] })} className={marked[current] ? "marked" : ""}><span className="material-symbols-outlined">flag</span>Mark for Review</button>
                <button onClick={() => { const next = { ...answers }; delete next[current]; setAnswers(next); }}>Clear Response</button>
              </div>
              <div>
                <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>Previous</button>
                {current < filtered.length - 1
                  ? <button onClick={() => setCurrent(current + 1)}>Save & Next</button>
                  : <button onClick={() => { clearInterval(timerRef.current); setPhase("result"); }}>Submit Test</button>}
              </div>
            </div>
          </div>
        </section>

        <aside className="aptitude-palette">
          <div>
            <h3>Question Palette</h3>
            <div className="aptitude-palette-grid">
              {filtered.map((_, i) => {
                const state = i === current ? "current" : marked[i] ? "review" : answers[i] !== undefined ? "answered" : "unanswered";
                return <button key={i} className={state} onClick={() => setCurrent(i)}>{i + 1}</button>;
              })}
            </div>
          </div>
          <div className="aptitude-legend">
            <h4>Legend</h4>
            <p><i className="answered" />Answered</p>
            <p><i className="unanswered" />Not Answered</p>
            <p><i className="review" />Marked for Review</p>
            <p><i className="current" />Current</p>
          </div>
          <div className="aptitude-palette-footer">
            <p>{answeredCount}/{filtered.length} answered</p>
            <button onClick={() => { clearInterval(timerRef.current); setPhase("result"); }}>Finish Test</button>
          </div>
        </aside>
      </main>
      <footer className="aptitude-exam-footer">
        <span>© 2024 PrepNexus Elite Education. All rights reserved.</span>
        <div><a>Help Center</a><a>Guidelines</a></div>
      </footer>
    </section>
  );
}
function CodingModule() {
  const [selected, setSelected] = useState(null);
  const [lang, setLang] = useState("Python");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  if (!selected) return (
    <section className="coding-home">
      <div className="coding-home-hero">
        <span className="material-symbols-outlined">code</span>
        <div>
          <h2>Coding Test Module</h2>
          <p>Solve programming challenges in C, Java, or Python with an interview-style editor.</p>
        </div>
      </div>
      <div className="coding-problem-list">
        {CODING_PROBLEMS.map((p) => (
          <button key={p.id} onClick={() => { setSelected(p); setLang("Python"); setCode(p.starterPython); setOutput(""); }} className="coding-problem-card">
            <span className="material-symbols-outlined">terminal</span>
            <div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
            <Badge color={p.difficulty === "Easy" ? "success" : "warning"}>{p.difficulty}</Badge>
            <strong>Open</strong>
          </button>
        ))}
      </div>
    </section>
  );

  const updateLanguage = (nextLang) => {
    setLang(nextLang);
    setCode(nextLang === "Python" ? selected.starterPython : nextLang === "Java" ? selected.starterJava || "public class Main {\n  public static void main(String[] args) {\n  }\n}" : selected.starterC || "#include <stdio.h>\nint main(){\n  return 0;\n}");
  };

  const runCode = () => {
    setRunning(true);
    setOutput("Running...");
    setTimeout(() => {
      setRunning(false);
      if (code.includes("pass")) setOutput("Function body is incomplete. Replace pass with your implementation.");
      else if (selected.id === 1 && code.includes("[::-1]")) setOutput("Output: olleh\n\nAll test cases passed. (3/3)");
      else if (selected.id === 2 && (code.includes("*") || code.includes("math"))) setOutput("Output: 120\n\nAll test cases passed. (3/3)");
      else setOutput("Code submitted. Connect this module to a judge service for real execution.");
    }, 800);
  };

  return (
    <section className="code-workspace">
      <header className="code-topbar">
        <div>
          <button onClick={() => setSelected(null)} aria-label="Back to coding problems"><span className="material-symbols-outlined">arrow_back</span></button>
          <h2>{selected.title}</h2>
        </div>
        <div>
          <span className="code-timer"><span className="material-symbols-outlined">timer</span>24:45</span>
          <span className="code-avatar">P</span>
        </div>
      </header>

      <div className="code-split">
        <aside className="problem-pane custom-scrollbar">
          <div className="problem-tags">
            <Badge color={selected.difficulty === "Easy" ? "success" : "warning"}>{selected.difficulty}</Badge>
            <span>45% Success Rate</span>
          </div>
          <p className="problem-lead">{selected.desc}</p>
          <p className="problem-muted">Use the starter code, choose your language, run the sample, and submit when your logic is ready.</p>

          <section>
            <h3>Example</h3>
            <pre>{selected.example}</pre>
          </section>

          <section>
            <h3>Constraints</h3>
            <ul>
              <li>Input size stays within beginner-friendly limits.</li>
              <li>Handle empty strings, small numbers, and edge cases.</li>
              <li>Return the expected output format exactly.</li>
            </ul>
          </section>

          <section>
            <h3>AI Review Tip</h3>
            <p className="problem-muted">After execution, use the output panel to compare logic and improve readability, complexity, and edge-case handling.</p>
          </section>
        </aside>

        <div className="editor-pane">
          <div className="editor-toolbar">
            <select value={lang} onChange={(e) => updateLanguage(e.target.value)}>
              <option>Python</option>
              <option>Java</option>
              <option>C</option>
            </select>
            <div>
              <button onClick={() => navigator.clipboard?.writeText(code)}><span className="material-symbols-outlined">content_copy</span>Copy</button>
              <button onClick={() => updateLanguage(lang)}><span className="material-symbols-outlined">restart_alt</span>Reset</button>
            </div>
          </div>

          <div className="editor-shell">
            <div className="line-numbers">
              {Array.from({ length: Math.max(15, code.split("\n").length) }, (_, i) => <span key={i}>{i + 1}</span>)}
            </div>
            <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} />
          </div>

          {output && (
            <div className="console-panel">
              <span><span className="material-symbols-outlined">terminal</span> Console</span>
              <pre>{output}</pre>
            </div>
          )}

          <footer className="editor-footer">
            <button className="console-toggle"><span className="material-symbols-outlined">terminal</span>Console</button>
            <div>
              <button onClick={runCode} disabled={running}>{running ? "Running..." : "Run Code"}</button>
              <button onClick={runCode} disabled={running}>Submit</button>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}

function InterviewModule() {
  const [tab, setTab] = useState("HR");
  const [companyTab, setCompanyTab] = useState("TCS");
  const [practice, setPractice] = useState(null);
  const [answer, setAnswer] = useState("");
  const questions = tab === "Company-wise" ? MOCK_INTERVIEW["Company-wise"][companyTab] : MOCK_INTERVIEW[tab];
  const categories = [
    { id: "HR", icon: "groups", label: "HR Questions", tag: "Behavioral", desc: "Master the STAR method and refine your personal narrative for behavioral rounds." },
    { id: "Technical", icon: "terminal", label: "Technical Rounds", tag: "Technical", desc: "Deep dives into DSA, DBMS, OS, OOP, and high-stakes technical fundamentals." },
    { id: "Company-wise", icon: "business", label: "Company Specific", tag: "Elite Firms", desc: "Targeted preparation for TCS, Infosys, Wipro, and other campus recruiters." },
  ];

  return (
    <section className="interview-page">
      <div className="interview-hero">
        <div>
          <h1>Ace Your <span>Dream Career</span></h1>
          <p>Master the art of the interview with professional resources tailored for campus placements and elite roles.</p>
        </div>
        <div className="interview-streak">
          <span className="material-symbols-outlined">local_fire_department</span>
          <div><strong>12 Days</strong><small>Daily Streak</small></div>
        </div>
      </div>

      <div className="interview-quote">
        <span className="material-symbols-outlined">format_quote</span>
        <h2>Preparation is the key to success. The most prepared candidates are the ones who define the future.</h2>
        <p>PrepNexus Mentor Circle</p>
      </div>

      <div className="interview-category-grid">
        {categories.map((item) => (
          <button key={item.id} onClick={() => { setTab(item.id); setPractice(null); }} className={tab === item.id ? "active" : ""}>
            <div>
              <span className="material-symbols-outlined">{item.icon}</span>
              <small>{item.tag}</small>
            </div>
            <h3>{item.label}</h3>
            <p>{item.desc}</p>
            <strong>{item.id === "Technical" ? "Practice Problems" : item.id === "Company-wise" ? "View Roadmaps" : "Explore Topics"} <span className="material-symbols-outlined">arrow_forward</span></strong>
          </button>
        ))}
      </div>

      {tab === "Company-wise" && (
        <div className="company-tabs">
          {Object.keys(MOCK_INTERVIEW["Company-wise"]).map((item) => <button key={item} onClick={() => setCompanyTab(item)} className={companyTab === item ? "active" : ""}>{item}</button>)}
        </div>
      )}

      <div className="practice-head">
        <h2><span className="material-symbols-outlined">edit_note</span>Practice Arena: <b>{tab === "Company-wise" ? companyTab : tab} Questions</b></h2>
        <div><span>Progress: 2/10 completed</span><i><b /></i></div>
      </div>

      <div className="interview-question-list">
        {questions.map((q, i) => (
          <article key={q} className="interview-question-card">
            <div className="question-number">{i + 1}</div>
            <div>
              <h4>"{q}"</h4>
              <div className="interview-meta">
                <span><span className="material-symbols-outlined">schedule</span>{i % 2 === 0 ? "10 min" : "5 min"}</span>
                {i % 2 === 0 && <span><span className="material-symbols-outlined filled">star</span>High Frequency</span>}
              </div>
              <label>Answer Here</label>
              <textarea value={practice === q ? answer : ""} onFocus={() => { setPractice(q); if (practice !== q) setAnswer(""); }} onChange={(e) => { setPractice(q); setAnswer(e.target.value); }} placeholder="Draft your response using the STAR (Situation, Task, Action, Result) method..." rows={practice === q ? 5 : 3} />
              <div className="interview-card-actions">
                <button>Save Draft</button>
                <button onClick={() => setPractice(q)}>Submit for Review</button>
              </div>
              {practice === q && <p className={answer.length > 40 ? "good" : ""}>{answer.length > 40 ? "Good start. Add one measurable result to make it stronger." : "Write a structured answer to receive practice feedback."}</p>}
            </div>
          </article>
        ))}
      </div>

      <div className="interview-tips">
        <h2>Expert <span>Success Tips</span></h2>
        <div>
          <article className="large"><span className="material-symbols-outlined">record_voice_over</span><h3>Master Non-Verbal Cues</h3><p>Maintain eye contact, sit upright, and use open gestures to convey confidence during video interviews.</p><a>Read Full Guide <span className="material-symbols-outlined">open_in_new</span></a></article>
          <article><span className="material-symbols-outlined">psychology</span><h3>Think Aloud</h3><p>For technical rounds, always articulate your thought process as you solve.</p></article>
          <article><span className="material-symbols-outlined">timer</span><h3>Mock Often</h3><p>Schedule at least 2 mock interviews per week to reduce anxiety.</p></article>
        </div>
      </div>
    </section>
  );
}

function ResumeModule() {
  const [form, setForm] = useState({ name: "Rahul Sharma", email: "rahul@college.edu", phone: "9876543210", college: "JNTU Hyderabad", degree: "B.Tech CSE", cgpa: "8.4", skills: "Python, Java, React, SQL, Git", projects: "1. Placement Portal - React and Python web app\n2. Library Management System - Java and MySQL", internship: "Software Intern at TCS (June-Aug 2024)", achievements: "Winner, HackFest 2024\nTop 5%, Dept. Merit List", summary: "Aspiring Software Engineer with a passion for building scalable web applications and mastering complex algorithms.", portfolio: "linkedin.com/in/rahulsharma" });
  const setValue = (key, value) => setForm({ ...form, [key]: value });
  const [firstName, ...lastNameParts] = form.name.split(" ");
  const lastName = lastNameParts.join(" ");

  return (
    <section className="resume-architect">
      <header className="resume-architect-header">
        <div>
          <h1>Resume Architect</h1>
          <p>AI-Enhanced Career Builder</p>
        </div>
        <div>
          <button>Save Draft</button>
          <button><span className="material-symbols-outlined">picture_as_pdf</span>Generate PDF</button>
        </div>
      </header>

      <div className="resume-builder-grid">
        <div className="resume-form-side">
          <div className="resume-stepper">
            {["Personal", "Education", "Experience", "Skills"].map((step, index) => (
              <div key={step} className={index === 0 ? "active" : ""}>
                <span>{index + 1}</span>
                <small>{step}</small>
              </div>
            ))}
          </div>

          <div className="resume-form-card">
            <div className="resume-form-title"><span className="material-symbols-outlined">person</span><h2>Personal Information</h2></div>
            <div className="resume-fields">
              <label><span>First Name</span><input value={firstName || ""} onChange={(e) => setValue("name", `${e.target.value} ${lastName}`.trim())} /></label>
              <label><span>Last Name</span><input value={lastName} onChange={(e) => setValue("name", `${firstName || ""} ${e.target.value}`.trim())} /></label>
              <label className="wide"><span>Professional Summary</span><textarea value={form.summary} onChange={(e) => setValue("summary", e.target.value)} rows={4} /></label>
              <label><span>Email Address</span><input value={form.email} onChange={(e) => setValue("email", e.target.value)} /></label>
              <label><span>Phone Number</span><input value={form.phone} onChange={(e) => setValue("phone", e.target.value)} /></label>
              <label className="wide"><span>LinkedIn / Portfolio URL</span><input value={form.portfolio} onChange={(e) => setValue("portfolio", e.target.value)} /></label>
              <label><span>College</span><input value={form.college} onChange={(e) => setValue("college", e.target.value)} /></label>
              <label><span>Degree</span><input value={form.degree} onChange={(e) => setValue("degree", e.target.value)} /></label>
              <label className="wide"><span>Technical Skills</span><textarea value={form.skills} onChange={(e) => setValue("skills", e.target.value)} rows={2} /></label>
              <label className="wide"><span>Projects</span><textarea value={form.projects} onChange={(e) => setValue("projects", e.target.value)} rows={3} /></label>
            </div>
            <div className="resume-form-actions"><button>Save & Next</button></div>
          </div>

          <div className="resume-collapsed-list">
            {["Education", "Experience"].map((item) => <div key={item}><span className="material-symbols-outlined">{item === "Education" ? "school" : "work"}</span><strong>{item}</strong><span className="material-symbols-outlined">add_circle</span></div>)}
          </div>
        </div>

        <div className="resume-preview-side">
          <div className="resume-preview-tools"><span>Live Preview</span><div><button><span className="material-symbols-outlined">zoom_in</span></button><button><span className="material-symbols-outlined">zoom_out</span></button></div></div>
          <div className="resume-paper">
            <i />
            <header>
              <h1>{form.name.toUpperCase()}</h1>
              <p>Software Engineer & Tech Enthusiast</p>
              <div><span><span className="material-symbols-outlined">mail</span>{form.email}</span><span><span className="material-symbols-outlined">call</span>{form.phone}</span><span><span className="material-symbols-outlined">public</span>{form.portfolio}</span></div>
            </header>
            <ResumeSection title="Professional Summary"><p>{form.summary}</p></ResumeSection>
            <ResumeSection title="Experience"><p><strong>{form.internship}</strong></p></ResumeSection>
            <ResumeSection title="Education"><p><strong>{form.degree}</strong></p><p>{form.college} | CGPA: {form.cgpa}</p></ResumeSection>
            <ResumeSection title="Projects">{form.projects.split("\n").map((p) => <p key={p}>{p}</p>)}</ResumeSection>
            <ResumeSection title="Core Skills"><div className="resume-skill-pills">{form.skills.split(",").map((skill) => <span key={skill}>{skill.trim()}</span>)}</div></ResumeSection>
            <ResumeSection title="Achievements">{form.achievements.split("\n").map((a) => <p key={a}>{a}</p>)}</ResumeSection>
            <div className="resume-ai-note"><span className="material-symbols-outlined">auto_awesome</span><b>AI: Strengthen your summary!</b></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResumeSection({ title, children }) {
  return <section className="resume-preview-section"><h4>{title.toUpperCase()}</h4>{children}</section>;
}

function ProgressModule() {
  const weak = ["Probability and Statistics", "Time and Work", "Reading Comprehension"];
  const history = [{ date: "May 15", module: "Aptitude", score: 70 }, { date: "May 16", module: "Coding", score: 60 }, { date: "May 17", module: "Aptitude", score: 80 }, { date: "May 18", module: "Interview", score: 85 }];
  return <section><h2 style={{ color: COLORS.text }}>Progress Tracker</h2><div className="grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: "1.5rem" }}>{Object.entries(PROGRESS_DATA).map(([key, val]) => <Card key={key}><ProgressRow name={key} value={val} /></Card>)}</div><div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}><Card><h4 style={{ color: COLORS.text, marginTop: 0 }}>Weak Areas</h4>{weak.map((item) => <p key={item} style={{ color: COLORS.textMuted }}>{item} <Badge color="danger">Needs Work</Badge></p>)}</Card><Card><h4 style={{ color: COLORS.text, marginTop: 0 }}>Test History</h4>{history.map((item) => <div key={`${item.date}-${item.module}`} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${COLORS.border}`, padding: "8px 0" }}><span style={{ color: COLORS.text }}>{item.module}<br /><small style={{ color: COLORS.textMuted }}>{item.date}</small></span><strong style={{ color: item.score >= 75 ? COLORS.success : COLORS.warning }}>{item.score}%</strong></div>)}</Card></div></section>;
}

function AIFeatures() {
  const [selected, setSelected] = useState(null);
  return (
    <section>
      <h2 style={{ color: COLORS.text }}>AI Integration Suggestions</h2>
      <Card style={{ background: `linear-gradient(135deg, ${COLORS.accent}22, #22D3EE22)`, marginBottom: "1.5rem" }}>
        <p style={{ color: COLORS.text, margin: 0, lineHeight: 1.7 }}><strong style={{ color: COLORS.accent2 }}>Tech Stack:</strong> React frontend, Python FastAPI backend, PostgreSQL database, JWT authentication, OpenAI or Hugging Face for AI models.</p>
      </Card>
      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {AI_SUGGESTIONS.map((item, i) => <Card key={item.title} onClick={() => setSelected(selected === i ? null : i)}><div style={{ display: "flex", gap: 12 }}><div style={{ width: 42, height: 42, borderRadius: 8, background: COLORS.primary, color: COLORS.accent2, display: "grid", placeItems: "center", fontWeight: 900 }}>{item.icon}</div><div><div style={{ color: COLORS.text, fontWeight: 900 }}>{item.title} <Badge color={item.impact === "High" ? "success" : "warning"}>{item.impact}</Badge></div><div style={{ color: COLORS.textMuted, fontSize: 12 }}>Module: {item.module}</div>{selected === i && <p style={{ color: COLORS.textMuted, lineHeight: 1.7 }}>{item.desc}</p>}</div></div></Card>)}
      </div>
    </section>
  );
}

function AdminModule({ view }) {
  const users = [
    { name: "Priya K.", email: "priya@college.edu", tests: 18, avg: 78, joined: "Apr 20" },
    { name: "Arjun M.", email: "arjun@college.edu", tests: 12, avg: 65, joined: "Apr 22" },
    { name: "Sneha T.", email: "sneha@college.edu", tests: 25, avg: 88, joined: "Apr 18" },
    { name: "Vikram R.", email: "vikram@college.edu", tests: 5, avg: 50, joined: "May 1" },
  ];
  if (view === "admin-questions") return <section><h2 style={{ color: COLORS.text }}>Manage Questions</h2><Card>{["Question Text", "Option A", "Option B", "Option C", "Option D", "Correct Option"].map((label) => <Field key={label} label={label}><input placeholder={label} style={inputStyle} /></Field>)}<Button>Add Question</Button></Card></section>;
  if (view === "admin-users") return <section><h2 style={{ color: COLORS.text }}>Manage Users</h2><Card><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{["Name", "Email", "Tests", "Avg Score", "Joined", "Action"].map((h) => <th key={h} style={{ color: COLORS.textMuted, textAlign: "left", padding: "8px", borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>)}</tr></thead><tbody>{users.map((u) => <tr key={u.email}>{[u.name, u.email, u.tests, `${u.avg}%`, u.joined].map((v) => <td key={v} style={{ color: COLORS.text, padding: "10px 8px", borderBottom: `1px solid ${COLORS.border}` }}>{v}</td>)}<td style={{ padding: 8, borderBottom: `1px solid ${COLORS.border}` }}><Button variant="danger" size="sm">Remove</Button></td></tr>)}</tbody></table></div></Card></section>;
  if (view === "admin-reports") return <section><h2 style={{ color: COLORS.text }}>Reports</h2><div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}><Card><h4 style={{ color: COLORS.text }}>Module Performance</h4>{Object.entries(PROGRESS_DATA).map(([key, val]) => <ProgressRow key={key} name={key} value={val} />)}</Card><Card><h4 style={{ color: COLORS.text }}>Top Performers</h4>{users.sort((a, b) => b.avg - a.avg).map((u, i) => <p key={u.email} style={{ color: COLORS.textMuted }}><strong style={{ color: COLORS.text }}>#{i + 1}</strong> {u.name} - {u.avg}%</p>)}</Card></div></section>;
  return <section><h2 style={{ color: COLORS.text }}>Admin Dashboard</h2><div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: "1.5rem" }}>{[["Total Students", 42], ["Questions Bank", 185], ["Tests Taken", 312], ["Avg Platform Score", "72%"]].map(([label, value]) => <Card key={label}><div style={{ color: COLORS.accent2, fontSize: 26, fontWeight: 900 }}>{value}</div><div style={{ color: COLORS.textMuted }}>{label}</div></Card>)}</div><Card><h4 style={{ color: COLORS.text }}>Recent Activity</h4>{users.map((u) => <div key={u.email} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}><span style={{ color: COLORS.text }}>{u.name}<br /><small style={{ color: COLORS.textMuted }}>{u.email}</small></span><strong style={{ color: u.avg >= 75 ? COLORS.success : COLORS.warning }}>{u.avg}%</strong></div>)}</Card></section>;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("placeprep_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState(null);
  const [active, setActive] = useState(user?.role === "admin" ? "admin-dashboard" : "dashboard");

  const handleLogin = (nextUser) => {
    setUser(nextUser);
    setActive(nextUser.role === "admin" ? "admin-dashboard" : "dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("placeprep_user");
    setUser(null);
  };

  if (!user && !authMode) return <LandingPage onAuth={setAuthMode} />;
  if (!user) return <AuthScreen onLogin={handleLogin} initialMode={authMode} />;

  const renderContent = () => {
    if (user.role === "admin") return <AdminModule view={active} />;
    switch (active) {
      case "dashboard": return <Dashboard user={user} setActive={setActive} />;
      case "aptitude": return <AptitudeModule />;
      case "coding": return <CodingModule />;
      case "interview": return <InterviewModule />;
      case "resume": return <ResumeModule />;
      case "progress": return <ProgressModule />;
      case "ai": return <AIFeatures />;
      default: return <Dashboard user={user} setActive={setActive} />;
    }
  };

  return (
    <div className="app-shell" style={{ minHeight: "100vh", background: COLORS.primary, fontFamily: "Segoe UI, system-ui, sans-serif" }}>
      <Sidebar user={user} active={active} setActive={setActive} onLogout={handleLogout} />
      <main className="main-content" style={{ marginLeft: 240, padding: "2rem 2.5rem", minHeight: "100vh" }}>
        {renderContent()}
      </main>
    </div>
  );
}
