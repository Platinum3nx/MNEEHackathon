import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [services, setServices] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    wallet_address: '',
    endpoint_url: ''
  });

  const fetchData = async () => {
    try {
      const servicesRes = await axios.get('http://localhost:3000/services');
      setServices(servicesRes.data);

      const transactionsRes = await axios.get('http://localhost:3000/transactions');
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/register', formData);
      // Clear form and immediately refresh list
      setFormData({ name: '', price: '', wallet_address: '', endpoint_url: '' });
      fetchData();
    } catch (error) {
      console.error('Error registering service:', error);
      alert('Failed to register service');
    }
  };

  return (
    <div className="command-center">
      <header className="header">
        <h1>COMMAND CENTER</h1>
        <div className="status-indicator">ONLINE</div>
      </header>

      <div className="dashboard">
        <div className="panel left-panel">
          <h2>REGISTER NEW AGENT</h2>
          <form className="registration-form" onSubmit={handleRegister}>
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Agent Name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="price"
                placeholder="Price (MNEE)"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="wallet_address"
                placeholder="Wallet Address"
                value={formData.wallet_address}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="endpoint_url"
                placeholder="Endpoint URL"
                value={formData.endpoint_url}
                onChange={handleInputChange}
                required
              />
            </div>
            <button type="submit" className="register-btn">REGISTER SERVICE</button>
          </form>

          <h2>ACTIVE AGENTS [{services.length}]</h2>
          <div className="list-container">
            {services.map(service => (
              <div key={service.id} className="list-item service-item">
                <div className="service-header">
                  <span className="service-name">{service.name}</span>
                  <span className="service-id">ID: {service.id}</span>
                </div>
                <div className="service-details">
                  <p>Deployed At: {service.wallet_address.substring(0, 10)}...</p>
                  <p>Price: {service.price} MNEE</p>
                  <p className="endpoint">{service.endpoint_url}</p>
                </div>
              </div>
            ))}
            {services.length === 0 && <div className="empty-state">No agents detected.</div>}
          </div>
        </div>

        <div className="panel right-panel">
          <h2>LIVE NETWORK ACTIVITY</h2>
          <div className="list-container">
            {transactions.map(tx => (
              <div key={tx.id} className={`list-item tx-item status-${tx.status}`}>
                <div className="tx-header">
                  <span className="timestamp">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                  <span className={`status-badge ${tx.status}`}>{tx.status.toUpperCase()}</span>
                </div>
                <div className="tx-details">
                  <p>Target: <span className="highlight">{tx.service_name || `Service #${tx.service_id}`}</span></p>
                  <p className="hash">Tx: {tx.tx_hash.substring(0, 20)}...</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && <div className="empty-state">Waiting for network traffic...</div>}
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>SYSTEM STATUS: OPERATIONAL | NODE: PUBLIC-SEPOLIA | PORT: 3000</p>
      </footer>
    </div>
  );
}

export default App;
