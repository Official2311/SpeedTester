import React, { useState, useEffect } from "react";
import { testDownloadSpeed, testUploadSpeed, fetchNetworkInfo } from "../utils/speedUtils";
import "bootstrap/dist/css/bootstrap.min.css";
import './style.css';

const SpeedTest: React.FC = () => {
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'downloading' | 'uploading' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const [history, setHistory] = useState<{ date: string; download: number; upload: number }[]>([]);

  const runTest = async () => {
    setStatus('downloading');
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setProgress(0);
    setCurrentSpeed(null);

    const download = await testDownloadSpeed((loaded, total, speed) => {
      setProgress(Math.round((loaded / total) * 100));
      setCurrentSpeed(speed);
    });
    setDownloadSpeed(download);
    setStatus('uploading');
    setProgress(0);
    setCurrentSpeed(null);

    const upload = await testUploadSpeed((loaded, total, speed) => {
      setProgress(Math.round((loaded / total) * 100));
      setCurrentSpeed(speed);
    });
    setUploadSpeed(upload);
    setStatus('complete');

    const testDate = new Date().toLocaleString();
    setHistory(prev => [...prev.slice(-4), { date: testDate, download, upload }]);
  };

  const loadNetworkInfo = async () => {
    try {
      const info = await fetchNetworkInfo();
      setNetworkInfo(info);
    } catch (err) {
      console.error("Failed to load network info:", err);
    }
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('speedTestHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('speedTestHistory', JSON.stringify(history));
    }
  }, [history]);

  const getStatusColor = () => {
    switch (status) {
      case 'downloading': return 'primary';
      case 'uploading': return 'warning';
      case 'complete': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'downloading': return 'Testing Download...';
      case 'uploading': return 'Testing Upload...';
      case 'complete': return 'Test Complete';
      default: return 'Start Test';
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(to right, #0f2027, #203a43, #2c5364)', color: '#fff' }}>
      <div className="card p-4 shadow-lg w-100" style={{ maxWidth: '800px', borderRadius: '20px', backgroundColor: '#1e2a38' }}>
        <h2 className="text-center mb-4"> Internet Speed Test</h2>

        <div className="text-center mb-3">
          <button 
            className={`btn btn-${getStatusColor()} me-2 px-4`} 
            onClick={runTest} 
            disabled={status === 'downloading' || status === 'uploading'}>
            {getStatusText()}
          </button>

          <button className="btn btn-outline-light px-4" onClick={loadNetworkInfo}>
            Show Network Info
          </button>
        </div>

        {(status === 'downloading' || status === 'uploading') && (
          <div className="mb-4">
            <div className="d-flex justify-content-between mb-1">
              <span>{status === 'downloading' ? 'Download Progress' : 'Upload Progress'}</span>
              <span>{progress}%</span>
            </div>
            <div className="progress" style={{ height: '20px' }}>
              <div 
                className={`progress-bar progress-bar-striped progress-bar-animated bg-${getStatusColor()}`} 
                role="progressbar" 
                style={{ width: `${progress}%` }}></div>
            </div>
            {currentSpeed !== null && (
              <div className="text-center mt-2">
                <h5>Current Speed: {currentSpeed.toFixed(2)} Mbps</h5>
              </div>
            )}
          </div>
        )}

        <div className="row text-center mt-4">
          <div className="col-md-6 mb-3">
            <div className="p-4 rounded" style={{ backgroundColor: '#283b4d' }}>
              <h5>Download Speed</h5>
              <h2 className="text-info">{downloadSpeed !== null ? `${downloadSpeed.toFixed(2)} Mbps` : "--"}</h2>
              {downloadSpeed && (
                <div className="mt-2">
                  {downloadSpeed < 5 ? '🟠 Slow' : downloadSpeed < 25 ? '🟢 Good' : ' Excellent'}
                </div>
              )}
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="p-4 rounded" style={{ backgroundColor: '#283b4d' }}>
              <h5>Upload Speed</h5>
              <h2 className="text-warning">{uploadSpeed !== null ? `${uploadSpeed.toFixed(2)} Mbps` : "--"}</h2>
              {uploadSpeed && (
                <div className="mt-2">
                  {uploadSpeed < 2 ? '🟠 Slow' : uploadSpeed < 10 ? '🟢 Good' : ' Excellent'}
                </div>
              )}
            </div>
          </div>
        </div>

        {networkInfo && (
          <div className="mt-4">
            <h5 className="text-center">📡 Network Information</h5>
            <div className="row text-white">
              {Object.entries(networkInfo).map(([key, value]) => (
                <div key={key} className="col-md-4 mb-3">
                  <div className="card bg-dark text-white">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-2 text-muted text-uppercase">{key}</h6>
                      <p className="card-text">{String(value)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-4">
            <h5 className="text-center">📊 Test History</h5>
            <div className="table-responsive">
              <table className="table table-dark table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Download (Mbps)</th>
                    <th>Upload (Mbps)</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((test, index) => (
                    <tr key={index}>
                      <td>{test.date}</td>
                      <td>{test.download.toFixed(2)}</td>
                      <td>{test.upload.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeedTest;