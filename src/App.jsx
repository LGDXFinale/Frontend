import { startTransition, useEffect, useState } from "react";
import Start from "./pages/start";
import Home from "./pages/home";
import Laundry from "./pages/laundry";
import LaundryTiming from "./pages/laundry-timing";
import LaundryProgress from "./pages/laundry-progress";
import LaundryDry from "./pages/laundry-dry";
import Device from "./pages/device";
import Care from "./pages/care";
import Menu from "./pages/menu";
import MyPage from "./pages/mypage";
import "./App.css";

const SPLASH_DELAY_MS = 2000;
const TRANSITION_DURATION_MS = 700;
const USER_LOCATION_STORAGE_KEY = "thinq-user-location";

const DEFAULT_LOCATION = {
  label: "\uC704\uCE58 \uBBF8\uC124\uC815",
  detail: "\uB9C8\uC774\uD398\uC774\uC9C0\uC5D0\uC11C \uD604\uC7AC \uC704\uCE58\uB97C \uC124\uC815\uD574\uBCF4\uC138\uC694.",
  latitude: null,
  longitude: null,
  source: "manual",
  updatedAt: "",
};

function getInitialUserLocation() {
  if (typeof window === "undefined") {
    return DEFAULT_LOCATION;
  }

  try {
    const storedValue = window.localStorage.getItem(USER_LOCATION_STORAGE_KEY);

    if (!storedValue) {
      return DEFAULT_LOCATION;
    }

    const parsedValue = JSON.parse(storedValue);

    return {
      ...DEFAULT_LOCATION,
      ...parsedValue,
    };
  } catch {
    return DEFAULT_LOCATION;
  }
}

function App() {
  const [phase, setPhase] = useState("start");
  const [page, setPage] = useState("home");
  const [previousPage, setPreviousPage] = useState("home");
  const [pageDirection, setPageDirection] = useState("forward");
  const [pageTransitionKey, setPageTransitionKey] = useState(0);
  const [profileName, setProfileName] = useState("\uD53C\uB0A0\uB808");
  const [householdSize, setHouseholdSize] = useState(3);
  const [shareDeviceStatus, setShareDeviceStatus] = useState(false);
  const [userLocation, setUserLocation] = useState(getInitialUserLocation);

  useEffect(() => {
    const transitionTimer = window.setTimeout(() => {
      setPhase("transition");
    }, SPLASH_DELAY_MS);

    const completeTimer = window.setTimeout(() => {
      startTransition(() => {
        setPhase("home");
      });
    }, SPLASH_DELAY_MS + TRANSITION_DURATION_MS);

    return () => {
      window.clearTimeout(transitionTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  const moveToPage = (nextPage, direction) => {
    if (nextPage === page) {
      return;
    }

    if (direction === "forward") {
      setPreviousPage(page);
    }

    setPageDirection(direction);
    setPage(nextPage);
    setPageTransitionKey((current) => current + 1);
  };

  const goToPage = (nextPage) => {
    moveToPage(nextPage, "forward");
  };

  const goBack = () => {
    const nextPage = previousPage === page ? "home" : previousPage;
    moveToPage(nextPage, "back");
  };

  const openMenu = () => {
    goToPage("menu");
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(userLocation));
    } catch {
      // Ignore storage errors and keep the in-memory location state.
    }
  }, [userLocation]);

  let currentPage = null;

  if (page === "home") {
    currentPage = (
      <Home
        profileName={profileName}
        onOpenLaundry={() => goToPage("laundry")}
        onOpenDevice={() => goToPage("device")}
        onOpenCare={() => goToPage("care")}
        onOpenMenu={openMenu}
      />
    );
  } else if (page === "laundry") {
    currentPage = (
      <Laundry
        profileName={profileName}
        onGoBack={goBack}
        onGoHome={() => goToPage("home")}
        onOpenDevice={() => goToPage("device")}
        onOpenCare={() => goToPage("care")}
        onOpenMenu={openMenu}
        onOpenTiming={() => goToPage("laundry-timing")}
        onOpenProgress={() => goToPage("laundry-progress")}
        onOpenDry={() => goToPage("laundry-dry")}
      />
    );
  } else if (page === "laundry-timing") {
    currentPage = (
      <LaundryTiming
        profileName={profileName}
        householdSize={householdSize}
        userLocation={userLocation}
        onGoBack={goBack}
        onGoHome={() => goToPage("home")}
        onOpenDevice={() => goToPage("device")}
        onOpenCare={() => goToPage("care")}
        onOpenMenu={openMenu}
      />
    );
  } else if (page === "laundry-progress") {
    currentPage = (
      <LaundryProgress
        profileName={profileName}
        householdSize={householdSize}
        userLocation={userLocation}
        onGoBack={goBack}
        onGoHome={() => goToPage("home")}
        onOpenDevice={() => goToPage("device")}
        onOpenCare={() => goToPage("care")}
        onOpenMenu={openMenu}
      />
    );
  } else if (page === "laundry-dry") {
    currentPage = (
      <LaundryDry
        profileName={profileName}
        householdSize={householdSize}
        userLocation={userLocation}
        onGoBack={goBack}
        onGoHome={() => goToPage("home")}
        onOpenDevice={() => goToPage("device")}
        onOpenCare={() => goToPage("care")}
        onOpenMenu={openMenu}
      />
    );
  } else if (page === "device") {
    currentPage = (
      <Device
        profileName={profileName}
        onGoBack={goBack}
        onGoHome={() => goToPage("home")}
        onOpenCare={() => goToPage("care")}
        onOpenMenu={openMenu}
      />
    );
  } else if (page === "care") {
    currentPage = (
      <Care
        onGoBack={goBack}
        onGoHome={() => goToPage("home")}
        onOpenDevice={() => goToPage("device")}
        onOpenMenu={openMenu}
      />
    );
  } else if (page === "mypage") {
    currentPage = (
      <MyPage
        profileName={profileName}
        householdSize={householdSize}
        shareDeviceStatus={shareDeviceStatus}
        userLocation={userLocation}
        onChangeProfileName={setProfileName}
        onChangeUserLocation={setUserLocation}
        onChangeHouseholdSize={setHouseholdSize}
        onToggleShareDeviceStatus={() => setShareDeviceStatus((current) => !current)}
        onGoBack={goBack}
        onGoHome={() => goToPage("home")}
        onOpenDevice={() => goToPage("device")}
        onOpenCare={() => goToPage("care")}
        onOpenMenu={() => setPage("menu")}
      />
    );
  } else {
    currentPage = (
      <Menu
        onGoBack={goBack}
        onGoHome={() => goToPage("home")}
        onOpenDevice={() => goToPage("device")}
        onOpenCare={() => goToPage("care")}
        onOpenMyPage={() => goToPage("mypage")}
      />
    );
  }

  return (
    <main className="app">
      <div className="stage">
        <div
          className={`screen-layer splash-layer ${
            phase === "transition"
              ? "is-exiting"
              : phase === "home"
                ? "is-hidden"
                : "is-visible"
          }`}
        >
          <Start />
        </div>

        <div className={`screen-layer home-layer ${phase !== "start" ? "is-visible" : ""}`}>
          <div key={`${page}-${pageTransitionKey}`} className={`page-shell page-shell--${pageDirection}`}>
            {currentPage}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
