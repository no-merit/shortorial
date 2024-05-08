// 트림 기능 역할
// 직접 시간을 넣어서 수정된 영상을 보여줌
// 파일 다운로드 다윤이가 한 기능 가져오면 될 듯

import React, { useEffect, useState } from 'react';
import { shorts } from '../apis/shorts';
import { axios } from '../utils/axios';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import ModalComponent from '../components/modal/ModalComponent';

const VideoTrimPage = () => {

  const navigate = useNavigate();
  const handleShowModal = (id : number) => setClickId(id);
  const handleCloseModal = () => setClickId(-1);

  const goToLearnMode = () => {
    navigate("/learn");
  };

  const goToChallengeMode = () => {
    navigate("/challenge");
  };

  const [shortsList, setShortsList] = useState<shorts[]>([]);
  const [clickId, setClickId] = useState<number>(-1);

  useEffect(() => {
    axios.get<shorts[]>("/api/shorts")
      .then(response => {
        setShortsList(response.data);

        console.log(response.data);
        for(let i = 0; i < shortsList.length; i++) {
          console.log(shortsList[i].shortsUrl);
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
    
    

  }, [])

  return (
    <div>
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(162px, 1fr))",
          gap: "16px 16px",
        }}
      >
        <div>
        {shortsList.map(shorts => (
          <div key={shorts.shortsNo}>
            <VideoBox onClick={() => handleShowModal(shorts.shortsNo)}>
              <video src={shorts.shortsLink} crossOrigin="anonymous"></video>
            </VideoBox>
            <ModalComponent
              title={shorts.shortsTitle}
              body={
                <VideoBox>
                  <video src={shorts.shortsLink} autoPlay loop crossOrigin='anonymous'></video>
                </VideoBox>
              }
              showModal={clickId === shorts.shortsNo}
              handleCloseModal={handleCloseModal}
              goToLearnMode={goToLearnMode}
              goToChallengeMode={goToChallengeMode}
              />
              <p>쇼츠 제목 : {shorts.shortsTitle}</p>
              <p>쇼츠 디렉터 : {shorts.shortsDirector}</p>
              <p>쇼츠 시간 : {shorts.shortsTime}</p>
              <p>쇼츠 참여 인원 : {shorts.shortsChallengers}</p>
          </div>
        ))}
          
        </div>
      </div>
    </div>
  );
};

export default VideoTrimPage;

const VideoBox = styled.div`
  position: relative;
  width: 100%;
  max-width: 286px;
  border-radius: 8px;
  overflow: hidden;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;