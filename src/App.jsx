import { startTransition, useEffect, useState } from "react";
import Start from "./pages/start";
import Home from "./pages/home";
import Laundry from "./pages/laundry";
import Device from "./pages/device";
import Care from "./pages/care";
import Menu from "./pages/menu";
import MyPage from "./pages/mypage";
import "./App.css";

const SPLASH_DELAY_MS = 2000;
const TRANSITION_DURATION_MS = 700;

function App() {
  const [phase, setPhase] = useState("start");
  const [page, setPage] = useState("home");
  const [previousPage, setPreviousPage] = useState("home");
  const [profileName, setProfileName] = useState("피날레");
  const [householdSize, setHouseholdSize] = useState(3);
  const [shareDeviceStatus, setShareDeviceStatus] = useState(false);

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

  const goToPage = (nextPage) => {
    if (nextPage === page) {
      return;
    }

    setPreviousPage(page);
    setPage(nextPage);
  };

  const goBack = () => {
    setPage(previousPage === page ? "home" : previousPage);
  };

  const openMenu = () => {
    goToPage("menu");
  };

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
          {page === "home" ? (
            <Home
              profileName={profileName}
              onOpenLaundry={() => goToPage("laundry")}
              onOpenDevice={() => goToPage("device")}
              onOpenCare={() => goToPage("care")}
              onOpenMenu={openMenu}
            />
          ) : page === "laundry" ? (
            <Laundry
              profileName={profileName}
              onGoBack={goBack}
              onGoHome={() => goToPage("home")}
              onOpenDevice={() => goToPage("device")}
              onOpenCare={() => goToPage("care")}
              onOpenMenu={openMenu}
            />
          ) : page === "device" ? (
            <Device
              profileName={profileName}
              onGoBack={goBack}
              onGoHome={() => goToPage("home")}
              onOpenCare={() => goToPage("care")}
              onOpenMenu={openMenu}
            />
          ) : page === "care" ? (
            <Care
              onGoBack={goBack}
              onGoHome={() => goToPage("home")}
              onOpenDevice={() => goToPage("device")}
              onOpenMenu={openMenu}
            />
          ) : page === "mypage" ? (
            <MyPage
              profileName={profileName}
              householdSize={householdSize}
              shareDeviceStatus={shareDeviceStatus}
              onChangeProfileName={setProfileName}
              onChangeHouseholdSize={setHouseholdSize}
              onToggleShareDeviceStatus={() => setShareDeviceStatus((current) => !current)}
              onGoBack={goBack}
              onGoHome={() => goToPage("home")}
              onOpenDevice={() => goToPage("device")}
              onOpenCare={() => goToPage("care")}
              onOpenMenu={() => setPage("menu")}
            />
          ) : (
            <Menu
              onGoBack={goBack}
              onGoHome={() => goToPage("home")}
              onOpenDevice={() => goToPage("device")}
              onOpenCare={() => goToPage("care")}
              onOpenMyPage={() => goToPage("mypage")}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
