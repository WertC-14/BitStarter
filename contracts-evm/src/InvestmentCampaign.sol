// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IEscrow.sol";

interface IERC20Approve {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract InvestmentCampaign {
    // ── Status ──────────────────────────────────────────────────────────────
    enum Status { Active, VotingOpen, Approved, Rejected, Cancelled }

    uint256 public constant VOTE_APPROVE = 1;
    uint256 public constant VOTE_REJECT  = 2;

    // ── Storage ──────────────────────────────────────────────────────────────
    bool private _initialized;

    address public developer;
    address public token;
    IEscrow public escrow;
    string  public title;
    string  public description;
    string  public metadataUri;
    uint256 public fundingGoal;
    uint256 public fundingDeadline;
    uint256 public refundRatio;   // 0-100
    uint256 public usableRatio;   // 0-100
    uint256 public votingDuration;
    Status  public status;

    uint256 public totalInvested;
    uint256 public totalRefundReserved;
    uint256 public totalUsableAllocated;
    uint256 public totalUsableWithdrawn;
    uint256 public approvalPower;
    uint256 public rejectionPower;
    uint256 public votingDeadline;
    bool    public remainingWithdrawn;

    struct InvestorPosition {
        uint256 totalInvested;
        uint256 refundableAmount;
        uint256 usableAmount;
        bool    hasVoted;
        uint256 voteChoice; // 0 = not voted
        bool    refunded;
    }
    mapping(address => InvestorPosition) public positions;

    // ── Events ───────────────────────────────────────────────────────────────
    event InvestmentPlaced(address indexed investor, uint256 amount, uint256 refundable, uint256 usable);
    event UsableFundsWithdrawn(address indexed developer, uint256 amount);
    event VotingOpened(address indexed campaign, uint256 votingDeadline);
    event VoteCast(address indexed investor, uint256 choice, uint256 power);
    event CampaignFinalized(address indexed campaign, Status status);
    event RemainingFundsWithdrawn(address indexed developer, uint256 amount);
    event RefundClaimed(address indexed campaign, address indexed investor, uint256 amount);
    event CampaignCancelled(address indexed campaign, address indexed developer);

    // ── Errors ────────────────────────────────────────────────────────────────
    error AlreadyInitialized();
    error NotInitialized();
    error InvalidAmount();
    error InvalidDeadline();
    error InvalidRatio();
    error InvalidVotingDuration();
    error CampaignInactive();
    error Unauthorized();
    error VotingNotOpen();
    error VotingClosed();
    error AlreadyVoted();
    error InvestmentNotFound();
    error FinalizationUnavailable();
    error RefundUnavailable();
    error RefundAlreadyClaimed();
    error InsufficientAvailableFunds();
    error AlreadyWithdrawn();

    // ── Initializer ──────────────────────────────────────────────────────────
    function initialize(
        address _developer,
        address _escrow,
        string calldata _title,
        string calldata _description,
        string calldata _metadataUri,
        uint256 _fundingGoal,
        uint256 _fundingDeadline,
        uint256 _refundRatio,
        uint256 _usableRatio,
        uint256 _votingDuration
    ) external {
        if (_initialized) revert AlreadyInitialized();
        _validateParams(_fundingGoal, _fundingDeadline, _refundRatio, _usableRatio, _votingDuration);

        _initialized  = true;
        developer     = _developer;
        escrow        = IEscrow(_escrow);
        token         = escrow.getToken();
        title         = _title;
        description   = _description;
        metadataUri   = _metadataUri;
        fundingGoal   = _fundingGoal;
        fundingDeadline = _fundingDeadline;
        refundRatio   = _refundRatio;
        usableRatio   = _usableRatio;
        votingDuration = _votingDuration;
        status        = Status.Active;
    }

    // ── Invest ───────────────────────────────────────────────────────────────
    /// Investor must have approved this contract (or the escrow) for `amount` before calling.
    function invest(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        if (status != Status.Active || block.timestamp > fundingDeadline) revert CampaignInactive();

        uint256 usable    = amount * usableRatio / 100;
        uint256 refundable = amount - usable;

        InvestorPosition storage pos = positions[msg.sender];
        pos.totalInvested    += amount;
        pos.usableAmount     += usable;
        pos.refundableAmount += refundable;

        // Pull tokens from investor into escrow (investor must approve escrow contract)
        escrow.deposit(address(this), msg.sender, amount);

        totalInvested        += amount;
        totalUsableAllocated += usable;
        totalRefundReserved  += refundable;

        emit InvestmentPlaced(msg.sender, amount, refundable, usable);
    }

    // ── Developer withdraws usable funds ─────────────────────────────────────
    function withdrawAvailableFunds(uint256 amount) external {
        if (msg.sender != developer) revert Unauthorized();
        if (amount == 0) revert InvalidAmount();
        if (status != Status.Active && status != Status.VotingOpen) revert CampaignInactive();

        uint256 available = totalUsableAllocated - totalUsableWithdrawn;
        if (amount > available) revert InsufficientAvailableFunds();

        totalUsableWithdrawn += amount;
        escrow.release(address(this), developer, amount);
        emit UsableFundsWithdrawn(developer, amount);
    }

    // ── Mark finished (opens voting) ─────────────────────────────────────────
    function markFinished() external {
        if (msg.sender != developer) revert Unauthorized();
        _openVoting();
    }

    function openVotingAfterDeadline() external {
        if (block.timestamp <= fundingDeadline) revert InvalidDeadline();
        _openVoting();
    }

    // ── Vote ─────────────────────────────────────────────────────────────────
    function vote(uint256 choice) external {
        if (status != Status.VotingOpen) revert VotingNotOpen();
        if (block.timestamp > votingDeadline) revert VotingClosed();

        InvestorPosition storage pos = positions[msg.sender];
        if (pos.totalInvested == 0) revert InvestmentNotFound();
        if (pos.hasVoted) revert AlreadyVoted();

        uint256 power = pos.totalInvested;
        if (choice == VOTE_APPROVE) {
            approvalPower += power;
        } else if (choice == VOTE_REJECT) {
            rejectionPower += power;
        } else {
            revert VotingNotOpen();
        }

        pos.hasVoted   = true;
        pos.voteChoice = choice;
        emit VoteCast(msg.sender, choice, power);
    }

    // ── Finalize ─────────────────────────────────────────────────────────────
    function finalizeCampaign() external returns (Status) {
        if (status != Status.VotingOpen) revert VotingNotOpen();
        if (block.timestamp <= votingDeadline) revert FinalizationUnavailable();

        status = approvalPower > totalInvested / 2 ? Status.Approved : Status.Rejected;
        emit CampaignFinalized(address(this), status);
        return status;
    }

    // ── Withdraw remaining (after Approved) ──────────────────────────────────
    function withdrawRemainingFunds() external returns (uint256) {
        if (msg.sender != developer) revert Unauthorized();
        if (status != Status.Approved) revert CampaignInactive();
        if (remainingWithdrawn) revert AlreadyWithdrawn();

        uint256 amount = escrow.getCampaignBalance(address(this));
        if (amount == 0) revert InsufficientAvailableFunds();

        remainingWithdrawn = true;
        escrow.release(address(this), developer, amount);
        emit RemainingFundsWithdrawn(developer, amount);
        return amount;
    }

    // ── Claim refund ─────────────────────────────────────────────────────────
    function claimRefund() external returns (uint256) {
        if (status != Status.Rejected && status != Status.Cancelled) revert RefundUnavailable();

        InvestorPosition storage pos = positions[msg.sender];
        if (pos.refundableAmount == 0) revert InvestmentNotFound();
        if (pos.refunded) revert RefundAlreadyClaimed();

        uint256 amount = pos.refundableAmount;
        pos.refunded = true;
        escrow.release(address(this), msg.sender, amount);
        emit RefundClaimed(address(this), msg.sender, amount);
        return amount;
    }

    // ── Cancel ───────────────────────────────────────────────────────────────
    function cancelCampaign() external {
        if (msg.sender != developer) revert Unauthorized();
        if (status != Status.Active && status != Status.VotingOpen) revert CampaignInactive();
        status = Status.Cancelled;
        emit CampaignCancelled(address(this), developer);
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function getInvestorPosition(address investor) external view returns (InvestorPosition memory) {
        return positions[investor];
    }

    function getAvailableFunds() external view returns (uint256) {
        return totalUsableAllocated - totalUsableWithdrawn;
    }

    // ── Internal ─────────────────────────────────────────────────────────────
    function _openVoting() internal {
        if (status != Status.Active) revert CampaignInactive();
        votingDeadline = block.timestamp + votingDuration;
        status = Status.VotingOpen;
        emit VotingOpened(address(this), votingDeadline);
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
