import {BigNumber, BigNumberish} from 'ethers';
import {Account, getAddressOf, getBalanceOf} from './misc/account';

export function supportChangeBalances(Assertion: Chai.AssertionStatic) {
  Assertion.addMethod('changeBalances', function (
    this: any,
    signers: Account[],
    balanceChanges: BigNumberish[]
  ) {
    const subject = this._obj;
    const derivedPromise = Promise.all([
      getBalanceChangeForTransactionCall(subject, signers),
      getAddresses(signers)
    ]).then(
      ([actualChanges, signerAddresses]) => {
        this.assert(
          actualChanges.every((change, ind) =>
            change.eq(BigNumber.from(balanceChanges[ind]))
          ),
          `Expected ${signerAddresses} to change balance by ${balanceChanges} wei, ` +
          `but it has changed by ${actualChanges} wei`,
          `Expected ${signerAddresses} to not change balance by ${balanceChanges} wei,`,
          balanceChanges.map((balanceChange) => balanceChange.toString()),
          actualChanges.map((actualChange) => actualChange.toString())
        );
      }
    );
    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    this.promise = derivedPromise;
    return this;
  });
}

function getAddresses(accounts: Account[]) {
  return Promise.all(accounts.map((account) => getAddressOf(account)));
}

async function getBalances(accounts: Account[]) {
  return Promise.all(
    accounts.map(async (account) => {
      return getBalanceOf(account);
    })
  );
}

async function getBalanceChangeForTransactionCall(
  transactionCall: (() => Promise<void> | void),
  accounts: Account[]
) {
  const balancesBefore = await getBalances(accounts);
  await transactionCall();
  const balancesAfter = await getBalances(accounts);

  return balancesAfter.map((balance, ind) => balance.sub(balancesBefore[ind]));
}
