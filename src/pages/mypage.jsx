import { useEffect, useRef, useState } from "react";
import "./mypage.css";
import { BottomNav, useScrollBounce } from "../components/mobile-ui";

const householdOptions = Array.from({ length: 10 }, (_, index) => index + 1);

const manualLocationOptions = [
  { id: "mapo-seogyo", label: "\uC11C\uC6B8\uC2DC \uB9C8\uD3EC\uAD6C", detail: "\uC11C\uC6B8\uC2DC \uB9C8\uD3EC\uAD6C \uC11C\uAD50\uB3D9", latitude: 37.5552, longitude: 126.9229 },
  { id: "seodaemun-yeonhui", label: "\uC11C\uC6B8\uC2DC \uC11C\uB300\uBB38\uAD6C", detail: "\uC11C\uC6B8\uC2DC \uC11C\uB300\uBB38\uAD6C \uC5F0\uD76C\uB3D9", latitude: 37.5734, longitude: 126.9332 },
  { id: "hwaseong-byeongjeom", label: "\uD654\uC131\uC2DC \uBCD1\uC810\uB3D9", detail: "\uACBD\uAE30\uB3C4 \uD654\uC131\uC2DC \uBCD1\uC810\uB3D9", latitude: 37.2077, longitude: 127.0336 },
  { id: "suwon-yeongtong", label: "\uC218\uC6D0\uC2DC \uC601\uD1B5\uAD6C", detail: "\uACBD\uAE30\uB3C4 \uC218\uC6D0\uC2DC \uC601\uD1B5\uAD6C \uC601\uD1B5\uB3D9", latitude: 37.2515, longitude: 127.071 },
  { id: "busan-haeundae", label: "\uBD80\uC0B0\uC2DC \uD574\uC6B4\uB300\uAD6C", detail: "\uBD80\uC0B0\uC2DC \uD574\uC6B4\uB300\uAD6C \uC6B0\uB3D9", latitude: 35.1631, longitude: 129.1635 },
  { id: "daejeon-yuseong", label: "\uB300\uC804\uC2DC \uC720\uC131\uAD6C", detail: "\uB300\uC804\uC2DC \uC720\uC131\uAD6C \uBD09\uBA85\uB3D9", latitude: 36.3551, longitude: 127.3417 },
  { id: "jeju-ara", label: "\uC81C\uC8FC\uC2DC \uC544\uB77C\uB3D9", detail: "\uC81C\uC8FC\uC2DC \uC544\uB77C\uC77C\uB3D9", latitude: 33.4735, longitude: 126.5459 },
];

function getManualLocationOptionById(optionId) {
  return manualLocationOptions.find((option) => option.id === optionId) ?? null;
}

function buildManualLocation(optionId) {
  const selectedOption = getManualLocationOptionById(optionId);

  if (!selectedOption) {
    return null;
  }

  return {
    ...selectedOption,
    source: "manual",
    manualId: selectedOption.id,
    updatedAt: new Date().toISOString(),
  };
}

function getManualLocationOptionId(location) {
  if (!location || location.source !== "manual") {
    return "";
  }

  if (location.manualId && getManualLocationOptionById(location.manualId)) {
    return location.manualId;
  }

  const matchedOption = manualLocationOptions.find((option) => option.label === location.label && option.detail === location.detail);
  return matchedOption?.id ?? "";
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 5.5 8 12l6.5 6.5" />
      <path d="M9 12h10" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4.8 15.7 8.9-8.9 3.5 3.5-8.9 8.9-4.4.8.9-4.3Z" />
      <path d="m12.9 7.5 2.2-2.2a1.8 1.8 0 0 1 2.6 0l1 1a1.8 1.8 0 0 1 0 2.6l-2.2 2.2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function formatLocationUpdatedAt(updatedAt) {
  if (!updatedAt) {
    return "";
  }

  const parsedDate = new Date(updatedAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

async function reverseGeocodeLocation(latitude, longitude) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18",
    addressdetails: "1",
    "accept-language": "ko",
  });

  const response = await fetch(
    "https://nominatim.openstreetmap.org/reverse?" + params.toString(),
  );

  if (!response.ok) {
    throw new Error("reverse geocode " + response.status);
  }

  const result = await response.json();
  const address = result.address ?? {};
  const district = address.city_district || address.borough || address.county || address.city || address.state_district || "";
  const neighborhood = address.suburb || address.neighbourhood || address.quarter || address.hamlet || address.village || address.town || "";
  const label = [district, neighborhood].filter(Boolean).join(" ").trim();
  const detail = result.display_name
    ? result.display_name
        .split(",")
        .map((token) => token.trim())
        .slice(0, 3)
        .join(" ")
    : "\uC704\uB3C4 " + latitude.toFixed(4) + ", \uACBD\uB3C4 " + longitude.toFixed(4);

  return {
    label: label || "\uD604\uC7AC \uC704\uCE58",
    detail,
  };
}

function MyPage({
  profileName,
  householdSize,
  shareDeviceStatus,
  userLocation,
  onChangeProfileName,
  onChangeUserLocation,
  onChangeHouseholdSize,
  onToggleShareDeviceStatus,
  onGoBack,
  onGoHome,
  onOpenDevice,
  onOpenCare,
  onOpenMenu,
}) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const pickerRefs = useRef([]);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isHouseholdPickerOpen, setIsHouseholdPickerOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(profileName);
  const [locationDraft, setLocationDraft] = useState(userLocation);
  const [locationMode, setLocationMode] = useState(userLocation?.source === "gps" ? "gps" : "manual");
  const [selectedManualLocationId, setSelectedManualLocationId] = useState(getManualLocationOptionId(userLocation));
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  useScrollBounce(scrollRef, contentRef);

  useEffect(() => {
    setNameDraft(profileName);
  }, [profileName]);

  useEffect(() => {
    setLocationDraft(userLocation);
    setLocationMode(userLocation?.source === "gps" ? "gps" : "manual");
    setSelectedManualLocationId(getManualLocationOptionId(userLocation));
  }, [userLocation]);

  useEffect(() => {
    if (!isHouseholdPickerOpen) {
      return undefined;
    }

    const selectedOption = pickerRefs.current[householdSize - 1];

    if (!selectedOption) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      selectedOption.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 60);

    return () => window.clearTimeout(timer);
  }, [householdSize, isHouseholdPickerOpen]);

  const openProfileEditor = () => {
    setNameDraft(profileName);
    setLocationDraft(userLocation);
    setLocationMode(userLocation?.source === "gps" ? "gps" : "manual");
    setSelectedManualLocationId(getManualLocationOptionId(userLocation));
    setLocationMessage("");
    setLocationError("");
    setIsProfileEditorOpen(true);
  };

  const handleUseCurrentLocation = () => {
    setLocationMode("gps");

    if (!("geolocation" in navigator)) {
      setLocationError("\uC774 \uBE0C\uB77C\uC6B0\uC800\uC5D0\uC11C\uB294 \uC704\uCE58 \uC124\uC815\uC744 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC544\uC694.");
      setLocationMessage("");
      return;
    }

    setIsLocating(true);
    setLocationError("");
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));

        try {
          const resolvedLocation = await reverseGeocodeLocation(latitude, longitude);

          setLocationDraft({
            label: resolvedLocation.label,
            detail: resolvedLocation.detail,
            latitude,
            longitude,
            source: "gps",
            updatedAt: new Date().toISOString(),
          });
          setLocationMessage("\uD604\uC7AC \uC704\uCE58\uB97C \uAC00\uC838\uC654\uC5B4\uC694. \uC800\uC7A5\uD574\uC8FC\uC138\uC694.");
        } catch {
          setLocationDraft({
            label: "\uD604\uC7AC \uC704\uCE58 \uC0AC\uC6A9 \uC911",
            detail: "\uC704\uB3C4 " + latitude.toFixed(4) + ", \uACBD\uB3C4 " + longitude.toFixed(4),
            latitude,
            longitude,
            source: "gps",
            updatedAt: new Date().toISOString(),
          });
          setLocationMessage("\uD604\uC7AC \uC704\uCE58\uB97C \uAC00\uC838\uC654\uC5B4\uC694. \uC8FC\uC18C \uC815\uBCF4\uB294 \uD655\uC778\uD558\uC9C0 \uBABB\uD574 \uC88C\uD45C\uB85C \uC800\uC7A5\uD574\uB458\uAC8C\uC694.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        const errorMessage =
          error.code === error.PERMISSION_DENIED
            ? "\uC704\uCE58 \uAD8C\uD55C\uC774 \uD5C8\uC6A9\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694. \uAD8C\uD55C\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694."
            : "\uC704\uCE58 \uC815\uBCF4\uB97C \uAC00\uC838\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694. \uB2E4\uC2DC \uD55C \uBC88 \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.";

        setLocationError(errorMessage);
        setLocationMessage("");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleManualLocationSelect = (optionId) => {
    const nextLocation = buildManualLocation(optionId);

    setLocationMode("manual");
    setSelectedManualLocationId(optionId);
    setLocationError("");

    if (!nextLocation) {
      setLocationMessage("");
      return;
    }

    setLocationDraft(nextLocation);
    setLocationMessage("\uC9C1\uC811 \uC9C0\uC815\uD55C \uC9C0\uC5ED\uC73C\uB85C \uC800\uC7A5\uD560\uAC8C\uC694.");
  };

  const handleProfileSave = () => {
    const nextName = nameDraft.trim();

    if (!nextName) {
      return;
    }

    const nextLocation = locationMode === "manual"
      ? buildManualLocation(selectedManualLocationId) ?? locationDraft
      : locationDraft;

    onChangeProfileName(nextName);
    onChangeUserLocation(nextLocation);
    setIsProfileEditorOpen(false);
  };

  const profileInitial = profileName.trim().charAt(0) || "P";
  const locationUpdatedAt = formatLocationUpdatedAt(userLocation.updatedAt);

  return (
    <section className="screen mypage-screen" aria-label="\uB9C8\uC774\uD398\uC774\uC9C0">
      <div className="home-scroll" ref={scrollRef}>
        <div className="home-scroll__content home-scroll__content--mypage" ref={contentRef}>
          <header className="mypage-header">
            <button type="button" className="mypage-header__back" onClick={onGoBack} aria-label="\uBA54\uB274\uB85C \uB3CC\uC544\uAC00\uAE30">
              <span className="mypage-header__back-icon">
                <BackIcon />
              </span>
              <span>{"\uB9C8\uC774\uD398\uC774\uC9C0"}</span>
            </button>
          </header>

          <section className="mypage-profile-card">
            <div className="mypage-profile">
              <div className="mypage-avatar">
                <span>{profileInitial}</span>
                <button type="button" className="mypage-avatar__edit" onClick={openProfileEditor} aria-label="\uB0B4 \uC815\uBCF4 \uC218\uC815">
                  <PencilIcon />
                </button>
              </div>

              <div className="mypage-profile__body">
                <div className="mypage-profile__name-row">
                  <strong>{profileName}</strong>
                  <button type="button" className="mypage-inline-edit" onClick={openProfileEditor} aria-label="\uB0B4 \uC815\uBCF4 \uC218\uC815">
                    <PencilIcon />
                  </button>
                </div>
                <div className="mypage-profile__meta">
                  <p className="mypage-profile__location">{userLocation.label}</p>
                  <p className="mypage-profile__location-detail">{userLocation.detail}</p>
                  {locationUpdatedAt ? <p className="mypage-profile__location-time">{"\uCD5C\uADFC \uC124\uC815 "}{locationUpdatedAt}</p> : null}
                </div>
                <button type="button" className="mypage-profile__button" onClick={openProfileEditor}>
                  {"\uB0B4 \uC815\uBCF4 \uC218\uC815"}
                </button>
              </div>
            </div>

            <div className="mypage-membership-card">
              <button type="button" className="mypage-membership-card__item">{"\uBA64\uBC84\uC2ED"}</button>
              <button type="button" className="mypage-membership-card__item">{"\uAC00\uC785\uD558\uAE30"}</button>
              <button type="button" className="mypage-membership-card__item">{"Q \uB9AC\uC6CC\uB4DC"}</button>
              <button type="button" className="mypage-membership-card__item">{"\uAC00\uC785\uD558\uAE30"}</button>
            </div>
          </section>

          <section className="mypage-section">
            <h2 className="mypage-section__title">{"\uAC00\uC871 \uC124\uC815"}</h2>
            <div className="mypage-card">
              <button type="button" className="mypage-row" onClick={() => setIsHouseholdPickerOpen(true)}>
                <span>{"\uAC00\uAD6C\uC6D0 \uC218 \uC124\uC815\uD558\uAE30"}</span>
                <span className="mypage-row__action">
                  <span className="mypage-row__meta">{householdSize}{"\uBA85"}</span>
                  <span className="mypage-row__icon">
                    <PencilIcon />
                  </span>
                </span>
              </button>

              <button
                type="button"
                className="mypage-row mypage-row--switch"
                role="switch"
                aria-checked={shareDeviceStatus}
                onClick={onToggleShareDeviceStatus}
              >
                <span>{"\uAC00\uC804 \uC0C1\uD0DC \uACF5\uC720 \uC54C\uB9BC"}</span>
                <span className={
                  "mypage-switch " + (shareDeviceStatus ? "is-on" : "is-off")
                }>
                  <span className="mypage-switch__thumb" />
                </span>
              </button>
            </div>
          </section>

          <section className="mypage-section">
            <h2 className="mypage-section__title">{"\uC81C\uD488 \uC815\uBCF4\uC640 \uBCF4\uC99D"}</h2>
            <div className="mypage-card mypage-card--info">
              <p className="mypage-card__copy">{"\uBCF4\uC99D \uAE30\uAC04 \uB0B4\uC758 \uC81C\uD488\uC774 \uC5C6\uC5B4\uC694."}</p>
              <button type="button" className="mypage-link-row">
                <span>{"\uC804\uCCB4 \uC81C\uD488 \uBCF4\uAE30"}</span>
                <span className="mypage-link-row__icon">
                  <ChevronIcon />
                </span>
              </button>
            </div>
          </section>

          <section className="mypage-section">
            <h2 className="mypage-section__title">{"\uC11C\uBE44\uC2A4 \uC608\uC57D"}</h2>
            <div className="mypage-card mypage-card--service">
              <button type="button" className="mypage-link-row">
                <span>{"\uC804\uCCB4 \uC608\uC57D \uBCF4\uAE30"}</span>
                <span className="mypage-link-row__icon">
                  <ChevronIcon />
                </span>
              </button>
            </div>
          </section>

          <p className="mypage-footnote">
            {"\uD639\uC2DC LGE.COM\uC5D0\uC11C \uAD6C\uB9E4\uD55C \uC0C1\uD488\uC774 \uC788\uB2E4\uBA74 "}
            <button type="button">{"\uC5EC\uAE30"}</button>
            {"\uB97C \uB20C\uB7EC \uB0B4 \uC8FC\uBB38\uB0B4\uC5ED\uC744 \uD655\uC778\uD574\uBCF4\uC138\uC694."}
          </p>
        </div>
      </div>

      {isProfileEditorOpen ? (
        <div className="mypage-overlay" role="presentation" onClick={() => setIsProfileEditorOpen(false)}>
          <div
            className="mypage-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="\uB0B4 \uC815\uBCF4 \uC218\uC815"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mypage-dialog__title">{"\uB0B4 \uC815\uBCF4 \uC218\uC815"}</p>

            <label className="mypage-dialog__label" htmlFor="mypage-name-input">{"\uC774\uB984"}</label>
            <input
              id="mypage-name-input"
              className="mypage-dialog__input"
              value={nameDraft}
              maxLength={12}
              autoFocus
              onChange={(event) => setNameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleProfileSave();
                }
              }}
              placeholder={"이름을 입력하세요"}
            />

            <div className="mypage-dialog__location-block">
              <div className="mypage-dialog__location-head">
                <div>
                  <p className="mypage-dialog__label">{"\uC704\uCE58 \uC124\uC815"}</p>
                  <p className="mypage-dialog__hint">{"\uD604\uC7AC GPS \uAE30\uC900\uC73C\uB85C \uB0A0\uC528\uB97C \uBD88\uB7EC\uC624\uAC70\uB098, \uC6D0\uD558\uB294 \uC9C0\uC5ED\uC744 \uC9C1\uC811 \uACE8\uB77C\uBCFC \uC218 \uC788\uC5B4\uC694."}</p>
                </div>
              </div>

              <div className="mypage-dialog__location-mode">
                <button
                  type="button"
                  className={"mypage-dialog__mode-button " + (locationMode === "gps" ? "is-active" : "")}
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                >
                  {isLocating ? "\uAC00\uC838\uC624\uB294 \uC911..." : "\uD604\uC7AC \uC704\uCE58 \uC0AC\uC6A9"}
                </button>
                <button
                  type="button"
                  className={"mypage-dialog__mode-button " + (locationMode === "manual" ? "is-active" : "")}
                  onClick={() => {
                    setLocationMode("manual");
                    setLocationError("");
                    setLocationMessage("");

                    if (!selectedManualLocationId) {
                      handleManualLocationSelect(manualLocationOptions[0].id);
                    }
                  }}
                >
                  {"\uC9C0\uC5ED \uC9C1\uC811 \uC9C0\uC815"}
                </button>
              </div>

              {locationMode === "manual" ? (
                <div className="mypage-dialog__manual-picker">
                  <label className="mypage-dialog__label mypage-dialog__label--compact" htmlFor="mypage-location-select">{"\uC9C0\uC5ED \uC120\uD0DD"}</label>
                  <select
                    id="mypage-location-select"
                    className="mypage-dialog__select"
                    value={selectedManualLocationId}
                    onChange={(event) => handleManualLocationSelect(event.target.value)}
                  >
                    <option value="" disabled>{"\uC9C0\uC5ED\uC744 \uC120\uD0DD\uD558\uC138\uC694"}</option>
                    {manualLocationOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}{" - "}{option.detail}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="mypage-dialog__location-card">
                <strong>{locationDraft.label}</strong>
                <span>{locationDraft.detail}</span>
              </div>

              {locationMessage ? <p className="mypage-dialog__message">{locationMessage}</p> : null}
              {locationError ? <p className="mypage-dialog__message is-error">{locationError}</p> : null}
            </div>

            <div className="mypage-dialog__actions">
              <button type="button" className="mypage-dialog__button is-muted" onClick={() => setIsProfileEditorOpen(false)}>
                {"\uCDE8\uC18C"}
              </button>
              <button
                type="button"
                className="mypage-dialog__button"
                onClick={handleProfileSave}
                disabled={!nameDraft.trim() || isLocating || (locationMode === "manual" && !selectedManualLocationId)}
              >
                {"\uC800\uC7A5"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isHouseholdPickerOpen ? (
        <div className="mypage-overlay" role="presentation" onClick={() => setIsHouseholdPickerOpen(false)}>
          <div
            className="mypage-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="\uAC00\uAD6C\uC6D0 \uC218 \uC124\uC815"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mypage-sheet__handle" aria-hidden="true" />
            <p className="mypage-sheet__title">{"\uAC00\uAD6C\uC6D0 \uC218 \uC124\uC815"}</p>
            <div className="mypage-picker" aria-label="\uAC00\uAD6C\uC6D0 \uC218 \uC120\uD0DD">
              {householdOptions.map((count, index) => (
                <button
                  key={count}
                  type="button"
                  ref={(element) => {
                    pickerRefs.current[index] = element;
                  }}
                  className={"mypage-picker__item " + (householdSize === count ? "is-selected" : "")}
                  onClick={() => {
                    onChangeHouseholdSize(count);
                    setIsHouseholdPickerOpen(false);
                  }}
                >
                  {count}{"\uBA85"}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav
        active="menu"
        onHomeClick={onGoHome}
        onDeviceClick={onOpenDevice}
        onCareClick={onOpenCare}
        onMenuClick={onOpenMenu}
      />
    </section>
  );
}

export default MyPage;
