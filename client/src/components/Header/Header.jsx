import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { navItems } from "../../data/navigation";
import { useI18n } from "../../i18n/language.jsx";
import { AiMark } from "../AiMark/AiMark";
import { LanguageSwitch } from "../LanguageSwitch/LanguageSwitch";
import { Logo } from "../Logo/Logo";
import { MobileMenu } from "../MobileMenu/MobileMenu";
import "./Header.css";

export function Header() {
  const location = useLocation();
  const { t } = useI18n();
  const navRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pill, setPill] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) {
      return undefined;
    }
    const place = () => {
      const active = nav.querySelector("a.is-active");
      if (!active) {
        setPill(null);
        return;
      }
      const navBox = nav.getBoundingClientRect();
      const box = active.getBoundingClientRect();
      setPill({ left: box.left - navBox.left + 10, width: Math.max(16, box.width - 20) });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [location.pathname]);

  return (
    <header className={`header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container header__bar">
        <Logo />
        <nav className="header__nav" ref={navRef} aria-label={t("navLabel")}>
          {pill ? <span className="header__pill" style={{ left: pill.left, width: pill.width }} /> : null}
          {navItems.map((item) => (
            <NavLink key={item.href} to={item.href} className={({ isActive }) => (isActive ? "is-active" : "")}>
              {item.mark ? <AiMark className="nav-mark" /> : null}
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
        <LanguageSwitch />
        <button
          type="button"
          className={`burger ${open ? "is-open" : ""}`}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t("closeMenu") : t("openMenu")}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
