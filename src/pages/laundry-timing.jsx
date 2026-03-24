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

const currentBasketLabel = "바구니 적재량";
const currentSummaryLabel = "현재 적재량";
const currentLoadRatioLabel = "현재 적재율";
const predictedSummaryPrefixLabel = "48시간 뒤";
const predictedSummarySuffixLabel = "예상 적재량";
const predictedLoadRatioLabel = "예상 적재율";
const washerInnerLabel = "내부 적재량";

function normalizeExecutionWindow(value) {
  if (!value) return value;
  return value === "다음 24시간 안" ? "24시간 이내" : value;
}

function buildWeeklyWeatherUrl(householdSize, userLocation) {
  const params = new URLSearchParams({
    scenario: householdSize >= 4 ? "family4_household" : "single_household",
  });

  if (Number.isFinite(userLocation?.latitude) && Number.isFinite(userLocation?.longitude)) {
    params.set("latitude", String(userLocation.latitude));
    params.set("longitude", String(userLocation.longitude));
  }

  const path = `/api/laundry-timing/weather/weekly?${params.toString()}`;

  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

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

function getHouseholdPredictionMultiplier(householdSize) {
  const safeHouseholdSize = Number(householdSize);

  if (!Number.isFinite(safeHouseholdSize) || safeHouseholdSize === 3) {
    return 1;
  }

  return Math.max(0.76, Math.min(1.84, 1 + (safeHouseholdSize - 3) * 0.12));
}

function getDisplayedFutureLoad(recommendation, householdSize) {
  const predictedWeight = Number(recommendation?.future_load_prediction?.predicted_weight_kg);
  const predictedLoadRatio = Number(recommendation?.future_load_prediction?.predicted_load_ratio);
  const washerCapacity = Number(recommendation?.washer_capacity);

  if (!Number.isFinite(predictedWeight) || !Number.isFinite(predictedLoadRatio)) {
    return {
      weightKg: recommendation?.future_load_prediction?.predicted_weight_kg ?? 0,
      loadRatio: recommendation?.future_load_prediction?.predicted_load_ratio ?? 0,
    };
  }

  const multiplier = getHouseholdPredictionMultiplier(householdSize);
  const adjustedWeightKg = Number.isFinite(washerCapacity) && washerCapacity > 0
    ? Math.min(washerCapacity * 0.98, Math.max(0, predictedWeight * multiplier))
    : Math.max(0, predictedWeight * multiplier);
  const adjustedLoadRatio = Number.isFinite(washerCapacity) && washerCapacity > 0
    ? (adjustedWeightKg / washerCapacity) * 100
    : Math.min(100, Math.max(0, predictedLoadRatio * multiplier));

  return {
    weightKg: adjustedWeightKg,
    loadRatio: adjustedLoadRatio,
  };
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

function getWeatherPresentation(recommendation, todayWeather) {
  if (todayWeather?.summary) {
    const todaySummary = todayWeather.summary;
    const humidity = Number(todayWeather.relative_humidity ?? 0);
    const rainChance = Number(todayWeather.precipitation_probability ?? 0);

    if (/눈|진눈깨비/.test(todaySummary)) {
      return { src: weatherImageMap.snow, label: "눈" };
    }

    if (/천둥|뇌우|번개/.test(todaySummary)) {
      return { src: weatherImageMap.thunderstorm, label: "천둥번개" };
    }

    if (/바람|강풍/.test(todaySummary)) {
      return { src: weatherImageMap.wind, label: "바람 강함" };
    }

    if (rainChance >= 50 || /비|소나기/.test(todaySummary)) {
      return { src: weatherImageMap.rainy, label: humidity >= 80 ? "비 / 습함" : "비 예보" };
    }

    if (/맑음|화창/.test(todaySummary)) {
      return { src: weatherImageMap.sunny, label: humidity >= 80 ? "맑지만 습함" : "맑음" };
    }

    if (/구름|흐림/.test(todaySummary)) {
      return { src: weatherImageMap.sunCloudy, label: "구름 많음" };
    }
  }

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

function getGuideItems(recommendation) {
  return recommendation.action_items.slice(0, 2);
}

function getDisplayContent(recommendation, todayWeather) {
  const todaySummary = todayWeather?.summary ?? "";
  const humidity = Number(todayWeather?.relative_humidity ?? 0);
  const rainChance = Number(todayWeather?.precipitation_probability ?? 0);

  if (rainChance >= 50 || /비|소나기/.test(todaySummary)) {
    return {
      executionWindow: "오늘 안에",
      reason: "비 예보가 있어 세탁과 건조를 조금 앞당기는 편이 안전해요.",
      weatherSummary: humidity >= 80
        ? "비 소식이 있고 습도도 높아 건조가 더뎌질 수 있어요."
        : "비 소식이 있어 실외 건조 여건이 빠르게 나빠질 수 있어요.",
      guideItems: [
        "오늘 안에 세탁을 마치고 실내 건조 공간을 미리 준비해두세요.",
        "제습기나 선풍기를 함께 사용하면 건조 시간을 줄이는 데 도움이 돼요.",
      ],
    };
  }

  if (/맑음|화창/.test(todaySummary) && humidity < 80) {
    return {
      executionWindow: "오늘 또는 내일",
      reason: "맑은 하늘이라 자연 건조까지 고려하기 좋은 타이밍이에요.",
      weatherSummary: "오늘은 맑은 편이라 세탁 후 건조까지 비교적 수월할 가능성이 있어요.",
      guideItems: [
        "오늘 세탁을 진행하면 자연 건조까지 비교적 여유 있게 이어갈 수 있어요.",
        "햇볕이 드는 시간대나 통풍이 좋은 공간을 활용해보세요.",
      ],
    };
  }

  if (/구름|흐림/.test(todaySummary)) {
    return {
      executionWindow: humidity >= 80 ? "오늘 안에" : normalizeExecutionWindow(recommendation.execution_window),
      reason: humidity >= 80
        ? "구름이 많고 습도도 높아서 세탁을 미루면 건조가 더 길어질 수 있어요."
        : "하늘은 흐리지만 바로 급한 수준은 아니라 생활 패턴에 맞춰 진행해도 괜찮아요.",
      weatherSummary: humidity >= 80
        ? "구름이 많고 습도도 높아 자연 건조가 다소 느릴 수 있어요."
        : "구름이 많아도 당장 큰 비 소식은 없어 무난한 세탁 여건이에요.",
      guideItems: humidity >= 80
        ? [
            "24시간 이내에 세탁 일정을 잡아두는 편이 좋아요.",
            "실내 건조를 함께 고려해 통풍이 잘되는 공간을 확인해두세요.",
          ]
        : [
            "오늘 또는 내일 일정에 맞춰 세탁을 진행해도 무리가 없어요.",
            "건조 시간을 줄이려면 탈수 후 바로 널어두는 흐름을 추천해요.",
          ],
    };
  }

  if (humidity >= 80 || recommendation.high_humidity) {
    return {
      executionWindow: "오늘 안에",
      reason: "습도가 높아 세탁을 미루면 건조 시간이 길어질 가능성이 커요.",
      weatherSummary: "습도가 높아 자연 건조 시간이 길어질 가능성이 있어요.",
      guideItems: [
        "24시간 이내에 세탁 일정을 잡아두는 것을 권장해요.",
        "실내 건조 공간과 제습 보조 수단을 함께 준비해두면 좋아요.",
      ],
    };
  }

  return {
    executionWindow: normalizeExecutionWindow(recommendation.execution_window),
    reason: recommendation.reason,
    weatherSummary: recommendation.weather_summary,
    guideItems: getGuideItems(recommendation),
  };
}

function getWeatherSummaryIndicatorFromText(summaryText) {
  const weatherText = summaryText ?? "";

  if (/눈|진눈깨비/.test(weatherText)) {
    return { icon: "❄", tone: "snow" };
  }

  if (/천둥|뇌우|번개/.test(weatherText)) {
    return { icon: "⚡", tone: "storm" };
  }

  if (/바람|강풍/.test(weatherText)) {
    return { icon: "🌀", tone: "wind" };
  }

  if (/비|소나기/.test(weatherText)) {
    return { icon: "☔", tone: "rain" };
  }

  if (/습도|습함/.test(weatherText)) {
    return { icon: "💧", tone: "humidity" };
  }

  if (/맑음|건조|화창/.test(weatherText)) {
    return { icon: "☀", tone: "sunny" };
  }

  if (/구름|흐림/.test(weatherText)) {
    return { icon: "☁", tone: "cloudy" };
  }

  return { icon: "☁", tone: "cloudy" };
}

function normalizeCityLabel(token) {
  if (!token) {
    return "";
  }

  return token
    .replace(/특별자치시$/, "시")
    .replace(/특별자치도$/, "도")
    .replace(/특별시$/, "시")
    .replace(/광역시$/, "시");
}

function extractDetailedAreaLabel(userLocation) {
  if (!userLocation) {
    return "";
  }

  const detail = userLocation.detail ?? "";
  const label = userLocation.label ?? "";
  const sourceText = `${label} ${detail}`;
  const tokens = Array.from(
    new Set(
      (
        sourceText.match(
          /[가-힣]+(?:특별자치시|특별자치도|특별시|광역시|도|시|군|구|읍|면|동|리)/g,
        ) ?? []
      )
        .map((token) => token.trim())
        .filter(Boolean),
    ),
  );

  const cityToken = tokens.find((token) => /(?:특별자치시|특별시|광역시|시)$/.test(token));
  const guToken = tokens.find((token) => /구$/.test(token));
  const dongToken = tokens.find((token) => /동$/.test(token));
  const eupMyeonToken = tokens.find((token) => /(?:읍|면)$/.test(token));

  if (cityToken) {
    const normalizedCity = normalizeCityLabel(cityToken);
    const secondaryToken = /서울시$/.test(normalizedCity)
      ? guToken || dongToken || eupMyeonToken
      : dongToken || guToken || eupMyeonToken;

    return secondaryToken ? `${normalizedCity} ${secondaryToken}` : normalizedCity;
  }

  if (guToken && dongToken) {
    return `${guToken} ${dongToken}`;
  }

  return label;
}

function getWeatherLocationLabel(recommendation, userLocation) {
  const detailedAreaLabel = extractDetailedAreaLabel(userLocation);

  if (    detailedAreaLabel
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
  const [weeklyWeather, setWeeklyWeather] = useState(null);
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
        const [recommendationResponse, weatherResponse] = await Promise.all([
          fetch(buildRecommendationUrl(householdSize, userLocation), { signal: controller.signal }),
          fetch(buildWeeklyWeatherUrl(householdSize, userLocation), { signal: controller.signal }).catch(() => null),
        ]);

        if (!recommendationResponse.ok) {
          throw new Error(`API ${recommendationResponse.status}`);
        }

        const result = await recommendationResponse.json();
        setRecommendation(result);

        if (weatherResponse?.ok) {
          const weatherResult = await weatherResponse.json();
          setWeeklyWeather(weatherResult);
        } else {
          setWeeklyWeather(null);
        }
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

  const todayWeather = weeklyWeather?.days?.[0] ?? null;
  const weatherPresentation = recommendation ? getWeatherPresentation(recommendation, todayWeather) : null;
  const displayContent = recommendation ? getDisplayContent(recommendation, todayWeather) : null;
  const guideItems = displayContent?.guideItems ?? (recommendation ? getGuideItems(recommendation) : []);
  const weatherSummaryIndicator = displayContent
    ? getWeatherSummaryIndicatorFromText(displayContent.weatherSummary)
    : recommendation
      ? getWeatherSummaryIndicatorFromText(recommendation.weather_summary)
      : null;
  const recommendationDateLabel = recommendation ? formatRecommendationDate(recommendation.generated_at) : "";
  const weatherLocationLabel = recommendation ? getWeatherLocationLabel(recommendation, userLocation) : "";
  const currentBasketWeightKg = recommendation
    ? recommendation.current_load?.basket_weight_kg ?? recommendation.current_load?.basket_sensor_weight_kg ?? 0
    : 0;
  const washerInnerWeightKg = recommendation
    ? recommendation.current_load?.washer_inner_weight_kg ?? Math.max(recommendation.current_weight - currentBasketWeightKg, 0)
    : 0;
  const displayedFutureLoad = recommendation
    ? getDisplayedFutureLoad(recommendation, householdSize)
    : { weightKg: 0, loadRatio: 0 };


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
                    <span className="timing-weather-card__meta">{weatherLocationLabel}</span>
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
                    <strong>{formatKg(displayedFutureLoad.weightKg)} / {formatKg(recommendation.washer_capacity)}</strong>
                    <span>{predictedLoadRatioLabel} : {formatPercent(displayedFutureLoad.loadRatio)}</span>
                  </p>
                </article>
              </section>

              <section className="timing-section">
                <p className="section-kicker">세탁 타이밍 추천</p>
                <div className="timing-recommend-grid">
                  <article className="timing-summary-card timing-summary-card--recommend timing-summary-card--with-emoji">
                    <img src="/t.png" alt="" className="timing-summary-card__emoji" />
                    <span>언제 세탁할까?</span>
                    <strong>{displayContent?.executionWindow ?? normalizeExecutionWindow(recommendation.execution_window)}</strong>
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
                  <p>{displayContent?.reason ?? recommendation.reason}</p>
                </article>
              </section>

              <section className="timing-section">
                <p className="section-kicker">날씨 요약</p>
                <article className="timing-summary-card timing-summary-card--weather">
                  <span className={`timing-drop-icon timing-drop-icon--${weatherSummaryIndicator?.tone ?? "cloudy"}`} aria-hidden="true">
                    {weatherSummaryIndicator?.icon ?? "☁"}
                  </span>
                  <p>{displayContent?.weatherSummary ?? recommendation.weather_summary}</p>
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
