import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../services/api';
import './TextPostScreen.css';  // Import file CSS cho component này

const TextPostScreen = ({ user }) => { // Component nhận props user
  const navigate = useNavigate(); // Hook để điều hướng giữa các trang
  const location = useLocation(); // Hook để lấy thông tin từ trang trước

  // Lấy dữ liệu được truyền từ trang trước (nếu có)
  const transcriptFromAudio = location.state?.transcript || ''; // Văn bản từ âm thanh
  const cameFromAudio = location.state?.fromAudioRecord || false; // Có phải từ ghi âm không
  const recordId = location.state?.recordId; // ID của bản ghi âm
  const audioUrl = location.state?.audioUrl; // URL của file âm thanh

  const [content, setContent] = useState(transcriptFromAudio); // State lưu nội dung bài viết
  const [statusMessage, setStatusMessage] = useState(''); // State lưu thông báo trạng thái

  // Effect chạy khi component mount hoặc location.state thay đổi
  useEffect(() => {
    if (location.state?.transcript) {
      setContent(location.state.transcript); // Cập nhật nội dung từ transcript
    }
  }, [location.state?.initialContent]);

  // Hàm xử lý khi người dùng thay đổi nội dung textarea
  const handleContentChange = (e) => setContent(e.target.value);

  // Hàm xử lý khi người dùng nhấn nút "送出"
  const handleSubmit = async () => {
    if (!content.trim()) { // Kiểm tra nội dung không được rỗng
      setStatusMessage('內容不能為空');
      return;
    }
    if (!user || !user.id) { // Kiểm tra người dùng đã đăng nhập
      setStatusMessage('使用者未登入，無法發文');
      return;
    }
    setStatusMessage('發文中...'); // Hiển thị thông báo đang xử lý

    try {
      // Gọi API để tạo bài viết mới
      const result = await ApiService.createPost(user.id, content.trim(), 'public');
      if (result.success) { // Nếu tạo bài viết thành công
        setStatusMessage('發文成功！');
        setTimeout(() => {
          navigate('/main'); // Chuyển về trang chính sau 600ms
        }, 600);
      } else { // Nếu tạo bài viết thất bại
        setStatusMessage(`發文失敗: ${result.message || '未知錯誤'}`);
      }
    } catch (err) { // Xử lý lỗi exception
      console.error('發文錯誤:', err);
      setStatusMessage('發文時發生錯誤，請稍後再試');
    }
  };

  // Hàm xử lý khi người dùng nhấn nút "取消"
  const handleCancel = () => navigate('/main');

  return (
    <div className="text-post-screen"> {/* Container chính của component */}
      {/* Hiển thị thông tin nếu đến từ trang ghi âm */}
      {cameFromAudio && (
        <div
          style={{
            background: '#eef', // Màu nền xanh nhạt
            padding: '8px 10px', // Padding trong
            borderRadius: 6, // Bo góc
            fontSize: 13, // Kích thước font
            marginBottom: 10 // Khoảng cách phía dưới
          }}
        >
          已從錄音自動匯入文字 {/* Thông báo đã import từ ghi âm */}
          {recordId && <span style={{ marginLeft: 8 }}>recordId: {recordId}</span>} {/* Hiển thị ID bản ghi */}
          {audioUrl && ( // Nếu có URL âm thanh
            <span style={{ marginLeft: 8 }}>
              <a href={audioUrl} target="_blank" rel="noreferrer">
                原音訊 {/* Link đến file âm thanh gốc */}
              </a>
            </span>
          )}
        </div>
      )}

      {/* Textarea để người dùng nhập nội dung */}
      <textarea
        placeholder="請輸入貼文內容" // Placeholder text
        value={content} // Giá trị hiện tại
        onChange={handleContentChange} // Hàm xử lý khi thay đổi
        rows={6} // Số dòng hiển thị
      />

      {/* Container chứa các nút bấm */}
      <div style={{ marginTop: 12 }}> {/* Khoảng cách phía trên */}
        <button onClick={handleSubmit}> {/* Nút gửi bài viết */}
          送出
        </button>
        <button onClick={handleCancel} className="cancel-btn"> {/* Nút hủy */}
          取消
        </button>
      </div>

      {/* Hiển thị thông báo trạng thái (nếu có) */}
      {statusMessage && (
        <p style={{ fontSize: 14, marginTop: 12 }}>{statusMessage}</p>
      )}
    </div>
  );
};

export default TextPostScreen; // Xuất component để sử dụng ở nơi khác
