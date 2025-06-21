// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Certificate {
    address public university;

    struct CertificateData {
        string studentName;
        string ipfsHash;
        bool isValid;
    }

    mapping(address => CertificateData[]) private studentCertificates;

    event CertificateIssued(address indexed student, string studentName, string ipfsHash);
    event CertificateRevoked(address indexed student, uint256 index);

    constructor() {
        university = msg.sender;
    }

    modifier onlyUniversity() {
        require(msg.sender == university, "Only university can perform this action");
        _;
    }

    function issueCertificate(
        address student, 
        string memory studentName, 
        string memory ipfsHash
    ) public onlyUniversity {
        require(student != address(0), "Invalid student address");
        require(bytes(studentName).length > 0, "Student name cannot be empty");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");

        studentCertificates[student].push(CertificateData(studentName, ipfsHash, true));
        emit CertificateIssued(student, studentName, ipfsHash);
    }

    function revokeCertificate(
        address student, 
        uint256 index
    ) public onlyUniversity {
        require(index < studentCertificates[student].length, "Invalid index");
        studentCertificates[student][index].isValid = false;
        emit CertificateRevoked(student, index);
    }

    function getCertificateCount(
        address student
    ) public view returns (uint256) {
        return studentCertificates[student].length;
    }

    function getCertificateAt(
        address student, 
        uint256 index
    ) public view returns (string memory, string memory, bool) {
        require(index < studentCertificates[student].length, "Index out of bounds");
        CertificateData memory cert = studentCertificates[student][index];
        return (cert.studentName, cert.ipfsHash, cert.isValid);
    }
}