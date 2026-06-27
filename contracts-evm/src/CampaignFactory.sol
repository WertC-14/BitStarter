// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./InvestmentCampaign.sol";
import "./CommitmentCampaign.sol";

contract CampaignFactory {
    address public admin;
    address public token;
    address public escrow;

    enum LaunchMode { Standard, Commitment }

    struct CampaignSummary {
        address    id;
        address    developer;
        string     title;
        uint256    fundingGoal;
        uint256    fundingDeadline;
        string     metadataUri;
        LaunchMode launchMode;
    }

    CampaignSummary[] public allCampaigns;
    mapping(address => CampaignSummary[]) public developerCampaigns;

    event CampaignCreated(
        address indexed campaign,
        address indexed developer,
        string title,
        LaunchMode launchMode
    );

    error AlreadyInitialized();
    error InvalidAmount();
    error InvalidDeadline();
    error InvalidRatio();
    error InvalidVotingDuration();
    error Unauthorized();

    bool private _initialized;

    function initialize(address _admin, address _token, address _escrow) external {
        if (_initialized) revert AlreadyInitialized();
        _initialized = true;
        admin  = _admin;
        token  = _token;
        escrow = _escrow;
    }

    /// @notice Klasik yatırım kampanyası oluşturur (Standard mod).
    function createCampaign(
        string calldata _title,
        string calldata _description,
        string calldata _metadataUri,
        uint256 _fundingGoal,
        uint256 _fundingDeadline,
        uint256 _refundRatio,
        uint256 _usableRatio,
        uint256 _votingDuration
    ) external returns (address) {
        _validateParams(_fundingGoal, _fundingDeadline, _refundRatio, _usableRatio, _votingDuration);

        InvestmentCampaign campaign = new InvestmentCampaign();
        campaign.initialize(
            msg.sender,
            escrow,
            _title,
            _description,
            _metadataUri,
            _fundingGoal,
            _fundingDeadline,
            _refundRatio,
            _usableRatio,
            _votingDuration
        );

        CampaignSummary memory summary = CampaignSummary({
            id:              address(campaign),
            developer:       msg.sender,
            title:           _title,
            fundingGoal:     _fundingGoal,
            fundingDeadline: _fundingDeadline,
            metadataUri:     _metadataUri,
            launchMode:      LaunchMode.Standard
        });

        allCampaigns.push(summary);
        developerCampaigns[msg.sender].push(summary);

        emit CampaignCreated(address(campaign), msg.sender, _title, LaunchMode.Standard);
        return address(campaign);
    }

    /// @notice Blueprint taahhüt modeliyle kampanya oluşturur (Commitment mod).
    /// @param _defectionRateBps  Erken çıkış ceza oranı baz puan — platform sınırları: [1000, 3000]
    /// @param _cohortCaps        Her kohortun bireysel yatırım tavanı; toplamı _fundingGoal'e eşit olmalı
    function createCommitmentCampaign(
        string calldata _title,
        string calldata _description,
        string calldata _metadataUri,
        uint256 _fundingGoal,
        uint256 _fundingDeadline,
        uint256 _refundRatio,
        uint256 _usableRatio,
        uint256 _votingDuration,
        uint256 _defectionRateBps,
        uint256[] calldata _cohortCaps
    ) external returns (address) {
        _validateParams(_fundingGoal, _fundingDeadline, _refundRatio, _usableRatio, _votingDuration);

        CommitmentCampaign campaign = new CommitmentCampaign();
        campaign.initialize(
            msg.sender,
            escrow,
            _title,
            _description,
            _metadataUri,
            _fundingGoal,
            _fundingDeadline,
            _refundRatio,
            _usableRatio,
            _votingDuration,
            _defectionRateBps,
            _cohortCaps
        );

        CampaignSummary memory summary = CampaignSummary({
            id:              address(campaign),
            developer:       msg.sender,
            title:           _title,
            fundingGoal:     _fundingGoal,
            fundingDeadline: _fundingDeadline,
            metadataUri:     _metadataUri,
            launchMode:      LaunchMode.Commitment
        });

        allCampaigns.push(summary);
        developerCampaigns[msg.sender].push(summary);

        emit CampaignCreated(address(campaign), msg.sender, _title, LaunchMode.Commitment);
        return address(campaign);
    }

    function getCampaignCount() external view returns (uint256) {
        return allCampaigns.length;
    }

    function getAllCampaigns() external view returns (CampaignSummary[] memory) {
        return allCampaigns;
    }

    function getCampaign(uint256 index) external view returns (CampaignSummary memory) {
        return allCampaigns[index];
    }

    function getCampaignsByDeveloper(address developer) external view returns (CampaignSummary[] memory) {
        return developerCampaigns[developer];
    }

    function _validateParams(
        uint256 _fundingGoal,
        uint256 _fundingDeadline,
        uint256 _refundRatio,
        uint256 _usableRatio,
        uint256 _votingDuration
    ) internal view {
        if (_fundingGoal == 0) revert InvalidAmount();
        if (_fundingDeadline <= block.timestamp) revert InvalidDeadline();
        if (_refundRatio > 100 || _usableRatio > 100 || _refundRatio + _usableRatio != 100) revert InvalidRatio();
        if (_votingDuration == 0) revert InvalidVotingDuration();
    }
}
