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

      if (singleProjectType === 'frontend' || singleProjectType === 'backend') {
        if (!singleProject.dns.trim()) {
          throw new Error('Please enter DNS');
        }
      }

      if (singleProjectType === 'database') {
        if (!singleProject.databaseName.trim()) {
          throw new Error('Please enter database name');
        }
        if (!singleProject.databaseUsername.trim()) {
          throw new Error('Please enter database username');
        }
        if (!singleProject.databasePassword.trim()) {
          throw new Error('Please enter database password');
        }
        if (!singleProject.databaseFile) {
          throw new Error('Please upload database file');
        }
        const fileValidation = validateFile(singleProject.databaseFile);
        if (!fileValidation.valid) {
          throw new Error(fileValidation.error);
        }
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

      if (singleProjectType === 'database') {
        // Database-only deployment
        const formData = new FormData();
        formData.append('name', singleProject.name.trim());
        formData.append('frameworkType', 'node');
        formData.append('deploymentType', 'docker');
        formData.append('dockerImage', 'nginx:latest');
        formData.append('username', username);
        formData.append('databaseName', singleProject.databaseName.trim());
        formData.append('databaseUsername', singleProject.databaseUsername.trim());
        formData.append('databasePassword', singleProject.databasePassword.trim());
        formData.append('databaseFile', singleProject.databaseFile);

        response = await api.post('/apps/deploy-docker', formData, {
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
      setModalData(response.data);
      setShowModal(true);
      setSuccess(true);
      
      // Clear localStorage
      localStorage.removeItem('deployment_mode');
      localStorage.removeItem('deployment_single_project');
      
      // Reset form
      resetSingleProject();

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
        if (!singleProject.databaseName.trim()) {
          setError('Please enter database name');
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
        if (!singleProject.databaseFile) {
          setError('Please upload database file');
          return false;
        }
        const dbFileValidation = validateFile(singleProject.databaseFile);
        if (!dbFileValidation.valid) {
          setError(dbFileValidation.error);
          return false;
        }
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
    } else if (step === 3) {
      // Step 3: DNS (only for frontend/backend)
      if ((singleProjectType === 'frontend' || singleProjectType === 'backend') && !singleProject.dns.trim()) {
        setError('Please enter DNS');
        return false;
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
      return 3; // Step 1: Project, Step 2: Environment Variables, Step 3: DNS
    } else if (singleProjectType === 'frontend' || singleProjectType === 'backend') {
      return 2; // Step 1: Project, Step 2: DNS
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

  // Bỏ màn hình chọn mode; vào thẳng Single Project selection

  // Render Single Project Type Selection
  if (projectMode === 'single' && !singleProjectType) {
    return (
      <div className="dashboard-card">
        <div className="card-header">
          <h2>Project Deployment</h2>
          <p>Select the type of project you want to deploy</p>
        </div>

        <div className="single-project-type-selection">
          <div className="type-options">
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
          </div>
        </div>
      </div>
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
        { number: 2, title: 'Environment Variables', description: 'Database connection information' },
        { number: 3, title: 'DNS', description: 'Application access address' }
      );
    } else {
      steps.push(
        { number: 1, title: 'Project', description: 'Basic project information' },
        { number: 2, title: 'DNS', description: 'Application access address' }
      );
    }

    return (
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

                  <div className="form-row form-row-two">
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
                    <div className="form-group">
                      <label htmlFor="databaseFile">Database File (.zip) *</label>
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
                          }
                        }}
                        required
                        disabled={loading || success}
                      />
                      {singleProject.databaseFile && (
                        <small className="file-info">
                          Selected: {singleProject.databaseFile.name} 
                          ({(singleProject.databaseFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </small>
                      )}
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

        {/* Step 2 or 3: DNS - For frontend/backend */}
        {((singleProjectStep === 2 && (singleProjectType === 'frontend' || (singleProjectType === 'backend' && singleProject.framework !== 'spring' && singleProject.framework !== 'nodejs'))) ||
          (singleProjectStep === 3 && singleProjectType === 'backend' && (singleProject.framework === 'spring' || singleProject.framework === 'nodejs'))) && (
          <div className="step-content">
            <div className="form-section">
              <div className="form-section-header">
                <h3>DNS</h3>
                <p className="form-section-description">Application access address after deployment</p>
              </div>

              <div className="form-group">
                <label htmlFor="dns">DNS *</label>
                <div className="dns-input-wrapper">
                  <div className="dns-input-container">
                    <input
                      type="text"
                      id="dns"
                      value={singleProject.dns}
                      onChange={(e) => {
                        setSingleProject(prev => ({ ...prev, dns: e.target.value }));
                        setDnsCheckResult(null);
                        setError('');
                      }}
                      placeholder="Enter DNS (e.g., www.example.com)"
                      required
                      disabled={loading || success || dnsChecking}
                      className={`dns-input ${dnsCheckResult === 'available' ? 'dns-available' : 
                                 dnsCheckResult === 'unavailable' || dnsCheckResult === 'error' ? 'dns-unavailable' : ''}`}
                    />
                    {dnsCheckResult === 'available' && (
                      <small className="dns-status dns-status-success">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        DNS is available
                      </small>
                    )}
                    {dnsCheckResult === 'unavailable' && (
                      <small className="dns-status dns-status-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        DNS is not available
                      </small>
                    )}
                    {dnsCheckResult === 'error' && (
                      <small className="dns-status dns-status-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Failed to check DNS
                      </small>
                    )}
                    {!dnsCheckResult && (
                      <small className="form-hint">
                        This DNS will be used for your deployed {singleProjectType} application
                      </small>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckDns}
                    disabled={loading || success || dnsChecking || !singleProject.dns.trim()}
                    className="dns-check-button"
                  >
                    {dnsChecking ? (
                      <>
                        <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', marginRight: '6px' }}></span>
                        Checking...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px' }}>
                          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Check DNS
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => modalType === 'error' && setShowModal(false)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className={`modal-content ${modalType}`}>
                <button 
                  className="modal-close-btn" 
                onClick={() => {
                    setShowModal(false);
                    if (modalType === 'success') {
                      setSuccess(false);
                      if (onDeploySuccess) onDeploySuccess();
                    }
                  }}
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
                    <h2 className="modal-title">Deployment successful</h2>
                    <p className="modal-description">Your project was deployed successfully.</p>
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
                    <button 
                      className="modal-action-btn primary-btn"
                      onClick={() => {
                        setShowModal(false);
                        setSuccess(false);
                        if (onDeploySuccess) onDeploySuccess();
                      }}
                    >
                      OK
                    </button>
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
                      onClick={() => setShowModal(false)}
                    >
                      Close
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

  return null;
}

export default NewDeployment;

