// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEscrow {
    function deposit(address campaign, address investor, uint256 amount) external;
    function release(address campaign, address recipient, uint256 amount) external;
    function getToken() external view returns (address);
    function getCampaignBalance(address campaign) external view returns (uint256);
}
