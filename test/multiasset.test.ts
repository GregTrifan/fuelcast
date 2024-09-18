import { launchTestNode, TestAssetId } from "fuels/test-utils";
import { describe, test, expect } from "vitest";
import { MultiAssetContractFactory } from "../src/sway-api";
import {
	AssetIdInput,
	IdentityInput,
} from "../src/sway-api/contracts/MultiAssetContract";
import { Address, BN, WalletUnlocked } from "fuels";

async function setup() {
	const launched = await launchTestNode({
		walletsConfig: {
			count: 3,
			assets: [TestAssetId.A, TestAssetId.B],
			coinsPerAsset: 5,
			amountPerCoin: 100_000,
		},
		contractsConfigs: [
			{ factory: MultiAssetContractFactory },
			{ factory: MultiAssetContractFactory },
		],
	});

	const [ownerWallet, otherWallet] = launched.wallets;
	const [instance1, instance2] = launched.contracts;
	const id = instance1.id;

	return { ownerWallet, otherWallet, id, instance1, instance2 };
}

function defaults(
	id: string,
	ownerWallet: WalletUnlocked,
	otherWallet: WalletUnlocked
) {
	const assetId1: AssetIdInput = {
		bits: id,
	};
	const assetId2: AssetIdInput = {
		bits: id.slice(0, 63) + "5",
	};
	const subId1 = new BN(0);
	const subId2 = new BN(1);
	const supply = new BN(
		"115792089237316195423570985008687907853269984665640564039457584007913129639935"
	);
	const ownerIdentity: IdentityInput = {
		Address: { bits: ownerWallet.address.toB256() },
	};
	const otherIdentity: IdentityInput = {
		Address: { bits: otherWallet.address.toB256() },
	};

	return {
		assetId1,
		assetId2,
		subId1,
		subId2,
		supply,
		ownerIdentity,
		otherIdentity,
	};
}

async function getWalletBalance(
	wallet: WalletUnlocked,
	assetId: AssetIdInput
): Promise<BN> {
	const assetIdBytes = Address.fromString(assetId.bits).toB256().slice(0, 64);

	const balance = await wallet.getBalance(assetIdBytes);

	return balance;
}

describe("MultiAsset Contract", () => {
	describe("Success cases", () => {
		test("mints assets", async () => {
			const { ownerWallet, otherWallet, id, instance1 } = await setup();
			const { assetId1, subId1, ownerIdentity, otherIdentity } = defaults(
				id.toB256(),
				ownerWallet,
				otherWallet
			);

			await instance1.functions.constructor(ownerIdentity).call();

			expect(await getWalletBalance(otherWallet, assetId1)).toEqual(new BN(0));
			expect(
				await (
					await instance1.functions.total_supply(assetId1).call()
				).waitForResult()
			).toBeNull();
			expect(
				await (await instance1.functions.total_assets().call()).waitForResult()
			).toEqual(new BN(0));

			await instance1.functions
				.mint(otherIdentity, subId1.toString(), 100)
				.call();

			expect(await getWalletBalance(otherWallet, assetId1)).toEqual(
				new BN(100)
			);

			const { waitForResult: i1SupResult } = await instance1.functions
				.total_supply(assetId1)
				.call();
			expect(i1SupResult).toEqual(new BN(100));
			expect(
				await (await instance1.functions.total_assets().call()).waitForResult()
			).toEqual(new BN(1));
		});

		test("mints multiple assets", async () => {
			const { ownerWallet, otherWallet, id, instance1 } = await setup();
			const {
				assetId1,
				assetId2,
				subId1,
				subId2,
				ownerIdentity,
				otherIdentity,
			} = defaults(id.toB256(), ownerWallet, otherWallet);

			await instance1.functions.constructor(ownerIdentity).call();
			await instance1.functions
				.mint(otherIdentity, subId1.toString(), 100)
				.call();

			expect(await getWalletBalance(otherWallet, assetId1)).toEqual(
				new BN(100)
			);
			expect(await getWalletBalance(otherWallet, assetId2)).toEqual(new BN(0));
			expect(
				await (
					await instance1.functions.total_supply(assetId1).call()
				).waitForResult()
			).toEqual(new BN(100));
			expect(
				await (
					await instance1.functions.total_supply(assetId2).call()
				).waitForResult()
			).toBeNull();
			expect(
				await (await instance1.functions.total_assets().call()).waitForResult()
			).toEqual(new BN(1));

			const { waitForResult: mint2Res } = await instance1.functions
				.mint(otherIdentity, subId2.toString(), 200)
				.call();
			await mint2Res();

			expect(await getWalletBalance(otherWallet, assetId1)).toEqual(
				new BN(100)
			);
			expect(await getWalletBalance(otherWallet, assetId2)).toEqual(
				new BN(200)
			);
			expect(
				await (
					await instance1.functions.total_supply(assetId1).call()
				).waitForResult()
			).toEqual(new BN(100));
			expect(
				await (
					await instance1.functions.total_supply(assetId2).call()
				).waitForResult()
			).toEqual(new BN(200));
			expect(
				await (await instance1.functions.total_assets().call()).waitForResult()
			).toEqual(new BN(2));
		});

		test("can mint max supply", async () => {
			const { ownerWallet, otherWallet, id, instance1 } = await setup();
			const { assetId1, subId1, supply, ownerIdentity, otherIdentity } =
				defaults(id.toB256(), ownerWallet, otherWallet);

			await instance1.functions.constructor(ownerIdentity).call();

			expect(await getWalletBalance(otherWallet, assetId1)).toEqual(new BN(0));
			expect(
				await (
					await instance1.functions.total_supply(assetId1).call()
				).waitForResult()
			).toBeNull();
			expect(
				await (await instance1.functions.total_assets().call()).waitForResult()
			).toEqual(new BN(0));

			await instance1.functions
				.mint(otherIdentity, subId1.toString(), supply)
				.call();

			expect(await getWalletBalance(otherWallet, assetId1)).toEqual(supply);
			expect(
				await (
					await instance1.functions.total_supply(assetId1).call()
				).waitForResult()
			).toEqual(supply);
			expect(
				await (await instance1.functions.total_assets().call()).waitForResult()
			).toEqual(new BN(1));
		});
	});

	describe("Revert cases", () => {
		test("reverts when not owner", async () => {
			const { ownerWallet, otherWallet, id, instance1, instance2 } =
				await setup();
			const { subId1, ownerIdentity, otherIdentity } = defaults(
				id.toB256(),
				ownerWallet,
				otherWallet
			);

			await instance1.functions.constructor(ownerIdentity).call();

			await expect(
				await (
					await instance2.functions
						.mint(otherIdentity, subId1.toString(), 100)
						.call()
				).waitForResult()
			).rejects.toThrow("NotOwner");
		});

		test("reverts when no owner", async () => {
			const { ownerWallet, otherWallet, id, instance1 } = await setup();
			const { subId1, otherIdentity } = defaults(
				id.toB256(),
				ownerWallet,
				otherWallet
			);

			await expect(
				await (
					await instance1.functions
						.mint(otherIdentity, subId1.toString(), 100)
						.call()
				).waitForResult()
			).rejects.toThrow("NotOwner");
		});

		test("reverts when max supply minted", async () => {
			const { ownerWallet, otherWallet, id, instance1 } = await setup();
			const { subId1, supply, ownerIdentity, otherIdentity } = defaults(
				id.toB256(),
				ownerWallet,
				otherWallet
			);

			await instance1.functions.constructor(ownerIdentity).call();

			await expect(
				instance1.functions
					.mint(otherIdentity, subId1.toString(), supply.add(1))
					.call()
			).rejects.toThrow("MaxMinted");
		});

		test("reverts when minting max supply after burn", async () => {
			const { ownerWallet, otherWallet, id, instance1, instance2 } =
				await setup();
			const { subId1, supply, ownerIdentity, otherIdentity } = defaults(
				id.toB256(),
				ownerWallet,
				otherWallet
			);

			await instance1.functions.constructor(ownerIdentity).call();
			await instance1.functions
				.mint(otherIdentity, subId1.toString(), supply)
				.call();

			await (
				await instance2.functions.burn(subId1.toString(), 1).call()
			).waitForResult();

			await expect(
				await (
					await instance1.functions
						.mint(otherIdentity, subId1.toString(), 1)
						.call()
				).waitForResult()
			).rejects.toThrow("MaxMinted");
		});
	});
});
