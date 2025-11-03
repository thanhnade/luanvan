import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import './Dashboard.css';

function NewDeployment({ onDeploySuccess }) {
  const [deploymentType, setDeploymentType] = useState('docker');
  const [dockerImage, setDockerImage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [frameworkPreset, setFrameworkPreset] = useState('other');
  const [buildCommand, setBuildCommand] = useState('npm run build');
  const [outputDirectory, setOutputDirectory] = useState('build');
  const [installCommand, setInstallCommand] = useState('npm install');
  const [envVariables, setEnvVariables] = useState([{ key: '', value: '' }]);
  const [buildSettingsExpanded, setBuildSettingsExpanded] = useState(true);
  const [envVarsExpanded, setEnvVarsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success'); // 'success' or 'error'
  const [modalData, setModalData] = useState(null);
  const [isFrameworkDropdownOpen, setIsFrameworkDropdownOpen] = useState(false);
  const frameworkDropdownRef = useRef(null);

  const frameworkPresets = [
    { value: 'nextjs', label: 'Next.js' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'nuxt', label: 'Nuxt.js' },
    { value: 'gatsby', label: 'Gatsby' },
    { value: 'vite', label: 'Vite' },
    { value: 'vanilla', label: 'Vanilla JS' },
    { value: 'other', label: 'Other / Custom' },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleAddEnvVariable = () => {
    setEnvVariables([...envVariables, { key: '', value: '' }]);
  };

  const handleRemoveEnvVariable = (index) => {
    if (envVariables.length > 1) {
      const newVars = envVariables.filter((_, i) => i !== index);
      setEnvVariables(newVars);
    }
  };

  const handleEnvVariableChange = (index, field, value) => {
    const newVars = [...envVariables];
    newVars[index][field] = value;
    setEnvVariables(newVars);
  };

  const handleImportEnv = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const envContent = event.target.result;
        const lines = envContent.split('\n');
        const vars = lines
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => {
            const [key, ...valueParts] = line.split('=');
            return {
              key: key?.trim() || '',
              value: valueParts.join('=').trim().replace(/^["']|["']$/g, '') || ''
            };
          })
          .filter(v => v.key);
        
        if (vars.length > 0) {
          setEnvVariables(vars);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (frameworkDropdownRef.current && !frameworkDropdownRef.current.contains(event.target)) {
        setIsFrameworkDropdownOpen(false);
      }
    };

    if (isFrameworkDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isFrameworkDropdownOpen]);

  const handleFrameworkSelect = (value) => {
    setFrameworkPreset(value);
    setIsFrameworkDropdownOpen(false);
  };

  const selectedFramework = frameworkPresets.find(p => p.value === frameworkPreset) || frameworkPresets[frameworkPresets.length - 1];

  // Map framework preset từ frontend sang backend format
  const mapFrameworkType = (preset) => {
    const mapping = {
      'react': 'react',
      'vue': 'vue',
      'angular': 'angular',
      'nextjs': 'react',
      'nuxt': 'vue',
      'gatsby': 'react',
      'vite': 'react',
      'svelte': 'node',
      'vanilla': 'node',
      'other': 'node'
    };
    return mapping[preset] || 'node';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!projectName.trim()) {
      setError('Vui lòng nhập tên dự án');
      return;
    }

    if (deploymentType === 'docker') {
      if (!dockerImage.trim()) {
        setError('Vui lòng nhập đường dẫn Docker Hub image');
        return;
      }
      const dockerImagePattern = /^[a-zA-Z0-9._\/-]+(:[a-zA-Z0-9._-]+)?$/;
      if (!dockerImagePattern.test(dockerImage)) {
        setError('Định dạng Docker Hub image không hợp lệ. Ví dụ: username/image:tag');
        return;
      }
    } else {
      if (!selectedFile) {
        setError('Vui lòng chọn file để upload');
        return;
      }
    }

    // Get username from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    const user = JSON.parse(userData);
    const username = user.username;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let response;

      if (deploymentType === 'docker') {
        // Gọi API deploy-docker cho Docker deployment
        const requestBody = {
          name: projectName.trim(),
          frameworkType: mapFrameworkType(frameworkPreset),
          deploymentType: 'docker',
          dockerImage: dockerImage.trim(),
          username: username
        };

        response = await api.post('/apps/deploy-docker', requestBody);
      } else {
        // Gọi API deploy cho File deployment
        const requestBody = {
          name: projectName.trim(),
          frameworkType: mapFrameworkType(frameworkPreset),
          deploymentType: 'file',
          filePath: selectedFile ? selectedFile.name : '',
          username: username
        };

        response = await api.post('/apps/deploy', requestBody);
      }
      
      console.log('Deployment successful:', response.data);
      
      // Hiển thị modal thành công với dữ liệu từ response
      setModalType('success');
      setModalData(response.data);
      setShowModal(true);
      setSuccess(true);
      
      // Reset form
      setDockerImage('');
      setSelectedFile(null);
      setProjectName('');
      setFrameworkPreset('other');
      setBuildCommand('npm run build');
      setOutputDirectory('build');
      setInstallCommand('npm install');
      setEnvVariables([{ key: '', value: '' }]);
      
      // KHÔNG gọi onDeploySuccess() ở đây, sẽ gọi sau khi người dùng đóng modal
      
    } catch (err) {
      console.error('Deployment error:', err);
      
      // Xác định thông báo lỗi
      let errorMessage = 'Đã xảy ra lỗi khi triển khai. Vui lòng thử lại.';
      let errorDetails = null;
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        if (data?.message) {
          errorMessage = data.message;
        } else if (data && typeof data === 'string') {
          errorMessage = data;
        } else if (status === 400) {
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
        } else if (status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        }
        
        errorDetails = data;
      } else if (err.request) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      // Hiển thị modal lỗi
      setModalType('error');
      setModalData({
        message: errorMessage,
        details: errorDetails
      });
      setShowModal(true);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h2>Triển khai ứng dụng mới</h2>
        <p>Upload file hoặc sử dụng Docker Hub image để triển khai web tự động</p>
      </div>

      <form onSubmit={handleSubmit} className="deployment-form">
        {success && (
          <div className="success-message">
            <svg className="success-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <strong>Triển khai thành công!</strong>
              <p>Ứng dụng của bạn đang được triển khai...</p>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="projectName">Tên dự án *</label>
          <input
            type="text"
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Nhập tên dự án"
            required
            disabled={loading || success}
          />
        </div>

        <div className="form-group">
          <label htmlFor="frameworkPreset">Framework Preset</label>
          <div className="framework-select-wrapper" ref={frameworkDropdownRef}>
            <button
              type="button"
              className={`framework-select-button ${isFrameworkDropdownOpen ? 'open' : ''} ${loading || success ? 'disabled' : ''}`}
              onClick={() => !loading && !success && setIsFrameworkDropdownOpen(!isFrameworkDropdownOpen)}
              disabled={loading || success}
            >
              <span className="framework-select-label">{selectedFramework.label}</span>
              <svg 
                className={`select-arrow ${isFrameworkDropdownOpen ? 'open' : ''}`} 
                viewBox="0 0 24 24" 
                fill="none"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {isFrameworkDropdownOpen && (
              <div className="framework-dropdown">
                <div className="framework-dropdown-content">
                  {frameworkPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`framework-option ${frameworkPreset === preset.value ? 'selected' : ''}`}
                      onClick={() => handleFrameworkSelect(preset.value)}
                    >
                      <span>{preset.label}</span>
                      {frameworkPreset === preset.value && (
                        <svg className="check-icon" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <small className="form-hint">
            Chọn framework để tự động cấu hình build settings
          </small>
        </div>

        <div className="form-group">
          <label>Phương thức triển khai *</label>
          <div className="deployment-options">
            <label className="option-radio">
              <input
                type="radio"
                name="deploymentType"
                value="docker"
                checked={deploymentType === 'docker'}
                onChange={(e) => setDeploymentType(e.target.value)}
                disabled={loading || success}
              />
              <div className="option-content">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.984 6.016v12.469c0 .563-.281.984-.656 1.219-.375.281-.75.375-1.219.375-.516 0-.891-.188-1.266-.516l-2.484-2.156c-.188-.141-.469-.141-.656 0l-2.484 2.156c-.375.328-.75.516-1.266.516-.469 0-.844-.094-1.219-.375C2.298 19.469 2 19.048 2 18.516V5.531c0-.563.298-.984.656-1.219C3.031 4.031 3.406 3.938 3.875 3.938c.516 0 .891.188 1.266.516l2.484 2.156c.188.141.469.141.656 0L10.75 4.453c.375-.328.75-.516 1.266-.516.469 0 .844.094 1.219.375C13.594 4.547 13.984 4.969 13.984 5.531v.485z" fill="currentColor"/>
                </svg>
                <span>Docker Hub Image</span>
                <p>Nhập đường dẫn image từ Docker Hub</p>
              </div>
            </label>

            <label className="option-radio">
              <input
                type="radio"
                name="deploymentType"
                value="file"
                checked={deploymentType === 'file'}
                onChange={(e) => setDeploymentType(e.target.value)}
                disabled={loading || success}
              />
              <div className="option-content">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
                </svg>
                <span>Upload File</span>
                <p>Upload file dự án của bạn</p>
              </div>
            </label>
          </div>
        </div>

        {deploymentType === 'docker' ? (
          <div className="form-group">
            <label htmlFor="dockerImage">Docker Hub Image *</label>
            <input
              type="text"
              id="dockerImage"
              value={dockerImage}
              onChange={(e) => setDockerImage(e.target.value)}
              placeholder="username/image:tag hoặc username/image"
              required
              disabled={loading || success}
            />
            <small className="form-hint">
              Ví dụ: nginx:latest, node:18-alpine, username/my-app:v1.0
            </small>
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="fileUpload">Chọn file *</label>
            <div className="file-upload-area">
              <input
                type="file"
                id="fileUpload"
                onChange={handleFileChange}
                accept=".zip,.tar,.gz"
                disabled={loading || success}
              />
              <div className="file-upload-display">
                {selectedFile ? (
                  <div className="file-selected">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
                    </svg>
                    <span>{selectedFile.name}</span>
                    <span className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="currentColor"/>
                    </svg>
                    <p>Kéo thả file vào đây hoặc click để chọn</p>
                    <small>Hỗ trợ: ZIP, TAR, GZ (tối đa 100MB)</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Build and Output Settings */}
        <div className="settings-section">
          <div className="settings-header">
            <h3>Build and Output Settings</h3>
            <button
              type="button"
              className="toggle-section-btn"
              onClick={() => setBuildSettingsExpanded(!buildSettingsExpanded)}
              aria-label={buildSettingsExpanded ? 'Collapse' : 'Expand'}
            >
              <svg 
                className={`toggle-icon ${buildSettingsExpanded ? 'expanded' : ''}`}
                viewBox="0 0 24 24" 
                fill="none"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          {buildSettingsExpanded && (
            <div className="settings-content">
              <div className="setting-field">
                <label htmlFor="buildCommand">
                  Build Command
                  <svg className="info-icon" viewBox="0 0 24 24" fill="none" title="Command to build your project">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </label>
                <div className="input-with-edit">
                  <input
                    type="text"
                    id="buildCommand"
                    value={buildCommand}
                    onChange={(e) => setBuildCommand(e.target.value)}
                    placeholder="npm run build"
                    disabled={loading || success}
                  />
                  <button type="button" className="edit-btn" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="setting-field">
                <label htmlFor="outputDirectory">
                  Output Directory
                  <svg className="info-icon" viewBox="0 0 24 24" fill="none" title="Directory containing build output">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </label>
                <div className="input-with-edit">
                  <input
                    type="text"
                    id="outputDirectory"
                    value={outputDirectory}
                    onChange={(e) => setOutputDirectory(e.target.value)}
                    placeholder="build"
                    disabled={loading || success}
                  />
                  <button type="button" className="edit-btn" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="setting-field">
                <label htmlFor="installCommand">
                  Install Command
                  <svg className="info-icon" viewBox="0 0 24 24" fill="none" title="Command to install dependencies">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </label>
                <div className="input-with-edit">
                  <input
                    type="text"
                    id="installCommand"
                    value={installCommand}
                    onChange={(e) => setInstallCommand(e.target.value)}
                    placeholder="npm install"
                    disabled={loading || success}
                  />
                  <button type="button" className="edit-btn" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Environment Variables */}
        <div className="settings-section">
          <div className="settings-header">
            <h3>Environment Variables</h3>
            <button
              type="button"
              className="toggle-section-btn"
              onClick={() => setEnvVarsExpanded(!envVarsExpanded)}
              aria-label={envVarsExpanded ? 'Collapse' : 'Expand'}
            >
              <svg 
                className={`toggle-icon ${envVarsExpanded ? 'expanded' : ''}`}
                viewBox="0 0 24 24" 
                fill="none"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          {envVarsExpanded && (
            <div className="settings-content">
              <div className="env-table">
                <div className="env-table-header">
                  <div className="env-col-key">Key</div>
                  <div className="env-col-value">Value</div>
                  <div className="env-col-action"></div>
                </div>
                
                {envVariables.map((env, index) => (
                  <div key={index} className="env-table-row">
                    <div className="env-col-key">
                      <input
                        type="text"
                        value={env.key}
                        onChange={(e) => handleEnvVariableChange(index, 'key', e.target.value)}
                        placeholder="KEY_NAME"
                        disabled={loading || success}
                      />
                    </div>
                    <div className="env-col-value">
                      <input
                        type="text"
                        value={env.value}
                        onChange={(e) => handleEnvVariableChange(index, 'value', e.target.value)}
                        placeholder="value"
                        disabled={loading || success}
                      />
                    </div>
                    <div className="env-col-action">
                      <button
                        type="button"
                        className="remove-env-btn"
                        onClick={() => handleRemoveEnvVariable(index)}
                        disabled={loading || success || envVariables.length === 1}
                        title="Remove"
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="env-actions">
                <button
                  type="button"
                  className="add-env-btn"
                  onClick={handleAddEnvVariable}
                  disabled={loading || success}
                >
                  + Add More
                </button>
                <label className="import-env-btn" htmlFor="envFileInput">
                  Import .env
                  <input
                    type="file"
                    id="envFileInput"
                    accept=".env,.env.*"
                    onChange={handleImportEnv}
                    disabled={loading || success}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <p className="env-hint">
                or paste the .env contents above. <a href="#" onClick={(e) => { e.preventDefault(); }}>Learn more</a>
              </p>
            </div>
          )}
        </div>

        <button type="submit" className="deploy-button" disabled={loading || success}>
          {loading ? (
            <>
              <span className="spinner"></span>
              Đang triển khai...
            </>
          ) : success ? (
            'Đã triển khai thành công!'
          ) : (
            'Triển khai ngay'
          )}
        </button>
      </form>

      {/* Modal hiển thị kết quả */}
      {showModal && (
        <div className="modal-overlay" onClick={() => {
          // Khi click overlay, chỉ đóng modal, không tự động chuyển trang
          // Người dùng cần chọn một trong 2 nút trong modal
          if (modalType === 'error') {
            setShowModal(false);
            setError('');
          }
        }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-content ${modalType}`}>
              <button 
                className="modal-close-btn" 
                onClick={() => {
                  // Khi click nút X, chỉ đóng modal, không tự động chuyển trang
                  if (modalType === 'error') {
                    setShowModal(false);
                    setError('');
                  } else {
                    // Với modal success, chỉ đóng modal khi click X
                    setShowModal(false);
                    setSuccess(false);
                  }
                }}
                aria-label="Đóng modal"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {modalType === 'success' ? (
                <>
                  <div className="modal-icon success-icon-wrapper">
                    <svg className="success-icon" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="modal-title">Triển khai thành công!</h2>
                  <p className="modal-description">Ứng dụng của bạn đã được triển khai thành công.</p>
                  
                  {modalData && (
                    <div className="modal-results">
                      {modalData.url && (
                        <div className="result-item">
                          <div className="result-label">
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            URL:
                          </div>
                          <div className="result-value">
                            <a 
                              href={modalData.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="result-link"
                            >
                              {modalData.url}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {modalData.status && (
                        <div className="result-item">
                          <div className="result-label">
                            <svg viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Status:
                          </div>
                          <div className="result-value">
                            <span className={`status-badge status-${modalData.status}`}>
                              {modalData.status}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="modal-actions-group">
                    <button 
                      className="modal-action-btn secondary-btn"
                      onClick={() => {
                        setShowModal(false);
                        setSuccess(false);
                        // Ở lại trang, không gọi onDeploySuccess
                      }}
                    >
                      Ở lại trang
                    </button>
                    <button 
                      className="modal-action-btn primary-btn"
                      onClick={() => {
                        setShowModal(false);
                        setSuccess(false);
                        // Chuyển hướng về ProjectsList
                        if (onDeploySuccess) {
                          onDeploySuccess();
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Danh sách dự án
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="modal-icon error-icon-wrapper">
                    <svg className="error-icon" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h2 className="modal-title">Triển khai thất bại</h2>
                  <p className="modal-description">{modalData?.message || 'Đã xảy ra lỗi khi triển khai.'}</p>
                  
                  {modalData?.details && (
                    <div className="modal-error-details">
                      <pre>{JSON.stringify(modalData.details, null, 2)}</pre>
                    </div>
                  )}

                  <button 
                    className="modal-action-btn error-btn"
                    onClick={() => {
                      setShowModal(false);
                      setError('');
                      // KHÔNG gọi onDeploySuccess cho modal error
                    }}
                  >
                    Đóng
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewDeployment;

