import { useState, useRef } from "react";
import "./laundry.css";
import { BackHeader, BottomNav, HeaderActions, useScrollBounce } from "../components/mobile-ui";

const laundryCards = [
  {
    title: "세탁 전, 최적의 세탁 타이밍을 알려드려요",
    src: "/laundry-card-1.png",
    fallback: "세탁 전 안내 이미지",
  },
  {
    title: "세탁 중, 걱정없이 세탁 진행 상황을 알려드려요",
    src: "/laundry-card-2.png",
    fallback: "세탁 중 안내 이미지",
  },
  {
    title: "세탁 후, 딱 맞는 건조 방식을 추천드려요",
    src: "/laundry-card-3.png",
    fallback: "건조 추천 안내 이미지",
  },
];

function SmartImageCard({ src, alt, caption, cardClassName, onClick }) {
  const [hasError, setHasError] = useState(false);
  const Tag = onClick ? "button" : "article";

  return (
    <Tag
      {...(onClick ? { type: "button", onClick } : {})}
      className={`laundry-story-card ${cardClassName} ${onClick ? "laundry-story-card--button" : ""}`}
    >
      <div className={`laundry-story-card__visual ${hasError ? "is-fallback" : ""}`}>
        {!hasError ? (
          <img src={src} alt={alt} className="laundry-story-card__image" onError={() => setHasError(true)} />
        ) : (
          <div className="laundry-story-card__placeholder" aria-hidden="true">
            <span>{alt}</span>
          </div>
        )}
      </div>
      <div className="laundry-story-card__caption">
        <p>{caption}</p>
      </div>
    </Tag>
  );
}

function Laundry({ profileName, onGoBack, onGoHome, onOpenDevice, onOpenCare, onOpenMenu, onOpenTiming }) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const laundryTitle = `${profileName}의 세탁기`;

  useScrollBounce(scrollRef, contentRef);

  return (
    <section className="screen home-screen" aria-label={laundryTitle}>
      <div className="home-scroll" ref={scrollRef}>
        <div className="home-scroll__content home-scroll__content--laundry" ref={contentRef}>
          <BackHeader title={laundryTitle} onBack={onGoBack} actions={<HeaderActions />} />

          <section className="home-section laundry-section">
            <p className="section-kicker section-kicker--detail">Zero-Touch Laundry Care</p>
            <div className="laundry-story-list">
              {laundryCards.map((card, index) => (
                <SmartImageCard
                  key={card.src}
                  src={card.src}
                  alt={card.fallback}
                  caption={card.title}
                  cardClassName={`laundry-story-card--${index + 1}`}
                  onClick={index === 0 ? onOpenTiming : undefined}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      <BottomNav
        active="home"
        onHomeClick={onGoHome}
        onDeviceClick={onOpenDevice}
        onCareClick={onOpenCare}
        onMenuClick={onOpenMenu}
      />
    </section>
  );
}

export default Laundry;




