// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Escrow.sol";
import "../src/CampaignFactory.sol";
import "../src/RefundManager.sol";

contract Deploy is Script {
    function run() external {
        address tokenAddress = vm.envAddress("TOKEN_ADDRESS");
        uint256 deployerKey  = vm.envUint("PRIVATE_KEY");
        address deployer     = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // 1. Deploy Escrow
        Escrow escrow = new Escrow();
        escrow.initialize(deployer, tokenAddress);
        console.log("Escrow:", address(escrow));

        // 2. Deploy CampaignFactory
        CampaignFactory factory = new CampaignFactory();
        factory.initialize(deployer, tokenAddress, address(escrow));
        console.log("CampaignFactory:", address(factory));

        // 3. Deploy RefundManager (stateless)
        RefundManager refundManager = new RefundManager();
        console.log("RefundManager:", address(refundManager));

        vm.stopBroadcast();
    }
}
