// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract Escrow {
    address public admin;
    IERC20 public token;

    mapping(address => uint256) public campaignBalance;
    mapping(address => uint256) public totalDeposited;
    mapping(address => uint256) public totalReleased;

    event EscrowDeposited(address indexed campaign, address indexed investor, uint256 amount);
    event EscrowReleased(address indexed campaign, address indexed recipient, uint256 amount);

    error AlreadyInitialized();
    error NotInitialized();
    error InvalidAmount();
    error InsufficientFunds();
    error Unauthorized();

    bool private _initialized;

    function initialize(address _admin, address _token) external {
        if (_initialized) revert AlreadyInitialized();
        _initialized = true;
        admin = _admin;
        token = IERC20(_token);
    }

    function deposit(address campaign, address investor, uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        token.transferFrom(investor, address(this), amount);
        campaignBalance[campaign] += amount;
        totalDeposited[campaign] += amount;
        emit EscrowDeposited(campaign, investor, amount);
    }

    /// Only the campaign contract itself can call release (msg.sender == campaign).
    function release(address campaign, address recipient, uint256 amount) external {
        if (msg.sender != campaign) revert Unauthorized();
        if (amount == 0) revert InvalidAmount();
        if (amount > campaignBalance[campaign]) revert InsufficientFunds();
        campaignBalance[campaign] -= amount;
        totalReleased[campaign] += amount;
        token.transfer(recipient, amount);
        emit EscrowReleased(campaign, recipient, amount);
    }

    function getToken() external view returns (address) {
        return address(token);
    }

    function getCampaignBalance(address campaign) external view returns (uint256) {
        return campaignBalance[campaign];
    }

    function getTotalDeposited(address campaign) external view returns (uint256) {
        return totalDeposited[campaign];
    }

    function getTotalReleased(address campaign) external view returns (uint256) {
        return totalReleased[campaign];
    }
}
