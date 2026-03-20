import { useEffect, useRef, useState } from "react";
import { BottomNav, useScrollBounce } from "../components/mobile-ui";

const householdOptions = Array.from({ length: 10 }, (_, index) => index + 1);

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

function MyPage({
  profileName,
  householdSize,
  shareDeviceStatus,
  onChangeProfileName,
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
  const [isNameEditorOpen, setIsNameEditorOpen] = useState(false);
  const [isHouseholdPickerOpen, setIsHouseholdPickerOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(profileName);

  useScrollBounce(scrollRef, contentRef);

  useEffect(() => {
    setNameDraft(profileName);
  }, [profileName]);

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

  const openNameEditor = () => {
    setNameDraft(profileName);
    setIsNameEditorOpen(true);
  };

  const handleNameSave = () => {
    const nextName = nameDraft.trim();

    if (!nextName) {
      return;
    }

    onChangeProfileName(nextName);
    setIsNameEditorOpen(false);
  };

  const profileInitial = profileName.trim().charAt(0) || "P";

  return (
    <section className="screen mypage-screen" aria-label="마이페이지">
      <div className="home-scroll" ref={scrollRef}>
        <div className="home-scroll__content home-scroll__content--mypage" ref={contentRef}>
          <header className="mypage-header">
            <button type="button" className="mypage-header__back" onClick={onGoBack} aria-label="메뉴로 돌아가기">
              <span className="mypage-header__back-icon">
                <BackIcon />
              </span>
              <span>마이페이지</span>
            </button>
          </header>

          <section className="mypage-profile-card">
            <div className="mypage-profile">
              <div className="mypage-avatar">
                <span>{profileInitial}</span>
                <button type="button" className="mypage-avatar__edit" onClick={openNameEditor} aria-label="이름 수정">
                  <PencilIcon />
                </button>
              </div>

              <div className="mypage-profile__body">
                <div className="mypage-profile__name-row">
                  <strong>{profileName}</strong>
                  <button type="button" className="mypage-inline-edit" onClick={openNameEditor} aria-label="이름 수정">
                    <PencilIcon />
                  </button>
                </div>
                <button type="button" className="mypage-profile__button" onClick={openNameEditor}>
                  내 정보 수정
                </button>
              </div>
            </div>

            <div className="mypage-membership-card">
              <button type="button" className="mypage-membership-card__item">멤버십</button>
              <button type="button" className="mypage-membership-card__item">가입하기</button>
              <button type="button" className="mypage-membership-card__item">Q 리워드</button>
              <button type="button" className="mypage-membership-card__item">가입하기</button>
            </div>
          </section>

          <section className="mypage-section">
            <h2 className="mypage-section__title">가족 설정</h2>
            <div className="mypage-card">
              <button type="button" className="mypage-row" onClick={() => setIsHouseholdPickerOpen(true)}>
                <span>가구원 수 설정하기</span>
                <span className="mypage-row__action">
                  <span className="mypage-row__meta">{householdSize}명</span>
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
                <span>가전 상태 공유 알림</span>
                <span className={`mypage-switch ${shareDeviceStatus ? "is-on" : "is-off"}`}>
                  <span className="mypage-switch__thumb" />
                </span>
              </button>
            </div>
          </section>

          <section className="mypage-section">
            <h2 className="mypage-section__title">제품 정보와 보증</h2>
            <div className="mypage-card mypage-card--info">
              <p className="mypage-card__copy">보증 기간 내의 제품이 없어요.</p>
              <button type="button" className="mypage-link-row">
                <span>전체 제품 보기</span>
                <span className="mypage-link-row__icon">
                  <ChevronIcon />
                </span>
              </button>
            </div>
          </section>

          <section className="mypage-section">
            <h2 className="mypage-section__title">서비스 예약</h2>
            <div className="mypage-card mypage-card--service">
              <button type="button" className="mypage-link-row">
                <span>전체 예약 보기</span>
                <span className="mypage-link-row__icon">
                  <ChevronIcon />
                </span>
              </button>
            </div>
          </section>

          <p className="mypage-footnote">
            혹시 LGE.COM에서 구매한 상품이 있다면 <button type="button">여기</button>를 눌러 내 주문내역을 확인해보세요.
          </p>
        </div>
      </div>

      {isNameEditorOpen ? (
        <div className="mypage-overlay" role="presentation" onClick={() => setIsNameEditorOpen(false)}>
          <div
            className="mypage-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="이름 수정"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mypage-dialog__title">이름 수정</p>
            <input
              className="mypage-dialog__input"
              value={nameDraft}
              maxLength={12}
              autoFocus
              onChange={(event) => setNameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleNameSave();
                }
              }}
              placeholder="이름을 입력하세요"
            />
            <div className="mypage-dialog__actions">
              <button type="button" className="mypage-dialog__button is-muted" onClick={() => setIsNameEditorOpen(false)}>
                취소
              </button>
              <button
                type="button"
                className="mypage-dialog__button"
                onClick={handleNameSave}
                disabled={!nameDraft.trim()}
              >
                저장
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
            aria-label="가구원 수 설정"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mypage-sheet__handle" aria-hidden="true" />
            <p className="mypage-sheet__title">가구원 수 설정</p>
            <div className="mypage-picker" aria-label="가구원 수 선택">
              {householdOptions.map((count, index) => (
                <button
                  key={count}
                  type="button"
                  ref={(element) => {
                    pickerRefs.current[index] = element;
                  }}
                  className={`mypage-picker__item ${householdSize === count ? "is-selected" : ""}`}
                  onClick={() => {
                    onChangeHouseholdSize(count);
                    setIsHouseholdPickerOpen(false);
                  }}
                >
                  {count}명
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

