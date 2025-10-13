import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CreatePostScreen.css';  // Import file CSS cho component này

const CreatePostScreen = () => {
  const navigate = useNavigate(); // Hook để điều hướng giữa các trang

  return (
    <div className="centered-layout"> {/* Container chính căn giữa */}
      <h1 className="page-title">建立新貼文</h1> {/* Tiêu đề trang với gradient màu */}
      
      <div
        style={{
          display: 'flex', // Sử dụng flexbox
          flexDirection: 'column', // Sắp xếp theo chiều dọc
          alignItems: 'center', // Căn giữa theo chiều ngang
          gap: '20px', // Khoảng cách giữa các phần tử
          marginBottom: '40px', // Khoảng cách phía dưới
          marginTop: '95px',  // Đẩy nội dung xuống 95px từ phía trên
        }}
      >
        {/* Div này hiện tại đang trống */}
      </div>
      
      <div style={{ 
        display: 'flex', // Sử dụng flexbox
        flexDirection: 'column', // Sắp xếp theo chiều dọc
        alignItems: 'center', // Căn giữa theo chiều ngang
        gap: '20px', // Khoảng cách 20px giữa các nút
        marginBottom: '40px' // Khoảng cách 40px phía dưới
      }}>        
        <button
          className="post-button" // Class CSS cho styling nút
          onClick={() => navigate('/create-post/text')} // Chuyển đến trang tạo bài viết văn bản
          aria-label="建立文字貼文" // Nhãn trợ năng cho screen reader
        >
          建立文字貼文 {/* Nút tạo bài viết văn bản */}
        </button>
        
        <button
          className="post-button" // Class CSS cho styling nút
          onClick={() => navigate('/create-post/audio')} // Chuyển đến trang tạo bài viết âm thanh
          aria-label="建立音訊貼文" // Nhãn trợ năng cho screen reader
        >
          建立音訊貼文 {/* Nút tạo bài viết âm thanh */}
        </button>
      </div>
    </div>
  );
};

export default CreatePostScreen; // Xuất component để sử dụng ở nơi khác
