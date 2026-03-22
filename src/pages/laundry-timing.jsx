import { useEffect, useRef, useState } from "react";
import "./laundry-timing.css";
import { BackHeader, BottomNav, HeaderActions, useScrollBounce } from "../components/mobile-ui";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const levelLabelMap = {
  high: "높음",
  medium: "보통",
  low: "여유",
};

const weatherImageMap = {
  sunny: "/weather/sunny.png",
  sunCloudy: "/weather/sun_cloudy.png",
  rainy: "/weather/rainy.png",
  snow: "/weather/snow.png",
  thunderstorm: "/weather/thunderstorm.png",
  wind: "/weather/wind.png",
};

const currentBasketLabel = "\uBC14\uAD6C\uB2C8 \uC801\uC7AC\uB7C9";
const currentSummaryLabel = "\uD604\uC7AC \uC801\uC7AC\uB7C9";
const currentLoadRatioLabel = "\uD604\uC7AC \uC801\uC7AC\uC728";
const predictedSummaryPrefixLabel = "48\uC2DC\uAC04 \uB4A4";
const predictedSummarySuffixLabel = "\uC608\uC0C1 \uC801\uC7AC\uB7C9";
const predictedLoadRatioLabel = "\uC608\uC0C1 \uC801\uC7AC\uC728";
const washerInnerLabel = "\uB0B4\uBD80 \uC801\uC7AC\uB7C9";

function buildRecommendationUrl(householdSize, userLocation) {
  const params = new URLSearchParams({
    scenario: householdSize >= 4 ? "family4_household" : "single_household",
    household_size: String(householdSize),
  });

  if (Number.isFinite(userLocation?.latitude) && Number.isFinite(userLocation?.longitude)) {
    params.set("latitude", String(userLocation.latitude));
    params.set("longitude", String(userLocation.longitude));
  }

  const path = `/api/laundry-timing/recommend?${params.toString()}`;

  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function formatKg(value) {
  return `${Number(value).toFixed(1)}kg`;
}

function formatPercent(value) {
  return `${Math.round(Number(value))}%`;
}

function formatRecommendationDate(dateString) {
  const parsedDate = dateString ? new Date(dateString) : new Date();
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(safeDate);
}

function getWeatherPresentation(recommendation) {
  if (recommendation.weather?.source === "fallback") {
    return { src: weatherImageMap.sunCloudy, label: "날씨 확인 필요" };
  }

  const weatherText = `${recommendation.weather?.weather_summary ?? recommendation.weather_summary ?? ""} ${recommendation.reason ?? ""}`;

  if (/눈|진눈깨비/.test(weatherText)) {
    return { src: weatherImageMap.snow, label: "눈" };
  }

  if (/천둥|뇌우|번개/.test(weatherText)) {
    return { src: weatherImageMap.thunderstorm, label: "천둥번개" };
  }

  if (/바람|강풍/.test(weatherText)) {
    return { src: weatherImageMap.wind, label: "바람 강함" };
  }

  if (recommendation.rain_expected || /비|소나기/.test(weatherText)) {
    return {
      src: weatherImageMap.rainy,
      label: recommendation.high_humidity ? "비 / 습함" : "비 예보",
    };
  }

  if (recommendation.high_humidity) {
    return { src: weatherImageMap.sunCloudy, label: "습함" };
  }

  if (/구름|흐림/.test(weatherText)) {
    return { src: weatherImageMap.sunCloudy, label: "구름 많음" };
  }

  if (recommendation.weather?.outdoor_drying_friendly) {
    return { src: weatherImageMap.sunny, label: "맑음" };
  }

  return { src: weatherImageMap.sunny, label: "맑음" };
}

function getWeatherSummaryIndicator(recommendation) {
  const weatherText = `${recommendation.weather_summary ?? ""} ${recommendation.weather?.weather_summary ?? ""}`;

  if (/\uB208|\uC9C4\uB208\uAE68\uBE44/.test(weatherText)) {
    return { icon: "\u2744", tone: "snow" };
  }

  if (/\uCC9C\uB465|\uB1CC\uC6B0|\uBC88\uAC1C/.test(weatherText)) {
    return { icon: "\u26A1", tone: "storm" };
  }

  if (/\uBC14\uB78C|\uAC15\uD48D/.test(weatherText)) {
    return { icon: "\uD83C\uDF00", tone: "wind" };
  }

  if (recommendation.rain_expected || /\uBE44|\uC18C\uB098\uAE30/.test(weatherText)) {
    return { icon: "\u2614", tone: "rain" };
  }

  if (recommendation.high_humidity || /\uC2B5\uB3C4|\uC2B5\uD568/.test(weatherText)) {
    return { icon: "\uD83D\uDCA7", tone: "humidity" };
  }

  if (recommendation.weather?.outdoor_drying_friendly || /\uB9D1\uC74C|\uAC74\uC870|\uD654\uCC3D/.test(weatherText)) {
    return { icon: "\u2600", tone: "sunny" };
  }

  if (/\uAD6C\uB984|\uD750\uB9BC/.test(weatherText)) {
    return { icon: "\u2601", tone: "cloudy" };
  }

  return { icon: "\u2601", tone: "cloudy" };
}

function extractDetailedAreaLabel(userLocation) {
  if (!userLocation) {
    return "";
  }

  const detail = userLocation.detail ?? "";
  const label = userLocation.label ?? "";
  const sourceText = `${label} ${detail}`;
  const match = sourceText.match(/([\uAC00-\uD7A3]+\uAD6C)\s*([\uAC00-\uD7A30-9]+\uB3D9)?/);

  if (!match) {
    return label;
  }

  return [match[1], match[2]].filter(Boolean).join(" ");
}

function getGuideItems(recommendation) {
  return recommendation.action_items.slice(0, 2);
}

function getWeatherLocationLabel(recommendation, userLocation) {
  const detailedAreaLabel = extractDetailedAreaLabel(userLocation);

  if (
    userLocation?.source === "gps"
    && detailedAreaLabel
    && detailedAreaLabel !== "위치 미설정"
    && detailedAreaLabel !== "현재 위치 사용 중"
  ) {
    return detailedAreaLabel;
  }

  if (recommendation.weather?.source !== "fallback" && recommendation.weather?.location_label) {
    return recommendation.weather.location_label;
  }

  if (userLocation?.label && userLocation.label !== "위치 미설정") {
    return userLocation.label;
  }

  return "위치 설정 필요";
}

function LaundryTiming({
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

    const loadRecommendation = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(buildRecommendationUrl(householdSize, userLocation), {
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

        setError("백엔드 응답을 불러오지 못했어요. Backend 서버가 실행 중인지 확인해주세요.");
      } finally {
        setLoading(false);
      }
    };

    loadRecommendation();

    return () => controller.abort();
  }, [householdSize, userLocation?.latitude, userLocation?.longitude]);

  const guideItems = recommendation ? getGuideItems(recommendation) : [];
  const weatherPresentation = recommendation ? getWeatherPresentation(recommendation) : null;
  const weatherSummaryIndicator = recommendation ? getWeatherSummaryIndicator(recommendation) : null;
  const recommendationDateLabel = recommendation ? formatRecommendationDate(recommendation.generated_at) : "";
  const weatherLocationLabel = recommendation ? getWeatherLocationLabel(recommendation, userLocation) : "";
  const currentBasketWeightKg = recommendation
    ? recommendation.current_load?.basket_weight_kg ?? recommendation.current_load?.basket_sensor_weight_kg ?? 0
    : 0;
  const washerInnerWeightKg = recommendation
    ? recommendation.current_load?.washer_inner_weight_kg ?? Math.max(recommendation.current_weight - currentBasketWeightKg, 0)
    : 0;

  return (
    <section className="screen home-screen" aria-label="세탁 타이밍 추천">
      <div className="home-scroll" ref={scrollRef}>
        <div className="home-scroll__content home-scroll__content--timing" ref={contentRef}>
          <BackHeader title={laundryTitle} onBack={onGoBack} actions={<HeaderActions />} />

          {loading ? (
            <section className="timing-loading-card">
              <p>세탁 타이밍 추천을 계산하고 있어요.</p>
              <span>백엔드 데이터를 불러오는 중입니다...</span>
            </section>
          ) : error ? (
            <section className="timing-loading-card timing-loading-card--error">
              <p>{error}</p>
              <span>`uvicorn app.main:app --reload`로 Backend를 실행한 뒤 다시 열어보세요.</span>
            </section>
          ) : recommendation ? (
            <>
              <section className="timing-hero">
                <article className="timing-washer-card">
                  <div className="timing-washer-card__date">{recommendationDateLabel}</div>
                  <img src="/real_wash.png" alt="세탁기" className="timing-washer-card__image" />
                  <div className="timing-washer-card__badge">
                    <strong>세탁전</strong>
                    <span>{washerInnerLabel} : {formatKg(washerInnerWeightKg)}</span>
                  </div>
                </article>

                <div className="timing-side-column">
                  <article className="timing-weather-card">
                    <img
                      src={weatherPresentation?.src}
                      alt={weatherPresentation?.label ?? "현재 날씨"}
                      className="timing-weather-card__image"
                    />
                    <p>{weatherPresentation?.label}</p>
                    <span className="timing-weather-card__meta">{weatherLocationLabel} 기준</span>
                  </article>

                  <article className="timing-basket-wrap">
                    <div className="timing-pill">{currentBasketLabel} : {formatKg(currentBasketWeightKg)}</div>
                    <img src="/basket.png" alt="빨래 바구니" className="timing-basket" />
                  </article>
                </div>
              </section>

              <section className="timing-section">
                <p className="section-kicker">{currentSummaryLabel}</p>
                <article className="timing-summary-card timing-summary-card--center timing-summary-card--inline">
                  <p className="timing-summary-card__inline-copy">
                    <strong>{formatKg(recommendation.current_weight)} / {formatKg(recommendation.washer_capacity)}</strong>
                    <span>{currentLoadRatioLabel} : {formatPercent(recommendation.load_ratio)}</span>
                  </p>
                </article>
              </section>

              <section className="timing-section timing-section--compact">
                <p className="section-kicker"><span className="section-kicker__accent">{predictedSummaryPrefixLabel}</span> {predictedSummarySuffixLabel}</p>
                <article className="timing-summary-card timing-summary-card--center timing-summary-card--inline">
                  <p className="timing-summary-card__inline-copy">
                    <strong>{formatKg(recommendation.future_load_prediction.predicted_weight_kg)} / {formatKg(recommendation.washer_capacity)}</strong>
                    <span>{predictedLoadRatioLabel} : {formatPercent(recommendation.future_load_prediction.predicted_load_ratio)}</span>
                  </p>
                </article>
              </section>

              <section className="timing-section">
                <p className="section-kicker">세탁 타이밍 추천</p>
                <div className="timing-recommend-grid">
                  <article className="timing-summary-card timing-summary-card--recommend timing-summary-card--with-emoji">
                    <img src="/t.png" alt="" className="timing-summary-card__emoji" />
                    <span>언제 세탁할까?</span>
                    <strong>{recommendation.execution_window}</strong>
                  </article>
                  <article className="timing-summary-card timing-summary-card--recommend timing-summary-card--level">
                    <span>추천 등급</span>
                    <strong>{levelLabelMap[recommendation.recommend_level] ?? recommendation.recommend_level}</strong>
                  </article>
                </div>
              </section>

              <section className="timing-section">
                <p className="section-kicker">이유</p>
                <article className="timing-summary-card timing-summary-card--reason">
                  <span className="timing-info-icon" aria-hidden="true">i</span>
                  <p>{recommendation.reason}</p>
                </article>
              </section>

              <section className="timing-section">
                <p className="section-kicker">날씨 요약</p>
                <article className="timing-summary-card timing-summary-card--weather">
                  <span className="timing-drop-icon" aria-hidden="true">💧</span>
                  <p>{recommendation.weather_summary}</p>
                </article>
              </section>

              <section className="timing-section">
                <p className="section-kicker">행동 가이드 보기</p>
                <div className="timing-guide-list">
                  {guideItems.map((item) => (
                    <article key={item} className="timing-guide-card">
                      <span className="timing-guide-card__icon" aria-hidden="true">👥</span>
                      <p>{item}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="timing-section">
                <p className="section-kicker">스마트 루틴</p>
                <button type="button" className="timing-routine-card">
                  <span className="timing-routine-card__icon" aria-hidden="true">◔</span>
                  <span>루틴 알아보기</span>
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

export default LaundryTiming;
