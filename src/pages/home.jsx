import { useRef } from "react";
import "./home.css";
import { BottomNav, HeaderActions, useScrollBounce } from "../components/mobile-ui";

function Home({ profileName, onOpenLaundry, onOpenDevice, onOpenCare, onOpenMenu }) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const homeTitle = `${profileName} 홈`;

  useScrollBounce(scrollRef, contentRef);

  return (
    <section className="screen home-screen" aria-label={homeTitle}>
      <div className="home-scroll" ref={scrollRef}>
        <div className="home-scroll__content" ref={contentRef}>
          <header className="home-header">
            <div>
              <button type="button" className="home-title">
                {homeTitle}
                <span className="home-title__chevron" aria-hidden="true">
                  ▾
                </span>
              </button>
            </div>
            <HeaderActions />
          </header>

          <section className="home-section">
            <p className="section-kicker">ThinQ Agent 활용하기</p>
            <button type="button" className="agent-card agent-card--button" onClick={onOpenLaundry}>
              <div className="agent-card__hero">
                <div className="agent-card__copy">
                  <h2>Zero-Touch Laundry Care</h2>
                </div>
                <div className="agent-card__washer" aria-hidden="true">
                  <img src="/washer.png" alt="" className="agent-card__washer-image" />
                </div>
              </div>
              <div className="agent-card__footer">
                <p>세탁, 걱정없이 한 큐에 해결해요</p>
              </div>
            </button>
          </section>
        </div>
      </div>

      <BottomNav active="home" onDeviceClick={onOpenDevice} onCareClick={onOpenCare} onMenuClick={onOpenMenu} />
    </section>
  );
}

export default Home;




