// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./InvestmentCampaign.sol";

/// Stateless helper — wraps InvestmentCampaign.claimRefund with an availability check.
contract RefundManager {
    error RefundUnavailable();
    error InvestmentNotFound();

    function claimRefund(address campaignAddress) external returns (uint256) {
        if (!isRefundAvailable(campaignAddress, msg.sender)) revert RefundUnavailable();
        return InvestmentCampaign(campaignAddress).claimRefund();
    }

    function isRefundAvailable(address campaignAddress, address investor) public view returns (bool) {
        InvestmentCampaign campaign = InvestmentCampaign(campaignAddress);
        InvestmentCampaign.InvestorPosition memory pos = campaign.getInvestorPosition(investor);
        if (pos.totalInvested == 0) return false;
        if (pos.refunded) return false;
        InvestmentCampaign.Status s = campaign.status();
        return s == InvestmentCampaign.Status.Rejected || s == InvestmentCampaign.Status.Cancelled;
    }

    function hasClaimedRefund(address campaignAddress, address investor) external view returns (bool) {
        return InvestmentCampaign(campaignAddress).getInvestorPosition(investor).refunded;
    }
}
