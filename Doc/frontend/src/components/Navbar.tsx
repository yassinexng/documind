interface NavbarProps {
  username: string;
  onLogout: () => void;
}

export default function Navbar({ username, onLogout }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">DocuMind</div>
      <div className="navbar-user">
        <span>{username}</span>
        <button onClick={onLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
}