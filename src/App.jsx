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

  useEffect(() => {
    const loadBlockchain = async () => {
      if (window.ethereum) {
        try {
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

          // Check if user is university
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
        }
      } else {
        alert("Please install MetaMask!");
      }
    };

    loadBlockchain();

    // Handle account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        loadBlockchain(); // Reload everything with new account
      } else {
        setAccount("");
        setContract(null);
      }
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    return () => window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
  }, []);

  return (
    <div className="App">
      <h1>Certificate System</h1>
      <p><strong>Connected Wallet:</strong> {account}</p>
      {isUniversity && <p className="badge">University Account</p>}

      {isUniversity ? (
        <UniversityView contract={contract} />
      ) : (
        <StudentView contract={contract} account={account} />
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
    <div className="card">
      <h2>Issue New Certificate</h2>
      <input 
        placeholder="Student Address" 
        value={studentAddress}
        onChange={(e) => setStudentAddress(e.target.value)}
      />
      <input
        placeholder="Student Name"
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
      />
      <input
        placeholder="IPFS Hash"
        value={ipfsHash}
        onChange={(e) => setIpfsHash(e.target.value)}
      />
      <button 
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
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>My Certificates</h2>
      <button onClick={fetchCertificates} disabled={isLoading}>
        {isLoading ? "Loading..." : "Refresh Certificates"}
      </button>

      <div className="certificates-list">
        {certificates.map((cert, i) => (
          <div key={i} className="certificate">
            <p><strong>Name:</strong> {cert.studentName}</p>
            <p><strong>IPFS:</strong> {cert.ipfsHash}</p>
            <p><strong>Status:</strong> {cert.isValid ? "Valid" : "Revoked"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;