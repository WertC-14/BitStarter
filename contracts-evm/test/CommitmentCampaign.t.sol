// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CommitmentCampaign.sol";
import "../src/CampaignFactory.sol";
import "../src/Escrow.sol";

// Minimal ERC20 for testing
contract MockToken {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient");
        require(allowance[from][msg.sender] >= amount, "not approved");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract CommitmentCampaignTest is Test {
    MockToken   token;
    Escrow      escrow;
    CampaignFactory factory;

    address admin    = address(1);
    address dev      = address(2);
    address alice    = address(3);
    address bob      = address(4);
    address carol    = address(5);

    uint256 constant GOAL     = 3000 ether;
    uint256 constant DEADLINE = 7 days;
    uint256 constant D_BPS    = 1500; // %15

    // cohortCaps: [1000, 1000, 1000] → toplam 3000
    uint256[] cohortCaps;

    function setUp() public {
        token  = new MockToken();
        escrow = new Escrow();
        factory = new CampaignFactory();

        escrow.initialize(admin, address(token));
        factory.initialize(admin, address(token), address(escrow));

        cohortCaps = new uint256[](3);
        cohortCaps[0] = 1000 ether;
        cohortCaps[1] = 1000 ether;
        cohortCaps[2] = 1000 ether;

        // Yatırımcılara token dağıt
        token.mint(alice, 2000 ether);
        token.mint(bob,   2000 ether);
        token.mint(carol, 2000 ether);
    }

    function _createCampaign() internal returns (CommitmentCampaign) {
        vm.prank(dev);
        address addr = factory.createCommitmentCampaign(
            "Test", "desc", "uri",
            GOAL,
            block.timestamp + DEADLINE,
            30,   // refundRatio
            70,   // usableRatio
            2 days,
            D_BPS,
            cohortCaps
        );
        return CommitmentCampaign(addr);
    }

    function _approve(address investor, address campaign, uint256 amount) internal {
        vm.prank(investor);
        token.approve(address(escrow), amount);
    }

    // ── Temel yatırım ────────────────────────────────────────────────────────
    function test_invest_basic() public {
        CommitmentCampaign c = _createCampaign();
        _approve(alice, address(c), 500 ether);

        vm.prank(alice);
        c.invest(500 ether);

        assertEq(c.totalInvested(), 500 ether);
        assertEq(c.currentCohort(), 0);

        CommitmentCampaign.InvestorPosition memory pos = c.getInvestorPosition(alice);
        assertEq(pos.totalInvested,    500 ether);
        assertEq(pos.usableAmount,     350 ether);  // %70
        assertEq(pos.refundableAmount, 150 ether);  // %30
    }

    // ── Kohort geçişi ─────────────────────────────────────────────────────────
    function test_cohort_advance() public {
        CommitmentCampaign c = _createCampaign();

        // Kohort 0'ı doldur (1000 ETH)
        _approve(alice, address(c), 1000 ether);
        vm.prank(alice);
        c.invest(1000 ether);

        assertEq(c.currentCohort(), 1);

        // Kohort 1'e gir
        _approve(bob, address(c), 500 ether);
        vm.prank(bob);
        c.invest(500 ether);

        assertEq(c.currentCohort(), 1);
        assertEq(c.totalInvested(), 1500 ether);
    }

    // ── Kohort dolunca revert ─────────────────────────────────────────────────
    function test_cohort_overflow_reverts() public {
        CommitmentCampaign c = _createCampaign();

        // Kohort 0 kapasitesi 1000, 1200 yatırmak revert etmeli
        _approve(alice, address(c), 1200 ether);
        vm.prank(alice);
        vm.expectRevert(CommitmentCampaign.CohortsFull.selector);
        c.invest(1200 ether);
    }

    // ── Tüm kohortlar dolunca revert ─────────────────────────────────────────
    function test_all_cohorts_full_reverts() public {
        CommitmentCampaign c = _createCampaign();

        _approve(alice, address(c), 1000 ether);
        vm.prank(alice); c.invest(1000 ether);

        _approve(bob, address(c), 1000 ether);
        vm.prank(bob); c.invest(1000 ether);

        _approve(carol, address(c), 1000 ether);
        vm.prank(carol); c.invest(1000 ether);

        // Artık yer yok
        token.mint(address(6), 1 ether);
        vm.prank(address(6));
        token.approve(address(escrow), 1 ether);
        vm.prank(address(6));
        vm.expectRevert(CommitmentCampaign.CohortsFull.selector);
        c.invest(1 ether);
    }

    // ── Erken çıkış: ceza kesilir, kalan iade edilir ─────────────────────────
    function test_early_exit_penalty() public {
        CommitmentCampaign c = _createCampaign();
        _approve(alice, address(c), 1000 ether);
        vm.prank(alice); c.invest(1000 ether);

        uint256 aliceBefore = token.balanceOf(alice);

        vm.prank(alice);
        c.exitEarly();

        // refundable = 1000 * 30% = 300
        // penalty    = 300 * 15% = 45
        // payout     = 300 - 45 = 255
        uint256 aliceAfter = token.balanceOf(alice);
        assertEq(aliceAfter - aliceBefore, 255 ether);
        assertEq(c.penaltyPool(), 45 ether);
    }

    // ── Erken çıkan oy kullanamaz ─────────────────────────────────────────────
    function test_early_exit_cannot_vote() public {
        CommitmentCampaign c = _createCampaign();
        _approve(alice, address(c), 1000 ether);
        vm.prank(alice); c.invest(1000 ether);
        vm.prank(alice); c.exitEarly();

        vm.prank(dev); c.markFinished();

        vm.prank(alice);
        vm.expectRevert(CommitmentCampaign.NoInvestment.selector);
        c.vote(1);
    }

    // ── Rejected kampanyada kalan yatırımcı ceza bonusu alır ─────────────────
    function test_refund_with_penalty_bonus() public {
        CommitmentCampaign c = _createCampaign();

        // Alice kohort 0: 1000 ETH
        _approve(alice, address(c), 1000 ether);
        vm.prank(alice); c.invest(1000 ether);

        // Bob kohort 1: 1000 ETH
        _approve(bob, address(c), 1000 ether);
        vm.prank(bob); c.invest(1000 ether);

        // Alice erken çıkış → penaltyPool = 45 ETH
        vm.prank(alice); c.exitEarly();

        // Oylama aç ve bitir
        vm.prank(dev); c.markFinished();
        vm.warp(block.timestamp + 2 days + 1);

        // Bob oy kullanmıyor → approvalPower = 0 → Rejected
        c.finalizeCampaign();
        assertEq(uint(c.status()), uint(CommitmentCampaign.Status.Rejected));

        uint256 bobBefore = token.balanceOf(bob);
        vm.prank(bob); c.claimRefund();
        uint256 bobAfter  = token.balanceOf(bob);

        // Bob refundable = 1000 * 30% = 300
        // Bob bonus = 45 ETH (penaltyPool'un tamamı, tek kalan yatırımcı)
        assertEq(bobAfter - bobBefore, 345 ether);
    }

    // ── Platform sınırları dışında D revert ───────────────────────────────────
    function test_defection_rate_below_min_reverts() public {
        uint256[] memory caps = new uint256[](2);
        caps[0] = 1500 ether;
        caps[1] = 1500 ether;

        vm.prank(dev);
        vm.expectRevert();
        factory.createCommitmentCampaign(
            "T", "d", "u",
            3000 ether,
            block.timestamp + 1 days,
            30, 70, 1 days,
            900, // %9 — min %10 altında
            caps
        );
    }

    // ── Factory'de launchMode doğru kaydedilir ────────────────────────────────
    function test_launch_mode_recorded() public {
        _createCampaign();

        CampaignFactory.CampaignSummary memory s = factory.getCampaign(0);
        assertEq(uint(s.launchMode), uint(CampaignFactory.LaunchMode.Commitment));
    }
}
