import { useRef } from "react";
import { BackHeader, BottomNav, HeaderActions, useScrollBounce } from "../components/mobile-ui";

const energyTabs = [
  { label: "전체" },
  { label: "세탁기", icon: "/washer.png" },
  { label: "건조기", icon: "/washer.png" },
];

function Care({ onGoBack, onGoHome, onOpenDevice, onOpenMenu }) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);

  useScrollBounce(scrollRef, contentRef);

  return (
    <section className="screen home-screen" aria-label="케어 페이지">
      <div className="home-scroll" ref={scrollRef}>
        <div className="home-scroll__content home-scroll__content--care" ref={contentRef}>
          <BackHeader title="3월 리포트" onBack={onGoBack} actions={<HeaderActions />} />

          <section className="care-alert-strip" aria-label="케어 알림">
            <p className="care-alert-strip__warning">
              <span className="care-alert-strip__icon" aria-hidden="true">!</span>
              <span>제품 이상 진단을 발견했어요</span>
            </p>
            <div className="care-alert-strip__grid">
              <div className="care-alert-chip">
                <span>스마트 진단</span>
                <strong>1건</strong>
              </div>
              <div className="care-alert-chip">
                <span>케어 알림</span>
                <strong>3건</strong>
              </div>
            </div>
          </section>

          <section className="care-section">
            <p className="care-section__eyebrow">가전 에너지 사용량</p>
            <article className="care-card care-card--hero">
              <div className="care-energy-headline">
                <div className="care-energy-price-row">
                  <strong>5,600</strong>
                  <span>원</span>
                </div>
                <p className="care-energy-kwh">
                  <span className="care-energy-kwh__bolt" aria-hidden="true">⚡</span>
                  <span>4.45KWh</span>
                </p>
              </div>
              <div className="care-burger" aria-hidden="true">
                <span className="care-burger__seed care-burger__seed--1" />
                <span className="care-burger__seed care-burger__seed--2" />
                <span className="care-burger__seed care-burger__seed--3" />
                <span className="care-burger__bun care-burger__bun--top" />
                <span className="care-burger__tomato" />
                <span className="care-burger__cheese" />
                <span className="care-burger__patty" />
                <span className="care-burger__lettuce" />
                <span className="care-burger__bun care-burger__bun--bottom" />
              </div>
              <p className="care-energy-caption">햄버거 1개 금액만큼 사용</p>
            </article>
          </section>

          <section className="care-section">
            <p className="care-section__eyebrow">가전 리포트</p>
            <div className="care-tab-row" role="tablist" aria-label="리포트 기기 선택">
              {energyTabs.map((tab, index) => (
                <button key={tab.label} type="button" className={`care-tab ${index === 0 ? "is-active" : ""}`}>
                  {tab.icon ? <img src={tab.icon} alt="" className="care-tab__device-icon" /> : null}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <article className="care-card care-card--report">
              <p className="care-card__label">사용 패턴 비교</p>
              <h3 className="care-pattern-copy">
                <span>지난 달 같은 기간 보다</span>
                <span className="care-pattern-copy__emphasis">
                  <strong>6회 더 많이</strong>
                  <em>사용중이에요</em>
                </span>
              </h3>
              <div className="care-bar-group">
                <div className="care-bar-row">
                  <span className="care-bar-row__label">이번 달</span>
                  <div className="care-bar-row__meter">
                    <div className="care-bar-track">
                      <div className="care-bar care-bar--current" style={{ width: "72%" }} />
                    </div>
                    <strong>16회</strong>
                  </div>
                </div>
                <div className="care-bar-row">
                  <span className="care-bar-row__label">지난 달</span>
                  <div className="care-bar-row__meter">
                    <div className="care-bar-track">
                      <div className="care-bar care-bar--previous" style={{ width: "45%" }} />
                    </div>
                    <strong>10회</strong>
                  </div>
                </div>
              </div>
            </article>

            <article className="care-card care-card--report">
              <p className="care-card__label">코스 정보</p>
              <h3 className="care-course-copy">
                주로 <strong>표준 세탁 코스</strong>를 사용하시네요
              </h3>
              <div className="care-course-chart" aria-hidden="true">
                <span className="care-course-chart__segment care-course-chart__segment--main" />
                <span className="care-course-chart__segment care-course-chart__segment--light" />
                <span className="care-course-chart__segment care-course-chart__segment--sub" />
              </div>
              <div className="care-legend-list">
                <div className="care-legend-item">
                  <span className="care-legend-dot care-legend-dot--main" />
                  <span>표준세탁</span>
                  <strong>8회(48.8%)</strong>
                </div>
                <div className="care-legend-item">
                  <span className="care-legend-dot care-legend-dot--light" />
                  <span>울세탁</span>
                  <strong>7회(40.0%)</strong>
                </div>
                <div className="care-legend-item">
                  <span className="care-legend-dot care-legend-dot--sub" />
                  <span>강력세탁</span>
                  <strong>1회(15.0%)</strong>
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>

      <BottomNav active="care" onHomeClick={onGoHome} onDeviceClick={onOpenDevice} onMenuClick={onOpenMenu} />
    </section>
  );
}

export default Care;
