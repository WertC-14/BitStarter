// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ── Platform-enforced constraints ─────────────────────────────────────────────
// Proje sahibi bu aralıklar içinde parametre seçer; aralık dışı revert eder.
uint256 constant MIN_DEFECTION_RATE_BPS = 1000; // %10
uint256 constant MAX_DEFECTION_RATE_BPS = 3000; // %30
uint256 constant MIN_COHORTS            = 2;
uint256 constant MAX_COHORTS            = 4;

import "./IEscrow.sol";

/// @title CommitmentCampaign
/// @notice xbt2027 Blueprint metodolojisini uygulayan taahhüt tabanlı kampanya.
///         Yatırımcılar sıralı kohortlara girer; erken çıkış D oranında ceza keser
///         ve bu ceza kalan yatırımcılara (Rejected/Cancelled durumunda) dağıtılır.
contract CommitmentCampaign {
    // ── Enums & Constants ────────────────────────────────────────────────────
    enum Status { Active, VotingOpen, Approved, Rejected, Cancelled }

    uint256 public constant VOTE_APPROVE = 1;
    uint256 public constant VOTE_REJECT  = 2;

    // ── Core Storage ─────────────────────────────────────────────────────────
    bool    private _initialized;

    address public developer;
    address public token;
    IEscrow public escrow;
    string  public title;
    string  public description;
    string  public metadataUri;
    uint256 public fundingGoal;      // cohortCaps toplamına eşit olmalı
    uint256 public fundingDeadline;
    uint256 public refundRatio;      // 0-100
    uint256 public usableRatio;      // 0-100
    uint256 public votingDuration;
    Status  public status;

    // ── Commitment-Specific Storage ──────────────────────────────────────────
    /// @dev Baz puan cinsinden; 1500 = %15
    uint256 public defectionRateBps;

    /// @dev Her kohorttaki maksimum yatırım miktarı (bireysel cap, kümülatif değil)
    uint256[] public cohortCaps;
    /// @dev Şu an açık kohort indeksi (0-indexed)
    uint256 public currentCohort;
    /// @dev Her kohortta ne kadar yatırım toplandığı
    uint256[] public cohortFilled;

    // ── Accounting ───────────────────────────────────────────────────────────
    uint256 public totalInvested;
    uint256 public totalRefundReserved;
    uint256 public totalUsableAllocated;
    uint256 public totalUsableWithdrawn;
    uint256 public approvalPower;
    uint256 public rejectionPower;
    uint256 public votingDeadline;
    bool    public remainingWithdrawn;

    // ── Penalty Pool ─────────────────────────────────────────────────────────
    /// @dev Erken çıkışlardan biriken ceza havuzu (escrow bakiyesinin bir parçası)
    uint256 public penaltyPool;
    /// @dev finalizeCampaign / cancelCampaign anındaki anlık görüntüler (dağıtım için)
    uint256 public snapshotPenaltyPool;
    uint256 public snapshotRefundPool;   // finalizasyon anındaki totalRefundReserved
    uint256 public penaltyPoolClaimed;   // dağıtılan toplam ceza (yuvarlama güvencesi)

    // ── Investor Positions ───────────────────────────────────────────────────
    struct InvestorPosition {
        uint256 totalInvested;
        uint256 refundableAmount;
        uint256 usableAmount;
        bool    hasVoted;
        uint256 voteChoice;
        bool    refunded;
        bool    exitedEarly;
    }
    mapping(address => InvestorPosition) public positions;

    // ── Events ───────────────────────────────────────────────────────────────
    event InvestmentPlaced(address indexed investor, uint256 amount, uint256 cohortIndex);
    event EarlyExit(address indexed investor, uint256 returned, uint256 penalty);
    event UsableFundsWithdrawn(address indexed developer, uint256 amount);
    event VotingOpened(uint256 votingDeadline);
    event VoteCast(address indexed investor, uint256 choice, uint256 power);
    event CampaignFinalized(Status status);
    event RemainingFundsWithdrawn(address indexed developer, uint256 amount);
    event RefundClaimed(address indexed investor, uint256 base, uint256 bonus);
    event CampaignCancelled();

    // ── Errors ────────────────────────────────────────────────────────────────
    error AlreadyInitialized();
    error InvalidParams();
    error CohortsFull();
    error NotActive();
    error Unauthorized();
    error AlreadyExited();
    error VotingNotOpen();
    error VotingClosed();
    error AlreadyVoted();
    error NoInvestment();
    error FinalizationNotReady();
    error RefundNotAvailable();
    error AlreadyClaimed();
    error InsufficientFunds();
    error AlreadyWithdrawn();

    // ── Initializer ──────────────────────────────────────────────────────────
    /// @param _defectionRateBps  Erken çıkış ceza oranı baz puan (1000-3000)
    /// @param _cohortCaps        Her kohortun bireysel yatırım tavanı; toplamı _fundingGoal'e eşit olmalı
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
        uint256 _votingDuration,
        uint256 _defectionRateBps,
        uint256[] calldata _cohortCaps
    ) external {
        if (_initialized) revert AlreadyInitialized();
        _validateParams(
            _fundingGoal, _fundingDeadline, _refundRatio, _usableRatio,
            _votingDuration, _defectionRateBps, _cohortCaps
        );

        _initialized    = true;
        developer       = _developer;
        escrow          = IEscrow(_escrow);
        token           = escrow.getToken();
        title           = _title;
        description     = _description;
        metadataUri     = _metadataUri;
        fundingGoal     = _fundingGoal;
        fundingDeadline = _fundingDeadline;
        refundRatio     = _refundRatio;
        usableRatio     = _usableRatio;
        votingDuration  = _votingDuration;
        defectionRateBps = _defectionRateBps;
        status          = Status.Active;

        for (uint256 i = 0; i < _cohortCaps.length; i++) {
            cohortCaps.push(_cohortCaps[i]);
            cohortFilled.push(0);
        }
    }

    // ── Invest ───────────────────────────────────────────────────────────────
    /// @notice Yatırımcı mevcut kohorta girer. Kohort doluysa revert.
    ///         Escrow kontratını `amount` için önceden approve etmek gerekir.
    function invest(uint256 amount) external {
        if (amount == 0 || status != Status.Active || block.timestamp > fundingDeadline)
            revert NotActive();

        // Önceki yatırımlarla dolmuş kohortları atla
        _advanceCohort();

        uint256 remaining = cohortCaps[currentCohort] - cohortFilled[currentCohort];
        if (amount > remaining) revert CohortsFull();

        uint256 usable    = amount * usableRatio / 100;
        uint256 refundable = amount - usable;

        InvestorPosition storage pos = positions[msg.sender];
        pos.totalInvested    += amount;
        pos.usableAmount     += usable;
        pos.refundableAmount += refundable;

        cohortFilled[currentCohort] += amount;
        totalInvested        += amount;
        totalUsableAllocated += usable;
        totalRefundReserved  += refundable;

        escrow.deposit(address(this), msg.sender, amount);

        // Yatırım sonrası kohort durumunu güncelle
        _advanceCohort();

        emit InvestmentPlaced(msg.sender, amount, currentCohort);
    }

    // ── Early Exit (Defection) ───────────────────────────────────────────────
    /// @notice Yatırımcı kampanya aktifken çıkabilir; refundable tutarının
    ///         defectionRateBps kadarı ceza havuzuna aktarılır, kalanı iade edilir.
    ///         Usable kısım developer'a zaten tahsis edilmiştir, iade edilmez.
    function exitEarly() external {
        if (status != Status.Active) revert NotActive();

        InvestorPosition storage pos = positions[msg.sender];
        if (pos.totalInvested == 0) revert NoInvestment();
        if (pos.exitedEarly)        revert AlreadyExited();

        uint256 penalty = pos.refundableAmount * defectionRateBps / 10000;
        uint256 payout  = pos.refundableAmount - penalty;

        penaltyPool         += penalty;
        totalRefundReserved -= pos.refundableAmount;

        pos.exitedEarly      = true;
        pos.refundableAmount = 0;

        escrow.release(address(this), msg.sender, payout);
        emit EarlyExit(msg.sender, payout, penalty);
    }

    // ── Developer: Usable funds ──────────────────────────────────────────────
    function withdrawAvailableFunds(uint256 amount) external {
        if (msg.sender != developer) revert Unauthorized();
        if (amount == 0) revert InvalidParams();
        if (status != Status.Active && status != Status.VotingOpen) revert NotActive();

        uint256 available = totalUsableAllocated - totalUsableWithdrawn;
        if (amount > available) revert InsufficientFunds();

        totalUsableWithdrawn += amount;
        escrow.release(address(this), developer, amount);
        emit UsableFundsWithdrawn(developer, amount);
    }

    // ── Voting ───────────────────────────────────────────────────────────────
    function markFinished() external {
        if (msg.sender != developer) revert Unauthorized();
        _openVoting();
    }

    function openVotingAfterDeadline() external {
        if (block.timestamp <= fundingDeadline) revert InvalidParams();
        _openVoting();
    }

    function vote(uint256 choice) external {
        if (status != Status.VotingOpen) revert VotingNotOpen();
        if (block.timestamp > votingDeadline) revert VotingClosed();

        InvestorPosition storage pos = positions[msg.sender];
        if (pos.totalInvested == 0 || pos.exitedEarly) revert NoInvestment();
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
        if (block.timestamp <= votingDeadline) revert FinalizationNotReady();

        // Ceza havuzu anlık görüntüsü — Rejected durumunda kalan yatırımcılara dağıtılır
        snapshotPenaltyPool = penaltyPool;
        snapshotRefundPool  = totalRefundReserved;

        // Approved olursa ceza havuzu da developer'a gider (escrow bakiyesinin parçası)
        status = approvalPower > totalInvested / 2 ? Status.Approved : Status.Rejected;
        emit CampaignFinalized(status);
        return status;
    }

    function withdrawRemainingFunds() external returns (uint256) {
        if (msg.sender != developer) revert Unauthorized();
        if (status != Status.Approved)  revert NotActive();
        if (remainingWithdrawn)         revert AlreadyWithdrawn();

        uint256 amount = escrow.getCampaignBalance(address(this));
        if (amount == 0) revert InsufficientFunds();

        remainingWithdrawn = true;
        escrow.release(address(this), developer, amount);
        emit RemainingFundsWithdrawn(developer, amount);
        return amount;
    }

    // ── Refund ───────────────────────────────────────────────────────────────
    /// @notice Rejected veya Cancelled kampanyada kalan yatırımcı:
    ///         refundableAmount + (ceza havuzundan orantılı pay) alır.
    function claimRefund() external returns (uint256) {
        if (status != Status.Rejected && status != Status.Cancelled)
            revert RefundNotAvailable();

        InvestorPosition storage pos = positions[msg.sender];
        if (pos.refundableAmount == 0) revert NoInvestment();
        if (pos.refunded)              revert AlreadyClaimed();

        uint256 base  = pos.refundableAmount;
        uint256 bonus = 0;

        if (snapshotRefundPool > 0 && snapshotPenaltyPool > 0) {
            bonus = snapshotPenaltyPool * base / snapshotRefundPool;
            // Yuvarlama hatalarının havuzu aşmasını önle
            if (penaltyPoolClaimed + bonus > snapshotPenaltyPool) {
                bonus = snapshotPenaltyPool - penaltyPoolClaimed;
            }
            penaltyPoolClaimed += bonus;
        }

        pos.refunded = true;
        escrow.release(address(this), msg.sender, base + bonus);
        emit RefundClaimed(msg.sender, base, bonus);
        return base + bonus;
    }

    // ── Cancel ───────────────────────────────────────────────────────────────
    function cancelCampaign() external {
        if (msg.sender != developer) revert Unauthorized();
        if (status != Status.Active && status != Status.VotingOpen) revert NotActive();

        snapshotPenaltyPool = penaltyPool;
        snapshotRefundPool  = totalRefundReserved;

        status = Status.Cancelled;
        emit CampaignCancelled();
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function getCohortInfo()
        external view
        returns (uint256[] memory caps, uint256[] memory filled, uint256 activeCohort)
    {
        return (cohortCaps, cohortFilled, currentCohort);
    }

    function getInvestorPosition(address investor)
        external view
        returns (InvestorPosition memory)
    {
        return positions[investor];
    }

    function getAvailableFunds() external view returns (uint256) {
        return totalUsableAllocated - totalUsableWithdrawn;
    }

    // ── Internal ─────────────────────────────────────────────────────────────
    function _openVoting() internal {
        if (status != Status.Active) revert NotActive();
        votingDeadline = block.timestamp + votingDuration;
        status = Status.VotingOpen;
        emit VotingOpened(votingDeadline);
    }

    /// @dev Dolmuş kohortları atlar; tüm kohortlar dolmuşsa currentCohort son indekste kalır.
    function _advanceCohort() internal {
        while (
            currentCohort < cohortCaps.length - 1 &&
            cohortFilled[currentCohort] >= cohortCaps[currentCohort]
        ) {
            currentCohort++;
        }
    }

    function _validateParams(
        uint256 _fundingGoal,
        uint256 _fundingDeadline,
        uint256 _refundRatio,
        uint256 _usableRatio,
        uint256 _votingDuration,
        uint256 _defectionRateBps,
        uint256[] calldata _cohortCaps
    ) internal view {
        if (_fundingGoal == 0)                   revert InvalidParams();
        if (_fundingDeadline <= block.timestamp) revert InvalidParams();
        if (_refundRatio + _usableRatio != 100)  revert InvalidParams();
        if (_votingDuration == 0)                revert InvalidParams();

        // Platform sınırları
        if (_defectionRateBps < MIN_DEFECTION_RATE_BPS || _defectionRateBps > MAX_DEFECTION_RATE_BPS)
            revert InvalidParams();
        if (_cohortCaps.length < MIN_COHORTS || _cohortCaps.length > MAX_COHORTS)
            revert InvalidParams();

        // Kohort toplamı funding goal'e eşit olmalı
        uint256 total = 0;
        for (uint256 i = 0; i < _cohortCaps.length; i++) {
            if (_cohortCaps[i] == 0) revert InvalidParams();
            total += _cohortCaps[i];
        }
        if (total != _fundingGoal) revert InvalidParams();
    }
}
