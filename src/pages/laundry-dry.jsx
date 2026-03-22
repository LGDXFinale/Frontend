import { useEffect, useRef, useState } from "react";
import "./laundry-timing.css";
import "./laundry-dry.css";
import { BackHeader, BottomNav, HeaderActions, useScrollBounce } from "../components/mobile-ui";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const weatherImageMap = {
  sunny: "/weather/sunny.png",
  sunCloudy: "/weather/sun_cloudy.png",
  rainy: "/weather/rainy.png",
  snow: "/weather/snow.png",
  thunderstorm: "/weather/thunderstorm.png",
  wind: "/weather/wind.png",
};

const LABELS = {
  screen: "건조 추천",
  washer: "세탁기",
  bannerTitle: "위치와 날씨 기반으로 최적의 건조 방식을 추천드려요!",
  dryingSection: "건조 추천",
  methodPrompt: "어떻게 건조할까?",
  levelPrompt: "추천등급",
  reasonSection: "이유",
  weatherSection: "날씨 요약",
  airSection: "대기질",
  smartRoutine: "스마트 루틴",
  routineCta: "루틴 알아보기",
  smellRisk: "냄새 위험도",
  pm10: "미세먼지",
  pm25: "초미세먼지",
  loadingTitle: "건조 추천 정보를 불러오고 있어요.",
  loadingBody: "백엔드 데이터를 바탕으로 최적의 건조 방식을 정리하는 중입니다...",
  errorBody: "`uvicorn app.main:app --reload`로 Backend를 실행한 뒤 다시 열어보세요.",
  weatherFallback: "날씨 확인 필요",
};

const METHOD_IMAGE_MAP = {
  1: { src: "/recom/in.png", fallback: "/recom/in.png" },
  2: { src: "/recom/out.png", fallback: "/recom/out.png" },
  3: { src: "/recom/dryin.png", fallback: "/recom/dryin.png" },
  4: { src: "/recom/mix.png", fallback: "/recom/out.png" },
};

function buildScenario(householdSize) {
  return householdSize >= 4 ? "family4_household" : "single_household";
}

function buildDryRecommendationUrl(householdSize, userLocation) {
  const params = new URLSearchParams({
    scenario: buildScenario(householdSize),
  });

  if (Number.isFinite(userLocation?.latitude) && Number.isFinite(userLocation?.longitude)) {
    params.set("latitude", String(userLocation.latitude));
    params.set("longitude", String(userLocation.longitude));
  }

  const path = `/api/dry-recommendation/recommend?${params.toString()}`;
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function formatDateLabel(dateString) {
  const parsedDate = dateString ? new Date(dateString) : new Date();
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(safeDate);
}

function formatDust(value) {
  return Number.isFinite(value) ? `${value} µg/m³` : "--";
}

function getWeatherPresentation(recommendation) {
  const weather = recommendation?.weather_info;
  if (!weather || weather.source === "fallback") {
    return { src: weatherImageMap.sunCloudy, label: LABELS.weatherFallback };
  }

  const weatherText = `${weather.weather_summary ?? ""} ${weather.weather_description ?? ""} ${weather.weather_main_label ?? ""}`;

  if (/눈|진눈|깨비/.test(weatherText)) {
    return { src: weatherImageMap.snow, label: "눈" };
  }

  if (/천둥|뇌우|번개/.test(weatherText)) {
    return { src: weatherImageMap.thunderstorm, label: "천둥번개" };
  }

  if (/바람|강풍/.test(weatherText)) {
    return { src: weatherImageMap.wind, label: "바람 강함" };
  }

  if (weather.rain_expected || weather.is_raining || /비|소나기/.test(weatherText)) {
    return { src: weatherImageMap.rainy, label: weather.high_humidity ? "비 / 습함" : "비 예보" };
  }

  if (weather.high_humidity) {
    return { src: weatherImageMap.sunCloudy, label: "습함" };
  }

  if (/구름|흐림/.test(weatherText)) {
    return { src: weatherImageMap.sunCloudy, label: "구름 약간 / 맑음" };
  }

  return { src: weatherImageMap.sunny, label: "맑음" };
}

function extractDetailedAreaLabel(userLocation) {
  if (!userLocation) {
    return "";
  }

  const detail = userLocation.detail ?? "";
  const label = userLocation.label ?? "";
  const sourceText = `${label} ${detail}`;
  const match = sourceText.match(/([가-힣]+구)\s*([가-힣0-9]+동)?/);

  if (!match) {
    return label;
  }

  return [match[1], match[2]].filter(Boolean).join(" ");
}

function getLocationLabel(recommendation, userLocation) {
  const detailedAreaLabel = extractDetailedAreaLabel(userLocation);

  if (
    detailedAreaLabel
    && detailedAreaLabel !== "위치 미설정"
    && detailedAreaLabel !== "현재 위치 사용 중"
  ) {
    return detailedAreaLabel;
  }

  if (userLocation?.label && userLocation.label !== "위치 미설정") {
    return userLocation.label;
  }

  if (recommendation?.weather_info?.location_label) {
    return recommendation.weather_info.location_label;
  }

  return "서울특별시 서대문구";
}

function getWeatherSummaryCopy(recommendation) {
  const weather = recommendation?.weather_info;
  if (!weather) {
    return LABELS.weatherFallback;
  }

  if (weather.high_humidity) {
    return "습도가 높아 자연 건조 시간이 길어질 가능성이 있어요.";
  }

  if (weather.rain_expected || weather.is_raining) {
    return "비 예보가 있어 실외 건조는 피하는 편이 좋아요.";
  }

  if (weather.outdoor_drying_friendly) {
    return "바람과 습도 조건이 좋아 자연 건조가 잘 되는 편이에요.";
  }

  return weather.weather_summary || LABELS.weatherFallback;
}

function getMethodImageSource(recommendation) {
  if (!recommendation) {
    return METHOD_IMAGE_MAP[3];
  }

  return METHOD_IMAGE_MAP[recommendation.dry_rec_method] ?? METHOD_IMAGE_MAP[3];
}

function LaundryDry({
  profileName,
  householdSize,
  userLocation,
  onGoBack,
  onGoHome,
  onOpenDevice,
  onOpenCare,
  onOpenMenu,
}) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const laundryTitle = `${profileName}의 세탁기`;

  useScrollBounce(scrollRef, contentRef);

  useEffect(() => {
    const controller = new AbortController();

    const loadPageData = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(buildDryRecommendationUrl(householdSize, userLocation), {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API ${response.status}`);
        }

        const result = await response.json();
        setRecommendation(result);
      } catch (caughtError) {
        if (caughtError.name === "AbortError") {
          return;
        }

        setError("건조 추천 응답을 불러오지 못했어요. Backend 서버가 실행 중인지 확인해주세요.");
      } finally {
        setLoading(false);
      }
    };

    loadPageData();

    return () => controller.abort();
  }, [householdSize, userLocation?.latitude, userLocation?.longitude]);  const weatherPresentation = recommendation ? getWeatherPresentation(recommendation) : null;
  const weatherSummary = recommendation ? getWeatherSummaryCopy(recommendation) : "";
  const locationLabel = recommendation ? getLocationLabel(recommendation, userLocation) : "";
  const airQuality = recommendation?.weather_info?.air_quality;
  const smellLabel = recommendation?.moisture_estimation?.odor_risk_level_label ?? "--";
  const methodImage = getMethodImageSource(recommendation);

  return (
    <section className="screen home-screen" aria-label={LABELS.screen}>
      <div className="home-scroll" ref={scrollRef}>
        <div className="home-scroll__content home-scroll__content--timing home-scroll__content--laundry-dry" ref={contentRef}>
          <BackHeader title={laundryTitle} onBack={onGoBack} actions={<HeaderActions />} className="laundry-dry-header" />

          {loading ? (
            <section className="timing-loading-card">
              <p>{LABELS.loadingTitle}</p>
              <span>{LABELS.loadingBody}</span>
            </section>
          ) : error ? (
            <section className="timing-loading-card timing-loading-card--error">
              <p>{error}</p>
              <span>{LABELS.errorBody}</span>
            </section>
          ) : recommendation ? (
            <>
              <section className="laundry-dry-banner">
                <strong>{LABELS.bannerTitle}</strong>
                <span>{`📍 ${locationLabel}`}</span>
              </section>

              <section className="timing-section timing-section--compact laundry-dry-intro-section">
                <p className="section-kicker">{LABELS.dryingSection}</p>
              </section>

              <section className="timing-hero laundry-dry-hero">
                <article className="laundry-dry-machine-card">
                  <img
                    src={methodImage.src}
                    alt={recommendation.dry_rec_method_name}
                    className="laundry-dry-machine-card__image"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = methodImage.fallback;
                    }}
                  />                  <p className="laundry-dry-machine-card__note">{`${LABELS.smellRisk} : ${smellLabel}`}</p>
                </article>
              </section>

              <section className="timing-section timing-section--compact">
                <div className="laundry-dry-recommend-grid">
                  <article className="timing-summary-card laundry-dry-recommend-card laundry-dry-recommend-card--method">
                    <img src="/wind.png" alt="" className="laundry-dry-recommend-card__icon-image" />
                    <span className="laundry-dry-recommend-card__eyebrow">{LABELS.methodPrompt}</span>
                    <strong>{recommendation.dry_rec_method_name}</strong>
                  </article>

                  <article className="timing-summary-card laundry-dry-recommend-card laundry-dry-recommend-card--level">
                    <span className="laundry-dry-recommend-card__eyebrow">추천 등급</span>
                    <strong>{recommendation.recommend_level_label}</strong>
                  </article>
                </div>
              </section>

              <section className="timing-section laundry-dry-reason-section">
                <p className="section-kicker">{LABELS.reasonSection}</p>
                <article className="timing-summary-card timing-summary-card--reason laundry-dry-reason-card">
                  <span className="timing-info-icon" aria-hidden="true">i</span>
                  <p>{recommendation.reason}</p>
                </article>
              </section>

              <section className="timing-section">
                <p className="section-kicker">{LABELS.weatherSection}</p>
                <article className="timing-summary-card timing-summary-card--weather laundry-dry-weather-summary-card">
                  <img src={weatherPresentation?.src} alt="" className="laundry-dry-weather-summary-card__icon" />
                  <p>{weatherSummary}</p>
                </article>
              </section>

              <section className="timing-section timing-section--compact">
                <article className="timing-summary-card timing-summary-card--weather laundry-dry-air-card">
                  <img src="/air.png" alt="" className="laundry-dry-air-card__icon-image" />
                  <span className="laundry-dry-air-card__label">{LABELS.airSection}</span>
                  <div className="laundry-dry-air-card__copy">
                    <span>{`${LABELS.pm10} ${formatDust(airQuality?.pm10)} (${airQuality?.pm10_grade ?? "-"})`}</span>
                    <span>{`${LABELS.pm25} ${formatDust(airQuality?.pm25)} (${airQuality?.pm25_grade ?? "-"})`}</span>
                  </div>
                </article>
              </section>

              <section className="timing-section">
                <p className="section-kicker">{LABELS.smartRoutine}</p>
                <button type="button" className="timing-routine-card laundry-dry-routine-card">
                  <span className="laundry-dry-routine-card__icon" aria-hidden="true" />
                  <span>{LABELS.routineCta}</span>
                </button>
              </section>
            </>
          ) : null}
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

export default LaundryDry;









