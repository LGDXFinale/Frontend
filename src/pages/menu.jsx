import { useRef } from "react";
import "./menu.css";
import { BottomNav, useScrollBounce } from "../components/mobile-ui";

const quickCards = [
  { title: "마이페이지", type: "mypage" },
  { title: "고객 지원", type: "support" },
];

const menuGroups = [
  {
    label: "쇼핑",
    items: [
      { title: "LG 스토어", meta: "소모품/제품", type: "store", image: "/subscription.png" },
    ],
  },
  {
    label: "구독",
    items: [
      { title: "LG전자 구독", meta: "", type: "subscription", image: "/c.png" },
    ],
  },
];

const externalLinks = {
  store: "https://www.lge.co.kr/benefits/exhibitions/detail-PE00385001?eventCode=aoexngdn&utm_source=gdn&utm_medium=banner&utm_campaign=20230701_pmax_feed_ao_only_pp&utm_content=gdn_pmax_feed_pur_ao_nt&utm_term=google_pmax_ao&gad_source=1&gad_campaignid=20361266572&gbraid=0AAAAABWck5ePnH-ABUPzOl1sfobg5BroS&gclid=Cj0KCQjwpv7NBhCzARIsADkIfWxDoCaWlBP6Ye-pkEHof2FYRPV_VztyC-VQcdYKDELPrlQ5xfFOwdMaAvtUEALw_wcB",
  subscription: "https://www.lge.co.kr/care-solutions",
};

const footerLinks = [
  "LGE.COM",
  "LG전자 멤버십",
  "LG 베스트샵",
  "개인정보처리방침",
  "이벤트 개인정보처리방침",
  "이용약관",
  "위치기반서비스 이용약관",
];

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 5.5 8 12l6.5 6.5" />
      <path d="M9 12h10" />
    </svg>
  );
}

function QuickIcon({ type }) {
  if (type === "support") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.5 11.2V9.8a4.5 4.5 0 1 1 9 0v1.4" />
        <rect x="5.2" y="10.8" width="3.2" height="5.9" rx="1.2" />
        <rect x="15.6" y="10.8" width="3.2" height="5.9" rx="1.2" />
        <path d="M16 17.4a3.4 3.4 0 0 1-3.1 1.8H12" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="7.7" r="3" />
      <path d="M6.3 18.2a5.7 5.7 0 0 1 11.4 0" />
    </svg>
  );
}

function MenuListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.6v4.7h3.7" />
    </svg>
  );
}

function openExternalLink(type) {
  const targetUrl = externalLinks[type];

  if (!targetUrl) {
    return;
  }

  window.open(targetUrl, "_blank", "noopener,noreferrer");
}

function Menu({ onGoBack, onGoHome, onOpenDevice, onOpenCare, onOpenMyPage }) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);

  useScrollBounce(scrollRef, contentRef);

  return (
    <section className="screen menu-screen" aria-label="메뉴">
      <div className="home-scroll" ref={scrollRef}>
        <div className="home-scroll__content home-scroll__content--menu" ref={contentRef}>
          <header className="menu-header">
            <button type="button" className="menu-header__back" onClick={onGoBack} aria-label="뒤로가기">
              <span className="menu-header__back-icon"><BackIcon /></span>
              <span>LG ThinQ</span>
            </button>
            <button type="button" className="menu-header__settings" aria-label="설정">
              <img src="/setting.png" alt="" className="menu-header__settings-image" />
            </button>
          </header>

          <section className="menu-quick-grid">
            {quickCards.map((card) => (
              <button
                key={card.title}
                type="button"
                className="menu-quick-card"
                onClick={card.type === "mypage" ? onOpenMyPage : undefined}
              >
                <span className={`menu-quick-card__icon menu-quick-card__icon--${card.type}`}>
                  <QuickIcon type={card.type} />
                </span>
                <span className="menu-quick-card__label">{card.title}</span>
              </button>
            ))}
          </section>

          {menuGroups.map((group) => (
            <section key={group.label} className="menu-group">
              <h2 className="menu-group__title">{group.label}</h2>
              <div className="menu-list">
                {group.items.map((item) => (
                  <button key={item.title} type="button" className="menu-list-card" onClick={() => openExternalLink(item.type)}>
                    <span className={`menu-list-card__icon menu-list-card__icon--${item.type}`}>
                      {item.image ? (
                        <img src={item.image} alt="" className="menu-list-card__image" />
                      ) : (
                        <MenuListIcon />
                      )}
                    </span>
                    <span className="menu-list-card__content">
                      <span className="menu-list-card__title">{item.title}</span>
                    </span>
                    {item.meta ? <span className="menu-list-card__meta">{item.meta}</span> : null}
                  </button>
                ))}
              </div>
            </section>
          ))}

          <footer className="menu-footer">
            <div className="menu-footer__links menu-footer__links--primary">
              {footerLinks.slice(0, 3).map((link) => (
                <button key={link} type="button" className="menu-footer__link">{link}</button>
              ))}
            </div>
            <div className="menu-footer__links menu-footer__links--secondary">
              {footerLinks.slice(3).map((link) => (
                <button key={link} type="button" className="menu-footer__link menu-footer__link--secondary">
                  {link}
                </button>
              ))}
            </div>
          </footer>
        </div>
      </div>

      <BottomNav active="menu" onHomeClick={onGoHome} onDeviceClick={onOpenDevice} onCareClick={onOpenCare} />
    </section>
  );
}

export default Menu;
