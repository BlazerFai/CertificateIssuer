import { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import contractJson from "D:/Blockchain/YaqinProject/src/artifacts/contracts/Certificate.sol/Certificate.json";
import addressJson from "D:/Blockchain/YaqinProject/src/artifacts/contracts/Certificate.sol/contract-address.json";

const CONTRACT_ABI = contractJson.abi;
const CONTRACT_ADDRESS = addressJson.Certificate;

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [isUniversity, setIsUniversity] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBlockchain = async () => {
      if (window.ethereum) {
        try {
          setIsLoading(true);
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();
          setAccount(userAddress);

          const contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS, 
            CONTRACT_ABI, 
            signer
          );
          setContract(contractInstance);

          const uniAddress = await contractInstance.university();
          setIsUniversity(userAddress.toLowerCase() === uniAddress.toLowerCase());
          
          console.log("Blockchain loaded:", {
            userAddress,
            uniAddress,
            isUniversity: userAddress.toLowerCase() === uniAddress.toLowerCase()
          });
        } catch (error) {
          console.error("Initialization error:", error);
          alert(`Connection error: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      } else {
        alert("Please install MetaMask!");
        setIsLoading(false);
      }
    };

    loadBlockchain();

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        loadBlockchain();
      } else {
        setAccount("");
        setContract(null);
      }
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    return () => window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
  }, []);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
    } catch (error) {
      console.error("Wallet connection error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="certificate-app">
      <h1 className="header">🎓 Certificate System</h1>

      {isLoading ? (
        <div className="loading-state">Loading blockchain data...</div>
      ) : !account ? (
        <button className="connect-button" onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <div className="app-content">
          <div className="account-info">
            <p className="connected-status">
              Connected as: <span className="account-address">{account}</span>
              {isUniversity && <span className="university-badge">University Account</span>}
            </p>
          </div>

          {isUniversity ? (
            <UniversityView contract={contract} />
          ) : (
            <StudentView contract={contract} account={account} />
          )}
        </div>
      )}
    </div>
  );
}

function UniversityView({ contract }) {
  const [studentAddress, setStudentAddress] = useState("");
  const [studentName, setStudentName] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const issueCertificate = async () => {
    if (!ethers.isAddress(studentAddress)) {
      alert("Please enter a valid student address");
      return;
    }

    try {
      setIsLoading(true);
      const tx = await contract.issueCertificate(studentAddress, studentName, ipfsHash);
      await tx.wait();
      alert("✅ Certificate issued successfully!");
      setStudentAddress("");
      setStudentName("");
      setIpfsHash("");
    } catch (err) {
      console.error("Full error:", err);
      alert(`❌ Error: ${err.reason || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="university-card">
      <h2>Issue New Certificate</h2>
      <div className="form-group">
        <input
          className="input-field"
          type="text"
          placeholder="Student Wallet Address"
          value={studentAddress}
          onChange={(e) => setStudentAddress(e.target.value)}
        />
        <input
          className="input-field"
          type="text"
          placeholder="Student Name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />
        <input
          className="input-field"
          type="text"
          placeholder="IPFS Hash"
          value={ipfsHash}
          onChange={(e) => setIpfsHash(e.target.value)}
        />
      </div>
      <button
        className={`action-button ${isLoading ? 'loading' : ''}`}
        onClick={issueCertificate}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Issue Certificate"}
      </button>
    </div>
  );
}

function StudentView({ contract, account }) {
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const count = await contract.getCertificateCount(account);
      const fetchedCerts = [];

      for (let i = 0; i < count; i++) {
        const cert = await contract.getCertificateAt(account, i);
        fetchedCerts.push({
          studentName: cert[0],
          ipfsHash: cert[1],
          isValid: cert[2]
        });
      }

      setCertificates(fetchedCerts);
    } catch (err) {
      console.error("Fetch error:", err);
      alert(`❌ Error: ${err.reason || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="student-card">
      <div className="certificate-actions">
        <button
          className={`action-button ${isLoading ? 'loading' : ''}`}
          onClick={fetchCertificates}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh Certificates"}
        </button>
      </div>

      <div className="certificates-list">
        {certificates.length > 0 ? (
          certificates.map((cert, i) => (
            <div key={i} className="certificate-item">
              <h3>{cert.studentName}</h3>
              <p className="ipfs-hash">
                <strong>IPFS:</strong> {cert.ipfsHash}
              </p>
              <p className={`status ${cert.isValid ? 'valid' : 'revoked'}`}>
                {cert.isValid ? "Valid" : "Revoked"}
              </p>
            </div>
          ))
        ) : (
          <p className="no-certificates">No certificates found</p>
        )}
      </div>
    </div>
  );
}

export default App;