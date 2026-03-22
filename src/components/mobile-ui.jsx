import { useEffect, useEffectEvent } from "react";

const MAX_BOUNCE_OFFSET = 44;

function IconButton({ children, label }) {
  return (
    <button type="button" className="icon-button" aria-label={label}>
      {children}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4a4 4 0 0 0-4 4v2.1c0 .7-.28 1.38-.78 1.88L6 13.2V15h12v-1.8l-1.22-1.22a2.66 2.66 0 0 1-.78-1.88V8a4 4 0 0 0-4-4Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 5.5 8 12l6.5 6.5" />
      <path d="M9 12h10" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.8V19h11v-8.2" />
      <path d="M10 19v-4.2h4V19" />
    </svg>
  );
}

function DeviceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="4.5" width="6" height="6" rx="1.2" />
      <rect x="13.5" y="4.5" width="6" height="6" rx="1.2" />
      <rect x="4.5" y="13.5" width="6" height="6" rx="1.2" />
      <rect x="13.5" y="13.5" width="6" height="6" rx="1.2" />
    </svg>
  );
}

function CareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4.5c2.2 2.2 5.5 4.1 5.5 8.1A5.5 5.5 0 0 1 12 18a5.5 5.5 0 0 1-5.5-5.4c0-4 3.3-5.9 5.5-8.1Z" />
      <path d="M9.6 13.4c.8.7 1.5 1 2.4 1s1.6-.3 2.4-1" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="5.5" width="14" height="13" rx="2" />
      <path d="M8 10h8M8 14h8" />
    </svg>
  );
}

function HeaderActions({ notificationText = "" }) {
  return (
    <div className="home-actions">
      <IconButton label="추가">
        <PlusIcon />
      </IconButton>
      <div className="home-actions__notice-wrap">
        <IconButton label="알림">
          <BellIcon />
        </IconButton>
        {notificationText ? <span className="home-actions__notice">{notificationText}</span> : null}
      </div>
      <IconButton label="더보기">
        <DotsIcon />
      </IconButton>
    </div>
  );
}

function BackHeader({ title, onBack, actions = null, className = "" }) {
  return (
    <header className={`subpage-header ${className}`.trim()}>
      <button type="button" className="subpage-header__back" onClick={onBack} aria-label="뒤로가기">
        <span className="subpage-header__back-icon">
          <BackIcon />
        </span>
        <span>{title}</span>
      </button>
      {actions}
    </header>
  );
}

function NavItem({ active, icon, label, onClick }) {
  return (
    <button type="button" className={`nav-item ${active ? "is-active" : ""}`} onClick={onClick}>
      <span className="nav-item__icon">{icon}</span>
      <span className="nav-item__label">{label}</span>
    </button>
  );
}

function BottomNav({ active = "home", onHomeClick, onDeviceClick, onCareClick, onMenuClick }) {
  return (
    <nav className="bottom-nav" aria-label="하단 네비게이션">
      <NavItem active={active === "home"} icon={<HomeIcon />} label="홈" onClick={onHomeClick} />
      <NavItem active={active === "device"} icon={<DeviceIcon />} label="디바이스" onClick={onDeviceClick} />
      <NavItem active={active === "care"} icon={<CareIcon />} label="케어" onClick={onCareClick} />
      <NavItem active={active === "menu"} icon={<MenuIcon />} label="메뉴" onClick={onMenuClick} />
    </nav>
  );
}

function useScrollBounce(scrollRef, contentRef) {
  const setBounce = useEffectEvent((offset, immediate) => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    content.style.setProperty("--bounce-offset", `${offset}px`);

    if (immediate) {
      content.classList.add("is-bounce-active");
    } else {
      content.classList.remove("is-bounce-active");
    }
  });

  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;

    if (!scroller || !content) {
      return undefined;
    }

    let resetTimer = 0;
    let touchStartY = 0;
    let touchStartScrollTop = 0;

    const releaseBounce = () => {
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        setBounce(0, false);
      }, 34);
    };

    const clamp = (value) => Math.max(-MAX_BOUNCE_OFFSET, Math.min(MAX_BOUNCE_OFFSET, value));

    const wheelHandler = (event) => {
      const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const atTop = scroller.scrollTop <= 0;
      const atBottom = scroller.scrollTop >= maxScroll - 1;
      const shouldBounce = (atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0);

      if (!shouldBounce) {
        return;
      }

      event.preventDefault();
      setBounce(clamp(-event.deltaY * 0.16), true);
      releaseBounce();
    };

    const touchStartHandler = (event) => {
      if (event.touches.length !== 1) {
        return;
      }

      touchStartY = event.touches[0].clientY;
      touchStartScrollTop = scroller.scrollTop;
    };

    const touchMoveHandler = (event) => {
      if (event.touches.length !== 1) {
        return;
      }

      const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const deltaY = event.touches[0].clientY - touchStartY;
      const atTop = touchStartScrollTop <= 0 && scroller.scrollTop <= 0 && deltaY > 0;
      const atBottom =
        touchStartScrollTop >= maxScroll - 1 && scroller.scrollTop >= maxScroll - 1 && deltaY < 0;

      if (!atTop && !atBottom) {
        return;
      }

      event.preventDefault();
      setBounce(clamp(deltaY * 0.32), true);
    };

    const touchEndHandler = () => {
      releaseBounce();
    };

    scroller.addEventListener("wheel", wheelHandler, { passive: false });
    scroller.addEventListener("touchstart", touchStartHandler, { passive: true });
    scroller.addEventListener("touchmove", touchMoveHandler, { passive: false });
    scroller.addEventListener("touchend", touchEndHandler, { passive: true });
    scroller.addEventListener("touchcancel", touchEndHandler, { passive: true });

    return () => {
      window.clearTimeout(resetTimer);
      scroller.removeEventListener("wheel", wheelHandler);
      scroller.removeEventListener("touchstart", touchStartHandler);
      scroller.removeEventListener("touchmove", touchMoveHandler);
      scroller.removeEventListener("touchend", touchEndHandler);
      scroller.removeEventListener("touchcancel", touchEndHandler);
    };
  }, [contentRef, scrollRef, setBounce]);
}

export { BackHeader, BottomNav, HeaderActions, useScrollBounce };
