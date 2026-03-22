import { useRef, useState } from "react";
import "./laundry.css";
import { BackHeader, BottomNav, HeaderActions, useScrollBounce } from "../components/mobile-ui";

const laundryCards = [
  {
    title: "\uC138\uD0C1 \uC804, \uCD5C\uC801\uC758 \uC138\uD0C1 \uD0C0\uC774\uBC0D\uC744 \uC54C\uB824\uB4DC\uB824\uC694",
    src: "/laundry-card-1.png",
    fallback: "\uC138\uD0C1 \uC804 \uC548\uB0B4 \uC774\uBBF8\uC9C0",
  },
  {
    title: "\uC138\uD0C1 \uC911, \uAC71\uC815\uC5C6\uC774 \uC138\uD0C1 \uC9C4\uD589 \uC0C1\uD669\uC744 \uC54C\uB824\uB4DC\uB824\uC694",
    src: "/laundry-card-2.png",
    fallback: "\uC138\uD0C1 \uC911 \uC548\uB0B4 \uC774\uBBF8\uC9C0",
  },
  {
    title: "\uC138\uD0C1 \uD6C4, \uB531 \uB9DE\uB294 \uAC74\uC870 \uBC29\uC2DD\uC744 \uCD94\uCC9C\uB4DC\uB824\uC694",
    src: "/laundry-card-3.png",
    fallback: "\uAC74\uC870 \uCD94\uCC9C \uC548\uB0B4 \uC774\uBBF8\uC9C0",
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

function Laundry({
  profileName,
  onGoBack,
  onGoHome,
  onOpenDevice,
  onOpenCare,
  onOpenMenu,
  onOpenTiming,
  onOpenProgress,
  onOpenDry,
}) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const laundryTitle = `${profileName}\uC758 \uC138\uD0C1\uAE30`;

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
                  onClick={index === 0 ? onOpenTiming : index === 1 ? onOpenProgress : index === 2 ? onOpenDry : undefined}
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
