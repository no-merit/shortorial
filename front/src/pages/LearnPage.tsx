import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Flip, Pause, PlayArrow, Repeat, Videocam } from "@mui/icons-material";
import noRepeat from "/src/assets/icon/repeat-off.svg";
import { useNavigate, useParams } from "react-router-dom";
import { VideoSection, Shorts } from "../constants/types";
import { setBtnInfo } from "../modules/Motion";
import { getShortsInfo } from "../apis/shorts";
import useLearnStore from "../store/useLearnStore";
import { useActionStore, useBtnStore, useMotionDetectionStore } from "../store/useMotionStore";
import SectionButtonList from "../components/buttonList/SectionButtonList";
import MotionCamera from "../components/motion/MotionCamera";
import VideoMotionButton from "../components/button/VideoMotionButton";

const LearnPage = () => {
  type LearnState = "LOADING" | "PAUSE" | "READY" | "PLAY";

  const videoRef = useRef<HTMLVideoElement>(null);
  const video = videoRef.current;
  const leftSectionRef = useRef<HTMLDivElement>(null);
  const centerSectionRef = useRef<HTMLDivElement>(null);

  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [centerSectionSize, setCenterSectionSize] = useState({
    width: 0,
    height: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const interval = intervalRef.current;

  const navigate = useNavigate();
  const params = useParams();

  const [state, setState] = useState<LearnState>("LOADING");

  const [videoInfo, setVideoInfo] = useState<Shorts>({
    shortsNo: 0,
    shortsUrl: "",
    shortsTitle: "",
    shortsDirector: "",
    shortsTime: 0,
    shortsChallengers: 0,
    shortsLink: "",
    shortsDate: "",
  });

  const [sectionList, setSectionList] = useState<VideoSection[]>([]);

  const [currentTime, setCurrentTime] = useLearnStore((state) => [
    state.currentTime,
    state.setCurrentTime,
  ]);

  const [timer, resetTimer, countdownTimer] = useLearnStore((state) => [
    state.timer,
    state.resetTimer,
    state.countdownTimer,
  ]);

  const [isLooping, loopSection, setIsLooping, setLoopSection] = useLearnStore((state) => [
    state.isLooping,
    state.loopSection,
    state.setIsLooping,
    state.setLoopSection,
  ]);

  const [isFlipped, setIsFlipped] = useLearnStore((state) => [state.isFlipped, state.setIsFlipped]);

  const [playSpeed, changePlaySpeed] = useLearnStore((state) => [
    state.playSpeed,
    state.changePlaySpeed,
  ]);

  const currentSection = useLearnStore((state) => state.currentSection);

  const btn = useBtnStore((state) => state.btn);
  const action = useActionStore((state) => state.action);
  const [canAction, setCanAction] = useState(true);

  const [playCount, challengeCount, repeatCount, flipCount, speedCount] = useMotionDetectionStore(
    (state) => [
      state.playCount,
      state.challengeCount,
      state.repeatCount,
      state.flipCount,
      state.speedCount,
    ]
  );

  // 영상 정보 가져오기
  const loadVideo = useCallback(async () => {
    if (params.shortsNo) {
      const data: Shorts = await getShortsInfo(params.shortsNo);
      if (data) {
        setVideoInfo(data);
        initSectionList(data.shortsTime);
        setState("PAUSE");
      }
    }
  }, [params.shortsNo]);

  // 구간 리스트 초기화
  const initSectionList = (videoLength: number) => {
    const secondsPerSection = 3;
    const numberOfSections = videoLength / secondsPerSection;
    const result: VideoSection[] = [];

    for (let i = 0; i < numberOfSections; i++) {
      result.push({
        id: i,
        start: i * secondsPerSection,
        end: (i + 1) * secondsPerSection,
      });
    }

    setSectionList(result);
  };

  // 영상 시간 이동하기
  const moveVideoTime = useCallback(
    (startTime: number) => {
      if (video) {
        video.currentTime = startTime;
        setCurrentTime(startTime);
      }
    },
    [setCurrentTime, video]
  );

  // 타이머 인터벌 초기화
  const initInterval = useCallback(() => {
    if (interval) clearInterval(interval);
    intervalRef.current = null;
    resetTimer();
  }, [interval, resetTimer]);

  // 카운트다운 시작
  const startCountdown = useCallback(() => {
    if (interval) initInterval();
    intervalRef.current = setInterval(countdownTimer, 1000);
    setState("READY");
  }, [countdownTimer, initInterval, interval]);

  // 영상 재생
  const playVideo = useCallback(() => {
    if (video) {
      if (video.ended) {
        video.currentTime = 0;
        setCurrentTime(0);
      }

      video.playbackRate = playSpeed;
      video.play();
      setState("PLAY");
    }
  }, [playSpeed, setCurrentTime, video]);

  // 영상 일시정지
  const pauseVideo = useCallback(() => {
    if (video) {
      video.pause();
      initInterval();
      moveVideoTime(currentSection.start); // 현재 구간 시작 시간으로 이동
      setState("PAUSE");
    }
  }, [currentSection.start, initInterval, moveVideoTime, video]);

  // 영상의 현재 시간을 갱신, 반복인 경우 현재 시간 이전으로 되돌아가기
  const handleTimeUpdate = useCallback(() => {
    if (video) {
      // 반복하지 않는 경우
      if (!isLooping) {
        setCurrentTime(video.currentTime);
        if (video.ended) {
          video.currentTime = 0;
          setState("PAUSE");
        }
        return;
      }

      // 반복하는 경우
      if (isLooping && loopSection) {
        if (video.currentTime >= loopSection.end || video.ended) {
          video.currentTime = loopSection.start;
          setCurrentTime(loopSection.start);
          if (video.ended) playVideo();
          return;
        }
      }
    }
  }, [isLooping, loopSection, playVideo, setCurrentTime, video]);

  // 구간 반복 토글
  const toggleLooping = () => {
    if (isLooping) {
      setIsLooping(false);
      setLoopSection(null);
    } else {
      setIsLooping(true);
      setLoopSection(currentSection);
    }
  };

  // 다음 구간으로 이동
  const moveToNextSection = () => {
    if (currentSection.id >= sectionList.length - 1) return;

    if (video) {
      const nextTime = sectionList[currentSection.id + 1].start;
      video.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  // 이전 구간으로 이동
  const moveToPrevSection = () => {
    if (currentSection.id <= 0) return;

    if (video) {
      const nextTime = sectionList[currentSection.id - 1].start;
      video.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  // 컴포넌트가 처음 마운트될 때 실행
  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  // 비디오 크기 초기화
  const initVideoSize = useCallback(() => {
    const height = centerSectionSize.height;
    const width = Math.floor((centerSectionSize.height * 9) / 16);
    setVideoSize({ width, height });
  }, [centerSectionSize.height]);

  // Left Section 너비 반환
  const getLeftSectionWidth = useCallback(() => {
    if (leftSectionRef.current) {
      const { width } = leftSectionRef.current.getBoundingClientRect() ?? 0;
      return width;
    }
  }, []);

  // 화면 크기 바뀔 때마다 실행 - videoSize 초기화
  const handleResize = useCallback(() => {
    if (centerSectionRef.current) {
      const { width, height } = centerSectionRef.current.getBoundingClientRect();
      setCenterSectionSize({ width, height });
      initVideoSize();
    }
  }, [initVideoSize]);

  // window resize 이벤트 추가
  useEffect(() => {
    setTimeout(handleResize, 100);
    window.addEventListener("resize", () => setTimeout(handleResize, 100));

    return () => window.removeEventListener("resize", () => setTimeout(handleResize, 200));
  }, [handleResize, initVideoSize]);

  // 화면의 준비가 모두 완료했을 때 실행
  useEffect(() => {
    if (state === "LOADING") {
      if (videoInfo && sectionList && centerSectionRef) {
        initInterval();
      }
    }
  }, [centerSectionRef, initInterval, sectionList, state, videoInfo]);

  // 카운트다운이 끝나면 영상 재생
  useEffect(() => {
    if (interval && timer <= 0) {
      initInterval();
      playVideo();
    }
  }, [initInterval, interval, playVideo, timer]);

  // 영상에 timeupdate 이벤트 추가
  useEffect(() => {
    if (video) video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      if (video) video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [handleTimeUpdate, video]);

  // 영상 버튼 정보 가져오기
  useEffect(() => {
    setBtnInfo();
  }, [centerSectionSize]);

  // 영상 이동 액션 감지
  useEffect(() => {
    if (state !== "PAUSE") return;

    switch (action) {
      case "prev":
        if (canAction) {
          moveToPrevSection();
          setCanAction(false);
          // setTimeout(() => {
          //   setCanAction(true);
          // }, 1000);
        }
        break;
      case "next":
        if (canAction) {
          moveToNextSection();
          setCanAction(false);
          // setTimeout(() => {
          //   setCanAction(true);
          // }, 1000);
        }
        break;
      case "none":
        setCanAction(true);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  // 영상 버튼 모션 액션 감지
  useEffect(() => {
    switch (btn) {
      case "play":
        if (state === "PAUSE") startCountdown();
        else pauseVideo();
        break;
      case "challenge":
        if (state === "PAUSE") navigate(`/challenge/${params.shortsNo}`);
        break;
      case "repeat":
        if (state === "PAUSE") toggleLooping();
        break;
      case "flip":
        if (state === "PAUSE") setIsFlipped(!isFlipped);
        break;
      case "speed":
        if (state === "PAUSE") changePlaySpeed();
        break;
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [btn]);

  return (
    <Container>
      {state === "LOADING" ? (
        <LoadingText>Loading...</LoadingText>
      ) : (
        <>
          <LeftSection ref={leftSectionRef}>
            <SectionButtonList
              sectionList={sectionList}
              parentWidth={getLeftSectionWidth()}
              currentTime={currentTime}
              isLooping={isLooping}
              clickHandler={(section) => moveVideoTime(section.start)}
            />
          </LeftSection>
          <CenterSection ref={centerSectionRef}>
            <VideoContainer>
              <video
                width={videoSize.width}
                height={videoSize.height}
                src={videoInfo.shortsLink}
                ref={videoRef}
                className={isFlipped ? "flip" : ""}
                crossOrigin="anonymous"
              ></video>
            </VideoContainer>
            <VideoContainer id="dom">
              <MotionCamera
                width={videoSize.width}
                height={videoSize.height}
                className="camera flip"
                autoPlay
              ></MotionCamera>
              <VideoMotionButtonList>
                {state === "PAUSE" ? (
                  <VideoMotionButton
                    id="play"
                    icon={<PlayArrow />}
                    toolTip="재생"
                    onClick={startCountdown}
                    progress={playCount}
                  />
                ) : (
                  <VideoMotionButton
                    id="play"
                    icon={<Pause />}
                    toolTip="일시정지"
                    onClick={pauseVideo}
                    progress={playCount}
                  />
                )}
                <FoldList>
                  {isLooping ? (
                    <VideoMotionButton
                      id="repeat"
                      icon={<Repeat />}
                      toolTip="구간 반복 해제"
                      onClick={toggleLooping}
                      progress={repeatCount}
                      isVisible={state === "PAUSE"}
                    />
                  ) : (
                    <VideoMotionButton
                      id="repeat"
                      imgSrc={noRepeat}
                      toolTip="구간 반복"
                      onClick={toggleLooping}
                      progress={repeatCount}
                      isVisible={state === "PAUSE"}
                    />
                  )}
                  <VideoMotionButton
                    id="flip"
                    icon={<Flip />}
                    toolTip="거울 모드"
                    onClick={() => setIsFlipped(!isFlipped)}
                    progress={flipCount}
                    isVisible={state === "PAUSE"}
                  />
                  <VideoMotionButton
                    id="speed"
                    text={`${playSpeed}x`}
                    toolTip="재생 속도"
                    onClick={changePlaySpeed}
                    progress={speedCount}
                    isVisible={state === "PAUSE"}
                  />
                  <VideoMotionButton
                    id="challenge"
                    icon={<Videocam />}
                    toolTip="챌린지 모드로 이동"
                    link={`/challenge/${params.shortsNo}`}
                    progress={challengeCount}
                    isVisible={state === "PAUSE"}
                  />
                </FoldList>
              </VideoMotionButtonList>
              {state === "READY" && <Timer>{timer}</Timer>}
            </VideoContainer>
          </CenterSection>
          <RightSection></RightSection>
        </>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  background-color: #000;

  @media screen and (orientation: portrait) {
    display: flex;
    flex-direction: column-reverse;
  }
`;

const Section = styled.section`
  position: relative;
  display: flex;
`;

const RightSection = styled(Section)`
  flex: 1;
  margin: 8px;

  @media screen and (orientation: portrait) {
    display: none;
  }
`;

const CenterSection = styled(Section)`
  flex: 1;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  @media screen and (orientation: portrait) {
    height: 80%;
    flex: auto;
  }
`;

const LeftSection = styled(Section)`
  flex: 1;
  justify-content: flex-end;
  align-items: center;
  margin: 8px;
  color: #fff;

  @media screen and (orientation: portrait) {
    align-items: center;
    height: 20%;
    flex: auto;
  }
`;

const VideoContainer = styled.div`
  position: relative;
  display: flex;
  height: 100%;

  video {
    display: flex;
    object-fit: cover;
  }

  video.flip {
    transform: scaleX(-1);
  }

  @media screen and (orientation: portrait) {
    .camera {
      display: none;
    }
  }
`;

const Timer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 84px;
  height: 84px;
  font-size: 48px;
  color: #fff;
  background: #35353580;
  border: 5px solid #fff;
  border-radius: 50%;
`;

const VideoMotionButtonList = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 18px 8px 0;
  box-sizing: border-box;
`;

const FoldList = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  height: auto;
  min-height: 80%;
  max-height: 100%;
`;

const LoadingText = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  font-size: 24px;
  color: #fff;
`;

export default LearnPage;
