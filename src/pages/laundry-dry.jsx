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
  screen: "\uAC74\uC870 \uCD94\uCC9C",
  washer: "\uC138\uD0C1\uAE30",
  bannerTitle: "\uC704\uCE58\uC640 \uB0A0\uC528 \uAE30\uBC18\uC73C\uB85C \uCD5C\uC801\uC758 \uAC74\uC870 \uBC29\uC2DD\uC744 \uCD94\uCC9C\uB4DC\uB824\uC694!",
  dryingSection: "\uAC74\uC870 \uCD94\uCC9C",
  methodPrompt: "\uC5B4\uB5BB\uAC8C \uAC74\uC870\uD560\uAE4C?",
  levelPrompt: "\uCD94\uCC9C \uB4F1\uAE09",
  reasonSection: "\uC774\uC720",
  weatherSection: "\uB0A0\uC528 \uC694\uC57D",
  airSection: "\uB300\uAE30\uC9C8",
  smartRoutine: "\uC2A4\uB9C8\uD2B8 \uB8E8\uD2F4",
  routineCta: "\uB8E8\uD2F4 \uC54C\uC544\uBCF4\uAE30",
  smellRisk: "\uB0C4\uC0C8 \uC704\uD5D8\uB3C4",
  pm10: "\uBBF8\uC138\uBA3C\uC9C0",
  pm25: "\uCD08\uBBF8\uC138\uBA3C\uC9C0",
  loadingTitle: "\uAC74\uC870 \uCD94\uCC9C \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uACE0 \uC788\uC5B4\uC694.",
  loadingBody: "\uBC31\uC5D4\uB4DC \uB370\uC774\uD130\uB97C \uBC14\uD0D5\uC73C\uB85C \uCD5C\uC801\uC758 \uAC74\uC870 \uBC29\uC2DD\uC744 \uC815\uB9AC\uD558\uB294 \uC911\uC785\uB2C8\uB2E4...",
  errorBody: "\u0060uvicorn app.main:app --reload\u0060\uB85C Backend\uB97C \uC2E4\uD589\uD55C \uB4A4 \uB2E4\uC2DC \uC5F4\uC5B4\uBCF4\uC138\uC694.",
  weatherFallback: "\uB0A0\uC528 \uD655\uC778 \uD544\uC694",
  dryer: "\uAC74\uC870\uAE30",
  indoor: "\uC2E4\uB0B4\uAC74\uC870",
  outdoor: "\uC790\uC5F0\uAC74\uC870",
  mix: "\uD63C\uD569\uAC74\uC870",
  high: "\uB192\uC74C",
  medium: "\uBCF4\uD1B5",
};

const METHOD_IMAGE_MAP = {
  indoor: { src: "/recom/in.png", fallback: "/recom/in.png" },
  outdoor: { src: "/recom/out.png", fallback: "/recom/out.png" },
  dryer: { src: "/recom/dryin.png", fallback: "/recom/dryin.png" },
  mix: { src: "/recom/mix.png", fallback: "/recom/out.png" },
};

function containsAny(text, words) {
  return words.some((word) => text.includes(word));
}

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

  const pathName = "/api/dry-recommendation/recommend?" + params.toString();
  return API_BASE_URL ? API_BASE_URL + pathName : pathName;
}

function formatDust(value) {
  return Number.isFinite(Number(value)) ? String(value) + " \u00B5g/m\u00B3" : "--";
}

function normalizeCityLabel(label) {
  if (!label) return "";
  const cityMap = {
    "\uC11C\uC6B8": "\uC11C\uC6B8\uC2DC",
    "\uBD80\uC0B0": "\uBD80\uC0B0\uC2DC",
    "\uB300\uAD6C": "\uB300\uAD6C\uC2DC",
    "\uC778\uCC9C": "\uC778\uCC9C\uC2DC",
    "\uAD11\uC8FC": "\uAD11\uC8FC\uC2DC",
    "\uB300\uC804": "\uB300\uC804\uC2DC",
    "\uC6B8\uC0B0": "\uC6B8\uC0B0\uC2DC",
    "\uC138\uC885": "\uC138\uC885\uC2DC",
  };
  return cityMap[label] ?? label;
}

function extractDetailedAreaLabel(userLocation) {
  if (!userLocation) return "";

  const source = [normalizeCityLabel(userLocation.label ?? ""), userLocation.detail ?? ""]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!source) return "";

  const tokens = source.split(" ");
  const city = tokens.find((token) => /(?:\uC2DC|\uB3C4)$/.test(token)) ?? "";
  const area = tokens.find((token) => /(?:\uAD6C|\uAD70|\uB3D9|\uC74D|\uBA74)$/.test(token)) ?? "";

  if (city && area) return city + " " + area;
  if (city) return city;
  return normalizeCityLabel(userLocation.label ?? "");
}

function getLocationLabel(recommendation, userLocation) {
  const detailedAreaLabel = extractDetailedAreaLabel(userLocation);

  if (
    detailedAreaLabel
    && detailedAreaLabel !== "\uC704\uCE58 \uBBF8\uC124\uC815"
    && detailedAreaLabel !== "\uD604\uC7AC \uC704\uCE58 \uC0AC\uC6A9 \uC911"
  ) {
    return detailedAreaLabel;
  }

  if (userLocation?.label && userLocation.label !== "\uC704\uCE58 \uBBF8\uC124\uC815") {
    return normalizeCityLabel(userLocation.label);
  }

  if (recommendation?.weather_info?.location_label) {
    return recommendation.weather_info.location_label;
  }

  return "\uC11C\uC6B8\uC2DC \uC11C\uB300\uBB38\uAD6C";
}

function stripRecommendationSuffix(methodName) {
  if (!methodName) return "";
  return methodName.replace(/\s*\uCD94\uCC9C$/, "").trim();
}

function getMethodKeyFromResponse(recommendation) {
  if (recommendation?.dry_rec_method === 1) return "indoor";
  if (recommendation?.dry_rec_method === 2) return "outdoor";
  if (recommendation?.dry_rec_method === 4) return "mix";

  const rawName = stripRecommendationSuffix(recommendation?.dry_rec_method_name ?? "");
  if (rawName === LABELS.indoor) return "indoor";
  if (rawName === LABELS.outdoor) return "outdoor";
  if (rawName === LABELS.mix) return "mix";
  return "dryer";
}

function getWeatherPresentation(recommendation) {
  const weather = recommendation?.weather_info;
  if (!weather || weather.source === "fallback") {
    return { src: weatherImageMap.sunCloudy, label: LABELS.weatherFallback };
  }

  const weatherText = [weather.weather_summary, weather.weather_description, weather.weather_main_label]
    .filter(Boolean)
    .join(" ");

  if (containsAny(weatherText, ["\uB208", "\uC9C4\uB208\uAE68\uBE44"])) {
    return { src: weatherImageMap.snow, label: "\uB208" };
  }

  if (containsAny(weatherText, ["\uCC9C\uB465", "\uB1CC\uC6B0", "\uBC88\uAC1C"])) {
    return { src: weatherImageMap.thunderstorm, label: "\uCC9C\uB465\uBC88\uAC1C" };
  }

  if (containsAny(weatherText, ["\uBC14\uB78C", "\uAC15\uD48D"])) {
    return { src: weatherImageMap.wind, label: "\uBC14\uB78C" };
  }

  if (weather.rain_expected || weather.is_raining || containsAny(weatherText, ["\uBE44", "\uC18C\uB098\uAE30"])) {
    return {
      src: weatherImageMap.rainy,
      label: weather.high_humidity ? "\uBE44 / \uC2B5\uD568" : "\uBE44 \uC608\uBCF4",
    };
  }

  if (weather.high_humidity) {
    return { src: weatherImageMap.sunCloudy, label: "\uC2B5\uD568" };
  }

  if (containsAny(weatherText, ["\uAD6C\uB984", "\uD750\uB9BC"])) {
    return { src: weatherImageMap.sunCloudy, label: "\uAD6C\uB984 \uB9CE\uC74C" };
  }

  return { src: weatherImageMap.sunny, label: "\uB9D1\uC74C" };
}

function getWeatherSummaryCopy(recommendation) {
  const weather = recommendation?.weather_info;
  if (!weather) {
    return LABELS.weatherFallback;
  }

  if (weather.high_humidity) {
    return "\uC2B5\uB3C4\uAC00 \uB192\uC544 \uC790\uC5F0 \uAC74\uC870 \uC2DC\uAC04\uC774 \uAE38\uC5B4\uC9C8 \uAC00\uB2A5\uC131\uC774 \uC788\uC5B4\uC694.";
  }

  if (weather.rain_expected || weather.is_raining) {
    return "\uBE44 \uC608\uBCF4\uAC00 \uC788\uC5B4 \uC2E4\uC678 \uAC74\uC870\uB294 \uD53C\uD558\uB294 \uD3B8\uC774 \uC88B\uC544\uC694.";
  }

  if (weather.outdoor_drying_friendly) {
    return "\uBC14\uB78C\uACFC \uC2B5\uB3C4 \uC870\uAC74\uC774 \uC88B\uC544 \uC790\uC5F0 \uAC74\uC870\uAC00 \uC798 \uB418\uB294 \uD3B8\uC774\uC5D0\uC694.";
  }

  return weather.weather_summary || LABELS.weatherFallback;
}

function getAirQualityGradeScore(grade) {
  if (!grade) return 0;
  if (grade.includes("\uB9E4\uC6B0\uB098\uC068")) return 4;
  if (grade.includes("\uB098\uC068")) return 3;
  if (grade.includes("\uBCF4\uD1B5")) return 2;
  if (grade.includes("\uC88B\uC74C")) return 1;
  return 0;
}

function getDisplayContent(recommendation) {
  if (!recommendation) {
    return null;
  }

  const weather = recommendation.weather_info ?? {};
  const airQuality = weather.air_quality ?? {};
  const weatherText = [weather.weather_summary, weather.weather_description, weather.weather_main_label]
    .filter(Boolean)
    .join(" ");

  const rainOrSnow = weather.rain_expected || weather.is_raining || containsAny(weatherText, ["\uBE44", "\uC18C\uB098\uAE30", "\uB208", "\uC9C4\uB208\uAE68\uBE44"]);
  const humid = Boolean(weather.high_humidity) || weatherText.includes("\uC2B5");
  const windy = containsAny(weatherText, ["\uBC14\uB78C", "\uAC15\uD48D"]);
  const sunny = containsAny(weatherText, ["\uB9D1\uC74C", "\uD654\uCC3D"]) || Boolean(weather.outdoor_drying_friendly);
  const cloudy = containsAny(weatherText, ["\uAD6C\uB984", "\uD750\uB9BC"]);

  const pm10Score = getAirQualityGradeScore(airQuality.pm10_grade);
  const pm25Score = getAirQualityGradeScore(airQuality.pm25_grade);
  const airScore = Math.max(pm10Score, pm25Score);
  const poorAir = airScore >= 3 || Number(airQuality.pm10) >= 81 || Number(airQuality.pm25) >= 36;
  const moderateAir = !poorAir && (airScore === 2 || Number(airQuality.pm10) >= 31 || Number(airQuality.pm25) >= 16);

  let methodKey = getMethodKeyFromResponse(recommendation);
  let methodName = stripRecommendationSuffix(recommendation?.dry_rec_method_name) || LABELS.dryer;
  let levelLabel = recommendation?.recommend_level_label || LABELS.medium;
  let reason = recommendation?.reason || "\uD604\uC7AC \uAC74\uC870 \uD658\uACBD\uC744 \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694.";
  let weatherSummary = getWeatherSummaryCopy(recommendation);

  if (rainOrSnow || poorAir) {
    methodKey = "dryer";
    methodName = LABELS.dryer;
    levelLabel = LABELS.high;
    reason = poorAir
      ? "\uB300\uAE30\uC9C8\uC774 \uC88B\uC9C0 \uC54A\uC544 \uC2E4\uC678 \uAC74\uC870\uBCF4\uB2E4 \uAC74\uC870\uAE30 \uC0AC\uC6A9\uC774 \uAC00\uC7A5 \uC548\uC815\uC801\uC774\uC5D0\uC694."
      : "\uBE44\uB098 \uB208 \uC608\uBCF4\uAC00 \uC788\uC5B4 \uC790\uC5F0 \uAC74\uC870\uBCF4\uB2E4 \uAC74\uC870\uAE30 \uC0AC\uC6A9\uC774 \uAC00\uC7A5 \uC548\uC815\uC801\uC774\uC5D0\uC694.";
    weatherSummary = poorAir
      ? "\uB0A0\uC528\uBCF4\uB2E4 \uB300\uAE30\uC9C8 \uC601\uD5A5\uC774 \uCEE4\uC11C \uC2E4\uC678 \uAC74\uC870\uB294 \uD53C\uD558\uB294 \uD3B8\uC774 \uC88B\uC544\uC694."
      : humid
        ? "\uAC15\uC218 \uAC00\uB2A5\uC131\uACFC \uB192\uC740 \uC2B5\uB3C4\uB85C \uC790\uC5F0 \uAC74\uC870 \uC2DC\uAC04\uC774 \uAE38\uC5B4\uC9C8 \uC218 \uC788\uC5B4\uC694."
        : "\uAC15\uC218 \uAC00\uB2A5\uC131\uC774 \uC788\uC5B4 \uC2E4\uC678 \uAC74\uC870\uBCF4\uB2E4 \uAC74\uC870\uAE30 \uC0AC\uC6A9\uC774 \uC548\uC815\uC801\uC774\uC5D0\uC694.";
  } else if (sunny && !humid && !moderateAir) {
    methodKey = "outdoor";
    methodName = LABELS.outdoor;
    levelLabel = LABELS.high;
    reason = windy
      ? "\uD587\uBE5B\uACFC \uBC14\uB78C\uC774 \uAD1C\uCC2E\uC544 \uC790\uC5F0 \uAC74\uC870\uAC00 \uBE60\uB974\uAC8C \uC9C4\uD589\uB420 \uAC00\uB2A5\uC131\uC774 \uB192\uC544\uC694."
      : "\uD587\uBE5B\uACFC \uC2B5\uB3C4 \uC870\uAC74\uC774 \uC88B\uC544 \uC790\uC5F0 \uAC74\uC870\uB97C \uC2DC\uB3C4\uD558\uAE30 \uC88B\uC740 \uB0A0\uC528\uC608\uC694.";
    weatherSummary = windy
      ? "\uBC14\uB78C\uC774 \uC798 \uD1B5\uD558\uACE0 \uC2B5\uB3C4\uAC00 \uB192\uC9C0 \uC54A\uC544 \uC790\uC5F0 \uAC74\uC870 \uC5EC\uAC74\uC774 \uC88B\uC544\uC694."
      : "\uB9D1\uC740 \uD558\uB298\uACFC \uBE44\uAD50\uC801 \uB0AE\uC740 \uC2B5\uB3C4\uB85C \uC790\uC5F0 \uAC74\uC870\uAC00 \uC218\uC6D4\uD55C \uD3B8\uC774\uC5D0\uC694.";
  } else if (humid || moderateAir) {
    methodKey = humid && moderateAir ? "dryer" : "indoor";
    methodName = humid && moderateAir ? LABELS.dryer : LABELS.indoor;
    levelLabel = humid ? LABELS.high : LABELS.medium;
    reason = humid && moderateAir
      ? "\uC2B5\uB3C4\uB3C4 \uB192\uACE0 \uB300\uAE30\uC9C8\uB3C4 \uC644\uC804\uD788 \uAE68\uB057\uD558\uC9C0 \uC54A\uC544 \uAC74\uC870\uAE30\uB97C \uC4F0\uB294 \uD3B8\uC774 \uC548\uC815\uC801\uC774\uC5D0\uC694."
      : humid
        ? "\uC2B5\uB3C4\uAC00 \uB192\uC544 \uC2E4\uC678\uBCF4\uB2E4 \uC2E4\uB0B4\uC5D0\uC11C \uAD00\uB9AC\uD558\uB294 \uD3B8\uC774 \uB354 \uC548\uC815\uC801\uC774\uC5D0\uC694."
        : "\uB300\uAE30\uC9C8\uC774 \uC644\uC804\uD788 \uAE68\uB057\uD558\uC9C4 \uC54A\uC544 \uC2E4\uB0B4 \uAC74\uC870\uAC00 \uB354 \uBB34\uB09C\uD55C \uC120\uD0DD\uC774\uC5D0\uC694.";
    weatherSummary = humid
      ? "\uC2B5\uB3C4\uAC00 \uB192\uC544 \uC790\uC5F0 \uAC74\uC870 \uC2DC\uAC04\uC774 \uAE38\uC5B4\uC9C8 \uAC00\uB2A5\uC131\uC774 \uC788\uC5B4\uC694."
      : "\uB300\uAE30\uC9C8\uC774 \uBCF4\uD1B5 \uC218\uC900\uC774\uB77C \uC624\uB798 \uC2E4\uC678\uC5D0 \uB450\uB294 \uAC74 \uD53C\uD558\uB294 \uD3B8\uC774 \uC88B\uC544\uC694.";
  } else if (cloudy || windy) {
    methodKey = "mix";
    methodName = LABELS.mix;
    levelLabel = LABELS.medium;
    reason = "\uC2E4\uB0B4\uC5D0\uC11C \uBA3C\uC800 \uBB3C\uAE30\uB97C \uC904\uC778 \uB4A4, \uD1B5\uD48D\uC774 \uAD1C\uCC2E\uC744 \uB54C \uC790\uC5F0 \uAC74\uC870\uB97C \uBCD1\uD589\uD558\uBA74 \uD6A8\uC728\uC801\uC774\uC5D0\uC694.";
    weatherSummary = cloudy
      ? "\uAD6C\uB984\uC740 \uB9CE\uC9C0\uB9CC \uB2F9\uC7A5 \uD070 \uBE44 \uC18C\uC2DD\uC740 \uC5C6\uC5B4 \uD63C\uD569 \uAC74\uC870\uAC00 \uBB34\uB09C\uD574 \uBCF4\uC5EC\uC694."
      : "\uBC14\uB78C\uC740 \uAD1C\uCC2E\uC9C0\uB9CC \uB0A0\uC528\uAC00 \uC644\uC804\uD788 \uC548\uC815\uC801\uC774\uC9C4 \uC54A\uC544 \uD63C\uD569 \uAC74\uC870\uAC00 \uC801\uC808\uD574\uC694.";
  }

  return {
    methodKey,
    methodName,
    levelLabel,
    reason,
    weatherSummary,
    pm10Line: LABELS.pm10 + " " + formatDust(airQuality.pm10) + " (" + (airQuality.pm10_grade ?? "-") + ")",
    pm25Line: LABELS.pm25 + " " + formatDust(airQuality.pm25) + " (" + (airQuality.pm25_grade ?? "-") + ")",
  };
}

function getMethodImageSource(methodKey) {
  return METHOD_IMAGE_MAP[methodKey] ?? METHOD_IMAGE_MAP.dryer;
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
  const laundryTitle = profileName + "\uC758 \uC138\uD0C1\uAE30";

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
          throw new Error("API " + response.status);
        }

        const result = await response.json();
        setRecommendation(result);
      } catch (caughtError) {
        if (caughtError.name === "AbortError") {
          return;
        }
        setError("\uAC74\uC870 \uCD94\uCC9C \uC751\uB2F5\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694. Backend \uC11C\uBC84\uAC00 \uC2E4\uD589 \uC911\uC778\uC9C0 \uD655\uC778\uD574\uC8FC\uC138\uC694.");
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
    return () => controller.abort();
  }, [householdSize, userLocation?.latitude, userLocation?.longitude]);

  const weatherPresentation = recommendation ? getWeatherPresentation(recommendation) : null;
  const displayContent = recommendation ? getDisplayContent(recommendation) : null;
  const locationLabel = recommendation ? getLocationLabel(recommendation, userLocation) : "";
  const smellLabel = recommendation?.moisture_estimation?.odor_risk_level_label ?? "--";
  const methodImage = getMethodImageSource(displayContent?.methodKey);

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
          ) : recommendation && displayContent ? (
            <>
              <section className="laundry-dry-banner">
                <strong>{LABELS.bannerTitle}</strong>
                <span>{"\uD83D\uDCCD " + locationLabel}</span>
              </section>

              <section className="timing-section timing-section--compact laundry-dry-intro-section">
                <p className="section-kicker">{LABELS.dryingSection}</p>
              </section>

              <section className="timing-hero laundry-dry-hero">
                <article className="laundry-dry-machine-card">
                  <img
                    src={methodImage.src}
                    alt={displayContent.methodName}
                    className="laundry-dry-machine-card__image"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = methodImage.fallback;
                    }}
                  />
                  <p className="laundry-dry-machine-card__note">{LABELS.smellRisk + " : " + smellLabel}</p>
                </article>
              </section>

              <section className="timing-section timing-section--compact">
                <div className="laundry-dry-recommend-grid">
                  <article className="timing-summary-card laundry-dry-recommend-card laundry-dry-recommend-card--method">
                    <img src="/wind.png" alt="" className="laundry-dry-recommend-card__icon-image" />
                    <span className="laundry-dry-recommend-card__eyebrow">{LABELS.methodPrompt}</span>
                    <strong>{displayContent.methodName}</strong>
                  </article>

                  <article className="timing-summary-card laundry-dry-recommend-card laundry-dry-recommend-card--level">
                    <span className="laundry-dry-recommend-card__eyebrow">{LABELS.levelPrompt}</span>
                    <strong>{displayContent.levelLabel}</strong>
                  </article>
                </div>
              </section>

              <section className="timing-section laundry-dry-reason-section">
                <p className="section-kicker">{LABELS.reasonSection}</p>
                <article className="timing-summary-card timing-summary-card--reason laundry-dry-reason-card">
                  <span className="timing-info-icon" aria-hidden="true">i</span>
                  <p>{displayContent.reason}</p>
                </article>
              </section>

              <section className="timing-section">
                <p className="section-kicker">{LABELS.weatherSection}</p>
                <article className="timing-summary-card timing-summary-card--weather laundry-dry-weather-summary-card">
                  <img src={weatherPresentation?.src} alt="" className="laundry-dry-weather-summary-card__icon" />
                  <p>{displayContent.weatherSummary}</p>
                </article>
              </section>

              <section className="timing-section timing-section--compact">
                <article className="timing-summary-card timing-summary-card--weather laundry-dry-air-card">
                  <img src="/air.png" alt="" className="laundry-dry-air-card__icon-image" />
                  <span className="laundry-dry-air-card__label">{LABELS.airSection}</span>
                  <div className="laundry-dry-air-card__copy">
                    <span>{displayContent.pm10Line}</span>
                    <span>{displayContent.pm25Line}</span>
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
