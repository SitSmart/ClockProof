// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ClockProof — Permanently timestamp any idea or document
contract ClockProof {
    struct Proof {
        address owner;
        string description;
        uint256 timestamp;
        uint256 blockNumber;
    }

    mapping(bytes32 => Proof) public proofs;
    bytes32[] public proofHashes;

    event Stamped(bytes32 indexed hash, address indexed owner, string description, uint256 timestamp);

    /// @notice Timestamp any content. Hash is keccak256(content).
    function stamp(string calldata content, string calldata description) external returns (bytes32) {
        bytes32 hash = keccak256(abi.encodePacked(content));
        require(proofs[hash].timestamp == 0, "Already stamped");
        proofs[hash] = Proof(msg.sender, description, block.timestamp, block.number);
        proofHashes.push(hash);
        emit Stamped(hash, msg.sender, description, block.timestamp);
        return hash;
    }

    /// @notice Stamp with a precomputed hash directly
    function stampHash(bytes32 hash, string calldata description) external {
        require(proofs[hash].timestamp == 0, "Already stamped");
        proofs[hash] = Proof(msg.sender, description, block.timestamp, block.number);
        proofHashes.push(hash);
        emit Stamped(hash, msg.sender, description, block.timestamp);
    }

    function verify(bytes32 hash) external view returns (
        bool exists, address owner, string memory description,
        uint256 timestamp, uint256 blockNumber
    ) {
        Proof storage p = proofs[hash];
        return (p.timestamp > 0, p.owner, p.description, p.timestamp, p.blockNumber);
    }

    function verifyContent(string calldata content) external view returns (
        bool exists, address owner, string memory description,
        uint256 timestamp, uint256 blockNumber
    ) {
        bytes32 hash = keccak256(abi.encodePacked(content));
        Proof storage p = proofs[hash];
        return (p.timestamp > 0, p.owner, p.description, p.timestamp, p.blockNumber);
    }

    function total() external view returns (uint256) { return proofHashes.length; }
}
