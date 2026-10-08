const AuthIllustration = () => (
  <svg
    className="auth-person-illustration"
    viewBox="0 0 360 300"
    role="img"
    aria-label="Illustration of a team member holding a project clipboard"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="auth-shirt" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#f9fcf7" />
        <stop offset="1" stopColor="#dcebdd" />
      </linearGradient>
      <linearGradient id="auth-jacket" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#70a879" />
        <stop offset="1" stopColor="#39724d" />
      </linearGradient>
    </defs>

    <circle cx="182" cy="148" r="112" fill="#d8ebd8" opacity=".18" />
    <circle cx="268" cy="76" r="23" fill="#a7d7a9" opacity=".95" />
    <path d="M260 76c0-8 10-10 13-3 4-7 14-5 14 3 0 7-14 16-14 16s-13-9-13-16Z" fill="#fff" />

    {/* Decorative leaves */}
    <path d="M58 269c7-31 5-52-2-77m2 44c-17-5-25-17-23-30 16 1 26 10 25 24m-1-10c14-7 19-19 14-31-14 6-20 16-16 29m3 33c13-10 26-10 35-1-10 12-23 15-35 7" fill="none" stroke="#b9dfb9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    <path d="M290 269c-4-22 0-43 11-67m-8 41c-13-7-18-17-15-28 13 3 20 11 19 23m0-9c13-8 16-20 10-30-12 7-16 17-11 29m-6 28c12-10 24-10 32-1-9 11-21 14-32 7" fill="none" stroke="#a9d4ad" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    <ellipse cx="181" cy="278" rx="94" ry="12" fill="#173d2b" opacity=".18" />

    {/* Character hair and face */}
    <path d="M119 106c-8-37 10-71 46-76 36-5 62 22 55 62l-7 47-87 2-7-35Z" fill="#18372c" />
    <path d="M137 91c0-25 15-43 36-43s36 18 36 43v31c0 24-16 42-36 42s-36-18-36-42V91Z" fill="#e9bfa6" />
    <path d="M133 101c-13-5-19 5-14 17 3 8 10 11 18 9m76-26c13-5 19 5 14 17-3 8-10 11-18 9" fill="#e9bfa6" />
    <path d="M136 96c8-7 16-17 19-29 14 14 34 19 57 16-4-24-20-38-42-38-23 0-39 17-42 40l-3 26 11-15Z" fill="#18372c" />
    <path d="M151 111h2m38 0h2" stroke="#294538" strokeLinecap="round" strokeWidth="4" />
    <path d="M165 130c5 4 11 4 16 0" fill="none" stroke="#b96e66" strokeLinecap="round" strokeWidth="2.5" />
    <path d="M159 160v20h30v-20" fill="#e2ad93" />

    {/* Outfit and arms */}
    <path d="M110 272v-47c0-34 20-57 49-64l15 21 15-21c29 7 49 30 49 64v47H110Z" fill="url(#auth-jacket)" />
    <path d="m159 161 15 21 15-21 16 6-15 34h-32l-15-34 16-6Z" fill="url(#auth-shirt)" />
    <path d="M117 207c-17 19-19 40-3 55 14 13 32 6 48-5l28-21-13-16-28 17c-7 4-12 5-15 1-3-4 1-10 7-17l12-14-17-13-19 13Z" fill="#4b8759" />
    <path d="M243 207c17 19 19 40 3 55-13 12-30 7-46-4l-27-18 12-17 27 16c7 4 12 5 15 1 3-4-1-10-7-17l-11-14 17-13 17 11Z" fill="#5b9865" />
    <path d="M144 246c17 9 35 9 51 0" fill="none" stroke="#cce4cb" strokeLinecap="round" strokeWidth="4" />

    {/* Project clipboard */}
    <g transform="rotate(-5 190 217)">
      <rect x="165" y="177" width="66" height="91" rx="9" fill="#f8fbf6" stroke="#bdd5bd" strokeWidth="2" />
      <rect x="184" y="171" width="28" height="12" rx="5" fill="#80ae81" />
      <path d="m177 203 4 4 7-8m5 5h24m-40 13 4 4 7-8m5 5h24m-40 13 4 4 7-8m5 5h16" fill="none" stroke="#54835b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </g>
  </svg>
);

export default AuthIllustration;
