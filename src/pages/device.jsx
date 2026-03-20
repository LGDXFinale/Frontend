import { useRef } from "react";
import { BackHeader, BottomNav, HeaderActions, useScrollBounce } from "../components/mobile-ui";

const favoriteDevices = [
  { label: "세탁기", type: "washer", image: "/washer.png" },
  { label: "에어컨", type: "aircon", image: "/aircon.png" },
  { label: "공기청정기", type: "purifier" },
  { label: "건조기", type: "dryer", image: "/washer.png" },
];

function FavoriteDeviceCard({ label, type, image }) {
  return (
    <div className="favorite-device-card">
      <div className="favorite-device-card__tile">
        <div className={`favorite-device-card__icon favorite-device-card__icon--${type}`} aria-hidden="true">
          {image ? <img src={image} alt="" className="favorite-device-card__image" /> : null}
        </div>
      </div>
      <p className="favorite-device-card__label">{label}</p>
    </div>
  );
}

function Device({ profileName, onGoBack, onGoHome, onOpenCare, onOpenMenu }) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);

  useScrollBounce(scrollRef, contentRef);

  return (
    <section className="screen home-screen" aria-label="디바이스">
      <div className="home-scroll" ref={scrollRef}>
        <div className="home-scroll__content home-scroll__content--device" ref={contentRef}>
          <BackHeader title="디바이스" onBack={onGoBack} actions={<HeaderActions />} />

          <section className="device-section">
            <button type="button" className="device-register-card">
              <span className="device-register-card__plus" aria-hidden="true" />
              <span className="device-register-card__label">제품 등록</span>
            </button>
          </section>

          <section className="device-section">
            <h2 className="device-section__title">즐겨 찾는 제품</h2>
            <div className="favorite-device-grid">
              {favoriteDevices.map((device) => (
                <FavoriteDeviceCard
                  key={device.label}
                  label={device.label}
                  type={device.type}
                  image={device.image}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      <BottomNav active="device" onHomeClick={onGoHome} onCareClick={onOpenCare} onMenuClick={onOpenMenu} />
    </section>
  );
}

export default Device;
