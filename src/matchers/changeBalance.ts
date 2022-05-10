import {BigNumber, BigNumberish} from 'ethers';
import {Account, getAddressOf, getBalanceOf} from './misc/account';

export function supportChangeBalance(Assertion: Chai.AssertionStatic) {
  Assertion.addMethod('changeBalance', function (
    this: any,
    signer: Account,
    balanceChange: BigNumberish
  ) {
    const subject = this._obj;
    const derivedPromise = Promise.all([
      getBalanceChangeForTransactionCall(subject, signer),
      getAddressOf(signer)
    ]).then(
      ([actualChange, address]) => {
        this.assert(
          actualChange.eq(BigNumber.from(balanceChange)),
          `Expected "${address}" to change balance by ${balanceChange} wei, but it has changed by ${actualChange} wei`,
          `Expected "${address}" to not change balance by ${balanceChange} wei,`,
          balanceChange,
          actualChange
        );
      }
    );
    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    this.promise = derivedPromise;
    return this;
  });
}

async function getBalanceChangeForTransactionCall(
  transactionCall: (() => Promise<void> | void),
  account: Account
) {
  const balanceBefore: BigNumber = await getBalanceOf(account);
  await transactionCall();
  const balanceAfter: BigNumber = await getBalanceOf(account);

  return balanceAfter.sub(balanceBefore);
}
