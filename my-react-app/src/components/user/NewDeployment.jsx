import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import './Dashboard.css';

function NewDeployment({ onDeploySuccess }) {
  // Chế độ dự án
  const [projectMode, setProjectMode] = useState('single');
  // Loại dự án: 'frontend', 'backend', 'database'
  const [singleProjectType, setSingleProjectType] = useState(null);

  // Single project step hiện tại
  const [singleProjectStep, setSingleProjectStep] = useState(1);
  
  // State cho dự án đơn lẻ
  const [singleProject, setSingleProject] = useState({
    name: '',
    framework: '',
    deploymentType: 'file', // 'file' hoặc 'docker'
    dockerImage: '',
    file: null,
    databaseName: '',
    databaseIp: '',
    databasePort: '',
    databaseUsername: '',
    databasePassword: '',
    databaseFile: null,
    dns: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalData, setModalData] = useState(null);
  const [dnsChecking, setDnsChecking] = useState(false);
  const [dnsCheckResult, setDnsCheckResult] = useState(null); // null, 'available', 'unavailable', 'error'
  const [showGuide, setShowGuide] = useState(false); // State để show/hide hướng dẫn (mặc định thu gọn)

  // Load data từ localStorage khi component mount
  useEffect(() => {
    const savedSingleProject = localStorage.getItem('deployment_single_project');

    if (savedSingleProject) {
      try {
        const data = JSON.parse(savedSingleProject);
        setSingleProject(prev => ({ ...prev, ...data }));
        if (data.type) {
          setSingleProjectType(data.type);
          setProjectMode('single');
        }
      } catch (e) {
        console.error('Error loading single project data:', e);
      }
    }
  }, []);

  // Lưu single project vào localStorage
  useEffect(() => {
    if (projectMode === 'single') {
      const dataToSave = {
        ...singleProject,
        type: singleProjectType,
      };
      localStorage.setItem('deployment_single_project', JSON.stringify(dataToSave));
    }
  }, [singleProject, singleProjectType, projectMode]);

  // Lưu mode vào localStorage
  useEffect(() => {
    if (projectMode) {
      localStorage.setItem('deployment_mode', projectMode);
    }
  }, [projectMode]);

  // Set default framework khi chọn single project type
  useEffect(() => {
    if (projectMode === 'single' && singleProjectType) {
      let defaultFramework = '';
      if (singleProjectType === 'frontend') {
        defaultFramework = 'react';
      } else if (singleProjectType === 'backend') {
        defaultFramework = 'spring';
      } else if (singleProjectType === 'database') {
        defaultFramework = 'mysql';
      }
      if (defaultFramework && singleProject.framework !== defaultFramework) {
        setSingleProject(prev => ({
          ...prev,
          framework: defaultFramework,
        }));
      }
    }
  }, [singleProjectType, projectMode, singleProject.framework]);

  // Validate file upload
  const validateFile = (file, maxSizeMB = 100) => {
    if (!file) return { valid: false, error: 'Please select a file' };
    
    if (!file.name.endsWith('.zip')) {
      return { valid: false, error: 'File must be a .zip file' };
    }
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
    }
    
    return { valid: true };
  };

  // Xử lý single project deployment
  const handleSingleDeploy = async () => {
    setError('');
    setLoading(true);

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Session expired. Please sign in again.');
      }
      const user = JSON.parse(userData);
      const username = user.username;

      // Validation
      if (!singleProject.name.trim()) {
        throw new Error('Please enter project name');
      }

      // DNS không còn bắt buộc cho frontend/backend

      if (singleProjectType === 'database') {
        // File database là optional, nếu có thì validate
        if (singleProject.databaseFile) {
          const fileValidation = validateFile(singleProject.databaseFile);
          if (!fileValidation.valid) {
            throw new Error(fileValidation.error);
          }
        }
        // Database name, username, password sẽ được hệ thống tự động tạo
      } else if (singleProjectType === 'backend' && (singleProject.framework === 'spring' || singleProject.framework === 'nodejs')) {
        // Validate database environment variables for backend
        if (!singleProject.databaseIp.trim()) {
          throw new Error('Please enter database IP');
        }
        if (!singleProject.databasePort.trim()) {
          throw new Error('Please enter database port');
        }
        if (!singleProject.databaseUsername.trim()) {
          throw new Error('Please enter database username');
        }
        if (!singleProject.databasePassword.trim()) {
          throw new Error('Please enter database password');
        }
        if (!singleProject.databaseName.trim()) {
          throw new Error('Please enter database name');
        }
      } else {
        if (singleProject.deploymentType === 'docker') {
          if (!singleProject.dockerImage.trim()) {
            throw new Error('Please enter Docker Hub image path');
          }
        } else {
          if (!singleProject.file) {
            throw new Error('Please upload project file');
          }
          const fileValidation = validateFile(singleProject.file);
          if (!fileValidation.valid) {
            throw new Error(fileValidation.error);
          }
        }
      }

      // Map framework
  const mapFrameworkType = (preset) => {
    const mapping = {
      'react': 'react',
      'vue': 'vue',
      'angular': 'angular',
      'spring': 'spring',
          'nodejs': 'node',
        };
        return mapping[preset] || preset;
      };

      let response;
      const mappedFramework = mapFrameworkType(singleProject.framework);

      if (singleProjectType === 'frontend') {
        const frameworkValue = singleProject.framework.trim().toUpperCase();
        const deploymentTypeValue = singleProject.deploymentType.trim().toUpperCase();

        const frontendFormData = new FormData();
        frontendFormData.append('projectName', singleProject.name.trim());
        frontendFormData.append('frameworkType', frameworkValue);
        frontendFormData.append('deploymentType', deploymentTypeValue);
        frontendFormData.append('username', username);

        if (deploymentTypeValue === 'DOCKER') {
          frontendFormData.append('dockerImage', singleProject.dockerImage.trim());
        } else {
          frontendFormData.append('file', singleProject.file);
        }

        response = await api.post('/project-frontends/deploy', frontendFormData, {
          headers: { 'Content-Type': undefined },
        });
      } else if (singleProjectType === 'backend') {
        // Deploy Backend Project
        const frameworkValue = (singleProject.framework.trim().toLowerCase() === 'spring')
          ? 'SPRINGBOOT'
          : (singleProject.framework.trim().toLowerCase() === 'nodejs' ? 'NODEJS' : singleProject.framework.trim().toUpperCase());
        const deploymentTypeValue = singleProject.deploymentType.trim().toUpperCase();

        const backendFormData = new FormData();
        backendFormData.append('projectName', singleProject.name.trim());
        backendFormData.append('frameworkType', frameworkValue);
        backendFormData.append('deploymentType', deploymentTypeValue);
        backendFormData.append('username', username);

        // Database info (bắt buộc cho backend)
        backendFormData.append('databaseName', singleProject.databaseName.trim());
        backendFormData.append('databaseIp', singleProject.databaseIp.trim());
        backendFormData.append('databasePort', String(singleProject.databasePort).trim());
        backendFormData.append('databaseUsername', singleProject.databaseUsername.trim());
        backendFormData.append('databasePassword', singleProject.databasePassword.trim());

        if (deploymentTypeValue === 'DOCKER') {
          backendFormData.append('dockerImage', singleProject.dockerImage.trim());
        } else {
          backendFormData.append('file', singleProject.file);
        }

        response = await api.post('/project-backends/deploy', backendFormData, {
          headers: { 'Content-Type': undefined },
        });
      } else if (singleProjectType === 'database') {
        // Deploy Database Project
        const databaseTypeValue = singleProject.framework.trim().toUpperCase(); // MYSQL hoặc MONGODB
        
        const databaseFormData = new FormData();
        databaseFormData.append('projectName', singleProject.name.trim());
        databaseFormData.append('databaseType', databaseTypeValue);
        databaseFormData.append('username', username);
        
        // File database là optional (có thể không có)
        if (singleProject.databaseFile) {
          databaseFormData.append('file', singleProject.databaseFile);
        }

        response = await api.post('/project-databases/deploy', databaseFormData, {
          headers: { 'Content-Type': undefined },
        });
      } else if (singleProject.deploymentType === 'docker') {
        // Docker deployment
        const isBackend = singleProjectType === 'backend' && (mappedFramework === 'spring' || mappedFramework === 'node');
        const hasDns = (singleProjectType === 'frontend' || singleProjectType === 'backend') && singleProject.dns.trim();
        const hasDatabaseConfig = isBackend;
        
        if (hasDns || hasDatabaseConfig) {
          const formData = new FormData();
          formData.append('name', singleProject.name.trim());
          formData.append('frameworkType', mappedFramework);
          formData.append('deploymentType', 'docker');
          formData.append('dockerImage', singleProject.dockerImage.trim());
          formData.append('username', username);
          
          if (hasDatabaseConfig) {
            formData.append('databaseIp', singleProject.databaseIp.trim());
            formData.append('databasePort', singleProject.databasePort.trim());
            formData.append('databaseUsername', singleProject.databaseUsername.trim());
            formData.append('databasePassword', singleProject.databasePassword.trim());
            formData.append('databaseName', singleProject.databaseName.trim());
          }
          
          if (hasDns) {
            formData.append('dns', singleProject.dns.trim());
          }

          response = await api.post('/apps/deploy-docker', formData, {
            headers: { 'Content-Type': undefined },
          });
        } else {
          const requestBody = {
            name: singleProject.name.trim(),
            frameworkType: mappedFramework,
            deploymentType: 'docker',
            dockerImage: singleProject.dockerImage.trim(),
            username: username,
          };

          if (hasDns) {
            requestBody.dns = singleProject.dns.trim();
          }

          response = await api.post('/apps/deploy-docker', requestBody);
      }
    } else {
        // File deployment
        const formData = new FormData();
        formData.append('name', singleProject.name.trim());
        formData.append('frameworkType', mappedFramework);
        formData.append('deploymentType', 'file');
        formData.append('file', singleProject.file);
        formData.append('username', username);

        const isBackend = singleProjectType === 'backend' && (mappedFramework === 'spring' || mappedFramework === 'node');
        if (isBackend) {
          formData.append('databaseIp', singleProject.databaseIp.trim());
          formData.append('databasePort', singleProject.databasePort.trim());
          formData.append('databaseUsername', singleProject.databaseUsername.trim());
          formData.append('databasePassword', singleProject.databasePassword.trim());
          formData.append('databaseName', singleProject.databaseName.trim());
        }
        if ((singleProjectType === 'frontend' || singleProjectType === 'backend') && singleProject.dns.trim()) {
          formData.append('dns', singleProject.dns.trim());
        }

        response = await api.post('/apps/deploy-file', formData, {
          headers: { 'Content-Type': undefined },
        });
      }

      setModalType('success');
      // Lưu thêm singleProjectType vào modalData để biết loại deployment
      setModalData({
        ...response.data,
        deploymentType: singleProjectType // 'frontend', 'backend', hoặc 'database'
      });
      setShowModal(true);
      setSuccess(true);

    } catch (err) {
      console.error('Deployment error:', err);
      let errorMessage = 'Deployment failed. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setModalType('error');
      setModalData({ message: errorMessage });
      setShowModal(true);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset single project
  const resetSingleProject = () => {
    setSingleProject({
      name: '',
      framework: '',
      deploymentType: 'file',
      dockerImage: '',
      file: null,
      databaseName: '',
      databaseIp: '',
      databasePort: '',
      databaseUsername: '',
      databasePassword: '',
      databaseFile: null,
      dns: '',
    });
    setSingleProjectType(null);
    setSingleProjectStep(1);
    setDnsCheckResult(null);
  };

  const clearDeploymentStorage = () => {
    localStorage.removeItem('deployment_mode');
    localStorage.removeItem('deployment_single_project');
  };

  const handleContinueDeployment = () => {
    clearDeploymentStorage();
    resetSingleProject();
    setShowModal(false);
    setSuccess(false);
  };

  const handleGoToProjectList = () => {
    clearDeploymentStorage();
    resetSingleProject();
    setShowModal(false);
    setSuccess(false);
    if (onDeploySuccess) onDeploySuccess();
  };

  const handleCloseErrorModal = () => {
    setShowModal(false);
  };

  const renderModal = () => {
    if (!showModal) return null;

    const isSuccess = modalType === 'success';
    const onOverlayClick = isSuccess ? undefined : () => handleCloseErrorModal();

    return (
      <div className="modal-overlay" onClick={onOverlayClick}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className={`modal-content ${modalType}`}>
            <button
              className="modal-close-btn"
              onClick={isSuccess ? handleContinueDeployment : handleCloseErrorModal}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {isSuccess ? (
              <>
                <div className="modal-icon success-icon-wrapper">
                  <svg className="success-icon" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="modal-title">Deployment successful</h2>
                <p className="modal-description">Your project was deployed successfully.</p>
                {/* Hiển thị URL cho frontend/backend */}
                {modalData?.url && (
                  <div className="modal-results">
                    <div className="result-item">
                      <div className="result-label">URL:</div>
                      <div className="result-value">
                        <a href={modalData.url} target="_blank" rel="noopener noreferrer">
                          {modalData.url}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                {/* Hiển thị thông tin database cho database deployment */}
                {(singleProjectType === 'database' || modalData?.deploymentType === 'database') && modalData && modalData.databaseIp && (
                  <div className="modal-results" style={{ marginTop: '16px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                      📊 Database Connection Information
                    </h3>
                    <div className="result-item">
                      <div className="result-label">Database IP:</div>
                      <div className="result-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ 
                          backgroundColor: '#f3f4f6', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          flex: 1
                        }}>{modalData.databaseIp}</code>
                        <button
                          onClick={async (e) => {
                            try {
                              await navigator.clipboard.writeText(modalData.databaseIp);
                              const originalText = e.target.textContent;
                              e.target.textContent = 'Copied!';
                              setTimeout(() => {
                                e.target.textContent = originalText;
                              }, 2000);
                            } catch (err) {
                              console.error('Failed to copy:', err);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="result-item">
                      <div className="result-label">Database Port:</div>
                      <div className="result-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ 
                          backgroundColor: '#f3f4f6', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          flex: 1
                        }}>{modalData.databasePort}</code>
                        <button
                          onClick={async (e) => {
                            try {
                              await navigator.clipboard.writeText(String(modalData.databasePort));
                              const originalText = e.target.textContent;
                              e.target.textContent = 'Copied!';
                              setTimeout(() => {
                                e.target.textContent = originalText;
                              }, 2000);
                            } catch (err) {
                              console.error('Failed to copy:', err);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="result-item">
                      <div className="result-label">Database Name:</div>
                      <div className="result-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ 
                          backgroundColor: '#f3f4f6', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          flex: 1
                        }}>{modalData.databaseName}</code>
                        <button
                          onClick={async (e) => {
                            try {
                              await navigator.clipboard.writeText(modalData.databaseName);
                              const originalText = e.target.textContent;
                              e.target.textContent = 'Copied!';
                              setTimeout(() => {
                                e.target.textContent = originalText;
                              }, 2000);
                            } catch (err) {
                              console.error('Failed to copy:', err);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="result-item">
                      <div className="result-label">Database Username:</div>
                      <div className="result-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ 
                          backgroundColor: '#f3f4f6', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          flex: 1
                        }}>{modalData.databaseUsername}</code>
                        <button
                          onClick={async (e) => {
                            try {
                              await navigator.clipboard.writeText(modalData.databaseUsername);
                              const originalText = e.target.textContent;
                              e.target.textContent = 'Copied!';
                              setTimeout(() => {
                                e.target.textContent = originalText;
                              }, 2000);
                            } catch (err) {
                              console.error('Failed to copy:', err);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="result-item">
                      <div className="result-label">Database Password:</div>
                      <div className="result-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ 
                          backgroundColor: '#f3f4f6', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          flex: 1
                        }}>{modalData.databasePassword}</code>
                        <button
                          onClick={async (e) => {
                            try {
                              await navigator.clipboard.writeText(modalData.databasePassword);
                              const originalText = e.target.textContent;
                              e.target.textContent = 'Copied!';
                              setTimeout(() => {
                                e.target.textContent = originalText;
                              }, 2000);
                            } catch (err) {
                              console.error('Failed to copy:', err);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #3b82f6',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#1e40af'
                    }}>
                      <strong>💡 Lưu ý:</strong> Hãy lưu lại thông tin database này để sử dụng khi triển khai Backend.
                    </div>
                  </div>
                )}
                <div
                  className="modal-actions"
                  style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'nowrap' }}
                >
                  <button
                    className="modal-action-btn primary-btn"
                    style={{ width: 'auto' }}
                    onClick={handleContinueDeployment}
                  >
                    Continue Deploy
                  </button>
                  <button
                    className="modal-action-btn secondary-btn"
                    style={{ width: 'auto' }}
                    onClick={handleGoToProjectList}
                  >
                    Go to Project List
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
                <h2 className="modal-title">Deployment failed</h2>
                <p className="modal-description">{modalData?.message || 'An error occurred during deployment.'}</p>
                <button
                  className="modal-action-btn error-btn"
                  onClick={handleCloseErrorModal}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Validate step for single project
  const validateSingleProjectStep = (step) => {
    if (step === 1) {
      // Step 1: Project
      if (!singleProject.name.trim()) {
        setError('Please enter project name');
        return false;
      }
      if (!singleProject.framework) {
        setError('Please select framework');
        return false;
      }
      if (singleProject.deploymentType === 'docker' && !singleProject.dockerImage.trim()) {
        setError('Please enter Docker Hub image path');
        return false;
      }
      if (singleProject.deploymentType === 'file' && !singleProject.file) {
        setError('Please upload project file');
        return false;
      }
      if (singleProject.deploymentType === 'file' && singleProject.file) {
        const validation = validateFile(singleProject.file);
        if (!validation.valid) {
          setError(validation.error);
          return false;
        }
      }

      if (singleProjectType === 'database') {
        // File database là optional, nếu có thì validate
        if (singleProject.databaseFile) {
          const dbFileValidation = validateFile(singleProject.databaseFile);
          if (!dbFileValidation.valid) {
            setError(dbFileValidation.error);
            return false;
          }
        }
        // Database name, username, password sẽ được hệ thống tự động tạo
      }

      return true;
    } else if (step === 2) {
      // Step 2: Environment Variables (only for backend)
      if (singleProjectType === 'backend' && (singleProject.framework === 'spring' || singleProject.framework === 'nodejs')) {
        if (!singleProject.databaseIp.trim()) {
          setError('Please enter database IP');
          return false;
        }
        if (!singleProject.databasePort.trim()) {
          setError('Please enter database port');
          return false;
        }
        if (!singleProject.databaseUsername.trim()) {
          setError('Please enter database username');
          return false;
        }
        if (!singleProject.databasePassword.trim()) {
          setError('Please enter database password');
          return false;
        }
        if (!singleProject.databaseName.trim()) {
          setError('Please enter database name');
          return false;
        }
      }
      return true;
    }
    return true;
  };

  // Next step for single project
  const handleSingleProjectNext = () => {
    if (validateSingleProjectStep(singleProjectStep)) {
      setError('');
      const maxStep = getMaxStepForSingleProject();
      if (singleProjectStep < maxStep) {
        setSingleProjectStep(singleProjectStep + 1);
      }
    }
  };

  // Previous step for single project
  const handleSingleProjectPrev = () => {
    setError('');
    if (singleProjectStep > 1) {
      setSingleProjectStep(singleProjectStep - 1);
    }
  };

  // Get max step for single project
  const getMaxStepForSingleProject = () => {
    if (singleProjectType === 'database') {
      return 1; // Only step 1 (Project)
    } else if (singleProjectType === 'backend' && (singleProject.framework === 'spring' || singleProject.framework === 'nodejs')) {
      return 2; // Step 1: Project, Step 2: Environment Variables
    } else if (singleProjectType === 'frontend' || singleProjectType === 'backend') {
      return 1; // Step 1: Project
    }
    return 1;
  };

  // Check DNS availability
  const handleCheckDns = async () => {
    if (!singleProject.dns.trim()) {
      setError('Please enter DNS first');
      return;
    }

    // Basic DNS format validation
    const dnsPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!dnsPattern.test(singleProject.dns.trim())) {
      setDnsCheckResult('error');
      setError('Invalid DNS format. Please enter a valid domain name (e.g., www.example.com)');
      return;
    }

    setDnsChecking(true);
    setDnsCheckResult(null);
    setError('');

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Session expired. Please sign in again.');
      }
      const user = JSON.parse(userData);
      const username = user.username;

      // Call API to check DNS availability
      const response = await api.post('/apps/check-dns', {
        dns: singleProject.dns.trim(),
        username: username,
      });

      if (response.data.available) {
        setDnsCheckResult('available');
        setError('');
      } else {
        setDnsCheckResult('unavailable');
        setError(response.data.message || 'DNS is not available');
      }
    } catch (err) {
      console.error('DNS check error:', err);
      setDnsCheckResult('error');
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to check DNS availability');
      }
    } finally {
      setDnsChecking(false);
    }
  };

  // Component hướng dẫn triển khai
  const renderDeploymentGuide = () => {
    return (
      <div className="deployment-guide-card" style={{
        marginBottom: '24px',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}>
        {/* Header */}
        <div 
          onClick={() => setShowGuide(!showGuide)}
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            backgroundColor: '#f9fafb',
            borderBottom: showGuide ? '1px solid #e5e7eb' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                🚀 Quy trình triển khai Full-stack (Khuyến nghị)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                Bạn có thể triển khai dịch vụ đơn lẻ hoặc full-stack (Database → Backend → Frontend)
              </p>
            </div>
          </div>
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#6b7280" 
            strokeWidth="2"
            style={{
              transform: showGuide ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }}
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>

        {/* Content */}
        {showGuide && (
          <div style={{ padding: '24px', animation: 'fadeIn 0.3s ease' }}>
            {/* Giới thiệu về tính linh hoạt */}
            <div style={{ 
              backgroundColor: '#eff6ff', 
              border: '1px solid #3b82f6', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '24px' 
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#1e40af', lineHeight: '1.6' }}>
                <strong>💡 Tính linh hoạt:</strong> Hệ thống hỗ trợ triển khai dịch vụ đơn lẻ hoặc kết hợp tùy nhu cầu:
              </p>
              <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0, fontSize: '14px', color: '#1e40af', lineHeight: '1.8' }}>
                <li><strong>Triển khai đơn lẻ:</strong> Chỉ triển khai Frontend, Backend, hoặc Database</li>
                <li><strong>Triển khai kết hợp:</strong> Ví dụ: Frontend + Backend (sử dụng database của bạn hoặc database đã triển khai trước đó)</li>
                <li><strong>Triển khai Full-stack:</strong> Database → Backend → Frontend (khuyến nghị cho dự án mới)</li>
              </ul>
              <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#1e40af', fontStyle: 'italic' }}>
                Lưu ý: Nếu bạn đã có database sẵn, chỉ cần cung cấp thông tin kết nối (IP, Port, Username, Password, Database Name) khi triển khai Backend.
              </p>
            </div>

            {/* Step 1: Database */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '16px',
                }}>1</div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  🗄️ Triển khai Database
                </h4>
              </div>
              
              <div style={{ marginLeft: '44px' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>
                  <strong>Bạn cần chuẩn bị:</strong>
                </p>
                <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '14px', color: '#4b5563' }}>
                  <li>Loại CSDL: <code style={{ padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>MySQL</code> hoặc <code style={{ padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>MongoDB</code></li>
                  <li>Username/Password cho CSDL</li>
                  <li>File dump nếu muốn import dữ liệu:
                    <ul style={{ margin: '8px 0 0 16px' }}>
                      <li>MySQL: file <code style={{ padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>.sql</code> và nén thành <code style={{ padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>.zip</code></li>
                      <li>MongoDB: file <code style={{ padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>.bson</code> (hoặc dump thư mục) nén <code style={{ padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>.zip</code></li>
                      <li><strong>Lưu ý:</strong> File <code>.sql</code> không được chứa câu lệnh tạo schema (CREATE DATABASE)</li>
                    </ul>
                  </li>
                </ul>

                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                    📤 Hệ thống sẽ trả về (dùng cho Backend):
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#166534' }}>
                    <li><code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>DB_HOST</code> (VD: 10.96.123.45 hoặc mysql.web.svc.cluster.local)</li>
                    <li><code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>DB_PORT</code> (VD: 3306 hoặc 27017)</li>
                    <li><code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>DB_USERNAME</code>, <code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>DB_PASSWORD</code>, <code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>DB_NAME</code></li>
                  </ul>
                </div>

                <details style={{ marginBottom: '12px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#3b82f6', marginBottom: '8px' }}>
                    💡 Connection String Examples
                  </summary>
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#374151' }}>MySQL (JDBC):</p>
                    <pre style={{
                      backgroundColor: '#1f2937',
                      color: '#e5e7eb',
                      padding: '12px',
                      borderRadius: '6px',
                      overflow: 'auto',
                      fontSize: '12px',
                      margin: '0 0 12px 0',
                    }}>jdbc:mysql://&lt;DB_HOST&gt;:&lt;DB_PORT&gt;/&lt;DB_NAME&gt;?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC</pre>
                    
                    <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#374151' }}>MongoDB (URI):</p>
                    <pre style={{
                      backgroundColor: '#1f2937',
                      color: '#e5e7eb',
                      padding: '12px',
                      borderRadius: '6px',
                      overflow: 'auto',
                      fontSize: '12px',
                      margin: 0,
                    }}>mongodb://&lt;DB_USERNAME&gt;:&lt;DB_PASSWORD&gt;@&lt;DB_HOST&gt;:&lt;DB_PORT&gt;/&lt;DB_NAME&gt;?authSource=admin</pre>
                  </div>
                </details>

                <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
                    💡 <strong>Lưu ý:</strong> Hãy lưu lại thông tin CSDL sau khi triển khai. Bạn sẽ dùng nó ở bước 2.
                  </p>
                </div>
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #facc15', borderRadius: '8px', padding: '12px 16px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#854d0e' }}>
                    📦 <strong>Quy ước file .zip:</strong> Khi giải nén, <strong>tên thư mục gốc phải trùng tên file .zip</strong>.
                    Ví dụ: <code style={{ backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>baong.zip</code> → thư mục <code style={{ backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>baong</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Backend */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '16px',
                }}>2</div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  ⚙️ Triển khai Backend (API)
                </h4>
              </div>
              
              <div style={{ marginLeft: '44px' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>
                  <strong>Bạn cần chuẩn bị:</strong>
                </p>
                <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '14px', color: '#4b5563' }}>
                  <li>Mã nguồn (ZIP) hoặc Docker Image</li>
                  <li>Biến môi trường kết nối DB (từ bước 1)</li>
                </ul>

                <details style={{ marginBottom: '12px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#3b82f6', marginBottom: '8px' }}>
                    🔧 Environment Variables
                  </summary>
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#374151' }}>Spring Boot (MySQL):</p>
                    <pre style={{
                      backgroundColor: '#1f2937',
                      color: '#e5e7eb',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      margin: '0 0 12px 0',
                    }}>{`SPRING_DATASOURCE_URL=jdbc:mysql://...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...`}</pre>
                    
                    <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#374151' }}>Node.js/Express:</p>
                    <pre style={{
                      backgroundColor: '#1f2937',
                      color: '#e5e7eb',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      margin: 0,
                    }}>{`DB_HOST=...
DB_PORT=...
DB_NAME=...
DB_USERNAME=...
DB_PASSWORD=...`}</pre>
                  </div>
                </details>

                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                    📤 Hệ thống sẽ trả về (dùng cho Frontend):
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#166534' }}>
                    <li>DNS/URL của Backend (VD: <code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>http://api.myapp.local</code>)</li>
                  </ul>
                </div>

                <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', padding: '12px 16px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
                    💡 <strong>Gợi ý:</strong> Cung cấp endpoint health như <code style={{ backgroundColor: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>/actuator/health</code> hoặc <code style={{ backgroundColor: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>/health</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Frontend */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '16px',
                }}>3</div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  🎨 Triển khai Frontend
                </h4>
              </div>
              
              <div style={{ marginLeft: '44px' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>
                  <strong>Bạn cần chuẩn bị:</strong>
                </p>
                <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '14px', color: '#4b5563' }}>
                  <li>Mã nguồn (ZIP) hoặc Docker Image</li>
                  <li>API Base URL (từ bước 2)</li>
                </ul>

                <details style={{ marginBottom: '12px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#3b82f6', marginBottom: '8px' }}>
                    🔧 Environment Variables theo Framework
                  </summary>
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#374151' }}>Vite (React/Vue):</p>
                    <pre style={{
                      backgroundColor: '#1f2937',
                      color: '#e5e7eb',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      margin: '0 0 12px 0',
                    }}>VITE_API_BASE_URL=http://api.myapp.local</pre>
                    
                    <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#374151' }}>Create React App:</p>
                    <pre style={{
                      backgroundColor: '#1f2937',
                      color: '#e5e7eb',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      margin: '0 0 12px 0',
                    }}>REACT_APP_API_BASE_URL=http://api.myapp.local</pre>

                    <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#374151' }}>Next.js:</p>
                    <pre style={{
                      backgroundColor: '#1f2937',
                      color: '#e5e7eb',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      margin: 0,
                    }}>NEXT_PUBLIC_API_URL=http://api.myapp.local</pre>
                    
                    <p style={{ margin: '12px 0 8px 0', fontWeight: '500', color: '#374151' }}>Angular (environment.ts):</p>
                    <pre style={{
                      backgroundColor: '#1f2937',
                      color: '#e5e7eb',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      margin: 0,
                    }}>{`export const environment = {
  production: false,
  apiBaseUrl: 'http://api.myapp.local'
};`}</pre>
                  </div>
                </details>

                <div style={{ backgroundColor: '#fee2e2', border: '1px solid #f87171', borderRadius: '8px', padding: '12px 16px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#991b1b' }}>
                    🔐 <strong>CORS:</strong> Nếu Frontend và Backend dùng khác domain/port, hãy bật CORS ở Backend hoặc cấu hình Ingress để tránh lỗi CORS.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Bỏ màn hình chọn mode; vào thẳng Single Project selection

  // Render Single Project Type Selection
  if (projectMode === 'single' && !singleProjectType) {
    return (
      <>
      {renderDeploymentGuide()}
      <div className="dashboard-card">
        <div className="card-header">
          <h2>Project Deployment</h2>
          <p>Select the type of project you want to deploy</p>
        </div>

        <div className="single-project-type-selection">
          <div className="type-options">
            <div 
              className="type-card"
              onClick={() => setSingleProjectType('database')}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <h3>Database</h3>
              <p>MySQL, MongoDB</p>
            </div>

            <div 
              className="type-card"
              onClick={() => setSingleProjectType('backend')}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M9 9h6M9 15h6M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>Backend</h3>
              <p>Spring Boot, Node.js</p>
            </div>

            <div 
              className="type-card"
              onClick={() => setSingleProjectType('frontend')}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <h3>Frontend</h3>
              <p>React, Angular, Vue.js</p>
            </div>
          </div>
        </div>
      </div>
        {renderModal()}
      </>
    );
  }

  // Render Single Project Form
  if (projectMode === 'single' && singleProjectType) {
    const frontendFrameworks = [
      { value: 'react', label: 'React' },
      { value: 'vue', label: 'Vue.js' },
      { value: 'angular', label: 'Angular' },
    ];

    const backendFrameworks = [
      { value: 'spring', label: 'Spring Boot' },
      { value: 'nodejs', label: 'Node.js' },
    ];

    const databaseTypes = [
      { value: 'mysql', label: 'MySQL' },
      { value: 'mongodb', label: 'MongoDB' },
    ];

    const frameworks = singleProjectType === 'frontend' ? frontendFrameworks :
                      singleProjectType === 'backend' ? backendFrameworks :
                      databaseTypes;

    const maxStep = getMaxStepForSingleProject();
    const steps = [];
    
    if (singleProjectType === 'database') {
      steps.push({ number: 1, title: 'Project', description: 'Basic project information' });
    } else if (singleProjectType === 'backend' && (singleProject.framework === 'spring' || singleProject.framework === 'nodejs')) {
      steps.push(
        { number: 1, title: 'Project', description: 'Basic project information' },
        { number: 2, title: 'Environment Variables', description: 'Database connection information' }
      );
    } else {
      steps.push({ number: 1, title: 'Project', description: 'Basic project information' });
    }

    return (
      <>
      {renderDeploymentGuide()}
      <div className="dashboard-card">
        <div className="card-header">
          <h2>Deploy {singleProjectType.charAt(0).toUpperCase() + singleProjectType.slice(1)} Project</h2>
          <button 
            className="back-button"
            onClick={() => {
              setSingleProjectType(null);
              resetSingleProject();
              localStorage.removeItem('deployment_mode');
              localStorage.removeItem('deployment_single_project');
            }}
          >
            ← Back
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="step-progress">
          {steps.map((step, index) => (
            <div key={step.number} className="step-item">
              <div className={`step-number ${singleProjectStep > step.number ? 'completed' : ''} ${singleProjectStep === step.number ? 'active' : ''}`}>
                {singleProjectStep > step.number ? (
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`step-connector ${singleProjectStep > step.number ? 'completed' : ''}`}></div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (singleProjectStep === maxStep) { handleSingleDeploy(); } else { handleSingleProjectNext(); } }} className="deployment-form">
        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Project */}
        {singleProjectStep === 1 && (
          <div className="step-content">
            {/* Hướng dẫn riêng cho từng loại project */}
            {singleProjectType === 'frontend' && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💡</span> Hướng dẫn Deploy Frontend Project
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#1e40af', lineHeight: '1.6' }}>
                  <li><strong>Chất lượng dự án:</strong> Đảm bảo dự án đã được kiểm tra và chạy thành công (build/test) trước khi triển khai.</li>
                  <li><strong>File Upload:</strong> File .zip phải chứa mã nguồn đã build hoặc Dockerfile. Sau giải nén, thư mục gốc phải trùng tên file (VD: <code style={{ backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>myapp.zip</code> → thư mục <code style={{ backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>myapp</code>).</li>
                  <li><strong>Docker Image:</strong> Sử dụng image từ Docker Hub (VD: <code style={{ backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>username/react-app:latest</code>).</li>
                  <li><strong>Dockerfile:</strong> Phải có trong thư mục gốc nếu deploy từ file. Port container thường là 80 (nginx) hoặc 3000 (dev server).</li>
                  <li><strong>Environment Variables:</strong> Cấu hình API URL trong file <code style={{ backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>.env</code> hoặc Dockerfile (<code style={{ backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>VITE_API_BASE_URL</code>, <code style={{ backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>REACT_APP_API_BASE_URL</code>, etc.).</li>
                  <li><strong>Kết quả:</strong> Sau khi deploy thành công, bạn sẽ nhận được URL truy cập ứng dụng frontend.</li>
                </ul>
              </div>
            )}

            {singleProjectType === 'backend' && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #22c55e',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💡</span> Hướng dẫn Deploy Backend Project
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#166534', lineHeight: '1.6' }}>
                  <li><strong>Chất lượng dự án:</strong> Đảm bảo dự án đã được kiểm tra và chạy thành công (build/test, chạy local OK) trước khi triển khai.</li>
                  <li><strong>File Upload:</strong> File .zip phải chứa mã nguồn và Dockerfile. Sau giải nén, thư mục gốc phải trùng tên file (VD: <code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>api-backend.zip</code> → thư mục <code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>api-backend</code>).</li>
                  <li><strong>Docker Image:</strong> Sử dụng image từ Docker Hub (VD: <code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>username/spring-api:latest</code>).</li>
                  <li><strong>Database Connection:</strong> Cung cấp đầy đủ thông tin kết nối DB (IP, Port, Username, Password, Database Name) từ bước triển khai Database trước đó.</li>
                  <li><strong>Port:</strong> Spring Boot mặc định port 8080, Node.js thường dùng 3000. Đảm bảo Dockerfile EXPOSE đúng port.</li>
                  <li><strong>Health Check:</strong> Nên có endpoint <code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>/health</code> hoặc <code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>/actuator/health</code> để Kubernetes kiểm tra.</li>
                  <li><strong>Kết quả:</strong> Sau khi deploy, bạn sẽ nhận được API URL để Frontend sử dụng.</li>
                </ul>
              </div>
            )}

            {singleProjectType === 'database' && (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💡</span> Hướng dẫn Deploy Database Project
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#92400e', lineHeight: '1.6' }}>
                  <li><strong>MySQL:</strong> File .sql (không chứa lệnh <code style={{ backgroundColor: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>CREATE DATABASE</code>) được nén thành .zip. Sau giải nén, thư mục gốc phải trùng tên file (VD: <code style={{ backgroundColor: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>database.zip</code> → thư mục <code style={{ backgroundColor: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>database</code>).</li>
                  <li><strong>MongoDB:</strong> File .bson hoặc folder dump được nén thành .zip.</li>
                  <li><strong>Tài khoản CSDL:</strong> Không cần nhập Username/Password. Hệ thống sẽ tạo user và mật khẩu trên máy chủ CSDL khi triển khai thành công và cung cấp lại cho bạn.</li>
                  <li><strong>Kết quả:</strong> Sau khi deploy, bạn sẽ nhận được:
                    <ul style={{ marginTop: '8px' }}>
                      <li><code style={{ backgroundColor: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>DB_HOST</code>: IP hoặc DNS của database server</li>
                      <li><code style={{ backgroundColor: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>DB_PORT</code>: Cổng kết nối (MySQL: 3306, MongoDB: 27017)</li>
                      <li><code style={{ backgroundColor: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>DB_NAME</code>: Tên database đã tạo</li>
                      <li><code style={{ backgroundColor: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>DB_USERNAME</code>, <code style={{ backgroundColor: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>DB_PASSWORD</code>: Thông tin xác thực</li>
                    </ul>
                  </li>
                  <li><strong>Lưu ý:</strong> Hãy lưu lại thông tin này để cấu hình Backend.</li>
                </ul>
              </div>
            )}

            <div className="form-section">
              <div className="form-section-header">
                <h3>Project</h3>
                <p className="form-section-description">Basic project information for deployment</p>
              </div>

              <div className="form-group">
                <label htmlFor="projectName">Project Name *</label>
                <input
                  type="text"
                  id="projectName"
                  value={singleProject.name}
                  onChange={(e) => setSingleProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  required
                  disabled={loading || success}
                />
              </div>

              <div className="form-group">
                <label htmlFor="framework">Framework *</label>
                <select
                  id="framework"
                  value={singleProject.framework}
                  onChange={(e) => setSingleProject(prev => ({ ...prev, framework: e.target.value }))}
                  required
                  disabled={loading || success}
                >
                  {frameworks.map(fw => (
                    <option key={fw.value} value={fw.value}>{fw.label}</option>
                  ))}
                </select>
              </div>

              {singleProjectType === 'database' ? (
                <>
                  <div className="form-row form-row-two">
                    <div className="form-group">
                      <label htmlFor="databaseFile">Database File (.zip) (Optional)</label>
                      <input
                        type="file"
                        id="databaseFile"
                        accept=".zip"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const validation = validateFile(file);
                            if (validation.valid) {
                              setSingleProject(prev => ({ ...prev, databaseFile: file }));
                              setError('');
                            } else {
                              setError(validation.error);
                            }
                          } else {
                            // Cho phép xóa file
                            setSingleProject(prev => ({ ...prev, databaseFile: null }));
                          }
                        }}
                        disabled={loading || success}
                      />
                      {singleProject.databaseFile && (
                        <small className="file-info">
                          Selected: {singleProject.databaseFile.name} 
                          ({(singleProject.databaseFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </small>
                      )}
                      <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        File .zip chứa file .sql (MySQL) hoặc .bson (MongoDB). Nếu không có file, hệ thống sẽ chỉ tạo database trống.
                      </small>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Deployment Method *</label>
                    <div className="deployment-options">
                      <label className="option-radio">
                        <input
                          type="radio"
                          name="deploymentType"
                          value="file"
                          checked={singleProject.deploymentType === 'file'}
                          onChange={(e) => setSingleProject(prev => ({ ...prev, deploymentType: e.target.value }))}
                          disabled={loading || success}
                        />
                        <div className="option-content">
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z" fill="currentColor"/>
                          </svg>
                          <span>Upload File</span>
                        </div>
                      </label>

                      <label className="option-radio">
                        <input
                          type="radio"
                          name="deploymentType"
                          value="docker"
                          checked={singleProject.deploymentType === 'docker'}
                          onChange={(e) => setSingleProject(prev => ({ ...prev, deploymentType: e.target.value }))}
                          disabled={loading || success}
                        />
                        <div className="option-content">
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M13.984 6.016v12.469c0 .563-.281.984-.656 1.219-.375.281-.75.375-1.219.375-.516 0-.891-.188-1.266-.516l-2.484-2.156c-.188-.141-.469-.141-.656 0l-2.484 2.156c-.375.328-.75.516-1.266.516-.469 0-.844-.094-1.219-.375C2.298 19.469 2 19.048 2 18.516V5.531c0-.563.298-.984.656-1.219C3.031 4.031 3.406 3.938 3.875 3.938c.516 0 .891.188 1.266.516l2.484 2.156c.188.141.469.141.656 0L10.75 4.453c.375-.328.75-.516 1.266-.516.469 0 .844.094 1.219.375C13.594 4.547 13.984 4.969 13.984 5.531v.485z" fill="currentColor"/>
                          </svg>
                          <span>Docker Hub Image</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {singleProject.deploymentType === 'file' ? (
                    <div className="form-group">
                      <label htmlFor="file">Project File (.zip) *</label>
                      <input
                        type="file"
                        id="file"
                        accept=".zip"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const validation = validateFile(file);
                            if (validation.valid) {
                              setSingleProject(prev => ({ ...prev, file: file }));
                              setError('');
                            } else {
                              setError(validation.error);
                            }
                          }
                        }}
                        required
                        disabled={loading || success}
                      />
                      {singleProject.file && (
                        <small className="file-info">
                          Selected: {singleProject.file.name} 
                          ({(singleProject.file.size / (1024 * 1024)).toFixed(2)} MB)
                        </small>
                      )}
                    </div>
                  ) : (
                    <div className="form-group">
                      <label htmlFor="dockerImage">Docker Hub Image *</label>
                      <input
                        type="text"
                        id="dockerImage"
                        value={singleProject.dockerImage}
                        onChange={(e) => setSingleProject(prev => ({ ...prev, dockerImage: e.target.value }))}
                        placeholder="username/image:tag"
                        required
                        disabled={loading || success}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Environment Variables - Only for backend with spring/node */}
        {singleProjectStep === 2 && singleProjectType === 'backend' && (singleProject.framework === 'spring' || singleProject.framework === 'nodejs') && (
          <div className="step-content">
            <div className="form-section">
              <div className="form-section-header">
                <h3>Environment Variables</h3>
                <p className="form-section-description">Database connection information for the project</p>
              </div>

              <div className="form-row form-row-three">
                <div className="form-group">
                  <label htmlFor="databaseIp">Database IP *</label>
                  <input
                    type="text"
                    id="databaseIp"
                    value={singleProject.databaseIp}
                    onChange={(e) => setSingleProject(prev => ({ ...prev, databaseIp: e.target.value }))}
                    placeholder="Enter database IP address"
                    required
                    disabled={loading || success}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="databasePort">Database Port *</label>
                  <input
                    type="text"
                    id="databasePort"
                    value={singleProject.databasePort}
                    onChange={(e) => setSingleProject(prev => ({ ...prev, databasePort: e.target.value }))}
                    placeholder="Enter database port"
                    required
                    disabled={loading || success}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="databaseName">Database Name *</label>
                  <input
                    type="text"
                    id="databaseName"
                    value={singleProject.databaseName}
                    onChange={(e) => setSingleProject(prev => ({ ...prev, databaseName: e.target.value }))}
                    placeholder="Enter database name"
                    required
                    disabled={loading || success}
                  />
                </div>
              </div>

              <div className="form-row form-row-two">
                <div className="form-group">
                  <label htmlFor="databaseUsername">Database Username *</label>
                  <input
                    type="text"
                    id="databaseUsername"
                    value={singleProject.databaseUsername}
                    onChange={(e) => setSingleProject(prev => ({ ...prev, databaseUsername: e.target.value }))}
                    placeholder="Enter database username"
                    required
                    disabled={loading || success}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="databasePassword">Database Password *</label>
                  <input
                    type="password"
                    id="databasePassword"
                    value={singleProject.databasePassword}
                    onChange={(e) => setSingleProject(prev => ({ ...prev, databasePassword: e.target.value }))}
                    placeholder="Enter database password"
                    required
                    disabled={loading || success}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DNS step đã bỏ cho frontend/backend */}

        {/* Navigation Buttons */}
        <div className="step-navigation">
          {singleProjectStep > 1 && (
            <button
              type="button"
              className="step-button prev-button"
              onClick={handleSingleProjectPrev}
              disabled={loading || success}
            >
              Previous
            </button>
          )}
          
          {singleProjectStep < maxStep ? (
            <button
              type="button"
              className="step-button next-button"
              onClick={handleSingleProjectNext}
              disabled={loading || success}
            >
              Next
            </button>
          ) : (
            <button type="submit" className="deploy-button" disabled={loading || success}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Deploying...
                </>
              ) : success ? (
                'Deployed successfully!'
              ) : (
                'Deploy Now'
              )}
            </button>
          )}
        </div>
        </form>
                  </div>
        {renderModal()}
      </>
    );
  }

  return null;
}

export default NewDeployment;

