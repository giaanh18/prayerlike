import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBackground from '../../components/AppBackground/AppBackground';
import ApiService from '../../services/api';
import './ActivityForm.css';

const ActivityForm = ({ user, onBack }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    eventName: '',
    eventLocation: '',
    eventDate: '',
    activityTime: '',
    maxParticipants: '',
    description: ''
  });

  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [images, setImages] = useState([]);
  const [imagesPreview, setImagesPreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    return () => {
      if (coverImagePreview) {
        URL.revokeObjectURL(coverImagePreview);
      }
      imagesPreview.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [coverImagePreview, imagesPreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file!');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size cannot exceed 5MB!');
        e.target.value = '';
        return;
      }

      if (coverImagePreview) {
        URL.revokeObjectURL(coverImagePreview);
      }

      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
      console.log('✅ Cover image selected:', file.name);
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file!`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} size exceeds 5MB!`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    imagesPreview.forEach(url => {
      URL.revokeObjectURL(url);
    });

    setImages(validFiles);
    setImagesPreview(validFiles.map(file => URL.createObjectURL(file)));
    console.log(`✅ ${validFiles.length} images selected`);
  };

  const removeCoverImage = () => {
    if (coverImagePreview) {
      URL.revokeObjectURL(coverImagePreview);
    }
    setCoverImage(null);
    setCoverImagePreview(null);
    const fileInput = document.getElementById('coverImageInput');
    if (fileInput) fileInput.value = '';
  };

  const removeImage = (index) => {
    if (imagesPreview[index]) {
      URL.revokeObjectURL(imagesPreview[index]);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagesPreview(prev => prev.filter((_, i) => i !== index));

    if (images.length === 1) {
      const fileInput = document.getElementById('activityImagesInput');
      if (fileInput) fileInput.value = '';
    }
  };

  const parseEventDate = (dateString) => {
    try {
      if (!dateString) {
        return new Date().toISOString().split('T')[0];
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }

      const match = dateString.match(/(\w+)\s+(\d+),?\s+(\d{4})/);
      if (match) {
        const [, month, day, year] = match;
        const monthMap = {
          'January': '01', 'February': '02', 'March': '03', 'April': '04',
          'May': '05', 'June': '06', 'July': '07', 'August': '08',
          'September': '09', 'October': '10', 'November': '11', 'December': '12'
        };
        const monthNum = monthMap[month] || '01';
        const dayNum = day.padStart(2, '0');
        return `${year}-${monthNum}-${dayNum}`;
      }

      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }

      return new Date().toISOString().split('T')[0];
    } catch (error) {
      console.error('Parse date error:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  const parseActivityTime = (timeString) => {
    try {
      if (!timeString) return '';

      const match = timeString.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        const [, hour, minute] = match;
        return `${hour.padStart(2, '0')}:${minute}`;
      }
      return '';
    } catch (error) {
      console.error('Parse time error:', error);
      return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress('Preparing...');

    try {
      // ✅ Validation
      if (!formData.eventName?.trim()) {
        alert('Please enter event name!');
        setIsSubmitting(false);
        setUploadProgress('');
        return;
      }

      if (!formData.eventLocation?.trim()) {
        alert('Please enter event location!');
        setIsSubmitting(false);
        setUploadProgress('');
        return;
      }

      if (!formData.eventDate) {
        alert('Please select event date!');
        setIsSubmitting(false);
        setUploadProgress('');
        return;
      }

      const currentUser = user || ApiService.getCurrentUser();

      if (!currentUser || !currentUser.id) {
        alert('Please log in first!');
        setIsSubmitting(false);
        setUploadProgress('');
        navigate('/login');
        return;
      }

      // ✅ Check tribe
      if (!currentUser.tribe) {
        alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to create an activity.');
        setIsSubmitting(false);
        setUploadProgress('');
        return;
      }

      // ✅ Parse date & time
      const parsedDate = parseEventDate(formData.eventDate);
      const parsedTime = parseActivityTime(formData.activityTime);

      console.log('📅 Parsed date:', parsedDate);
      console.log('⏰ Parsed time:', parsedTime);
      console.log('🏛️ User tribe:', currentUser.tribe);

      setUploadProgress('Creating activity...');

      // ✅ FIX: description sạch, không nhồi thêm gì
      const description = formData.description?.trim() || '';

      // ✅ FIX: event_time và max_participants là field riêng
      const activityData = {
        title: formData.eventName.trim(),
        location: formData.eventLocation.trim(),
        event_date: parsedDate,
        event_time: parsedTime || '00:00',
        description: description,
        max_participants: formData.maxParticipants
          ? parseInt(formData.maxParticipants, 10)
          : null,
        tribe: currentUser.tribe,
        coverImageFile: coverImage || null,
        imageFiles: images.length > 0 ? images : []
      };

      console.log('📤 Submitting activity:', {
        title: activityData.title,
        location: activityData.location,
        event_date: activityData.event_date,
        event_time: activityData.event_time,
        description: activityData.description,
        max_participants: activityData.max_participants,
        tribe: activityData.tribe,
        coverImageFile: activityData.coverImageFile?.name || 'none',
        imageFiles: activityData.imageFiles.map(f => f.name)
      });

      // ✅ Call API
      const result = await ApiService.createActivity(activityData);

      if (result.success) {
        console.log('✅ Activity created successfully:', result.activity);

        alert('Activity created successfully!');

        // ✅ Cleanup URLs
        if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
        imagesPreview.forEach(url => URL.revokeObjectURL(url));

        // ✅ Reset form
        setFormData({
          eventName: '',
          eventLocation: '',
          eventDate: '',
          activityTime: '',
          maxParticipants: '',
          description: ''
        });
        setCoverImage(null);
        setCoverImagePreview(null);
        setImages([]);
        setImagesPreview([]);
        setUploadProgress('');

        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => input.value = '');

        // ✅ Navigate back
        if (onBack) {
          onBack();
        } else {
          navigate('/context', {
            state: {
              category: 'Tribe Prayer',
              viewMode: 'activity',
              refresh: true
            }
          });
        }

      } else {
        console.error('❌ Create failed:', result);

        let errorMessage = 'Creation failed';

        if (result.message) {
          if (typeof result.message === 'string') {
            errorMessage = `Creation failed: ${result.message}`;
          } else if (typeof result.message === 'object') {
            errorMessage = `Creation failed:\n${JSON.stringify(result.message, null, 2)}`;
          }
        }

        if (result.error && result.error !== result.message) {
          errorMessage += `\n\nError: ${result.error}`;
        }

        if (result.details) {
          console.error('📋 Error details:', result.details);

          if (result.details.detail && Array.isArray(result.details.detail)) {
            errorMessage += '\n\nValidation errors:';
            result.details.detail.forEach((err, index) => {
              const location = err.loc ? err.loc.join(' > ') : 'unknown';
              const message = err.msg || err.message || JSON.stringify(err);
              errorMessage += `\n${index + 1}. [${location}] ${message}`;
            });
          } else if (typeof result.details === 'string') {
            errorMessage += `\n\nDetails: ${result.details}`;
          } else {
            errorMessage += `\n\nDetails:\n${JSON.stringify(result.details, null, 2)}`;
          }
        }

        if (result.statusCode) {
          errorMessage += `\n\nHTTP Status: ${result.statusCode}`;
        }

        alert(errorMessage);
      }

    } catch (error) {
      console.error('💥 Submit error:', error);

      let errorMessage = 'An error occurred';

      if (error.message) {
        errorMessage = `An error occurred: ${error.message}`;
      }

      if (error.response) {
        console.error('Error response:', error.response);
        errorMessage += `\n\nServer response: ${JSON.stringify(error.response.data || error.response, null, 2)}`;
      }

      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleCancel = () => {
    const hasData = formData.eventName || formData.eventLocation || formData.eventDate ||
      formData.description || coverImage || images.length > 0;

    if (hasData && !isSubmitting) {
      const confirmLeave = window.confirm('Are you sure you want to leave? Unsaved data will be lost.');
      if (!confirmLeave) return;
    }

    if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
    imagesPreview.forEach(url => URL.revokeObjectURL(url));

    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="activity-form-container">
        <div className="activity-form-header">
          <button
            className="back-button"
            onClick={handleCancel}
            disabled={isSubmitting}
            aria-label="Back"
          >
            ←
          </button>
          <h2>New promotional activity</h2>
        </div>

        <form className="activity-form" onSubmit={handleSubmit}>

          {/* Event Name */}
          <div className="form-group">
            <label htmlFor="eventName">Event name *</label>
            <input
              id="eventName"
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              placeholder="Tuesday prayer meeting"
              required
              disabled={isSubmitting}
              maxLength={200}
            />
          </div>

          {/* Event Location */}
          <div className="form-group">
            <label htmlFor="eventLocation">Event location *</label>
            <input
              id="eventLocation"
              type="text"
              name="eventLocation"
              value={formData.eventLocation}
              onChange={handleChange}
              placeholder="Prayer room on the second floor of the church"
              required
              disabled={isSubmitting}
              maxLength={200}
            />
          </div>

          {/* Event Date */}
          <div className="form-group">
            <label htmlFor="eventDate">Event date *</label>
            <input
              id="eventDate"
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Activity Time */}
          <div className="form-group">
            <label htmlFor="activityTime">Activity time</label>
            <input
              id="activityTime"
              type="time"
              name="activityTime"
              value={formData.activityTime}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Max Participants */}
          <div className="form-group">
            <label htmlFor="maxParticipants">Number of participants</label>
            <input
              id="maxParticipants"
              type="number"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              placeholder="Maximum number of people: 30"
              disabled={isSubmitting}
              min="1"
              max="9999"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Activity description..."
              disabled={isSubmitting}
              rows={4}
              maxLength={1000}
            />
          </div>

          {/* Cover Image */}
          <div className="form-group">
            <label>Cover Image</label>
            <input
              type="file"
              id="coverImageInput"
              accept="image/*"
              onChange={handleCoverImageChange}
              style={{ display: 'none' }}
              disabled={isSubmitting}
            />
            <label
              htmlFor="coverImageInput"
              className={`file-upload-label ${isSubmitting ? 'disabled' : ''}`}
              style={{
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              📸 Choose cover image
            </label>
            <small className="file-hint">Max 5MB, JPG/PNG/GIF</small>

            {coverImagePreview && (
              <div className="image-preview-container">
                <img
                  src={coverImagePreview}
                  alt="Cover Preview"
                  className="image-preview"
                />
                <button
                  type="button"
                  onClick={removeCoverImage}
                  className="remove-image-btn"
                  disabled={isSubmitting}
                  aria-label="Remove cover image"
                >
                  ×
                </button>
                <p className="image-name">{coverImage?.name}</p>
              </div>
            )}
          </div>

          {/* Multiple Images */}
          <div className="form-group">
            <label>Activity Images (multiple)</label>
            <input
              type="file"
              id="activityImagesInput"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
              style={{ display: 'none' }}
              disabled={isSubmitting}
            />
            <label
              htmlFor="activityImagesInput"
              className={`file-upload-label ${isSubmitting ? 'disabled' : ''}`}
              style={{
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              🖼️ Choose activity images
            </label>
            <small className="file-hint">Max 5MB each, JPG/PNG/GIF</small>

            {imagesPreview.length > 0 && (
              <div className="images-preview-container">
                <p className="images-count">
                  Selected {imagesPreview.length} image{imagesPreview.length > 1 ? 's' : ''}
                </p>
                <div className="images-grid">
                  {imagesPreview.map((preview, index) => (
                    <div key={index} className="image-preview-item">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="image-preview-small"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-image-btn-small"
                        disabled={isSubmitting}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        ×
                      </button>
                      <p className="image-name-small">{images[index]?.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="upload-progress">
              <div className="progress-spinner"></div>
              <p>{uploadProgress}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="post-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (uploadProgress || 'Creating...') : 'Post'}
          </button>

        </form>
      </div>
    </AppBackground>
  );
};

export default ActivityForm;
