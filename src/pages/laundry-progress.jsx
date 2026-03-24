import { useEffect, useRef, useState } from "react";
import "./laundry-timing.css";
import "./laundry-progress.css";
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
  screen: "\uC138\uD0C1 \uC9C4\uD589 \uC0C1\uD669",
  washer: "\uC138\uD0C1\uAE30",
  currentWeather: "\uD604\uC7AC \uB0A0\uC528",
  basket: "\uBE68\uB798 \uBC14\uAD6C\uB2C8",
  currentLoadCard: "현재 적재량",
  currentLoad: "\uC801\uC7AC\uB7C9",
  loadRatio: "\uC801\uC7AC\uC728",
  progressSection: "\uC138\uD0C1 \uC9C4\uD589 \uC0C1\uD669",
  remainingTime: "\uB0A8\uC740 \uC2DC\uAC04",
  expectedEnd: "\uC608\uC0C1 \uC885\uB8CC \uC2DC\uAC04",
  changeAlert: "\uBCC0\uACBD\uC0AC\uD56D \uC54C\uB9BC",
  smartRoutine: "\uC2A4\uB9C8\uD2B8 \uB8E8\uD2F4",
  routineCta: "\uB8E8\uD2F4 \uC54C\uC544\uBCF4\uAE30",
  progressLabel: "\uC9C4\uD589\uB960",
  weatherFallback: "\uB0A0\uC528 \uD655\uC778 \uD544\uC694",
  weatherBase: "\uAE30\uC900",
  loadingTitle: "\uC138\uD0C1 \uC9C4\uD589 \uC0C1\uD669\uC744 \uBD88\uB7EC\uC624\uACE0 \uC788\uC5B4\uC694.",
  loadingBody: "\uBC31\uC5D4\uB4DC \uB370\uC774\uD130\uB97C \uBC14\uD0D5\uC73C\uB85C \uD604\uC7AC \uC138\uD0C1 \uC0C1\uD0DC\uB97C \uC815\uB9AC\uD558\uB294 \uC911\uC785\uB2C8\uB2E4...",
  errorBody: "`uvicorn app.main:app --reload`\uB85C Backend\uB97C \uC2E4\uD589\uD55C \uB4A4 \uB2E4\uC2DC \uC5F4\uC5B4\uBCF4\uC138\uC694.",
};

const washStatusLabelMap = {
  0: "\uB300\uAE30\uC911",
  1: "\uC138\uD0C1\uC911",
  2: "\uD5F9\uAD7C\uC911",
  3: "\uD0C8\uC218\uC911",
  4: "\uC138\uD0C1 \uC644\uB8CC",
};

function buildScenario(householdSize) {
  return householdSize >= 4 ? "family4_household" : "single_household";
}

function buildWeeklyWeatherUrl(householdSize, userLocation) {
  const params = new URLSearchParams({
    scenario: buildScenario(householdSize),
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
    scenario: buildScenario(householdSize),
    household_size: String(householdSize),
  });

  if (Number.isFinite(userLocation?.latitude) && Number.isFinite(userLocation?.longitude)) {
    params.set("latitude", String(userLocation.latitude));
    params.set("longitude", String(userLocation.longitude));
  }

  const path = `/api/laundry-timing/recommend?${params.toString()}`;
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function buildProgressUrl(householdSize, recommendation) {
  const params = new URLSearchParams({
    scenario: buildScenario(householdSize),
    wash_status: "1",
  });

  if (recommendation?.current_weight != null) {
    params.set("current_load_kg", String(recommendation.current_weight));
  }

  if (recommendation?.washer_capacity != null) {
    params.set("washer_capacity_kg", String(recommendation.washer_capacity));
  }

  const path = `/api/laundry-progress/status?${params.toString()}`;
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function formatKg(value) {
  return `${Number(value).toFixed(1)}kg`;
}

function formatPercent(value) {
  return `${Math.round(Number(value))}%`;
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

function formatClockLabel(dateString) {
  const parsedDate = dateString ? new Date(dateString) : new Date();
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(safeDate);
}

function formatMinutesLabel(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "\uACE7 \uC644\uB8CC";
  }

  return `${Math.round(value)}\uBD84`;
}

function getWeatherPresentation(recommendation, todayWeather) {
  if (todayWeather?.summary) {
    const todaySummary = todayWeather.summary;
    const humidity = Number(todayWeather.relative_humidity ?? 0);
    const rainChance = Number(todayWeather.precipitation_probability ?? 0);

    if (/\uB208|\uC9C4\uB208\uAE68\uBE44/.test(todaySummary)) {
      return { src: weatherImageMap.snow, label: "\uB208" };
    }

    if (/\uCC9C\uB465|\uB1CC\uC6B0|\uBC88\uAC1C/.test(todaySummary)) {
      return { src: weatherImageMap.thunderstorm, label: "\uCC9C\uB465\uBC88\uAC1C" };
    }

    if (/\uBC14\uB78C|\uAC15\uD48D/.test(todaySummary)) {
      return { src: weatherImageMap.wind, label: "\uBC14\uB78C \uAC15\uD568" };
    }

    if (rainChance >= 50 || /\uBE44|\uC18C\uB098\uAE30/.test(todaySummary)) {
      return { src: weatherImageMap.rainy, label: humidity >= 80 ? "\uBE44 / \uC2B5\uD568" : "\uBE44 \uC608\uBCF4" };
    }

    if (/\uB9D1\uC74C|\uD654\uCC3D/.test(todaySummary)) {
      return { src: weatherImageMap.sunny, label: humidity >= 80 ? "\uB9D1\uC9C0\uB9CC \uC2B5\uD568" : "\uB9D1\uC74C" };
    }

    if (/\uAD6C\uB984|\uD750\uB9BC/.test(todaySummary)) {
      return { src: weatherImageMap.sunCloudy, label: "\uAD6C\uB984 \uB9CE\uC74C" };
    }
  }

  if (recommendation.weather?.source === "fallback") {
    return { src: weatherImageMap.sunCloudy, label: LABELS.weatherFallback };
  }

  const weatherText = `${recommendation.weather?.weather_summary ?? recommendation.weather_summary ?? ""} ${recommendation.reason ?? ""}`;

  if (/\uB208|\uC9C4\uB208\uAE68\uBE44/.test(weatherText)) {
    return { src: weatherImageMap.snow, label: "\uB208" };
  }

  if (/\uCC9C\uB465|\uB1CC\uC6B0|\uBC88\uAC1C/.test(weatherText)) {
    return { src: weatherImageMap.thunderstorm, label: "\uCC9C\uB465\uBC88\uAC1C" };
  }

  if (/\uBC14\uB78C|\uAC15\uD48D/.test(weatherText)) {
    return { src: weatherImageMap.wind, label: "\uBC14\uB78C \uAC15\uD568" };
  }

  if (recommendation.rain_expected || /\uBE44|\uC18C\uB098\uAE30/.test(weatherText)) {
    return {
      src: weatherImageMap.rainy,
      label: recommendation.high_humidity ? "\uBE44 / \uC2B5\uD568" : "\uBE44 \uC608\uBCF4",
    };
  }

  if (recommendation.high_humidity) {
    return { src: weatherImageMap.sunCloudy, label: "\uC2B5\uD568" };
  }

  if (/\uAD6C\uB984|\uD750\uB9BC/.test(weatherText)) {
    return { src: weatherImageMap.sunCloudy, label: "\uAD6C\uB984 \uC57D\uAC04 / \uB9D1\uC74C" };
  }

  if (recommendation.weather?.outdoor_drying_friendly) {
    return { src: weatherImageMap.sunny, label: "\uB9D1\uC74C" };
  }

  return { src: weatherImageMap.sunny, label: "\uB9D1\uC74C" };
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
    && detailedAreaLabel !== "\uC704\uCE58 \uBBF8\uC124\uC815"
    && detailedAreaLabel !== "\uD604\uC7AC \uC704\uCE58 \uC0AC\uC6A9 \uC911"
  ) {
    return detailedAreaLabel;
  }

  if (recommendation.weather?.source !== "fallback" && recommendation.weather?.location_label) {
    return recommendation.weather.location_label;
  }

  if (userLocation?.label && userLocation.label !== "\uC704\uCE58 \uBBF8\uC124\uC815") {
    return userLocation.label;
  }

  return "\uC11C\uC6B8";
}

function getChangeAlert(progress) {
  if (progress?.load_variation_detected) {
    return {
      title: "\uC885\uB8CC\uC2DC\uAC04\uC774 \uBCC0\uACBD\uB418\uC5C8\uC5B4\uC694",
      detail: "\uC0AC\uC720 : \uC138\uD0C1 \uC911 \uBB34\uAC8C \uBCC0\uD654 \uAC10\uC9C0",
    };
  }

  return {
    title: "\uC138\uD0C1 \uCF54\uC2A4\uAC00 \uC548\uC815\uC801\uC73C\uB85C \uC9C4\uD589\uB418\uACE0 \uC788\uC5B4\uC694",
    detail: "\uC0AC\uC720 : \uD604\uC7AC \uC13C\uC11C \uAE30\uC900 \uCD94\uAC00 \uBCC0\uACBD \uC5C6\uC74C",
  };
}

function LaundryProgress({
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
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const laundryTitle = `${profileName}\uC758 \uC138\uD0C1\uAE30`;

  useScrollBounce(scrollRef, contentRef);

  useEffect(() => {
    const controller = new AbortController();

    const loadPageData = async () => {
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

        const recommendationResult = await recommendationResponse.json();

        if (weatherResponse?.ok) {
          const weatherResult = await weatherResponse.json();
          setWeeklyWeather(weatherResult);
        } else {
          setWeeklyWeather(null);
        }

        const progressResponse = await fetch(buildProgressUrl(householdSize, recommendationResult), {
          signal: controller.signal,
        });

        if (!progressResponse.ok) {
          throw new Error(`API ${progressResponse.status}`);
        }

        const progressResult = await progressResponse.json();

        setRecommendation(recommendationResult);
        setProgress(progressResult);
      } catch (caughtError) {
        if (caughtError.name === "AbortError") {
          return;
        }

        setError("\uC138\uD0C1 \uC9C4\uD589 \uC0C1\uD669\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694. Backend \uC11C\uBC84\uAC00 \uC2E4\uD589 \uC911\uC778\uC9C0 \uD655\uC778\uD574\uC8FC\uC138\uC694.");
      } finally {
        setLoading(false);
      }
    };

    loadPageData();

    return () => controller.abort();
  }, [householdSize, userLocation?.latitude, userLocation?.longitude]);

  const todayWeather = weeklyWeather?.days?.[0] ?? null;
  const weatherPresentation = recommendation ? getWeatherPresentation(recommendation, todayWeather) : null;
  const weatherLocationLabel = recommendation ? getWeatherLocationLabel(recommendation, userLocation) : "";
  const heroDateLabel = progress ? formatDateLabel(progress.generated_at) : "";
  const statusLabel = progress ? washStatusLabelMap[progress.wash_status] ?? washStatusLabelMap[1] : "";
  const changeAlert = getChangeAlert(progress);

  return (
    <section className="screen home-screen" aria-label={LABELS.screen}>
      <div className="home-scroll" ref={scrollRef}>
        <div className="home-scroll__content home-scroll__content--timing home-scroll__content--laundry-progress" ref={contentRef}>
          <BackHeader title={laundryTitle} onBack={onGoBack} actions={<HeaderActions />} className="laundry-progress-header" />

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
          ) : recommendation && progress ? (
            <>
              <section className="timing-hero laundry-progress-hero">
                <article className="timing-washer-card">
                  <div className="timing-washer-card__date">{heroDateLabel}</div>
                  <img src="/real_wash.png" alt={LABELS.washer} className="timing-washer-card__image" />
                  <div className="timing-washer-card__badge timing-washer-card__badge--progress">
                    <strong>{statusLabel}</strong>
                    <span>{`${LABELS.progressLabel} : ${formatPercent(progress.progress_percent)}`}</span>
                  </div>
                </article>

                <div className="timing-side-column laundry-progress-side-column">
                  <article className="timing-weather-card">
                    <img
                      src={weatherPresentation?.src}
                      alt={weatherPresentation?.label ?? LABELS.currentWeather}
                      className="timing-weather-card__image"
                    />
                    <p>{weatherPresentation?.label}</p>
                    <span className="timing-weather-card__meta">{weatherLocationLabel}</span>
                  </article>

                  <img src="/basket.png" alt={LABELS.basket} className="laundry-progress-basket" />
                </div>
              </section>

              <section className="timing-section">
                <p className="section-kicker">{LABELS.currentLoadCard}</p>
                <article className="timing-summary-card timing-summary-card--center timing-summary-card--inline">
                  <p className="timing-summary-card__inline-copy">
                    <strong>{formatKg(recommendation.current_weight)} / {formatKg(recommendation.washer_capacity)}</strong>
                    <span>{`적재율 : ${formatPercent(recommendation.load_ratio)}`}</span>
                  </p>
                </article>
              </section>

              <section className="timing-section">
                <p className="section-kicker">{LABELS.progressSection}</p>
                <div className="laundry-progress-status-grid">
                  <article className="timing-summary-card laundry-progress-mini-card">
                    <img src="/left.png" alt="" className="laundry-progress-mini-card__icon-image" />
                    <span className="laundry-progress-mini-card__label">{LABELS.remainingTime}</span>
                    <strong>{formatMinutesLabel(progress.remaining_time)}</strong>
                  </article>

                  <article className="timing-summary-card laundry-progress-mini-card">
                    <img src="/finish.png" alt="" className="laundry-progress-mini-card__icon-image" />
                    <span className="laundry-progress-mini-card__label">{LABELS.expectedEnd}</span>
                    <strong>{formatClockLabel(progress.expected_end_time)}</strong>
                  </article>
                </div>
              </section>

              <section className="timing-section">
                <p className="section-kicker">{LABELS.changeAlert}</p>
                <article className="timing-summary-card laundry-progress-alert-card">
                  <span className="laundry-progress-alert-card__icon" aria-hidden="true">😮</span>
                  <div className="laundry-progress-alert-card__copy">
                    <strong>{changeAlert.title}</strong>
                    <span>{changeAlert.detail}</span>
                  </div>
                </article>
              </section>

              <section className="timing-section">
                <p className="section-kicker">{LABELS.smartRoutine}</p>
                <button type="button" className="timing-routine-card laundry-progress-routine-card">
                  <span className="timing-routine-card__icon" aria-hidden="true">◔</span>
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

export default LaundryProgress;




