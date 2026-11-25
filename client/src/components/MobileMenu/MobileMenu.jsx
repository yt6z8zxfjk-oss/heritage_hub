import { useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { useI18n } from "../../i18n/language.jsx";
import { AiMark } from "../AiMark/AiMark";
import { LanguageSwitch } from "../LanguageSwitch/LanguageSwitch";
import { useOblast } from "../../i18n/oblast.jsx";
import { navItems } from "../../data/navigation";
import "./MobileMenu.css";

export function MobileMenu({ open, onClose }) {
  const { t } = useI18n();
  const { id, name } = useOblast();
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return createPortal(
    <div
      id="mobile-menu"
      className={`mobile-menu ${open ? "is-open" : ""}`}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label={t("menu")}
    >
      <div className="mobile-menu__sheet">
        <div className="mobile-menu__brand">
          <img src={`/flags/${id}.svg`} alt="" />
          <div>
            <span className="logo__title">
              <span className="logo__title-wide">Спадчына</span>
              <span className="logo__title-peak">Роднага Краю</span>
            </span>
            <span>{name}</span>
          </div>
        </div>
        <LanguageSwitch />
        <nav className="mobile-menu__nav" aria-label={t("navLabel")}>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => (isActive ? "is-active" : "")}
              onClick={onClose}
            >
              {item.mark ? <AiMark className="nav-mark" /> : null}
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>,
    document.body
  );
}
