import {
  Container,
  FileDropSection,
  DragOverlay,
  PreviewImageSection,
} from "./styled";
import { useEffect, useRef, useState } from "react";
import { IoIosImages } from "react-icons/io";
import { IconContext } from "react-icons";
import ReactQuill from "react-quill";
import { fullModules } from "../../utils/ReactQuillConfig";
import axios from "axios";

const SignLanChatPage = () => {
  const [isDrag, setIsDrag] = useState(false);
  const dragTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const [dropFile, setDropFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [value, setValue] = useState("");

  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDrag(true);

      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }

      dragTimeoutRef.current = setTimeout(() => {
        setIsDrag(false);
      }, 100);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDrag(false);

      const files = e.dataTransfer.files;
      let previewUrls = []; // 미리보기 URL을 저장할 배열

      if (files && files.length) {
        const imageFiles = Array.from(files).filter((file) =>
          file.type.startsWith("image/"),
        );

        if (imageFiles.length) {
          const newImageFiles = dropFile
            ? [...dropFile, ...imageFiles]
            : imageFiles; // 기존 파일에 새로운 파일 추가

          newImageFiles.forEach((file, index) => {
            const reader = new FileReader();

            reader.onloadend = () => {
              previewUrls.push(reader.result); // URL 배열에 추가

              // 모든 이미지가 로드되었는지 확인
              if (previewUrls.length === newImageFiles.length) {
                setDropFile(newImageFiles); // 드랍된 파일 상태 업데이트
                setPreviewUrl(previewUrls); // 모든 이미지 URL 배열을 상태에 설정
              }
            };

            reader.readAsDataURL(file); // 파일 읽기 시작
          });
        } else {
          setDropFile(null);
        }
      }
    };

    const handlePaste = (e) => {
      const items = (e.clipboardData || window.clipboardData).items;
      let imageFiles = []; // 이미지 파일을 저장할 배열
      let previewUrls = []; // 미리보기 URL을 저장할 배열

      for (let index in items) {
        const item = items[index];

        if (item.kind === "file" && item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          imageFiles.push(blob); // 파일 배열에 추가
          const reader = new FileReader();

          reader.onloadend = () => {
            previewUrls.push(reader.result); // URL 배열에 추가
            // 모든 이미지가 로드되었는지 확인
            if (previewUrls.length === imageFiles.length) {
              setDropFile((prevFiles) => [...(prevFiles || []), ...imageFiles]); // 기존 파일에 새로운 파일 추가
              setPreviewUrl((prevUrls) => [
                ...(prevUrls || []),
                ...previewUrls,
              ]); // 기존 URL에 새로운 URL 추가
            }
          };

          reader.readAsDataURL(blob); // 파일 읽기 시작
        }
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    console.log("select files >> ", files);

    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/"),
      );

      let previewUrls = []; // 미리보기 URL을 저장할 배열

      imageFiles.forEach((file) => {
        const reader = new FileReader();

        reader.onloadend = () => {
          previewUrls.push(reader.result); // URL 배열에 추가
          // 모든 이미지가 로드되었는지 확인
          if (previewUrls.length === imageFiles.length) {
            setDropFile((prevFiles) => [...(prevFiles || []), ...imageFiles]); // 기존 파일에 새로운 파일 추가
            setPreviewUrl((prevUrls) => [...(prevUrls || []), ...previewUrls]); // 기존 URL에 새로운 URL 추가
          }
        };

        reader.readAsDataURL(file); // 파일 읽기 시작
      });
    }
  };

  const onClickSendImg = () => {
    console.log("dropFile >> ", dropFile);
    if (!dropFile || dropFile.length === 0) {
      alert("파일을 선택해주세요.");
      return;
    }

    const fd = new FormData();
    dropFile.forEach((file, index) => {
      fd.append(`file${index}`, file, file.name);
    });

    // FormData 객체의 내용을 로깅
    for (let [key, value] of fd.entries()) {
      console.log(`${key}: ${value}`);
    }
    axios
      .post("/api/sign-lan/analysis", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log(response.data);
        alert("[분석]파일이 성공적으로 전송되었습니다.");
      })
      .catch((error) => {
        console.error("Error uploading file: ", error);
        alert("[분석]파일 전송 중 오류가 발생했습니다.");
      });
  };

  const onClickChat = () => {
    const message = "안녕하세요. 오늘 날씨 어때요?";
    const payload = { message };

    axios
      .post("/api/chat", payload)
      .then((res) => {
        console.log(res.data);
        alert("[채팅] 파일이 성공적으로 전송되었습니다.");
      })
      .catch((error) => {
        console.error("Error uploading file: ", error);
        alert("[채팅] [알파벳 분석] 파일 전송 중 오류가 발생했습니다.");
      });
  };

  return (
    <Container>
      <button onClick={onClickSendImg}>전송</button>
      <button onClick={onClickChat}>채팅</button>

      <input
        type="file"
        multiple={true}
        accept="image/jpeg, image/png"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {isDrag && <DragOverlay>파일을 드롭하세요</DragOverlay>}
      <FileDropSection onClick={() => fileInputRef.current.click()}>
        {dropFile ? (
          <p>{dropFile[0].name}</p>
        ) : (
          <div className="drop-content">
            <IconContext.Provider value={{ className: "react-icons" }}>
              <IoIosImages />
            </IconContext.Provider>
            사진을 클릭하여 이미지를 업로드하세요. <br />
            또는 이미지를 끌어 넣거나 클립보드에 (Ctrl+V) 복사 후 사용해주세요.
            {/*<p>최대 10MB 이하 JPEG, PNG 첨부 가능</p>*/}
            {/*<p>이미지를 끌어넣거나 클립보드에 복사하여 붙여 넣어주세요.</p>*/}
            {/*<p>또는 시작할 파일을 선택하세요</p>*/}
          </div>
        )}
      </FileDropSection>

      <PreviewImageSection>
        {previewUrl &&
          previewUrl.map((v, i) => {
            return (
              <>
                <img src={v} alt="preview" />
              </>
            );
          })}
      </PreviewImageSection>
    </Container>
  );
};

export default SignLanChatPage;
