import { useState } from 'react';
import logo from '../assets/logo.jpeg';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header>
      <div className="nav wrap">
        <a href="#top" className="logo">
          <img src={logo} alt="Quantum Car Hire" />
        </a>
        <div className="nav-right">
          <nav className={`nav-links${menuOpen ? ' open' : ''}`} id="navLinks">
            <a href="#fleet" onClick={closeMenu}>
              Fleet & rates
            </a>
            <a href="#info" onClick={closeMenu}>
              How it works
            </a>
            <a href="#faq" onClick={closeMenu}>
              FAQ
            </a>
            <a href="#contact" onClick={closeMenu}>
              Contact
            </a>
          </nav>
          <a href="#book" className="btn btn-primary">
            Book now
          </a>
          <button
            className="burger"
            id="burgerBtn"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
